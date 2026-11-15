import { BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import { DESKTOP_CYBERBOT_LAYOUT, type DesktopCyberBotContext, type DesktopCyberBotShortcut } from '../shared/desktopCyberBot';
import type { LaunchResult } from '../src/launchFlow';

interface DesktopCyberBotOptions {
  devServerUrl?: string;
  rendererDirectory: string;
  preloadPath: string;
  getCatalog: () => Omit<DesktopCyberBotContext, 'resultsHeight'>;
  launch: (shortcut: DesktopCyberBotShortcut) => Promise<LaunchResult>;
}

export function createDesktopCyberBotWindow(options: DesktopCyberBotOptions) {
  let active: {
    window: BrowserWindow;
    workArea: Electron.Rectangle;
    context: DesktopCyberBotContext;
    launching: boolean;
  } | null = null;
  const margin = 12;

  const close = () => {
    const session = active;
    active = null;
    if (session && !session.window.isDestroyed()) session.window.destroy();
  };

  const getSession = (event: { sender: Electron.WebContents }) =>
    active && event.sender === active.window.webContents ? active : null;

  ipcMain.handle('desktop-cyberbot:get-context', event => getSession(event)?.context ?? null);
  ipcMain.on('desktop-cyberbot:close', event => {
    if (getSession(event)) close();
  });
  ipcMain.on('desktop-cyberbot:resize', (event, measuredHeight: number) => {
    const session = getSession(event);
    if (!session || !Number.isFinite(measuredHeight) || measuredHeight < 1) return;
    const { window, workArea } = session;
    const height = Math.min(Math.ceil(measuredHeight), workArea.height - margin * 2);
    const bounds = window.getBounds();
    const y = workArea.y + workArea.height - height - margin;
    if (bounds.height !== height || bounds.y !== y) {
      window.setBounds({ ...bounds, height, y });
    }
    if (!window.isVisible()) {
      window.show();
      window.focus();
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
    const { bubbleWidth, sidePadding, topPadding, bottomPadding } = DESKTOP_CYBERBOT_LAYOUT;
    const width = Math.min(bubbleWidth + sidePadding * 2, workArea.width - margin * 2);
    const height = Math.min(600, workArea.height - margin * 2);
    const context: DesktopCyberBotContext = {
      ...options.getCatalog(),
      resultsHeight: Math.max(48, height - topPadding - bottomPadding - 240),
    };
    const window = new BrowserWindow({
      title: 'CyberBot',
      x: workArea.x + workArea.width - width - margin,
      y: workArea.y + workArea.height - height - margin,
      width,
      height,
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
    active = { window, workArea, context, launching: false };
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
