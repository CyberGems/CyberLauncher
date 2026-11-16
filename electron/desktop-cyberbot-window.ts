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
import {
  constrainDesktopAvatar, desktopCyberBotAvatarBounds, desktopCyberBotBubbleBody,
  desktopCyberBotBubbleCrossingBounds, desktopCyberBotBubbleLayout,
} from './desktop-cyberbot-layout';
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
  interface Drag {
    grip: Electron.Point;
    pending: NodeJS.Immediate | null;
  }

  interface Session {
    avatarWindow: BrowserWindow;
    bubbleWindow: BrowserWindow;
    display: Electron.Display;
    catalog: DesktopCyberBotContext;
    placement: DesktopCyberBotBubblePlacement;
    expanded: boolean;
    bubbleVisible: boolean;
    avatar: Electron.Point;
    avatarBounds: Electron.Rectangle;
    bubbleBounds: Electron.Rectangle;
    bubbleBody: Electron.Rectangle;
    bubbleHeight: number;
    avatarReady: boolean;
    bubbleReady: boolean;
    drag: Drag | null;
    launching: boolean;
  }
  let active: Session | null = null;

  const close = () => {
    const session = active;
    active = null;
    if (!session) return;
    if (session.drag?.pending) clearImmediate(session.drag.pending);
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

  const setBounds = (window: BrowserWindow, current: Electron.Rectangle, next: Electron.Rectangle) => {
    // Reading back a native rectangle and feeding it into setPosition repeatedly
    // can accumulate Chromium's DPI/frame adjustments into the window size.
    if (current.x !== next.x || current.y !== next.y || current.width !== next.width || current.height !== next.height) window.setBounds(next);
    return next;
  };

  const overlaps = (a: Electron.Rectangle, b: Electron.Rectangle) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

  const updatePlacement = (session: Session) => {
    const { workArea } = session.display;
    const { bounds, bodyHeight, placement } = desktopCyberBotBubbleLayout(session.avatar, workArea, session.bubbleHeight, session.placement.side);
    const nextAvatar = desktopCyberBotAvatarBounds(session.avatar);
    const currentAvatar = session.avatarBounds;
    const body = desktopCyberBotBubbleBody(bounds, placement, bodyHeight);
    const bodyCrossesCurrentAvatar = overlaps(body, currentAvatar);
    if (session.bubbleVisible && bodyCrossesCurrentAvatar && overlaps(session.bubbleBody, nextAvatar)) {
      const clearBounds = desktopCyberBotBubbleCrossingBounds(bounds, placement, bodyHeight, currentAvatar, nextAvatar, workArea);
      if (clearBounds) session.bubbleBounds = setBounds(session.bubbleWindow, session.bubbleBounds, clearBounds);
    }
    // Move the leading surface first so the next native rectangle does not
    // run into the surface that Windows is still displaying at its old position.
    if (bodyCrossesCurrentAvatar) session.avatarBounds = setBounds(session.avatarWindow, currentAvatar, nextAvatar);
    session.bubbleBounds = setBounds(session.bubbleWindow, session.bubbleBounds, bounds);
    session.bubbleBody = body;
    if (!bodyCrossesCurrentAvatar) session.avatarBounds = setBounds(session.avatarWindow, currentAvatar, nextAvatar);
    if (JSON.stringify(session.placement) !== JSON.stringify(placement)) {
      session.placement = placement;
      session.bubbleWindow.webContents.send('desktop-cyberbot:bubble-placement', placement);
    }
  };

  const moveWithPointer = (session: Session, drag: Drag) => {
    const cursor = screen.getCursorScreenPoint();
    session.display = screen.getDisplayNearestPoint(cursor);
    session.avatar = constrainDesktopAvatar({ x: cursor.x - drag.grip.x, y: cursor.y - drag.grip.y }, session.display.workArea);
    updatePlacement(session);
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
    updatePlacement(session);
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
    if (phase === 'start') {
      const { avatarSize } = DESKTOP_CYBERBOT_LAYOUT;
      if (!offset || !Number.isFinite(offset.x) || !Number.isFinite(offset.y)
        || offset.x < 0 || offset.x > avatarSize || offset.y < 0 || offset.y > avatarSize) return;
      if (session.drag?.pending) clearImmediate(session.drag.pending);
      session.drag = {
        grip: { x: Math.round(offset.x), y: Math.round(offset.y) },
        pending: null,
      };
      return;
    }
    const drag = session.drag;
    if (!drag) return;
    if (phase === 'move') {
      if (!drag.pending) drag.pending = setImmediate(() => {
        drag.pending = null;
        moveWithPointer(session, drag);
        options.onLayoutChanged();
      });
      return;
    }
    if (phase !== 'end' && phase !== 'cancel') return;
    if (drag.pending) clearImmediate(drag.pending);
    session.drag = null;
    if (phase === 'end') moveWithPointer(session, drag);
    if (phase === 'end' && options.getCatalog().rememberPosition) {
      const { workArea } = session.display;
      options.savePosition({ displayId: session.display.id, x: session.avatar.x - workArea.x, y: session.avatar.y - workArea.y });
    }
    // Let the avatar hold native mouse capture during the drag, then give the
    // visible prompt its focus back once the pointer has been released.
    if (session.bubbleVisible && session.avatarWindow.isFocused()) session.bubbleWindow.focus();
    options.onLayoutChanged();
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
    const { bounds, bodyHeight, placement } = desktopCyberBotBubbleLayout(avatar, workArea, bubbleHeight);
    const bubbleWindow = createPopup(bounds);
    bubbleWindow.setIgnoreMouseEvents(true);
    const avatarBounds = desktopCyberBotAvatarBounds(avatar);
    const avatarWindow = createPopup(avatarBounds);
    avatarWindow.setBounds(avatarBounds);
    const session: Session = {
      avatarWindow, bubbleWindow, display, catalog, avatar, avatarBounds, bubbleBounds: bounds,
      bubbleBody: desktopCyberBotBubbleBody(bounds, placement, bodyHeight), bubbleHeight, placement,
      avatarReady: false, bubbleReady: false, bubbleVisible: false, expanded: true, drag: null, launching: false,
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
