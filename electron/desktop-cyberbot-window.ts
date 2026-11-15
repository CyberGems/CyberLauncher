import { BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import { DESKTOP_CYBERBOT_LAYOUT, type DesktopCyberBotContext, type DesktopCyberBotDragPhase, type DesktopCyberBotShortcut } from '../shared/desktopCyberBot';
import { constrainDesktopAvatar, desktopCyberBotLayout } from './desktop-cyberbot-layout';
import type { LaunchResult } from '../src/launchFlow';

interface DesktopCyberBotOptions {
  devServerUrl?: string;
  rendererDirectory: string;
  preloadPath: string;
  getCatalog: () => Omit<DesktopCyberBotContext, 'placement'>;
  launch: (shortcut: DesktopCyberBotShortcut) => Promise<LaunchResult>;
}

export function createDesktopCyberBotWindow(options: DesktopCyberBotOptions) {
  interface Session {
    window: BrowserWindow;
    workArea: Electron.Rectangle;
    context: DesktopCyberBotContext;
    launching: boolean;
    avatar: Electron.Point;
    expanded: boolean;
    bubbleHeight: number;
    dragOffset: Electron.Point | null;
  }
  let active: Session | null = null;

  const close = () => {
    const session = active;
    active = null;
    if (session && !session.window.isDestroyed()) session.window.destroy();
  };

  const getSession = (event: { sender: Electron.WebContents }) =>
    active && event.sender === active.window.webContents ? active : null;

  const updatePlacement = (session: Session) => {
    const { window, workArea, avatar, expanded, bubbleHeight } = session;
    const { bounds, placement } = desktopCyberBotLayout(avatar, workArea, expanded, bubbleHeight);
    if (JSON.stringify(session.context.placement) !== JSON.stringify(placement)) {
      session.context.placement = placement;
      window.webContents.send('desktop-cyberbot:placement', placement);
    }
    const current = window.getBounds();
    if (bounds.x !== current.x || bounds.y !== current.y || bounds.width !== current.width || bounds.height !== current.height) {
      window.setBounds(bounds);
    }
  };

  ipcMain.handle('desktop-cyberbot:get-context', event => getSession(event)?.context ?? null);
  ipcMain.on('desktop-cyberbot:close', event => {
    if (getSession(event)) close();
  });
  ipcMain.on('desktop-cyberbot:resize', (event, measuredHeight: number) => {
    const session = getSession(event);
    if (!session?.expanded || !Number.isFinite(measuredHeight) || measuredHeight < 1) return;
    session.bubbleHeight = Math.ceil(measuredHeight);
    updatePlacement(session);
    if (!session.window.isVisible()) {
      session.window.show();
      session.window.focus();
    }
  });
  ipcMain.on('desktop-cyberbot:toggle-bubble', event => {
    const session = getSession(event);
    if (!session) return;
    session.expanded = !session.expanded;
    updatePlacement(session);
  });
  ipcMain.on('desktop-cyberbot:drag', (event, phase: DesktopCyberBotDragPhase, offset?: Electron.Point) => {
    const session = getSession(event);
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
      session.workArea = screen.getDisplayNearestPoint(cursor).workArea;
      session.avatar = constrainDesktopAvatar({
        x: cursor.x - session.dragOffset.x,
        y: cursor.y - session.dragOffset.y,
      }, session.workArea);
      if (phase === 'end') session.dragOffset = null;
      updatePlacement(session);
    }
  });
  ipcMain.handle('desktop-cyberbot:launch', async (event, id: number): Promise<LaunchResult> => {
    const session = getSession(event);
    if (!session || session.launching || !Number.isSafeInteger(id)) return { success: false };
    if (!session.context.apps.some(shortcut => shortcut.id === id)) return { success: false, code: 'not-found' };
    const shortcut = options.getCatalog().apps.find(shortcut => shortcut.id === id);
    if (!shortcut) return { success: false, code: 'not-found' };
    session.launching = true;
    try {
      return await options.launch(shortcut);
    } finally {
      session.launching = false;
    }
  });

  const toggle = () => {
    if (active) {
      close();
      return;
    }
    const { workArea } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const { avatarSize, sidePadding, bottomPadding } = DESKTOP_CYBERBOT_LAYOUT;
    const avatar = constrainDesktopAvatar({
      x: workArea.x + workArea.width - 12 - sidePadding - 5 - avatarSize,
      y: workArea.y + workArea.height - 12 - bottomPadding - avatarSize,
    }, workArea);
    const bubbleHeight = 260;
    const { bounds, placement } = desktopCyberBotLayout(avatar, workArea, true, bubbleHeight);
    const context: DesktopCyberBotContext = {
      ...options.getCatalog(),
      placement,
    };
    const window = new BrowserWindow({
      title: 'CyberBot',
      ...bounds,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      alwaysOnTop: true,
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
      },
    });
    active = { window, workArea, context, launching: false, avatar, expanded: true, bubbleHeight, dragOffset: null };
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.webContents.on('render-process-gone', () => {
      if (active?.window === window) close();
    });
    window.once('closed', () => {
      if (active?.window === window) active = null;
    });

    const page = 'cyberbot-desktop.html';
    const loaded = options.devServerUrl
      ? window.loadURL(new URL('/' + page, options.devServerUrl).href)
      : window.loadFile(path.join(options.rendererDirectory, page));
    void loaded.catch(error => {
      if (active?.window !== window) return;
      console.error('[CYBERBOT] Could not load desktop prompt:', error);
      close();
    });
  };

  screen.on('display-removed', close);
  return { toggle, close };
}
