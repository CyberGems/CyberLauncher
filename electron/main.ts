import { app, BrowserWindow, ipcMain, shell, Tray, Menu, globalShortcut, screen, nativeImage, dialog, protocol, net } from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { exec, execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { resolveTargetDisplay } from './display-resolve';

// Registrar el protocolo antes de que la app esté lista
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-resource', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, allowServiceWorkers: true } }
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ocultar advertencias de seguridad para modo de desarrollo en local
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Forzar mismo nombre en dev y produccion para compartir userData
app.setName('CyberLauncher');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let currentShortcut = 'Alt+Shift+L';
let hotspotCorners: string[] = [];
let hotspotDelay = 300;
let hotspotTimer: NodeJS.Timeout | null = null;
let lastHotspotCorner = '';
let hotspotEntryTime = 0;
let isSavingConfig = false;
let isDialogOpen = false;
// ── STATE MACHINE & GUARDS ──
type VisibilityState = 'hidden-intentional' | 'shown-intentional' | 'hidden-blur' | 'hidden-os';
let windowVisibilityState: VisibilityState = 'hidden-intentional';
let ownShowCallId = 0;
let inOwnShowCall = 0;
let ownRestoreCallId = 0;
let inOwnRestoreCall = 0;
let hotspotCooldown = false;
let hideOnBlurEnabled = true;
let showTaskbarIcon = false;
/** Ignore hide-on-blur during initial boot / first maximize (Windows steals focus briefly). */
let bootBlurGuardUntil = 0;
let lastHotspotPollTime = 0;
const HOTSPOT_LAG_THRESHOLD_MS = 400;
let hotspotsPausedByUAC = false;
let uacResumeTimer: NodeJS.Timeout | null = null;
let uacGuardTimer: NodeJS.Timeout | null = null;

let appShortcuts: Array<{ id: number; path: string; shortcut: string; isAdmin: boolean }> = [];

function registerAppShortcutsList(shortcutsList: Array<{ id: number; path: string; shortcut: string; isAdmin: boolean }>) {
  // First, unregister all existing custom app shortcuts
  for (const item of appShortcuts) {
    if (item.shortcut) {
      try {
        const electronShortcut = item.shortcut
          .replace(/Meta/g, 'Super')
          .replace(/Ctrl/g, 'CommandOrControl');
        globalShortcut.unregister(electronShortcut);
      } catch (err) {
        console.error('Error unregistering app shortcut:', err);
      }
    }
  }

  appShortcuts = shortcutsList;

  // Now, register the new list
  for (const item of appShortcuts) {
    if (!item.shortcut) continue;
    try {
      const electronShortcut = item.shortcut
        .replace(/Meta/g, 'Super')
        .replace(/Ctrl/g, 'CommandOrControl');
      
      const success = globalShortcut.register(electronShortcut, () => {
        try {
          console.log(`[GLOBAL HOTKEY] Launching app ${item.id} via shortcut ${item.shortcut} (isAdmin: ${item.isAdmin})`);
          
          if (item.isAdmin && process.platform === 'win32') {
            const escapedPath = item.path.replace(/'/g, "''");
            const command = `powershell -NoProfile -Command "Start-Process -FilePath '${escapedPath}' -Verb RunAs"`;
            exec(command, { windowsHide: true });
          } else {
            shell.openPath(item.path);
          }
        } catch (launchErr) {
          console.error('[GLOBAL HOTKEY] Error launching shortcut app:', launchErr);
        }
      });
      if (!success) {
        console.warn(`[GLOBAL HOTKEY] Failed to register custom shortcut: ${electronShortcut}`);
      }
    } catch (err) {
      console.error('[GLOBAL HOTKEY] Error registering custom shortcut:', err);
    }
  }
}

function resumeHotspotsImmediate() {
  if (uacResumeTimer) clearTimeout(uacResumeTimer);
  hotspotsPausedByUAC = false;
  lastHotspotCorner = '';
  hotspotEntryTime = 0;
  hotspotCooldown = false;
  console.log('[HOTSPOT] Resumed immediately (user action)');
}

function pauseHotspots() {
  if (uacResumeTimer) clearTimeout(uacResumeTimer);
  hotspotsPausedByUAC = true;
  lastHotspotCorner = '';
  hotspotEntryTime = 0;
  hotspotCooldown = false;
  console.log('[HOTSPOT] Paused by secure-desktop guard');
}

function resumeHotspotsAfterUAC(delayMs = 1500) {
  if (uacResumeTimer) clearTimeout(uacResumeTimer);
  uacResumeTimer = setTimeout(() => {
    hotspotsPausedByUAC = false;
    lastHotspotCorner = '';
    hotspotEntryTime = 0;
    hotspotCooldown = false;
    console.log('[HOTSPOT] Resumed after UAC delay');
  }, delayMs);
}

function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('[WM] showMainWindow (state=' + windowVisibilityState + ')');
    const dpiSettle = willChangeDisplayOnActivation();
    placeOnActivationDisplayIfNeeded();

    const reveal = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      resumeHotspotsImmediate();
      const callId = ++ownShowCallId;
      inOwnShowCall = callId;
      windowVisibilityState = 'shown-intentional';
      bootBlurGuardUntil = Math.max(bootBlurGuardUntil, Date.now() + (dpiSettle ? 1200 : 0));
      mainWindow.show();
      mainWindow.focus();
      if (inOwnShowCall === callId) inOwnShowCall = 0;
      setImmediate(() => { if (inOwnShowCall === callId) inOwnShowCall = 0; });
    };

    // Mixed DPI (e.g. 150% ↔ 125%): let Chromium attach to the new scale before becoming visible
    if (dpiSettle) {
      setTimeout(reveal, 48);
    } else {
      reveal();
    }
  }
}

function hideMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('[WM] hideMainWindow');
    mainWindow.hide();
  }
}

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');
const CONFIG_FILE = path.join(app.getPath('userData'), 'cyber-launcher-config.json');
const START_MINIMIZED_ARG = '--start-minimized';
/** True when this process should boot to tray (login / --start-minimized). */
let startHiddenThisSession = false;

function readConfigBoolean(key: string): boolean {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return !!config[key];
    }
  } catch { /* ignore */ }
  return false;
}

function applyAutoLaunchSettings(enabled: boolean, startMinimized: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: app.getPath('exe'),
    args: enabled && startMinimized ? [START_MINIMIZED_ARG] : [],
  });
}

function computeStartHiddenThisSession(): boolean {
  if (process.argv.includes(START_MINIMIZED_ARG)) return true;
  try {
    const login = app.getLoginItemSettings();
    if (login.wasOpenedAtLogin && readConfigBoolean('startWithWindows') && readConfigBoolean('startMinimized')) {
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

// --- Icono de la aplicación (usa PNG/ICO real, no SVG) ---
function getAppIconPath(): string {
  if (VITE_DEV_SERVER_URL) {
    return path.join(__dirname, '../public/icon.ico');
  }
  const icoPath = path.join(__dirname, '../dist/icon.ico');
  if (fs.existsSync(icoPath)) return icoPath;
  return path.join(__dirname, '../dist/icon.png');
}

function getAppIcon() {
  const iconPath = getAppIconPath();
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) return icon;
  }
  // Fallback: usar el PNG
  const pngPath = VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/icon.png')
    : path.join(__dirname, '../dist/icon.png');
  if (fs.existsSync(pngPath)) {
    return nativeImage.createFromPath(pngPath);
  }
  return nativeImage.createEmpty();
}

// Icono para la bandeja del sistema - usa icon-16 para maxima nitidez en tray
function getTrayIconPath(): string {
  const dir = VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public')
    : path.join(__dirname, '../dist');
  const p16 = path.join(dir, 'icon-16.png');
  if (fs.existsSync(p16)) return p16;
  return path.join(dir, 'icon.png');
}

function getTrayIcon() {
  const iconPath = getTrayIconPath();
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) return icon;
  }
  return getAppIcon();
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  const isMaximized = mainWindow.isMaximized();
  const currentDisplay =
    screen.getDisplayMatching(bounds) ||
    screen.getDisplayNearestPoint({
      x: Math.round(bounds.x + bounds.width / 2),
      y: Math.round(bounds.y + bounds.height / 2),
    });
  const workArea = currentDisplay.workArea || currentDisplay.bounds;

  const state = {
    bounds,
    /** Stable geometric fingerprint — used when display.id changes after reboot */
    displayBounds: {
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height,
    },
    isMaximized,
    monitorId: currentDisplay.id.toString(),
    shortcut: currentShortcut,
  };
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

