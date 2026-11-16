import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron';
import { createRequire } from 'node:module';
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

type WindowsDpiMove = (handle: Buffer, x: number, y: number, width: number, height: number, dpi: number) => boolean;

function loadWindowsDpiMove(rendererDirectory: string): WindowsDpiMove | null {
  if (process.platform !== 'win32' || process.arch !== 'x64') return null;
  const moduleDirectory = app.isPackaged ? process.resourcesPath : path.resolve(rendererDirectory, '../electron');
  try {
    const require = createRequire(path.join(moduleDirectory, 'package.json'));
    const { move } = require(path.join(moduleDirectory, 'cyberbot-dpi-win32.node')) as { move: WindowsDpiMove };
    return move;
  } catch (error) {
    console.error('[CYBERBOT] Could not load the Windows DPI module:', error);
    return null;
  }
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
    requested: boolean;
    expanded: boolean;
    bubbleVisible: boolean;
    focusSearch: boolean;
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
  let preloadTimer: NodeJS.Timeout | undefined;
  let launcherVisible = false;
  let openSearchWhenHidden = false;
  const moveAcrossDpi = loadWindowsDpiMove(options.rendererDirectory);

  const destroy = () => {
    clearTimeout(preloadTimer);
    preloadTimer = undefined;
    openSearchWhenHidden = false;
    const session = active;
    active = null;
    if (!session) return;
    if (session.drag?.pending) clearImmediate(session.drag.pending);
    if (!session.avatarWindow.isDestroyed()) session.avatarWindow.destroy();
    if (!session.bubbleWindow.isDestroyed()) session.bubbleWindow.destroy();
    options.onLayoutChanged();
  };

  const suspend = (session: Session) => {
    session.focusSearch = false;
    if (session.drag?.pending) clearImmediate(session.drag.pending);
    session.drag = null;
    session.bubbleWindow.hide();
    session.avatarWindow.hide();
    session.avatarWindow.webContents.send('desktop-cyberbot:present', false);
    if (session.avatarReady && session.bubbleReady) setThrottled(session, true);
    options.onLayoutChanged();
  };

  const hide = () => {
    openSearchWhenHidden = false;
    if (!active?.requested) return;
    active.requested = false;
    active.expanded = false;
    active.bubbleVisible = false;
    active.bubbleWindow.setIgnoreMouseEvents(true);
    active.bubbleWindow.webContents.send('desktop-cyberbot:expanded', false);
    active.bubbleWindow.webContents.send('desktop-cyberbot:reset-search');
    suspend(active);
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
    if (current.x === next.x && current.y === next.y && current.width === next.width && current.height === next.height) return next;
    if (moveAcrossDpi) {
      const from = screen.getDisplayMatching(current);
      const to = screen.getDisplayMatching(next);
      if (from.scaleFactor !== to.scaleFactor) {
        const pixels = screen.dipToScreenRect(null, next);
        if (moveAcrossDpi(window.getNativeWindowHandle(), pixels.x, pixels.y, pixels.width, pixels.height,
          Math.round(to.scaleFactor * 96))) return next;
        console.warn('[CYBERBOT] Native DPI move failed. Applying Electron window bounds.');
      }
    }
    window.setBounds(next);
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

  const showInactive = (window: BrowserWindow) => {
    if (window.isVisible()) return false;
    window.showInactive();
    window.setAlwaysOnTop(true, 'pop-up-menu');
    return true;
  };

  const setThrottled = (session: Session, throttled: boolean) => {
    session.avatarWindow.webContents.setBackgroundThrottling(throttled);
    session.bubbleWindow.webContents.setBackgroundThrottling(throttled);
  };

  const showWhenReady = (session: Session) => {
    if (!session.avatarReady || !session.bubbleReady) return;
    if (launcherVisible || !session.requested) {
      setThrottled(session, true);
      return;
    }
    setThrottled(session, false);
    const avatarShown = showInactive(session.avatarWindow);
    if (avatarShown) {
      session.avatarWindow.webContents.send('desktop-cyberbot:present', true);
      session.avatarWindow.webContents.send('desktop-cyberbot:expanded', session.expanded);
      session.avatarWindow.webContents.send('desktop-cyberbot:language', session.catalog.language);
      session.bubbleWindow.webContents.send('desktop-cyberbot:catalog', session.catalog);
    }
    // A composited transparent window stays mounted. Folding its content avoids
    // running the Windows hide/show sequence when the user reopens the search.
    if (session.expanded) {
      const bubbleShown = showInactive(session.bubbleWindow);
      const opening = !session.bubbleVisible;
      if (opening) {
        session.bubbleVisible = true;
        session.bubbleWindow.setIgnoreMouseEvents(false);
        session.bubbleWindow.webContents.send('desktop-cyberbot:expanded', true);
      }
      if (session.focusSearch) {
        session.focusSearch = false;
        session.bubbleWindow.focus();
      }
      if (avatarShown || bubbleShown || opening) options.onLayoutChanged();
    } else if (avatarShown) {
      options.onLayoutChanged();
    }
  };

  const setLauncherVisible = (visible: boolean) => {
    if (launcherVisible === visible) return;
    launcherVisible = visible;
    if (!visible && openSearchWhenHidden) {
      openSearchWhenHidden = false;
      openSearch();
      return;
    }
    const session = active;
    if (!session?.requested) return;
    if (visible) {
      suspend(session);
    } else {
      showWhenReady(session);
    }
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
    if (getSession(event)) hide();
  });
  ipcMain.on('desktop-cyberbot:context-menu', event => {
    const session = getSession(event, 'avatar');
    if (!session?.requested || !session.avatarWindow.isVisible()) return;
    Menu.buildFromTemplate([{
      label: session.catalog.language === 'es' ? 'Ocultar CyberBot flotante' : 'Hide floating CyberBot',
      click: () => { if (active === session) hide(); },
    }]).popup({ window: session.avatarWindow });
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
    const session = getSession(event);
    if (!session?.requested || launcherVisible) return;
    if (!session.expanded && event.sender === session.bubbleWindow.webContents) return;
    const expanded = session.expanded = !session.expanded;
    if (expanded) {
      session.focusSearch = true;
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
    if (!session?.requested || launcherVisible) return;
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
    if (!session?.requested || !session.expanded || launcherVisible || session.launching || !Number.isSafeInteger(id)) return { success: false };
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
      if (active === session) destroy();
    });
    window.once('closed', () => {
      if (active === session) destroy();
    });

    const page = 'cyberbot-desktop.html';
    const loaded = options.devServerUrl
      ? window.loadURL(new URL('/' + page + '#' + kind, options.devServerUrl).href)
      : window.loadFile(path.join(options.rendererDirectory, page), { hash: kind });
    void loaded.catch(error => {
      if (active !== session) return;
      console.error('[CYBERBOT] Could not load desktop ' + kind + ':', error);
      destroy();
    });
  };

  const initialPosition = (catalog: DesktopCyberBotContext) => {
    const saved = catalog.rememberPosition ? options.loadPosition() : null;
    const savedDisplay = saved && screen.getAllDisplays().find(display => display.id === saved.displayId);
    const display = savedDisplay || screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const { workArea } = display;
    const { avatarSize, sidePadding, bottomPadding } = DESKTOP_CYBERBOT_LAYOUT;
    const avatar = constrainDesktopAvatar(saved && savedDisplay ? { x: workArea.x + saved.x, y: workArea.y + saved.y } : {
      x: workArea.x + workArea.width - 12 - sidePadding - 5 - avatarSize,
      y: workArea.y + workArea.height - 12 - bottomPadding - avatarSize,
    }, workArea);
    return { display, avatar };
  };

  const prepare = () => {
    if (active) return active;
    const catalog = options.getCatalog();
    const { display, avatar } = initialPosition(catalog);
    const bubbleHeight = 260;
    const { bounds, bodyHeight, placement } = desktopCyberBotBubbleLayout(avatar, display.workArea, bubbleHeight);
    const bubbleWindow = createPopup(bounds);
    bubbleWindow.setIgnoreMouseEvents(true);
    const avatarBounds = desktopCyberBotAvatarBounds(avatar);
    const avatarWindow = createPopup(avatarBounds);
    avatarWindow.setBounds(avatarBounds);
    const session: Session = {
      avatarWindow, bubbleWindow, display, catalog, avatar, avatarBounds, bubbleBounds: bounds,
      bubbleBody: desktopCyberBotBubbleBody(bounds, placement, bodyHeight), bubbleHeight, placement,
      avatarReady: false, bubbleReady: false, bubbleVisible: false, requested: false, expanded: false, focusSearch: false, drag: null, launching: false,
    };
    active = session;
    loadPopup(session, avatarWindow, 'avatar');
    loadPopup(session, bubbleWindow, 'bubble');
    return session;
  };

  const preload = () => {
    if (active || preloadTimer) return;
    preloadTimer = setTimeout(() => {
      preloadTimer = undefined;
      prepare();
    }, 2500);
  };

  const openSearch = () => {
    if (launcherVisible) {
      openSearchWhenHidden = true;
      return;
    }
    clearTimeout(preloadTimer);
    preloadTimer = undefined;
    const session = prepare();
    if (!session.requested) {
      session.catalog = options.getCatalog();
      const { display, avatar } = initialPosition(session.catalog);
      session.display = display;
      session.avatar = avatar;
      updatePlacement(session);
    }
    session.requested = true;
    if (!session.expanded) {
      session.expanded = true;
      session.avatarWindow.webContents.send('desktop-cyberbot:expanded', true);
    }
    session.focusSearch = true;
    showWhenReady(session);
  };

  const toggle = () => {
    if (launcherVisible) return;
    if (active?.requested) hide();
    else openSearch();
  };

  screen.on('display-removed', () => {
    const wasPrepared = Boolean(active || preloadTimer);
    destroy();
    if (wasPrepared) preload();
  });
  const getVisibleBounds = () => {
    if (launcherVisible || !active?.avatarWindow.isVisible()) return [];
    const bounds = [active.avatarWindow.getBounds()];
    if (active.bubbleVisible) bounds.push(active.bubbleWindow.getBounds());
    return bounds;
  };
  return { toggle, openSearch, preload, destroy, getVisibleBounds, setLauncherVisible };
}
