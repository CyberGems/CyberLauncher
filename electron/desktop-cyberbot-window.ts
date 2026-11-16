import { BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import {
  DESKTOP_CYBERBOT_LAYOUT,
  type DesktopCyberBotBubblePlacement,
  type DesktopCyberBotContext,
  type DesktopCyberBotDragPhase,
  type DesktopCyberBotPosition,
  type DesktopCyberBotShortcut,
  type DesktopCyberBotSurface,
} from '../shared/desktopCyberBot';
import { constrainDesktopAvatar, desktopCyberBotAvatarBounds, desktopCyberBotBubbleLayout } from './desktop-cyberbot-layout';
import type { LaunchResult } from '../src/launchFlow';

interface DesktopCyberBotOptions {
  devServerUrl?: string;
  rendererDirectory: string;
  preloadPath: string;
  getCatalog: () => DesktopCyberBotContext;
  launch: (shortcut: DesktopCyberBotShortcut) => Promise<LaunchResult>;
  loadPosition: () => DesktopCyberBotPosition | null;
  savePosition: (position: DesktopCyberBotPosition) => void;
  onLayoutChanged: () => void;
}

export function createDesktopCyberBotWindow(options: DesktopCyberBotOptions) {
  interface Session {
    avatarWindow: BrowserWindow;
    bubbleWindow: BrowserWindow;
    display: Electron.Display;
    catalog: DesktopCyberBotContext;
    placement: DesktopCyberBotBubblePlacement;
    expanded: boolean;
    bubbleVisible: boolean;
    avatar: Electron.Point;
    bubbleHeight: number;
    avatarReady: boolean;
    bubbleReady: boolean;
    dragOffset: Electron.Point | null;
    launching: boolean;
  }
  let active: Session | null = null;

  const close = () => {
    const session = active;
    active = null;
    if (!session) return;
    if (!session.avatarWindow.isDestroyed()) session.avatarWindow.destroy();
    if (!session.bubbleWindow.isDestroyed()) session.bubbleWindow.destroy();
    options.onLayoutChanged();
  };

  const getSession = (event: { sender: Electron.WebContents }, kind?: DesktopCyberBotSurface['kind']) => {
    const session = active;
    if (!session) return null;
    const fromAvatar = event.sender === session.avatarWindow.webContents;
    const fromBubble = event.sender === session.bubbleWindow.webContents;
    return (fromAvatar && kind !== 'bubble') || (fromBubble && kind !== 'avatar') ? session : null;
  };

  const updateBubblePlacement = (session: Session) => {
    const { bounds, placement } = desktopCyberBotBubbleLayout(session.avatar, session.display.workArea, session.bubbleHeight);
    const current = session.bubbleWindow.getBounds();
    if (bounds.x !== current.x || bounds.y !== current.y || bounds.width !== current.width || bounds.height !== current.height) {
      session.bubbleWindow.setBounds(bounds);
    }
    if (JSON.stringify(session.placement) !== JSON.stringify(placement)) {
      session.placement = placement;
      session.bubbleWindow.webContents.send('desktop-cyberbot:bubble-placement', placement);
    }
  };

  const showWhenReady = (session: Session) => {
    if (!session.avatarReady || !session.expanded || !session.bubbleReady
      || session.bubbleVisible) return;
    // A composited transparent window stays mounted. Folding its content avoids
    // running the Windows hide/show sequence when the user reopens the search.
    if (!session.bubbleWindow.isVisible()) {
      for (const window of [session.avatarWindow, session.bubbleWindow]) {
        window.showInactive();
        window.setAlwaysOnTop(true, 'pop-up-menu');
      }
    }
    session.bubbleVisible = true;
    options.onLayoutChanged();
    session.bubbleWindow.setIgnoreMouseEvents(false);
    session.bubbleWindow.webContents.send('desktop-cyberbot:expanded', true);
    session.bubbleWindow.focus();
  };

  ipcMain.handle('desktop-cyberbot:get-context', (event): DesktopCyberBotSurface | null => {
    const session = getSession(event);
    if (!session) return null;
    if (event.sender === session.avatarWindow.webContents) {
      return { kind: 'avatar', language: session.catalog.language, expanded: session.expanded };
    }
    return { kind: 'bubble', catalog: session.catalog, placement: session.placement };
  });
  ipcMain.on('desktop-cyberbot:close', event => {
    if (getSession(event)) close();
  });
  ipcMain.on('desktop-cyberbot:avatar-ready', event => {
    const session = getSession(event, 'avatar');
    if (!session) return;
    session.avatarReady = true;
    showWhenReady(session);
  });
  ipcMain.on('desktop-cyberbot:resize', (event, measuredHeight: number) => {
    const session = getSession(event, 'bubble');
    if (!session || !Number.isFinite(measuredHeight) || measuredHeight < 1) return;
    session.bubbleHeight = Math.ceil(measuredHeight);
    updateBubblePlacement(session);
    session.bubbleReady = true;
    if (session.bubbleVisible) options.onLayoutChanged();
    else showWhenReady(session);
  });
  ipcMain.on('desktop-cyberbot:toggle-bubble', event => {
    const session = getSession(event, 'avatar');
    if (!session) return;
    const expanded = session.expanded = !session.expanded;
    if (expanded) {
      showWhenReady(session);
    } else {
      session.bubbleVisible = false;
      session.bubbleWindow.setIgnoreMouseEvents(true);
      session.bubbleWindow.webContents.send('desktop-cyberbot:expanded', false);
      session.avatarWindow.focus();
      options.onLayoutChanged();
    }
    session.avatarWindow.webContents.send('desktop-cyberbot:expanded', expanded);
  });
  ipcMain.on('desktop-cyberbot:activity', event => {
    getSession(event, 'bubble')?.avatarWindow.webContents.send('desktop-cyberbot:activity');
  });
  ipcMain.on('desktop-cyberbot:drag', (event, phase: DesktopCyberBotDragPhase, offset?: Electron.Point) => {
    const session = getSession(event, 'avatar');
    if (!session) return;
    if (phase === 'cancel') {
      session.dragOffset = null;
      return;
    }
    if (phase === 'start') {
      const { avatarSize } = DESKTOP_CYBERBOT_LAYOUT;
      if (!offset || !Number.isFinite(offset.x) || !Number.isFinite(offset.y)
        || offset.x < 0 || offset.x > avatarSize || offset.y < 0 || offset.y > avatarSize) return;
      session.dragOffset = { x: Math.round(offset.x), y: Math.round(offset.y) };
    } else if (session.dragOffset && (phase === 'move' || phase === 'end')) {
      const cursor = screen.getCursorScreenPoint();
      session.display = screen.getDisplayNearestPoint(cursor);
      const { workArea } = session.display;
      session.avatar = constrainDesktopAvatar({
        x: cursor.x - session.dragOffset.x,
        y: cursor.y - session.dragOffset.y,
      }, workArea);
      if (phase === 'end') session.dragOffset = null;
      const { x, y } = desktopCyberBotAvatarBounds(session.avatar);
      const [currentX, currentY] = session.avatarWindow.getPosition();
      if (x !== currentX || y !== currentY) session.avatarWindow.setPosition(x, y);
      updateBubblePlacement(session);
      if (phase === 'end' && options.getCatalog().rememberPosition) {
        options.savePosition({ displayId: session.display.id, x: session.avatar.x - workArea.x, y: session.avatar.y - workArea.y });
      }
      options.onLayoutChanged();
    }
  });
  ipcMain.handle('desktop-cyberbot:launch', async (event, id: number): Promise<LaunchResult> => {
    const session = getSession(event, 'bubble');
    if (!session?.expanded || session.launching || !Number.isSafeInteger(id)) return { success: false };
    if (!session.catalog.apps.some(shortcut => shortcut.id === id)) return { success: false, code: 'not-found' };
    const shortcut = options.getCatalog().apps.find(shortcut => shortcut.id === id);
    if (!shortcut) return { success: false, code: 'not-found' };
    session.launching = true;
    try {
      return await options.launch(shortcut);
    } finally {
      session.launching = false;
    }
  });

  const createPopup = (bounds: Electron.Rectangle) => new BrowserWindow({
    title: 'CyberBot',
    ...bounds,
    show: false,
    frame: false,
    thickFrame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: options.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Let the hidden bubble measure the freshly rendered search before showing it.
      backgroundThrottling: false,
    },
  });

  const loadPopup = (session: Session, window: BrowserWindow, kind: DesktopCyberBotSurface['kind']) => {
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.webContents.on('render-process-gone', () => {
      if (active === session) close();
    });
    window.once('closed', () => {
      if (active === session) close();
    });

    const page = 'cyberbot-desktop.html';
    const loaded = options.devServerUrl
      ? window.loadURL(new URL('/' + page + '#' + kind, options.devServerUrl).href)
      : window.loadFile(path.join(options.rendererDirectory, page), { hash: kind });
    void loaded.catch(error => {
      if (active !== session) return;
      console.error('[CYBERBOT] Could not load desktop ' + kind + ':', error);
      close();
    });
  };

  const toggle = () => {
    if (active) {
      close();
      return;
    }
    const catalog = options.getCatalog();
    const saved = catalog.rememberPosition ? options.loadPosition() : null;
    const savedDisplay = saved && screen.getAllDisplays().find(display => display.id === saved.displayId);
    const display = savedDisplay || screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const { workArea } = display;
    const { avatarSize, sidePadding, bottomPadding } = DESKTOP_CYBERBOT_LAYOUT;
    const avatar = constrainDesktopAvatar(saved && savedDisplay ? { x: workArea.x + saved.x, y: workArea.y + saved.y } : {
      x: workArea.x + workArea.width - 12 - sidePadding - 5 - avatarSize,
      y: workArea.y + workArea.height - 12 - bottomPadding - avatarSize,
    }, workArea);
    const bubbleHeight = 260;
    const { bounds, placement } = desktopCyberBotBubbleLayout(avatar, workArea, bubbleHeight);
    const bubbleWindow = createPopup(bounds);
    bubbleWindow.setIgnoreMouseEvents(true);
    const avatarWindow = createPopup(desktopCyberBotAvatarBounds(avatar));
    const session: Session = {
      avatarWindow, bubbleWindow, display, catalog, avatar, bubbleHeight, placement,
      avatarReady: false, bubbleReady: false, bubbleVisible: false, expanded: true, dragOffset: null, launching: false,
    };
    active = session;
    loadPopup(session, avatarWindow, 'avatar');
    loadPopup(session, bubbleWindow, 'bubble');
  };

  screen.on('display-removed', close);
  const getVisibleBounds = () => {
    if (!active?.avatarWindow.isVisible()) return [];
    const bounds = [active.avatarWindow.getBounds()];
    if (active.bubbleVisible) bounds.push(active.bubbleWindow.getBounds());
    return bounds;
  };
  return { toggle, close, getVisibleBounds };
}