function loadWindowState(): any | null {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading window state:', e);
  }
  return null;
}

function readPreferredMonitorId(): string | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (config.selectedMonitor) return String(config.selectedMonitor);
    }
  } catch (e) {
    console.error('[MONITOR] Error reading preferred monitor from config:', e);
  }
  return null;
}

function persistSelectedMonitorInConfig(monitorId: string) {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return;
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (config.selectedMonitor === monitorId) return;
    config.selectedMonitor = monitorId;
    isSavingConfig = true;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    setTimeout(() => { isSavingConfig = false; }, 300);
  } catch (e) {
    console.error('[MONITOR] Error persisting selectedMonitor in config:', e);
  }
}

function placeWindowOnDisplay(display: Electron.Display, opts?: { maximize?: boolean }) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const wa = display.workArea || display.bounds;
  const shouldMaximize = opts?.maximize !== false;
  try {
    const currentBounds = mainWindow.getBounds();
    const currentDisplay =
      screen.getDisplayMatching(currentBounds) ||
      screen.getDisplayNearestPoint({
        x: Math.round(currentBounds.x + currentBounds.width / 2),
        y: Math.round(currentBounds.y + currentBounds.height / 2),
      });

    // Same display + already maximized → skip (avoids mixed-DPI thrash on reopen)
    if (currentDisplay?.id === display.id && mainWindow.isMaximized() && shouldMaximize) {
      return;
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    }

    // `animate: false` — Windows DPI transitions look worse with animated bounds
    mainWindow.setBounds(
      { x: wa.x, y: wa.y, width: wa.width, height: wa.height },
      false
    );

    if (shouldMaximize && !mainWindow.isMaximized()) {
      mainWindow.maximize();
    }
  } catch (e) {
    console.error('[MONITOR] placeWindowOnDisplay failed:', e);
  }
}

/** Special selectedMonitor value: open on the display under the cursor (hotkey/hotspot/tray). */
const MONITOR_FOLLOW_CURSOR = 'follow-cursor';

function getCursorDisplay(): Electron.Display {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

function isFollowCursorMonitorMode(): boolean {
  return readPreferredMonitorId() === MONITOR_FOLLOW_CURSOR;
}

function willChangeDisplayOnActivation(): boolean {
  if (!isFollowCursorMonitorMode() || !mainWindow || mainWindow.isDestroyed()) return false;
  const target = getCursorDisplay();
  const cur = screen.getDisplayMatching(mainWindow.getBounds());
  return !cur || cur.id !== target.id;
}

/** Before showing via activation, optionally jump to the cursor's monitor. */
function placeOnActivationDisplayIfNeeded() {
  if (!isFollowCursorMonitorMode()) return;
  const display = getCursorDisplay();
  console.log(`[MONITOR] Follow-cursor → display ${display.id}`);
  placeWindowOnDisplay(display);
  saveWindowState();
}

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function getIconPath(): string {
  if (VITE_DEV_SERVER_URL) {
    return path.join(__dirname, '../public/icon.png');
  }
  return path.join(__dirname, '../dist/icon.png');
}

function createWindow() {
  const windowState = loadWindowState();
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const preferredId = readPreferredMonitorId();

  const targetDisplay =
    preferredId === MONITOR_FOLLOW_CURSOR
      ? getCursorDisplay()
      : resolveTargetDisplay(displays, primary, {
          preferredId,
          savedMonitorId: windowState?.monitorId ?? null,
          boundsHint: windowState?.displayBounds || windowState?.bounds || null,
        });

  console.log(
    `[MONITOR] Creating on display ${targetDisplay.id}` +
      ` (preferred=${preferredId || 'none'}, savedId=${windowState?.monitorId || 'none'})` +
      ` at ${targetDisplay.workArea.x},${targetDisplay.workArea.y}`
  );

  const startupWorkArea = { ...(targetDisplay.workArea || targetDisplay.bounds) };
  const { width, height } = targetDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: startupWorkArea.x,
    y: startupWorkArea.y,
    frame: false,
    transparent: false,
    alwaysOnTop: false,
    resizable: true,
    skipTaskbar: !showTaskbarIcon,
    backgroundColor: '#0a0f18',
    show: false,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
      backgroundThrottling: false,
    },
    autoHideMenuBar: true,
  });

  try { mainWindow.setBackgroundColor('#0a0f18'); } catch { /* ignore */ }

  mainWindow.setResizable(true);
  // Position on target monitor WITHOUT maximize before first show —
  // maximize() while hidden often flashes a white frame on Windows.
  placeWindowOnDisplay(targetDisplay, { maximize: false });

  mainWindow.on('maximize', () => {});

  mainWindow.on('move', saveWindowState);
  mainWindow.on('resize', saveWindowState);

  // Early paint: force dark document chrome as soon as DOM exists
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow?.webContents.insertCSS(
      'html,body,#root{margin:0;width:100%;height:100%;background-color:#0a0f18!important;color-scheme:dark;overflow:hidden}'
    ).catch(() => {});
  });

  // Show as soon as Chromium is ready — no opacity dance, no waiting for ui-ready
  // (those caused black screen / invisible window for ~2s).
  startHiddenThisSession = computeStartHiddenThisSession();
  mainWindow.once('ready-to-show', () => {
    bootBlurGuardUntil = Date.now() + 2000;
    if (startHiddenThisSession) {
      console.log('[WM] ready-to-show — start minimized (tray)');
      windowVisibilityState = 'hidden-intentional';
      // Stay hidden; first tray/hotkey activation will show + maximize.
      saveWindowState();
      return;
    }
    console.log('[WM] ready-to-show — showing');
    showMainWindow();
    try {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isMaximized()) {
        mainWindow.maximize();
      }
    } catch { /* ignore */ }
    saveWindowState();
  });

  // Vista al restaurar del tray (reset ligero) — no mezclar con reload-config
  mainWindow.on('show', () => {
    console.log('[WM EVENT] show (inOwnShowCall=' + inOwnShowCall + ', state=' + windowVisibilityState + ')');
    if (inOwnShowCall === ownShowCallId) {
      inOwnShowCall = 0;
      console.log('[WM] Own show confirmed');
    } else {
      console.log('[WM] External show detected (UAC?), re-hiding');
      windowVisibilityState = 'hidden-os';
      hideMainWindow();
      return;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launcher-shown');
    }
  });

  mainWindow.on('hide', () => {
    console.log('[WM EVENT] hide');
  });

  // Nota: no enviar reload-config en focus — se disparaba en cada apertura (show+focus),
  // reseteaba la vista dos veces y forzaba loadConfig innecesario (lag).
  // La sync entre instancias sigue vía fs.watch → reload-config.
  mainWindow.on('blur', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    lastHotspotCorner = '';
    hotspotEntryTime = 0;
    
    if (mainWindow.isAlwaysOnTop()) {
      mainWindow.webContents.send('always-on-top-blur-attempt');
      return;
    }

    if (!hideOnBlurEnabled) return;
    if (Date.now() < bootBlurGuardUntil) {
      console.log('[WM] Ignoring blur during boot guard');
      return;
    }
    setTimeout(() => {
      if (Date.now() < bootBlurGuardUntil) return;
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isFocused() && !isDialogOpen && hideOnBlurEnabled) {
        console.log('[MAIN] Window lost focus, hiding to tray');
        windowVisibilityState = 'hidden-blur';
        hideMainWindow();
      }
    }, 200);
  });

  mainWindow.on('restore', () => {
    console.log('[WM EVENT] restore (inOwnRestoreCall=' + inOwnRestoreCall + ', state=' + windowVisibilityState + ')');
    if (inOwnRestoreCall === ownRestoreCallId) {
      inOwnRestoreCall = 0;
      console.log('[WM] Own restore confirmed');
    } else {
      console.log('[WM] Window restored by OS (UAC?), re-hiding unconditionally');
      windowVisibilityState = 'hidden-os';
      hideMainWindow();
    }
  });

  setTimeout(() => {
    if (startHiddenThisSession) return;
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.log('[WM] Safety timeout: forcing show');
      showMainWindow();
      try {
        if (!mainWindow.isMaximized()) mainWindow.maximize();
      } catch { /* ignore */ }
    }
  }, 3000);

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      saveWindowState();
      windowVisibilityState = 'hidden-intentional';
      hideMainWindow();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// (CyberTray polling removed)

// =====================================
// SYSTEM TRAY (Bandeja del sistema)
// =====================================
function createTray() {
  if (tray) return;
  tray = new Tray(getTrayIcon());
  tray.setToolTip('CyberLauncher');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar CyberLauncher',
      click: () => toggleWindow(),
    },
    {
      label: 'Configuración',
      click: () => {
        showMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Cerrar',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.on('click', () => toggleWindow());
  tray.setContextMenu(contextMenu);
}

// =====================================
// TOGGLE WINDOW (Mostrar / Ocultar)
// =====================================
function toggleWindow(forceShow = false) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('[TOGGLE] Window destroyed, recreating...');
    mainWindow = null;
    createWindow();
    registerGlobalShortcut(currentShortcut);
    return;
  }
  
  if (forceShow) {
    showMainWindow();
    return;
  }

  if (mainWindow.isVisible()) {
    // Si la ventana está anclada (Always on Top), no ocultar y alertar al frontend para destellar el Pin
    if (mainWindow.isAlwaysOnTop()) {
      mainWindow.webContents.send('always-on-top-blur-attempt');
      return;
    }
    hideMainWindow();
  } else {
    showMainWindow();
  }
}

// =====================================
// HOTSPOTS LOGIC (Esquinas activas)
// =====================================
function stopHotspotPolling() {
  if (hotspotTimer) {
    clearInterval(hotspotTimer);
    hotspotTimer = null;
  }
}

function startHotspotPolling() {
  stopHotspotPolling();
  lastHotspotPollTime = Date.now();
  lastHotspotCorner = '';
  hotspotEntryTime = 0;
  hotspotCooldown = false;

  if (hotspotCorners.length === 0) {
    console.log('[HOTSPOT] No corners configured — polling stopped');
    return;
  }
  
  hotspotTimer = setInterval(() => {
    if (hotspotsPausedByUAC) return;

    const now = Date.now();
    const elapsed = now - lastHotspotPollTime;
    lastHotspotPollTime = now;

    if (elapsed > HOTSPOT_LAG_THRESHOLD_MS) {
      console.log(`[HOTSPOT] Lag detected (${elapsed}ms), resetting hotspot state`);
      lastHotspotCorner = '';
      hotspotEntryTime = 0;
      hotspotCooldown = false;
      return;
    }

    if (hotspotCorners.length === 0) return;

    const { x, y } = screen.getCursorScreenPoint();
    const displays = screen.getAllDisplays();
    let currentCorner = '';

    for (const display of displays) {
      const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
      
      // Detección de PIXEL EXACTO para máxima precisión
      const isTop = y === dy;
      const isBottom = y === dy + dh - 1;
      const isLeft = x === dx;
      const isRight = x === dx + dw - 1;

      let detected = '';
      if (isTop && isLeft) detected = 'top-left';
      else if (isTop && isRight) detected = 'top-right';
      else if (isBottom && isLeft) detected = 'bottom-left';
      else if (isBottom && isRight) detected = 'bottom-right';

      if (detected) {
        if (hotspotCorners.includes(detected)) {
          currentCorner = detected;
          console.log(`[HOTSPOT] Esquina detectada: ${detected}`);
        }
        break; 
      } else if (isTop || isBottom || isLeft || isRight) {
         // Si estamos en un borde pero NO es una esquina exacta, reseteamos.
         // console.log(`[HOTSPOT] Borde detectado en (${x},${y}), ignorando.`);
         currentCorner = '';
      }
    }

    if (currentCorner) {
      if (hotspotCooldown) {
        // Cursor still in corner after previous activation — do nothing until it leaves
      } else if (currentCorner === lastHotspotCorner) {
        const timeInCorner = Date.now() - hotspotEntryTime;
        if (timeInCorner >= hotspotDelay) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            console.log(`ACTIVACIÓN VÁLIDA: ${currentCorner} tras ${timeInCorner}ms (vis=${mainWindow.isVisible()})`);
            toggleWindow();
            hotspotCooldown = true;
          }
          lastHotspotCorner = ''; 
        }
      } else {
        lastHotspotCorner = currentCorner;
        hotspotEntryTime = Date.now();
        // Si delay es 0, activar inmediatamente sin esperar otro ciclo
        if (hotspotDelay === 0 && mainWindow && !mainWindow.isDestroyed()) {
          console.log(`ACTIVACIÓN INMEDIATA: ${currentCorner} (vis=${mainWindow.isVisible()})`);
          toggleWindow();
          hotspotCooldown = true;
          lastHotspotCorner = '';
        }
      }
    } else {
      // Cursor left the corner — allow future activations
      lastHotspotCorner = '';
      hotspotCooldown = false;
    }
  }, 100);
}

// =====================================
// UAC GUARD (detecta consent.exe para pausar hotspots)
// =====================================
function startUACGuard() {
  if (uacGuardTimer) clearInterval(uacGuardTimer);
  let uacWasActive = false;
  let queryInFlight = false;

  uacGuardTimer = setInterval(() => {
    // Nothing to protect: no hotspots armed and window already hidden → skip the spawn.
    if (hotspotCorners.length === 0 && (!mainWindow || !mainWindow.isVisible())) return;
    // Coalesce: never pile up tasklist invocations if the previous one hasn't returned.
    if (queryInFlight) return;
    queryInFlight = true;

    exec('tasklist /FI "IMAGENAME eq consent.exe" /NH', { windowsHide: true }, (err, stdout) => {
      queryInFlight = false;
      const isActive = !err && stdout.includes('consent.exe');
      if (isActive && !uacWasActive) {
        console.log('[UAC-GUARD] UAC detected (consent.exe) — pausing hotspots');
        pauseHotspots();
        if (mainWindow && mainWindow.isVisible()) {
          windowVisibilityState = 'hidden-os';
          hideMainWindow();
        }
      } else if (!isActive && uacWasActive) {
        console.log('[UAC-GUARD] UAC closed — scheduling hotspot resume');
        resumeHotspotsAfterUAC(1500);
      }
      uacWasActive = isActive;
    });
  }, 1500);
}

function stopUACGuard() {
  if (uacGuardTimer) {
    clearInterval(uacGuardTimer);
    uacGuardTimer = null;
    console.log('[UAC-GUARD] Stopped');
  }
}

// =====================================
// GLOBAL SHORTCUT REGISTRATION
// =====================================
function registerGlobalShortcut(shortcut: string) {
  // Desregistrar el atajo anterior
  globalShortcut.unregisterAll();

  // Convertir formato "Alt+Shift+L" al formato de Electron
  // El formato de Electron usa: CommandOrControl, Alt, Shift, Super, etc.
  const electronShortcut = shortcut
    .replace(/Meta/g, 'Super')
    .replace(/Ctrl/g, 'CommandOrControl');

  try {
    const success = globalShortcut.register(electronShortcut, () => {
      try {
        toggleWindow();
      } catch (err) {
        console.error('[SHORTCUT] Error in global shortcut callback:', err);
      }
    });

    if (!success) {
      console.warn(`No se pudo registrar el atajo global: ${electronShortcut}`);
    }

    currentShortcut = shortcut;
  } catch (err) {
    console.error('Error registrando atajo global:', err);
  }
}

// =====================================
// FILE RESOLUTION HELPERS
// =====================================

function getIconCacheDir() {
  const dir = path.join(app.getPath('userData'), 'icon-cache');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function toLocalResourceUrl(filePath: string) {
  return `local-resource:///${filePath.replace(/\\/g, '/')}`;
}

/** Persist PNG bytes to disk cache and return a local-resource URL (avoids base64 in config). */
async function persistIconPng(sourcePath: string, pngBuffer: Buffer): Promise<string> {
  const hash = crypto.createHash('sha1').update(sourcePath.toLowerCase()).digest('hex').slice(0, 24);
  const outPath = path.join(getIconCacheDir(), `${hash}.png`);
  await fs.promises.writeFile(outPath, pngBuffer);
  return toLocalResourceUrl(outPath);
}

async function resolveFullFileInfo(filePath: string) {
  try {
    console.log('--- Iniciando resolución de archivo ---');
    console.log('Ruta original:', filePath);
    
    // Normalizar y limpiar ruta
    let normalized = path.resolve(filePath.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'));
    console.log('Ruta normalizada:', normalized);
    
    let ext = path.extname(normalized).toLowerCase();
    let resolvedPath = normalized;
    let resolvedName = path.basename(normalized, ext);

    // RESOLVER .LNK DE FORMA MÁS AGRESIVA
    if (ext === '.lnk') {
      try {
        const shortcut = shell.readShortcutLink(normalized);
        if (shortcut.target && fs.existsSync(shortcut.target)) {
          resolvedPath = path.resolve(shortcut.target);
        } else {
          // FALLBACK 1: PowerShell (Muy fiable en Windows)
          try {
            // Escapar comillas simples para PowerShell
            const escapedPath = normalized.replace(/'/g, "''");
            const winCommand = `powershell -NoProfile -Command "$s = New-Object -ComObject WScript.Shell; $s.CreateShortcut('${escapedPath}').TargetPath"`;
            const output = execSync(winCommand, { encoding: 'utf-8' }).trim();
            if (output && fs.existsSync(output)) {
              resolvedPath = path.resolve(output);
            }
          } catch (psErr) {
            console.error('Shortcut resolution fallbacks failed:', psErr);
          }
        }
        
        ext = path.extname(resolvedPath).toLowerCase();
        resolvedName = path.basename(resolvedPath, ext);
        console.log('Ruta resuelta tras .lnk:', resolvedPath);
      } catch (e) {
        console.error('Error resolving .lnk:', e);
      }
    }

    // EXTRACCIÓN DE ÍCONO → cache en disco (local-resource://) en vez de base64 en config
    let iconPath = '';
    const cachedIconPath = path.join(
      getIconCacheDir(),
      `${crypto.createHash('sha1').update(resolvedPath.toLowerCase()).digest('hex').slice(0, 24)}.png`
    );
    if (fs.existsSync(cachedIconPath) && fs.statSync(cachedIconPath).size > 100) {
      iconPath = toLocalResourceUrl(cachedIconPath);
      console.log('[ICON] Cache hit:', cachedIconPath);
    } else {
      try {
        console.log('Intentando extraer icono para:', resolvedPath);
        if (fs.existsSync(resolvedPath)) {
          let icon = await app.getFileIcon(resolvedPath, { size: 'large' });
          if (!icon || icon.isEmpty()) {
            console.log('Icono grande falló, intentando normal...');
            icon = await app.getFileIcon(resolvedPath, { size: 'normal' });
          }

          if (icon && !icon.isEmpty()) {
            const png = icon.toPNG();
            // Heurística previa: iconos genéricos suelen ser muy pequeños en dataURL (~<1500 chars ≈ <~1KB)
            if (png.length >= 400) {
              iconPath = await persistIconPng(resolvedPath, png);
              console.log('[ICON] Guardado en cache. Bytes:', png.length);
            }
          } else {
            console.log('No se pudo extraer icono (archivo protegido o sin recursos)');
          }
        }
      } catch (e) {
        console.warn('Error getFileIcon:', e);
      }

      // Fallback con PowerShell si el icono nativo falló o parece genérico
      if (!iconPath) {
        try {
          console.log('[ICON] Fallback PowerShell para:', resolvedPath);
          const escapedPath = resolvedPath.replace(/'/g, "''");
          const psScript = `Add-Type -AssemblyName System.Drawing; $icon=[System.Drawing.Icon]::ExtractAssociatedIcon('${escapedPath}'); if ($icon) { $bmp=$icon.ToBitmap(); $tmp=[System.IO.Path]::GetTempFileName()+'.png'; $bmp.Save($tmp,[System.Drawing.Imaging.ImageFormat]::Png); Write-Output $tmp; $icon.Dispose(); $bmp.Dispose() }`;
          const tmpPs = path.join(os.tmpdir(), `cl-icon-${Date.now()}.ps1`);
          await fs.promises.writeFile(tmpPs, psScript, 'utf-8');
          const psOutput = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`, { encoding: 'utf-8', timeout: 8000 }).trim();
          await fs.promises.unlink(tmpPs).catch(() => {});
          if (psOutput && fs.existsSync(psOutput)) {
            const pngBuffer = await fs.promises.readFile(psOutput);
            await fs.promises.unlink(psOutput).catch(() => {});
            if (pngBuffer.length > 100) {
              iconPath = await persistIconPng(resolvedPath, pngBuffer);
              console.log('[ICON] PowerShell → cache. Bytes:', pngBuffer.length);
            } else {
              console.log('[ICON] PowerShell PNG muy pequeño, ignorando');
            }
          } else {
            console.log('[ICON] PowerShell no devolvio ruta de PNG');
          }
        } catch (psErr: any) {
          console.warn('[ICON] PowerShell fallback falló:', psErr?.message || psErr);
        }
      }
    }

    return {
      name: resolvedName,
      path: resolvedPath,
      ext,
      exists: fs.existsSync(resolvedPath),
      iconPath,
      debug: { normalized, resolvedPath, ext, iconCached: !!iconPath },
    };
  } catch (err) {
    console.error('Error resolveFullFileInfo:', err);
    return null;
  }
}

// =====================================
// SYSTEM FILES INDEXER (EVERYTHING/WOX STYLE)
// =====================================
interface IndexedFile {
  name: string;
  path: string;
  ext: string;
  type: 'app' | 'file' | 'folder';
  icon?: string;
}

let systemIndex: IndexedFile[] = [];
let systemIndexStatus: 'ONLINE' | 'OFFLINE' | 'INDEXING' = 'OFFLINE';

const getSettingsFilePath = () => path.join(app.getPath('userData'), 'indexer_settings.json');

/** Default crawl roots — Start Menu shortcuts are the Wox/Everything-style app surface. */
function getDefaultIndexerPaths(): string[] {
  const programData = process.env.ProgramData || 'C:\\ProgramData';
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const candidates = [
    path.join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    path.join(programData, 'Microsoft', 'Windows', 'Start Menu'),
    path.join(appData, 'Microsoft', 'Windows', 'Start Menu'),
    path.join(os.homedir(), 'Desktop'),
    path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop'),
    path.join(localAppData, 'Programs'),
    path.join(os.homedir(), 'Downloads'),
    path.join(os.homedir(), 'Documents'),
  ];
  return candidates.filter((p, i, arr) => arr.indexOf(p) === i && fs.existsSync(p));
}

function isStartMenuPath(p: string): boolean {
  return /start menu/i.test(p);
}

function ensureStartMenuPaths(paths: string[]): string[] {
  const defaults = getDefaultIndexerPaths().filter(isStartMenuPath);
  const lower = new Set(paths.map(p => p.toLowerCase()));
  const merged = [...paths];
  for (const required of defaults) {
    if (!lower.has(required.toLowerCase())) {
      merged.push(required);
      lower.add(required.toLowerCase());
    }
  }
  return merged;
}

function loadIndexerSettings(): { enabled: boolean; maxDepth: number; paths: string[]; includeHiddenFolders: boolean; indexHiddenContent: boolean } {
  const defaults = {
    enabled: true,
    maxDepth: 2,
    paths: getDefaultIndexerPaths(),
    includeHiddenFolders: false,
    indexHiddenContent: false
  };

  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      const merged = {
        ...defaults,
        ...parsed,
        paths: Array.isArray(parsed.paths) && parsed.paths.length > 0
          ? ensureStartMenuPaths(parsed.paths)
          : defaults.paths
      };
      // Persist migration if Start Menu roots were missing / paths were empty
      const pathsChanged = JSON.stringify(parsed.paths || []) !== JSON.stringify(merged.paths);
      if (pathsChanged) {
        try { saveIndexerSettings(merged); } catch { /* ignore */ }
      }
      return merged;
    }
  } catch (err) {
    console.error('[INDEXER] Error loading indexer settings:', err);
  }

  return defaults;
}

function saveIndexerSettings(settings: { enabled: boolean; maxDepth: number; paths: string[]; includeHiddenFolders: boolean; indexHiddenContent: boolean }) {
  try {
    const filePath = getSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
    console.log('[INDEXER] Settings saved successfully.');
  } catch (err) {
    console.error('[INDEXER] Error saving indexer settings:', err);
  }
}

async function crawlDirectory(dirPath: string, maxDepth = 2, currentDepth = 0, opts?: { includeHiddenFolders?: boolean; indexHiddenContent?: boolean }) {
  if (currentDepth > maxDepth) return;
  try {
    if (!fs.existsSync(dirPath)) return;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const ext = path.extname(entry.name).toLowerCase();
      
      if (entry.isDirectory()) {
        const isHidden = entry.name.startsWith('.') || entry.name.startsWith('$');
        const isNodeModules = entry.name === 'node_modules';
        if (isNodeModules) continue;
        if (isHidden && !opts?.includeHiddenFolders) continue;

        systemIndex.push({
          name: entry.name,
          path: fullPath,
          ext: '',
          type: 'folder'
        });

        const shouldRecurse = opts?.indexHiddenContent || !isHidden;
        if (shouldRecurse) {
          await crawlDirectory(fullPath, maxDepth, currentDepth + 1, opts);
        }
      } else {
        const type = (ext === '.exe' || ext === '.lnk' || ext === '.cmd' || ext === '.bat' || ext === '.ps1') ? 'app' : 'file';
        systemIndex.push({
          name: entry.name,
          path: fullPath,
          ext,
          type
        });
      }
    }
  } catch (err) {
    // Ignore permission/read errors
  }
}

async function buildSystemIndex() {
  const settings = loadIndexerSettings();
  if (!settings.enabled) {
    console.log('[INDEXER] Indexador global deshabilitado por el usuario.');
    systemIndex = [];
    systemIndexStatus = 'OFFLINE';
    return;
  }

  console.log('[INDEXER] Iniciando indexación de sistema en segundo plano...');
  systemIndexStatus = 'INDEXING';
  const start = Date.now();
  systemIndex = [];

  const targets = settings.paths || [];
  const maxDepth = settings.maxDepth !== undefined ? settings.maxDepth : 2;
  const crawlOpts = {
    includeHiddenFolders: settings.includeHiddenFolders,
    indexHiddenContent: settings.indexHiddenContent
  };

  for (const target of targets) {
    if (fs.existsSync(target)) {
      const targetDepth = isStartMenuPath(target) ? Math.max(maxDepth, 4) : maxDepth;
      await crawlDirectory(target, targetDepth, 0, crawlOpts);
    }
  }

  systemIndexStatus = 'ONLINE';
  console.log(`[INDEXER] Indexación terminada en ${Date.now() - start}ms. Total items: ${systemIndex.length}`);
}

// =====================================
// IPC HANDLERS
// =====================================
function setupIpcHandlers() {
  // --- Obtener configuraciones del indexador global ---
  ipcMain.handle('get-indexer-settings', async () => {
    return loadIndexerSettings();
  });

  // --- Guardar configuraciones del indexador global ---
  ipcMain.handle('save-indexer-settings', async (_event, settings: { enabled: boolean; maxDepth: number; paths: string[]; includeHiddenFolders: boolean; indexHiddenContent: boolean }) => {
    saveIndexerSettings(settings);
    buildSystemIndex().catch(err => console.error('[INDEXER] Error building index after save:', err));
    return true;
  });

  // --- Obtener estadísticas en vivo del indexador global ---
  ipcMain.handle('get-indexer-stats', async () => {
    return {
      status: systemIndexStatus,
      totalFiles: systemIndex.length
    };
  });

  // --- Seleccionar carpeta nativa de Windows para indexación ---
  ipcMain.handle('select-indexer-folder', async () => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Seleccionar carpeta para indexar'
    });
    isDialogOpen = false;
    showMainWindow();
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // --- Obtener unidades lógicas del sistema ---
  ipcMain.handle('get-system-drives', async () => {
    const drives: string[] = [];
    for (let i = 65; i <= 90; i++) { // 'A' to 'Z'
      const char = String.fromCharCode(i);
      const drivePath = `${char}:\\`;
      try {
        if (fs.existsSync(drivePath)) {
          drives.push(drivePath);
        }
      } catch (e) {
        // Ignorar unidades no disponibles o protegidas
      }
    }
    return drives;
  });

  const systemFileIconCache = new Map<string, string>();
  let systemSearchGeneration = 0;

  // --- Búsqueda indexada global de sistema ---
  ipcMain.handle('search-system-files', async (_event, query: string) => {
    if (!query || query.trim() === '') return [];
    const normalizedQuery = query.toLowerCase().trim();
    const qLen = normalizedQuery.length;
    const gen = ++systemSearchGeneration;

    // 1 letra ≈ miles de hits: solo prefijo + priorizar apps, y cortar pronto
    const shortQuery = qLen <= 1;
    const collectLimit = shortQuery ? 80 : 400;
    const resultLimit = shortQuery ? 20 : 40;

    type Ranked = IndexedFile & { _score: number; _typeRank: number; _base: string };
    const ranked: Ranked[] = [];

    for (const item of systemIndex) {
      const base = path.parse(item.name).name;
      const nameLower = item.name.toLowerCase();
      const baseLower = base.toLowerCase();

      let score = 99;
      if (baseLower === normalizedQuery || nameLower === normalizedQuery) score = 0;
      else if (baseLower.startsWith(normalizedQuery) || nameLower.startsWith(normalizedQuery)) score = 1;
      else if (!shortQuery && (baseLower.includes(normalizedQuery) || nameLower.includes(normalizedQuery))) score = 2;

      if (score >= 99) continue;

      // En consultas de 1 carácter priorizar programas/accesos; carpetas/archivos solo si sobra cupo
      if (shortQuery && item.type !== 'app' && ranked.length >= 40) continue;

      let typeRank = 4;
      if (item.type === 'app') {
        if (item.ext === '.lnk') typeRank = 0;
        else if (item.ext === '.exe') typeRank = 1;
        else typeRank = 2;
      } else if (item.type === 'folder') typeRank = 3;

      ranked.push({ ...item, _score: score, _typeRank: typeRank, _base: base });
      if (ranked.length >= collectLimit) break;
    }

    if (gen !== systemSearchGeneration) return [];

    ranked.sort((a, b) => {
      if (a._score !== b._score) return a._score - b._score;
      if (a._typeRank !== b._typeRank) return a._typeRank - b._typeRank;
      return a._base.localeCompare(b._base, undefined, { numeric: true, sensitivity: 'base' });
    });

    const topMatches = ranked.slice(0, resultLimit);

    // Iconos: en queries cortas solo cache (evita 20× getFileIcon bloqueando el main process)
    const resolveIcon = async (item: IndexedFile): Promise<string> => {
      if (item.type === 'folder') return '';
      const cached = systemFileIconCache.get(item.path);
      if (cached) return cached;
      if (shortQuery) return '';
      try {
        if (!fs.existsSync(item.path)) return '';
        const fileIcon = await app.getFileIcon(item.path, { size: 'normal' });
        if (fileIcon && !fileIcon.isEmpty()) {
          const data = fileIcon.toDataURL();
          systemFileIconCache.set(item.path, data);
          return data;
        }
      } catch { /* ignore */ }
      return '';
    };

    const results: Array<IndexedFile & { icon: string }> = [];
    const ICON_BATCH = 6;
    for (let i = 0; i < topMatches.length; i += ICON_BATCH) {
      if (gen !== systemSearchGeneration) return [];
      const batch = topMatches.slice(i, i + ICON_BATCH);
      const withIcons = await Promise.all(batch.map(async (item) => {
        const { _score, _typeRank, _base, ...rest } = item;
        return { ...rest, icon: await resolveIcon(rest) };
      }));
      results.push(...withIcons);
      // Ceder el event loop entre lotes para no congelar la UI
      await new Promise<void>(resolve => setImmediate(resolve));
    }

    return results;
  });

  // --- Seleccionar archivo desde el explorador de Windows ---
  ipcMain.handle('select-file', async (_event, options?: { filters?: Electron.FileFilter[] }) => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [
        { name: 'Todos los archivos', extensions: ['*'] },
        { name: 'Ejecutables', extensions: ['exe', 'lnk', 'bat', 'cmd', 'ps1'] },
      ],
    });
    isDialogOpen = false;
    showMainWindow();
    if (result.canceled || result.filePaths.length === 0) return null;
    
    // Devolver la información completa, incluyendo el ícono
    return await resolveFullFileInfo(result.filePaths[0]);
  });

  // --- Seleccionar imagen desde el explorador de Windows ---
  ipcMain.handle('select-image', async () => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Imágenes', extensions: ['jpg', 'png', 'gif', 'webp', 'ico'] },
      ],
    });
    isDialogOpen = false;
    showMainWindow();
    if (result.canceled || result.filePaths.length === 0) return null;
    
    // Para imágenes pequeñas (iconos), devolveremos la ruta cruda.
    return result.filePaths[0];
  });

  // --- Obtener Base64 de una imagen local ---
  ipcMain.handle('get-image-data', async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) return null;
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      const mimeType = ext === 'ico' ? 'image/x-icon' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (e) {
      console.error('Error leyendo imagen para Base64:', e);
      return null;
    }
  });
  // --- Lanzar aplicación (ejecutar .exe, abrir URL, etc.) ---
  ipcMain.handle('launch-app', async (_event, appPath: string, isAdmin?: boolean) => {
    if (!appPath) return { success: false, error: 'No path provided' };

    try {
      // Si parece una URL, abrirla en el navegador predeterminado
      if (appPath.startsWith('http://') || appPath.startsWith('https://')) {
        await shell.openExternal(appPath);
        return { success: true };
      }

      // Si es una aplicación UWP/Windows Store (AUMID conteniendo '!' y '_'), lanzarla virtualmente
      const isUwp = appPath.includes('!') && appPath.includes('_');
      if (isUwp) {
        console.log(`[LAUNCH] Lanzando app de Windows Store via AUMID: ${appPath}`);
        const command = `explorer.exe shell:AppsFolder\\${appPath}`;
        exec(command, (err) => {
          if (err) {
            console.error('[LAUNCH] Error al lanzar app de Windows Store via AUMID:', err);
          }
        });
        windowVisibilityState = 'hidden-intentional';
        hideMainWindow();
        return { success: true };
      }

      // Si es una ruta del sistema, intentar abrirla con shell.openPath o PowerShell RunAs
      // Esto maneja .exe, .lnk (accesos directos), .bat, carpetas, etc.
      const normalizedPath = path.normalize(appPath);

      // Verificar si el archivo/ruta existe
      if (!fs.existsSync(normalizedPath)) {
        return { success: false, error: `Ruta no encontrada: ${normalizedPath}` };
      }

      if (isAdmin && process.platform === 'win32') {
        console.log(`[LAUNCH] Intentando lanzar como administrador: ${normalizedPath}`);
        // Escapar comillas simples para PowerShell
        const escapedPath = normalizedPath.replace(/'/g, "''");
        const command = `powershell -NoProfile -Command "Start-Process -FilePath '${escapedPath}' -Verb RunAs"`;
        
        exec(command, (err) => {
          if (err) {
            console.error('[LAUNCH] Error al ejecutar como administrador:', err);
          }
        });

        // Ocultar al tray al lanzar una app
        windowVisibilityState = 'hidden-intentional';
        hideMainWindow();
        return { success: true };
      } else {
        const errorMessage = await shell.openPath(normalizedPath);
        if (errorMessage) {
          return { success: false, error: errorMessage };
        }
        // Ocultar al tray al lanzar una app
        windowVisibilityState = 'hidden-intentional';
        hideMainWindow();
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error desconocido al lanzar la aplicación' };
    }
  });

  // --- Obtener aplicaciones de Windows Store (UWP/MSIX) ---
  ipcMain.handle('get-uwp-apps', async () => {
    return new Promise((resolve) => {
      const psScript = `# Full UWP Scanner with Icon Extraction (Standard User version)
\$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

\$startApps = Get-StartApps | Where-Object { \$_.AppID -like "*!*" -and \$_.AppID -like "*_*" }

\$packages = Get-AppxPackage
\$packageMap = @{}
foreach (\$pkg in \$packages) {
    if (\$pkg.InstallLocation) {
        \$packageMap[\$pkg.PackageFamilyName] = \$pkg.InstallLocation
    }
}

\$uwpApps = @()

foreach (\$app in \$startApps) {
    \$name = \$app.Name
    \$aumid = \$app.AppID
    
    \$parts = \$aumid.Split('!')
    if (\$parts.Length -lt 2) { continue }
    \$family = \$parts[0]
    \$appId = \$parts[1]
    
    \$installDir = \$packageMap[\$family]
    \$iconBase64 = ""
    
    if (\$installDir -and (Test-Path "\$installDir\\AppxManifest.xml")) {
        try {
            [xml]\$manifest = Get-Content "\$installDir\\AppxManifest.xml" -Raw
            
            \$ns = New-Object Xml.XmlNamespaceManager \$manifest.NameTable
            \$ns.AddNamespace("ns", "http://schemas.microsoft.com/appx/manifest/foundation/windows10")
            \$ns.AddNamespace("uap", "http://schemas.microsoft.com/appx/manifest/uap/windows10")
            
            \$appNode = \$manifest.SelectSingleNode("//ns:Application[@Id='\$appId']", \$ns)
            if (-not \$appNode) {
                \$appNode = \$manifest.SelectSingleNode("//Application[@Id='\$appId']")
            }
            
            if (\$appNode) {
                \$visualElements = \$appNode.SelectSingleNode("uap:VisualElements", \$ns)
                if (-not \$visualElements) { \$visualElements = \$appNode.SelectSingleNode("VisualElements") }
                
                if (\$visualElements) {
                    \$logoAttributes = @("Square44x44Logo", "Square150x150Logo", "Logo", "SmallLogo")
                    \$logoRelativePaths = @()
                    
                    foreach (\$attrName in \$logoAttributes) {
                        if (\$visualElements.Attributes[\$attrName]) {
                            \$logoRelativePaths += \$visualElements.Attributes[\$attrName].Value
                        }
                    }
                    
                    \$foundIcon = \$false
                    foreach (\$relPath in \$logoRelativePaths) {
                        if (\$foundIcon) { break }
                        
                        \$cleanPath = \$relPath.Replace('/', '\\')
                        \$fullPath = Join-Path \$installDir \$cleanPath
                        
                        \$parentDir = Split-Path \$fullPath
                        \$fileName = Split-Path \$fullPath -Leaf
                        \$baseName = [System.IO.Path]::GetFileNameWithoutExtension(\$fileName)
                        \$ext = [System.IO.Path]::GetExtension(\$fileName)
                        
                        if (Test-Path \$parentDir) {
                            \$matchingFiles = Get-ChildItem -Path \$parentDir -Filter "\$baseName*\$ext"
                            if (\$matchingFiles) {
                                \$bestFile = \$matchingFiles | Where-Object { \$_.Name -like "*scale-200*" } | Select-Object -First 1
                                if (-not \$bestFile) { \$bestFile = \$matchingFiles | Where-Object { \$_.Name -like "*targetsize-48*" } | Select-Object -First 1 }
                                if (-not \$bestFile) { \$bestFile = \$matchingFiles | Where-Object { \$_.Name -like "*scale-100*" } | Select-Object -First 1 }
                                if (-not \$bestFile) { \$bestFile = \$matchingFiles | Select-Object -First 1 }
                                
                                if (\$bestFile) {
                                    \$bytes = [System.IO.File]::ReadAllBytes(\$bestFile.FullName)
                                    \$b64 = [System.Convert]::ToBase64String(\$bytes)
                                    \$mime = "image/png"
                                    if (\$ext -eq ".jpg" -or \$ext -eq ".jpeg") { \$mime = "image/jpeg" }
                                    elseif (\$ext -eq ".ico") { \$mime = "image/x-icon" }
                                    \$iconBase64 = "data:\$mime;base64,\$b64"
                                    \$foundIcon = \$true
                                }
                            }
                        }
                    }
                }
            }
        } catch {
            # Skip
        }
    }
    
    \$uwpApps += [PSCustomObject]@{
        name = \$name
        aumid = \$aumid
        icon = \$iconBase64
    }
}

\$uwpApps | ConvertTo-Json
`;

      const tmpPs = path.join(os.tmpdir(), `cl-uwp-apps-${Date.now()}.ps1`);
      try {
        fs.writeFileSync(tmpPs, psScript, 'utf-8');
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`, { maxBuffer: 25 * 1024 * 1024 }, (err, stdout) => {
          try {
            if (fs.existsSync(tmpPs)) fs.unlinkSync(tmpPs);
          } catch {}

          if (err) {
            console.error('[UWP] Error ejecutando script de escaneo:', err);
            resolve([]);
            return;
          }

          try {
            const apps = JSON.parse(stdout.trim() || '[]');
            resolve(apps);
          } catch (e) {
            console.error('[UWP] Error parseando salida JSON de escaneo:', e);
            resolve([]);
          }
        });
      } catch (e) {
        console.error('[UWP] Error escribiendo o preparando script de escaneo:', e);
        try {
          if (fs.existsSync(tmpPs)) fs.unlinkSync(tmpPs);
        } catch {}
        resolve([]);
      }
    });
  });

  // --- Obtener monitores disponibles ---
  ipcMain.handle('get-monitors', () => {
    const displays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    return displays.map((d, index) => ({
      id: d.id.toString(),
      label: d.id === primary.id ? `${index + 1} (Primario)` : `Monitor ${index + 1}`,
      isPrimary: d.id === primary.id,
      bounds: d.workArea,
      size: d.workAreaSize,
    }));
  });

  // --- Mover ventana a un monitor específico (o modo seguir cursor) ---
  ipcMain.handle('set-monitor', (_event, monitorId: string) => {
    if (!mainWindow) return;
    persistSelectedMonitorInConfig(monitorId);

    if (monitorId === MONITOR_FOLLOW_CURSOR) {
      placeWindowOnDisplay(getCursorDisplay());
      saveWindowState();
      return { success: true, monitorId };
    }

    const displays = screen.getAllDisplays();
    const target = displays.find(d => d.id.toString() === monitorId);
    if (!target) return { success: false };

    placeWindowOnDisplay(target);
    saveWindowState();
    return { success: true, monitorId };
  });

  // --- Registrar atajo global desde React ---
  ipcMain.handle('register-shortcut', (_event, shortcut: string) => {
    registerGlobalShortcut(shortcut);
    return { success: true, shortcut: currentShortcut };
  });

  // --- Controles de ventana (minimizar, maximizar, cerrar) ---
  ipcMain.handle('window-minimize', () => {
    windowVisibilityState = 'hidden-intentional';
    hideMainWindow();
  });

  ipcMain.handle('window-maximize-toggle', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    windowVisibilityState = 'hidden-intentional';
    hideMainWindow();
  });

  ipcMain.handle('window-hide-to-tray', () => {
    windowVisibilityState = 'hidden-intentional';
    hideMainWindow();
  });

  // (CyberTray IPCs removed)

  // --- Configurar inicio con Windows (auto-launch) ---
  ipcMain.handle('set-auto-launch', (_event, enabled: boolean, startMinimized?: boolean) => {
    const minimized = enabled && (startMinimized ?? readConfigBoolean('startMinimized'));
    applyAutoLaunchSettings(enabled, minimized);
    return { success: true, enabled, startMinimized: minimized };
  });

  ipcMain.handle('set-hide-on-blur', (_event, enabled: boolean) => {
    hideOnBlurEnabled = enabled;
    return { success: true, enabled };
  });

  ipcMain.handle('set-show-taskbar-icon', (_event, enabled: boolean) => {
    showTaskbarIcon = enabled;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setSkipTaskbar(!enabled);
    }
    return { success: true, enabled };
  });

  // --- Obtener información del sistema (CPU/Mem real) ---
  ipcMain.handle('get-system-info', () => {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const cpus = os.cpus();

      return {
        memory: {
          total: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,  // GB
          used: Math.round(usedMem / (1024 * 1024 * 1024) * 10) / 10,
          percent: Math.round((usedMem / totalMem) * 100),
        },
        cpu: {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
        },
        uptime: os.uptime(),
      };
    } catch (e) {
      console.error('Error en get-system-info:', e);
      return {
        memory: { total: 16, used: 8, percent: 50 },
        cpu: { model: 'Error', cores: 0 },
        uptime: 0
      };
    }
  });

  // --- Obtener uso de disco real (con cache 60s) ---
  let diskCache: { data: Array<{ drive: string; total: number; free: number; used: number; percent: number }>, ts: number } | null = null;
  
  ipcMain.handle('get-disk-info', async () => {
    if (diskCache && (Date.now() - diskCache.ts) < 60000) {
      return diskCache.data;
    }
    return new Promise((resolve) => {
      exec('wmic logicaldisk get size,freespace,caption', { timeout: 3000, encoding: 'utf-8' }, (err, stdout) => {
        if (err) {
          resolve(diskCache?.data || []);
          return;
        }
        const lines = stdout.trim().split('\n').slice(1);
        const disks: Array<{ drive: string; total: number; free: number; used: number; percent: number }> = [];
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const drive = parts[0];
            const free = parseInt(parts[1], 10);
            const total = parseInt(parts[2], 10);
            if (!isNaN(free) && !isNaN(total) && total > 0) {
              const used = total - free;
              disks.push({
                drive,
                total: Math.round(total / (1024 * 1024 * 1024) * 10) / 10,
                free: Math.round(free / (1024 * 1024 * 1024) * 10) / 10,
                used: Math.round(used / (1024 * 1024 * 1024) * 10) / 10,
                percent: Math.round((used / total) * 100),
              });
            }
          }
        }
        if (disks.length > 0) {
          diskCache = { data: disks, ts: Date.now() };
        }
        resolve(disks);
      });
    });
  });

  // --- Obtener ruta de archivo arrastrado (drag & drop nativo) ---
  ipcMain.handle('resolve-file-path', async (_event, filePath: string) => {
    return await resolveFullFileInfo(filePath);
  });

  ipcMain.handle('open-file-location', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (e: any) {
      console.error('Error opening file location:', e);
      return { success: false, error: e.message };
    }
  });

  // --- Exportar configuración (guardar archivo nativo) ---
  ipcMain.handle('export-config', async (_event, jsonData: string) => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `cyber-launcher-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    isDialogOpen = false;
    showMainWindow();
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, jsonData, 'utf-8');
    return result.filePath;
  });

  // --- Importar configuración (abrir archivo nativo) ---
  ipcMain.handle('import-config', async () => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    isDialogOpen = false;
    showMainWindow();
    if (result.canceled || result.filePaths.length === 0) return null;
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return content;
  });

  // --- Registrar hotspots desde React ---
  ipcMain.handle('set-hotspots', (_event, corners: string[], delay: number) => {
    console.log('ACTUALIZANDO HOTSPOTS:', corners, 'Delay:', delay);
    hotspotCorners = corners;
    hotspotDelay = delay;
    startHotspotPolling(); // no-op interval when corners empty
    return { success: true };
  });

  // --- Abrir Consola de Diagnóstico ---
  ipcMain.handle('open-dev-tools', () => {
    mainWindow?.webContents.openDevTools({ mode: 'detach' });
    return { success: true };
  });

  // --- Menú contextual nativo de edición de texto ---
  ipcMain.handle('show-text-context-menu', (_event, { x, y }: { x: number, y: number }) => {
    const webContents = _event.sender;
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Cortar', accelerator: 'CmdOrCtrl+X', click: () => webContents.cut() },
      { label: 'Copiar', accelerator: 'CmdOrCtrl+C', click: () => webContents.copy() },
      { label: 'Pegar', accelerator: 'CmdOrCtrl+V', click: () => webContents.paste() },
      { type: 'separator' },
      { label: 'Eliminar', click: () => webContents.delete() },
      { type: 'separator' },
      { label: 'Seleccionar todo', accelerator: 'CmdOrCtrl+A', click: () => webContents.selectAll() },
    ]);
    contextMenu.popup({ x, y });
  });

  // --- Obtener ruta del archivo de config (diagnostico) ---
  ipcMain.handle('get-config-path', () => CONFIG_FILE);

  // (CyberTray Data Persistence removed)

  // --- Abrir carpeta de datos en el explorador ---
  ipcMain.handle('open-data-folder', () => {
    const dir = path.dirname(CONFIG_FILE);
    shell.openPath(dir);
  });

  // --- Window Pinning (Always-on-top) ---
  ipcMain.handle('set-always-on-top', (_event, enabled: boolean) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(enabled);
      return { success: true };
    }
    return { success: false };
  });

  // --- Dynamic shortcuts ---
  ipcMain.handle('register-app-shortcuts', (_event, list) => {
    registerAppShortcutsList(list);
    return { success: true };
  });

  // --- Shell runner ---
  const activeProcesses = new Map<string, any>();

  ipcMain.handle('run-shell-command', (_event, fullCommand: string) => {
    const cmdId = Math.random().toString(36).substring(7);
    try {
      console.log(`[SHELL RUNNER] Starting command: ${fullCommand} with ID: ${cmdId}`);
      
      let child;
      if (process.platform === 'win32') {
        child = spawn('cmd.exe', ['/c', fullCommand], {
          shell: true,
          windowsHide: true,
        });
      } else {
        child = spawn('sh', ['-c', fullCommand], {
          shell: true,
        });
      }

      activeProcesses.set(cmdId, child);

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        mainWindow?.webContents.send('shell-command-output', {
          id: cmdId,
          type: 'stdout',
          text,
        });
      });

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        mainWindow?.webContents.send('shell-command-output', {
          id: cmdId,
          type: 'stderr',
          text,
        });
      });

      child.on('close', (code: number) => {
        mainWindow?.webContents.send('shell-command-exit', {
          id: cmdId,
          exitCode: code ?? 0,
        });
        activeProcesses.delete(cmdId);
      });

      child.on('error', (err: Error) => {
        mainWindow?.webContents.send('shell-command-output', {
          id: cmdId,
          type: 'stderr',
          text: err.message,
        });
        mainWindow?.webContents.send('shell-command-exit', {
          id: cmdId,
          exitCode: -1,
        });
        activeProcesses.delete(cmdId);
      });

      return { success: true, cmdId };
    } catch (err: any) {
      console.error('[SHELL RUNNER] Spawn error:', err);
      return { success: false, error: err.message };
    }
  });

  // --- Persistencia centralizada en userData ---
  ipcMain.handle('saveConfig', async (_event, config) => {
    isSavingConfig = true;
    try {
      const json = JSON.stringify(config, null, 2);
      await fs.promises.writeFile(CONFIG_FILE, json, 'utf-8');
      // Pequeña pausa para asegurar que el watcher no capture la escritura parcial
      await new Promise(r => setTimeout(r, 50));
      console.log('[CONFIG] Guardado:', CONFIG_FILE, 'apps:', config?.apps?.length || 0);
      return true;
    } catch (e: any) {
      console.error('[CONFIG] Error saving:', e?.message || e);
      return false;
    } finally {
      // Esperar un poco mas antes de reactivar el watcher para evitar que el OS reporte el evento tarde
      setTimeout(() => { isSavingConfig = false; }, 300);
    }
  });

  ipcMain.handle('loadConfig', async () => {
    try {
      console.log('[CONFIG] Ruta:', CONFIG_FILE);
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
        const data = JSON.parse(raw);
        console.log('[CONFIG] Cargado:', data.apps?.length || 0, 'apps');
        return data;
      }
      // Migrar desde ruta antigua si existe (antes de app.setName)
      const oldConfig = path.join(app.getPath('appData'), 'cyber-launcher', 'cyber-launcher-config.json');
      if (fs.existsSync(oldConfig)) {
        const raw = await fs.promises.readFile(oldConfig, 'utf-8');
        const data = JSON.parse(raw);
        await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2));
        return data;
      }
      return null;
    } catch (e) {
      console.error('Error loading config:', e);
      return null;
    }
  });
}

// =====================================
// SINGLE INSTANCE LOCK
// =====================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Otra instancia ya está corriendo, cerrar esta
  console.log('[SINGLE-INSTANCE] Otra instancia detectada, cerrando...');
  app.quit();
} else {
  app.on('second-instance', () => {
    console.log('[SINGLE-INSTANCE] Intento de segunda instancia (state=' + windowVisibilityState + ')');
    if (mainWindow) {
      if (!mainWindow.isVisible()) showMainWindow();
      if (mainWindow.isMinimized()) {
        ownRestoreCallId++;
        inOwnRestoreCall = ownRestoreCallId;
        mainWindow.restore();
        if (inOwnRestoreCall === ownRestoreCallId) inOwnRestoreCall = 0;
        setImmediate(() => { if (inOwnRestoreCall === ownRestoreCallId) inOwnRestoreCall = 0; });
      }
      mainWindow.focus();
    }
  });
}

// Catch unexpected errors to prevent silent death of intervals/listeners
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err?.message, err?.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
});

// =====================================
// APP LIFECYCLE
// =====================================
app.whenReady().then(() => {
  setupIpcHandlers();
  buildSystemIndex().catch(err => console.error('[INDEXER] Error building index:', err));
  
  const windowState = loadWindowState();
  if (windowState && windowState.shortcut) {
    currentShortcut = windowState.shortcut;
  }
  
  // Intentar cargar configuración centralizada (atajo, hotspots, etc.)
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (config.activationShortcut) {
        currentShortcut = config.activationShortcut;
        console.log('Atajo cargado desde configuración central:', currentShortcut);
      }
      if (config.hotspotCorners && Array.isArray(config.hotspotCorners)) {
        hotspotCorners = config.hotspotCorners;
        console.log('Hotspots cargados desde configuración central:', hotspotCorners);
      }
      if (config.hotspotDelay !== undefined) {
        hotspotDelay = config.hotspotDelay;
        console.log('Hotspot delay cargado desde configuración central:', hotspotDelay);
      }
      if (config.showTaskbarIcon === true) {
        showTaskbarIcon = true;
        console.log('Taskbar icon habilitado desde configuración central');
      }
      // (CyberTray config load removed)
    }
  } catch (e) {
    console.error('Error cargando configuración central:', e);
  }
  
  // Configurar el protocolo local-resource para cargar archivos locales
  protocol.handle('local-resource', async (request) => {
    try {
      // Obtener la ruta cruda eliminando el prefijo del protocolo
      const urlText = request.url;
      let filePath = decodeURIComponent(urlText.replace('local-resource://', ''));
      
      // En Windows, a veces quedan barras triples o iniciales
      if (filePath.startsWith('/')) filePath = filePath.slice(1);
      
      // Asegurarnos de que las barras sean las del sistema
      filePath = path.normalize(filePath);

      if (!fs.existsSync(filePath)) {
        console.error('ARCHIVO NO ENCONTRADO PARA PROTOCOLO:', filePath);
        return new Response('Not Found', { status: 404 });
      }

      const buffer = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon'
      };

      return new Response(buffer, {
        headers: { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' }
      });
    } catch (e) {
      console.error('Error en protocolo local-resource:', e);
      return new Response('Error', { status: 500 });
    }
  });

  createWindow();
  createTray();

  // Iniciar guardia de hotspots
  startHotspotPolling();

  // Iniciar detector de UAC (consent.exe polling)
  startUACGuard();

  // Vigilar cambios en el archivo de configuracion para sincronizar entre instancias
  let configWatcherReloadTimer: NodeJS.Timeout | null = null;
  const startConfigWatcher = () => {
    try {
      // Asegurar que el directorio existe
      const configDir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      // Si el archivo no existe aun, no podemos vigilarlo directamente; vigilar el directorio
      if (!fs.existsSync(CONFIG_FILE)) {
        console.log('[WATCH] Config file does not exist yet, watching directory');
      }
      const watchTarget = fs.existsSync(CONFIG_FILE) ? CONFIG_FILE : configDir;
      fs.watch(watchTarget, (eventType, filename) => {
        // Ignorar cambios generados por esta misma instancia al guardar
        if (isSavingConfig) {
          console.log('[WATCH] Ignoring self-triggered change');
          return;
        }
        const relevant = fs.existsSync(CONFIG_FILE)
          ? true
          : (filename === 'cyber-launcher-config.json');
        if (!relevant) return;
        if (eventType === 'change' || eventType === 'rename') {
          if (configWatcherReloadTimer) clearTimeout(configWatcherReloadTimer);
          configWatcherReloadTimer = setTimeout(() => {
            // Doble chequeo: si entre tanto guardamos nosotros mismos, no recargar
            if (isSavingConfig) {
              console.log('[WATCH] Skipping reload because we are saving');
              return;
            }
            console.log('[WATCH] External config file change detected, sending reload-config');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('reload-config');
            }
          }, 250);
        }
      });
      console.log('[WATCH] Started watching config for external changes');
    } catch (e) {
      console.error('[WATCH] Error setting up config watcher:', e);
    }
  };
  startConfigWatcher();

  // Registrar atajo global
  registerGlobalShortcut(currentShortcut);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // No cerrar, mantener en tray
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopUACGuard();
});
