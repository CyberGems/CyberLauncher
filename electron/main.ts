import { app, BrowserWindow, ipcMain, shell, Tray, Menu, globalShortcut, screen, nativeImage, dialog, protocol, net, powerMonitor, Notification } from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { exec, execSync, spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import * as pty from 'node-pty';
import { createDisplayDiagnostics } from './display-diagnostics';
import { resolveTargetDisplay } from './display-resolve';
import { initUpdater } from './updater';
import { initSystemAlerts, updateSystemAlertsConfig, stopSystemAlerts } from './system-alerts';
import { chooseNotificationChannel, type NotificationDeliverySettings } from '../src/notificationRouting';
import {
  parseBackupHours,
  parseBackupKeep,
  isBackupDue,
  backupFileName,
  isBackupFile,
  selectBackupsToPrune,
  DEFAULT_AUTO_BACKUP_HOURS,
  DEFAULT_AUTO_BACKUP_KEEP,
  type BackupItem,
} from '../shared/backup';

// Registrar el protocolo antes de que la app esté lista
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-resource', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, allowServiceWorkers: true } }
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ocultar advertencias de seguridad para modo de desarrollo en local
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Forzar mismo nombre en dev y produccion para compartir userData
app.setName('CyberLauncher');

// Modo portable: aislar datos de usuario en una subcarpeta 'data' junto al ejecutable portable
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  const portableUserDataPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data');
  try {
    fs.mkdirSync(portableUserDataPath, { recursive: true });
  } catch (err) {
    console.error('[PORTABLE] Failed to create portable data directory:', err);
  }
  app.setPath('userData', portableUserDataPath);
}

const displayDiagnostics = createDisplayDiagnostics(app.getPath('userData'));

// Prevenir pantallas negras causadas por el cálculo erróneo de oclusión de Chromium en Windows
// (especialmente con ventanas sin marco 'frame: false', maximizadas o en configuraciones multimonitor).
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
}


let mainWindow: BrowserWindow | null = null;

function displayWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return { window: 'missing' };
  try {
    const contents = mainWindow.webContents;
    return {
      window: 'available',
      visible: mainWindow.isVisible(),
      focused: mainWindow.isFocused(),
      minimized: mainWindow.isMinimized(),
      maximized: mainWindow.isMaximized(),
      rendererCrashed: contents.isCrashed(),
      backgroundThrottling: contents.getBackgroundThrottling(),
    };
  } catch {
    return { window: 'unavailable' };
  }
}

function requestVisibleRepaint(trigger: 'show' | 'periodic') {
  const window = mainWindow;
  if (!window || window.isDestroyed() || !window.isVisible() || window.isMinimized()) return;
  try {
    // A live renderer can stop presenting its surface after a long idle on Windows.
    // Ask Chromium to paint the existing page again without resetting UI state.
    window.webContents.invalidate();
    displayDiagnostics.write('repaint-requested', { trigger });
  } catch (error) {
    displayDiagnostics.write('repaint-error', {
      trigger,
      error: error instanceof Error ? error.name : 'unknown',
    });
  }
}
let tray: Tray | null = null;
let isQuitting = false;
let currentShortcut = 'Alt+Shift+L';
let hotspotCorners: string[] = [];
let hotspotDelay = 300;
let hotspotsDisableInFullscreen = true;
let hotspotTimer: NodeJS.Timeout | null = null;
let lastHotspotCorner = '';
let hotspotEntryTime = 0;
let isSavingConfig = false;
let isDialogOpen = false;
/** React UI modals (e.g. Add/Edit App) that must block hide-on-blur independently of native dialogs. */
let isUiModalOpen = false;
// ── STATE MACHINE & GUARDS ──
type VisibilityState = 'hidden-intentional' | 'shown-intentional' | 'hidden-blur' | 'hidden-os';
let windowVisibilityState: VisibilityState = 'hidden-intentional';
let ownShowCallId = 0;
let inOwnShowCall = 0;
let ownRestoreCallId = 0;
let inOwnRestoreCall = 0;
let hotspotCooldown = false;
let lastHotspotActionTime = 0;
let hasCursorExitedSinceLastAction = true;
let hideOnBlurEnabled = true;
let externalTerminalBlurGuardUntil = 0;
let showTaskbarIcon = false;
/** Ignore hide-on-blur during initial boot / first maximize (Windows steals focus briefly). */
let bootBlurGuardUntil = 0;
let lastHotspotPollTime = 0;
const HOTSPOT_LAG_THRESHOLD_MS = 400;
let hotspotsPausedByUAC = false;
let uacResumeTimer: NodeJS.Timeout | null = null;
let uacWatchdogTimer: NodeJS.Timeout | null = null;
let isCheckingUAC = false;
let cachedDisplays: Electron.Display[] = [];
/** Keep Chromium awake while hidden only if the renderer must tick (scheduled tasks). */
let keepRendererAwake = false;

function updateCachedDisplays() {
  try {
    cachedDisplays = screen.getAllDisplays();
    console.log(`[MONITOR] Cached ${cachedDisplays.length} displays`);
  } catch (e) {
    console.error('[MONITOR] Error updating cached displays:', e);
  }
}

function checkUACActive(callback: (active: boolean) => void) {
  if (process.platform !== 'win32') {
    callback(false);
    return;
  }
  exec('tasklist /FI "IMAGENAME eq consent.exe" /NH', { windowsHide: true }, (err, stdout) => {
    const isActive = !err && stdout.includes('consent.exe');
    callback(isActive);
  });
}

function watchUACUntilExit() {
  if (process.platform !== 'win32') return;
  if (uacWatchdogTimer) return; // Vigilante ya activo

  console.log('[UAC-GUARD] Starting watchdog for consent.exe exit');
  uacWatchdogTimer = setInterval(() => {
    checkUACActive((isActive) => {
      if (!isActive) {
        console.log('[UAC-GUARD] consent.exe finished — scheduling hotspot resume');
        if (uacWatchdogTimer) {
          clearInterval(uacWatchdogTimer);
          uacWatchdogTimer = null;
        }
        resumeHotspotsAfterUAC(600);
      }
    });
  }, 1000);
}

interface AppShortcutItem {
  id: number;
  path: string;
  shortcut: string;
  isAdmin: boolean;
  name?: string;
  icon?: string;
}

let appShortcuts: Array<AppShortcutItem> = [];

function registerAppShortcutsList(shortcutsList: Array<AppShortcutItem>) {
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
          console.log(`[GLOBAL HOTKEY] Launching app ${item.id} (${item.name || item.path}) via shortcut ${item.shortcut} (isAdmin: ${item.isAdmin})`);
          
          if (item.isAdmin && process.platform === 'win32') {
            pauseHotspots();
            watchUACUntilExit();
            const escapedPath = item.path.replace(/'/g, "''");
            const command = `powershell -NoProfile -Command "Start-Process -FilePath '${escapedPath}' -Verb RunAs"`;
            exec(command, { windowsHide: true });
          } else {
            shell.openPath(item.path);
          }

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('app-launched-via-hotkey', {
              id: item.id,
              path: item.path,
              name: item.name,
              icon: item.icon
            });
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
  if (uacWatchdogTimer) {
    clearInterval(uacWatchdogTimer);
    uacWatchdogTimer = null;
  }
  hotspotsPausedByUAC = false;
  isCheckingUAC = false;
  console.log('[HOTSPOT] Resumed immediately (user action)');
}

function pauseHotspots() {
  if (uacResumeTimer) clearTimeout(uacResumeTimer);
  hotspotsPausedByUAC = true;
  lastHotspotCorner = '';
  hotspotEntryTime = 0;
  hotspotCooldown = true;
  console.log('[HOTSPOT] Paused by secure-desktop / UAC guard');
}

function resumeHotspotsAfterUAC(delayMs = 600) {
  if (uacResumeTimer) clearTimeout(uacResumeTimer);
  if (uacWatchdogTimer) {
    clearInterval(uacWatchdogTimer);
    uacWatchdogTimer = null;
  }
  uacResumeTimer = setTimeout(() => {
    hotspotsPausedByUAC = false;
    isCheckingUAC = false;
    lastHotspotCorner = '';
    hotspotEntryTime = 0;
    hotspotCooldown = false;
    hasCursorExitedSinceLastAction = true;
    console.log('[HOTSPOT] Resumed after UAC exit buffer');
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
      // Siempre mantener al menos 1500ms de guarda contra desenfoque tras mostrar
      bootBlurGuardUntil = Math.max(bootBlurGuardUntil, Date.now() + 1500);
      syncHotspotLockAfterWindowChange();
      mainWindow.show();
      hideDesktopToastInternal();
      const pinned = mainWindow.isAlwaysOnTop();
      if (!pinned) {
        mainWindow.setAlwaysOnTop(true);
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(false);
      } else {
        mainWindow.focus();
      }
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
  // Only block while the native menu HWND exists. A time-based guard here
  // made Show/Hide from the tray stuck (window could not hide for up to 60s).
  if (trayMenuOpen) {
    if (!pendingTrayAction) pendingHideAfterTray = true;
    console.log('[WM] skip hideMainWindow — tray menu open');
    return;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('[WM] hideMainWindow');
    mainWindow.hide();
  }
}

/** Keep Chromium's normal visibility throttling unless a scheduled countdown must run while hidden. */
let throttlingTimer: ReturnType<typeof setTimeout> | null = null;
let lastLoggedBackgroundThrottling: boolean | null = null;
function applyRendererThrottling() {
  if (throttlingTimer) clearTimeout(throttlingTimer);
  throttlingTimer = setTimeout(() => {
    throttlingTimer = null;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    // Native tray menus crash on Windows if Chromium is put to sleep mid-popup.
    if (trayMenuOpen) return;
    try {
      // A visible window runs normally with throttling enabled. Toggling this
      // setting on every hide/show can leave Chromium's frame visibility stale.
      const allowed = !keepRendererAwake;
      const current = mainWindow.webContents.getBackgroundThrottling();
      if (current !== allowed) mainWindow.webContents.setBackgroundThrottling(allowed);
      if (allowed !== lastLoggedBackgroundThrottling) {
        lastLoggedBackgroundThrottling = allowed;
        displayDiagnostics.write('background-throttling', { allowed, changed: current !== allowed, ...displayWindowState() });
      }
    } catch (error) {
      displayDiagnostics.write('background-throttling-error', { error: error instanceof Error ? error.name : 'unknown' });
    }
  }, 80);
}

/** True when the cursor is over or immediately adjacent to the Windows tray icon. */
function isCursorNearTrayIcon(): boolean {
  try {
    if (!tray || tray.isDestroyed()) return false;
    const trayBounds = tray.getBounds();
    if (!trayBounds || (trayBounds.width === 0 && trayBounds.height === 0)) return false;
    const pt = screen.getCursorScreenPoint();
    const pad = 24;
    return (
      pt.x >= trayBounds.x - pad &&
      pt.x <= trayBounds.x + trayBounds.width + pad &&
      pt.y >= trayBounds.y - pad &&
      pt.y <= trayBounds.y + trayBounds.height + pad
    );
  } catch {
    return false;
  }
}

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');
const CONFIG_FILE = path.join(app.getPath('userData'), 'cyber-launcher-config.json');
const backupsDir = path.join(app.getPath('userData'), 'backups');

// ─── Respaldo automático programado ─────────────────────────────────────
let autoBackupTimer: NodeJS.Timeout | null = null;
let autoBackupRunning = false;

function getAutoBackupConfig(): { enabled: boolean; hours: number; keep: number; last: string | null } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return {
        enabled: config.autoBackupEnabled !== false,
        hours: parseBackupHours(config.autoBackupHours),
        keep: parseBackupKeep(config.autoBackupKeep),
        last: typeof config.autoBackupLast === 'string' ? config.autoBackupLast : null,
      };
    }
  } catch (err) {
    console.error('[BACKUP] Error reading config for backup:', err);
  }
  return {
    enabled: true,
    hours: DEFAULT_AUTO_BACKUP_HOURS,
    keep: DEFAULT_AUTO_BACKUP_KEEP,
    last: null,
  };
}

async function runAutoBackup(reason: 'schedule' | 'startup' | 'manual'): Promise<{ ok: boolean; file?: string; error?: string }> {
  if (autoBackupRunning) return { ok: false, error: 'Backup already in progress' };
  autoBackupRunning = true;
  try {
    if (!fs.existsSync(CONFIG_FILE)) return { ok: false, error: 'Config file does not exist' };
    fs.mkdirSync(backupsDir, { recursive: true });
    const file = backupFileName(new Date());
    const targetPath = path.join(backupsDir, file);

    fs.copyFileSync(CONFIG_FILE, targetPath);

    const cfg = getAutoBackupConfig();
    const files = fs.readdirSync(backupsDir);
    for (const old of selectBackupsToPrune(files, cfg.keep)) {
      try {
        fs.unlinkSync(path.join(backupsDir, old));
      } catch { /* ignore */ }
    }

    const now = new Date().toISOString();
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(raw);
      config.autoBackupLast = now;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[BACKUP] Failed to record autoBackupLast in config:', err);
    }

    console.log(`[BACKUP] (${reason}) saved as ${file}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backup:completed', { at: now, file });
    }
    return { ok: true, file };
  } catch (err: any) {
    console.error(`[BACKUP] (${reason}) failed:`, err);
    return { ok: false, error: err?.message || String(err) };
  } finally {
    autoBackupRunning = false;
  }
}

function startAutoBackupWatcher(): void {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
  const check = (reason: 'schedule' | 'startup') => {
    const cfg = getAutoBackupConfig();
    if (!cfg.enabled) return;
    if (isBackupDue(cfg.last, Date.now(), cfg.hours)) {
      void runAutoBackup(reason);
    }
  };
  setTimeout(() => check('startup'), 30_000);
  autoBackupTimer = setInterval(() => check('schedule'), 60_000);
}

function stopAutoBackupWatcher(): void {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
}

const START_MINIMIZED_ARG = '--start-minimized';
/** True when this process should boot to tray (login / --start-minimized). */
let startHiddenThisSession = false;

function hasStartupMinimizedArg(argv: string[]): boolean {
  if (!Array.isArray(argv)) return false;
  return argv.some((arg) => {
    if (typeof arg !== 'string') return false;
    const clean = arg.replace(/^["']|["']$/g, '').trim().toLowerCase();
    return (
      clean === '--start-minimized' ||
      clean === '--minimized' ||
      clean === '--hidden' ||
      clean === '--autostart' ||
      clean === '--startup' ||
      clean === '-minimized' ||
      clean === '-hidden' ||
      clean.startsWith('--start-minimized=')
    );
  });
}

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
  // En modo desarrollo puro, no contaminar el registro de inicio de Windows con node_modules\electron.exe
  if (!app.isPackaged && !process.env.PORTABLE_EXECUTABLE_FILE) {
    console.log('[AUTO-LAUNCH] Skipping setLoginItemSettings in development mode');
    return;
  }
  const exePath = process.env.PORTABLE_EXECUTABLE_FILE || app.getPath('exe');
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: exePath,
    args: enabled && startMinimized ? [START_MINIMIZED_ARG] : [],
  });
}

function computeStartHiddenThisSession(): boolean {
  // 1. Argumentos explícitos de línea de comandos
  if (hasStartupMinimizedArg(process.argv)) {
    console.log('[BOOT] Starting hidden to tray via command-line argument');
    return true;
  }

  // 2. Detección de arranque/reinicio del sistema:
  // Si las preferencias 'startWithWindows' y 'startMinimized' están activas y el sistema
  // operativo arrancó hace menos de 120 segundos (cubre reinicios y restauración de sesión).
  try {
    if (readConfigBoolean('startWithWindows') && readConfigBoolean('startMinimized')) {
      const uptimeSec = os.uptime();
      if (typeof uptimeSec === 'number' && uptimeSec < 120) {
        console.log(`[BOOT] Detected Windows startup/reboot (uptime: ${Math.round(uptimeSec)}s) with startMinimized enabled -> starting hidden to tray`);
        return true;
      }
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

// Tray: On Windows, using nativeImage.createFromPath(icoPath) preserves hicon_path_,
// allowing Electron's native_image->GetHICON(GetSystemMetrics(SM_CXSMICON)) to invoke
// ReadICOFromPath() and extract the exact DPI-matching layer natively via Win32 LoadImage
// (20x20 at 125%, 24x24 at 150%, 16x16 at 100%, 32x32 at 200%).
// An in-memory nativeImage (createEmpty + addRepresentation) lacks hicon_path_ and causes
// GetHICON to fall back to CreateHICONFromSkBitmap on the 1.0x 16px bitmap, which Windows then
// upscales, ruining sharpness and clipping the rounded corners.
function getTrayIcon() {
  const dir = VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public')
    : path.join(__dirname, '../dist');

  if (process.platform === 'win32') {
    const icoPath = path.join(dir, 'icon.ico');
    if (fs.existsSync(icoPath)) {
      const ico = nativeImage.createFromPath(icoPath);
      if (!ico.isEmpty()) return ico;
    }
  }

  const img = nativeImage.createEmpty();
  const reps: Array<{ scale: number; file: string }> = [
    { scale: 1, file: 'icon-16.png' },
    { scale: 1.25, file: 'icon-20.png' },
    { scale: 1.5, file: 'icon-24.png' },
    { scale: 1.75, file: 'icon-28.png' },
    { scale: 2, file: 'icon-32.png' },
    { scale: 2.5, file: 'icon-40.png' },
    { scale: 3, file: 'icon-48.png' },
  ];
  for (const r of reps) {
    const p = path.join(dir, r.file);
    if (!fs.existsSync(p)) continue;
    const slice = nativeImage.createFromPath(p);
    if (slice.isEmpty()) continue;
    img.addRepresentation({
      scaleFactor: r.scale,
      width: 16,
      height: 16,
      buffer: slice.toPNG(),
    });
  }
  if (!img.isEmpty()) return img;

  const icoPath = path.join(dir, 'icon.ico');
  if (fs.existsSync(icoPath)) {
    const ico = nativeImage.createFromPath(icoPath);
    if (!ico.isEmpty()) return ico;
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
      // Visible windows run at full speed with the default setting. Only scheduled
      // countdowns temporarily disable throttling while the window is hidden.
      backgroundThrottling: true,
    },
    autoHideMenuBar: true,
  });

  lastLoggedBackgroundThrottling = null;
  displayDiagnostics.write('window-created', displayWindowState());

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

  // Supervisión del proceso de renderizado ante salidas o cuelgues inesperados
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    displayDiagnostics.write('renderer-gone', { reason: details.reason, exitCode: details.exitCode, ...displayWindowState() });
    console.error('[RENDERER] Proceso de renderizado terminado:', details.reason, 'código:', details.exitCode);
    if (details.reason !== 'clean-exit' && !isQuitting) {
      console.log('[RENDERER] Recuperando ventana tras caída inesperada del proceso de renderizado');
      mainWindow?.reload();
    }
  });

  mainWindow.webContents.on('unresponsive', () => {
    displayDiagnostics.write('renderer-unresponsive', displayWindowState());
  });
  mainWindow.webContents.on('responsive', () => {
    displayDiagnostics.write('renderer-responsive', displayWindowState());
  });
  mainWindow.webContents.on('did-finish-load', () => {
    displayDiagnostics.write('renderer-loaded', displayWindowState());
  });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, _errorDescription, _url, isMainFrame) => {
    if (isMainFrame) displayDiagnostics.write('renderer-load-failed', { errorCode, ...displayWindowState() });
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
    displayDiagnostics.write('window-show', displayWindowState());
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
    applyRendererThrottling();
    setTimeout(() => requestVisibleRepaint('show'), 150);
    rebuildTrayMenu();
  });

  mainWindow.on('hide', () => {
    displayDiagnostics.write('window-hide', displayWindowState());
    console.log('[WM EVENT] hide');
    syncHotspotLockAfterWindowChange();
    applyRendererThrottling();
    // Defer/skip if tray menu is open — replacing context menu mid-hover crashes on Windows.
    rebuildTrayMenu();
  });

  // Nota: no enviar reload-config en focus — se disparaba en cada apertura (show+focus),
  // reseteaba la vista dos veces y forzaba loadConfig innecesario (lag).
  // La sync entre instancias sigue vía fs.watch → reload-config.
  mainWindow.on('blur', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    displayDiagnostics.write('window-blur', displayWindowState());
    lastHotspotCorner = '';
    hotspotEntryTime = 0;
    
    if (mainWindow.isAlwaysOnTop()) {
      mainWindow.webContents.send('always-on-top-blur-attempt');
      return;
    }

    // The external terminal is a companion to this panel. Keep CyberLauncher
    // visible behind it, then resume the normal hide-on-blur rule afterward.
    if (Date.now() < externalTerminalBlurGuardUntil) {
      externalTerminalBlurGuardUntil = 0;
      return;
    }

    if (!hideOnBlurEnabled) return;
    if (isTrayMenuGuardActive()) {
      console.log('[WM] Ignoring blur during tray menu');
      return;
    }

    // Si estamos dentro de bootBlurGuard (ej. guarda inicial o apertura por hotspot),
    // postergamos la comprobación hasta que expire la guarda en lugar de descartar el blur.
    // Si al expirar la ventana sigue sin foco, el usuario realmente cambió a otra aplicación.
    const delay = Math.max(200, (bootBlurGuardUntil - Date.now()) + 50);

    setTimeout(() => {
      if (isTrayMenuGuardActive()) {
        console.log('[WM] Ignoring blur during tray menu (delayed)');
        return;
      }
      if (trayMenuOpen) {
        console.log('[WM] Ignoring blur — tray menu open');
        return;
      }
      // Solo ignorar si el cursor está sobre el icono de la bandeja del sistema (prevenir crash de menú nativo)
      if (isCursorNearTrayIcon()) {
        console.log('[WM] Ignoring blur — cursor on tray icon');
        armTrayMenuGuard(4000);
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isFocused() && !isDialogOpen && !isUiModalOpen && hideOnBlurEnabled) {
        console.log('[MAIN] Window lost focus, hiding to tray');
        windowVisibilityState = 'hidden-blur';
        hideMainWindow();
      }
    }, delay);
  });

  mainWindow.on('focus', () => displayDiagnostics.write('window-focus', displayWindowState()));
  mainWindow.on('minimize', () => displayDiagnostics.write('window-minimize', displayWindowState()));

  mainWindow.on('restore', () => {
    displayDiagnostics.write('window-restore', displayWindowState());
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
// MENU CONTEXTUAL DEL TRAY (BILINGÜE)
// =====================================
const TRAY_I18N = {
  es: {
    showHide: 'Mostrar / Ocultar',
    newApp: 'Nuevo acceso...',
    settings: 'Configuración...',
    pinTrayIcon: 'Fijar icono en la barra...',
    help: 'Ayuda',
    faq: 'Preguntas frecuentes',
    changelog: 'Changelog',
    homepage: 'Sitio web',
    donate: 'Donar',
    about: 'Acerca de...',
    checkUpdates: 'Buscar actualizaciones...',
    mostRecent: 'Más recientes',
    noRecents: 'Ningún acceso reciente',
    quit: 'Salir',
  },
  en: {
    showHide: 'Show / Hide',
    newApp: 'New shortcut...',
    settings: 'Settings...',
    pinTrayIcon: 'Pin icon to taskbar...',
    help: 'Help',
    faq: 'Frequently Asked Questions',
    changelog: 'Changelog',
    homepage: 'Website',
    donate: 'Donate',
    about: 'About...',
    checkUpdates: 'Check for Update...',
    mostRecent: 'Most recent',
    noRecents: 'No recent shortcuts',
    quit: 'Exit',
  },
} as const;

function getTrayLanguage(): 'es' | 'en' {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (config.language === 'en' || config.language === 'es') return config.language;
    }
  } catch { /* ignore */ }
  return app.getLocale().toLowerCase().startsWith('en') ? 'en' : 'es';
}

function getMenuIconsDir(): string {
  return VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/menu-icons')
    : path.join(__dirname, '../dist/menu-icons');
}

function loadMenuIcon(name: string): Electron.NativeImage | undefined {
  const iconPath = path.join(getMenuIconsDir(), name);
  if (!fs.existsSync(iconPath)) return undefined;
  const img = nativeImage.createFromPath(iconPath);
  if (img.isEmpty()) return undefined;
  return img;
}

const recentIconCache = new Map<string, Electron.NativeImage>();

function loadRecentIcon(iconPath?: string): Electron.NativeImage | undefined {
  if (!iconPath) return undefined;

  let sourceKey = iconPath;
  let image: Electron.NativeImage;

  if (/^data:image\//i.test(iconPath)) {
    const cached = recentIconCache.get(sourceKey);
    if (cached) return cached;
    image = nativeImage.createFromDataURL(iconPath);
  } else if (/^local-resource:\/\//i.test(iconPath)) {
    let filePath = iconPath
      .replace(/^local-resource:\/\//i, '')
      .split(/[?#]/, 1)[0];
    try {
      filePath = decodeURIComponent(filePath);
    } catch {
      return undefined;
    }
    if (/^\/[A-Za-z]:[\\/]/.test(filePath)) filePath = filePath.slice(1);
    filePath = filePath.replace(/\//g, path.sep);
    const cacheVersion = iconPath.match(/[?#].*$/)?.[0] || '';
    sourceKey = `${filePath}${cacheVersion}`;
    const cached = recentIconCache.get(sourceKey);
    if (cached) return cached;
    if (!fs.existsSync(filePath)) return undefined;
    image = nativeImage.createFromPath(filePath);
  } else {
    if (!path.isAbsolute(iconPath) || !fs.existsSync(iconPath)) return undefined;
    sourceKey = iconPath;
    const cached = recentIconCache.get(sourceKey);
    if (cached) return cached;
    image = nativeImage.createFromPath(iconPath);
  }

  if (image.isEmpty()) return undefined;
  const sized = image.resize({ width: 16, height: 16 });
  if (sized.isEmpty()) return undefined;
  recentIconCache.set(sourceKey, sized);
  return sized;
}

/**
 * While the tray context menu is open, hide-on-blur + tray.setContextMenu race on Windows
 * and can crash the process when hovering menu items. Guard both paths.
 */
let trayMenuGuardUntil = 0;
let pendingTrayRebuild = false;
let trayRebuildTimer: ReturnType<typeof setTimeout> | null = null;
/** True while the native tray menu HWND exists. */
let trayMenuOpen = false;
let lastTrayRightClickAt = 0;
let trayClickTimer: ReturnType<typeof setTimeout> | null = null;
let pendingHideAfterTray = false;
let trayMenuCloseFallback: ReturnType<typeof setTimeout> | null = null;
/** Bumped on every right-click / menu-will-show so a delayed left-click can cancel. */
let trayRightClickSeq = 0;
type TrayPendingAction = 'show' | 'hide' | 'new-app' | 'settings' | 'about' | 'check-updates' | 'quit' | 'launch-recent';
let pendingTrayAction: TrayPendingAction | null = null;

type TrayRecentItem = { name: string; path: string; isAdmin?: boolean; iconPath?: string };
let trayRecents: TrayRecentItem[] = [];
let pendingRecentLaunch: TrayRecentItem | null = null;
let lastTrayRecentsKey = '';

function getTrayRecentsFile() {
  return path.join(app.getPath('userData'), 'tray-recents.json');
}

function loadPersistedTrayRecents(): TrayRecentItem[] {
  try {
    const f = getTrayRecentsFile();
    if (fs.existsSync(f)) {
      const data = JSON.parse(fs.readFileSync(f, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch { /* ignore */ }
  return [];
}

function savePersistedTrayRecents(items: TrayRecentItem[]) {
  try {
    const f = getTrayRecentsFile();
    fs.writeFileSync(f, JSON.stringify(items, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

function setTrayRecents(items: unknown[]): void {
  const next: TrayRecentItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const path = typeof item.path === 'string' ? item.path.trim() : '';
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const iconPath = typeof item.iconPath === 'string' ? item.iconPath.trim() : '';
    if (!path || !name) continue;
    next.push({
      name: name.slice(0, 80),
      path,
      isAdmin: !!item.isAdmin,
      ...(iconPath ? { iconPath } : {}),
    });
    if (next.length >= 10) break;
  }
  const key = JSON.stringify(next);
  if (key === lastTrayRecentsKey) return;
  lastTrayRecentsKey = key;
  trayRecents = next;
  savePersistedTrayRecents(next);
  rebuildTrayMenu();
}

/** Brief post-menu blur ignore only — never used to block hideMainWindow. */
function armTrayMenuGuard(ms = 400) {
  trayMenuGuardUntil = Math.max(trayMenuGuardUntil, Date.now() + ms);
}

function isTrayMenuGuardActive() {
  return Date.now() < trayMenuGuardUntil;
}

function triggerOpenAbout(checkUpdates = false) {
  showMainWindow();
  const send = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('open-about', { checkUpdates });
    }
  };
  send();
  setTimeout(send, 80);
}

function resolveOpenTaskbarSettingsExe(): string | null {
  const candidates = [
    // Packaged extraResources (outside asar — required to spawn)
    path.join(process.resourcesPath || '', 'open-taskbar-settings.exe'),
    // Dev: compiled helper next to the C# source
    path.join(__dirname, '../electron/open-taskbar-settings.exe'),
    path.join(app.getAppPath(), 'electron', 'open-taskbar-settings.exe'),
    path.join(__dirname, 'open-taskbar-settings.exe'),
  ];
  return candidates.find(p => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  }) ?? null;
}

function tryCompileOpenTaskbarSettingsExe(): string | null {
  const csCandidates = [
    path.join(__dirname, '../electron/OpenTaskbarSettings.cs'),
    path.join(app.getAppPath(), 'electron', 'OpenTaskbarSettings.cs'),
  ];
  const csPath = csCandidates.find(p => fs.existsSync(p));
  const csc = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
  if (!csPath || !fs.existsSync(csc)) return null;

  const framework = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319';
  const targetExe = path.join(os.tmpdir(), 'cyberlauncher-open-taskbar-settings.exe');
  try {
    execSync(
      `"${csc}" /nologo /target:winexe /out:"${targetExe}" ` +
      `/r:"${framework}\\WPF\\UIAutomationClient.dll" ` +
      `/r:"${framework}\\WPF\\UIAutomationTypes.dll" ` +
      `"${csPath}"`,
      { windowsHide: true },
    );
    return fs.existsSync(targetExe) ? targetExe : null;
  } catch (compileErr) {
    console.warn('[SETTINGS] csc compile fallback error:', compileErr);
    return null;
  }
}

function openTaskbarIconSettings() {
  try {
    if (process.platform === 'win32') {
      let exePath = resolveOpenTaskbarSettingsExe();
      if (!exePath) exePath = tryCompileOpenTaskbarSettingsExe();

      if (exePath) {
        console.log('[SETTINGS] Launching native open-taskbar-settings.exe from:', exePath);
        const child = spawn(exePath, [], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        });
        child.unref();
        return;
      }

      console.warn('[SETTINGS] open-taskbar-settings.exe not found; falling back to ms-settings:taskbar');
    }

    void shell.openExternal('ms-settings:taskbar');
  } catch (err) {
    console.error('[SETTINGS] Error in openTaskbarIconSettings:', err);
    void shell.openExternal('ms-settings:taskbar');
  }
}

function getTrayMenuTemplate(): Electron.MenuItemConstructorOptions[] {
  const lang = getTrayLanguage();
  const t = TRAY_I18N[lang];
  const version = app.getVersion();
  const isVisible = !!(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
  const parts = t.showHide.split(' / ');
  const dynamicLabel = isVisible ? (parts[1] || 'Hide') : (parts[0] || 'Show');
  const iconBrand = loadMenuIcon('brand.png');
  const iconShow = loadMenuIcon('show-hide.png');
  const iconAdd = loadMenuIcon('add.png');
  const iconSettings = loadMenuIcon('settings.png');
  const iconHelp = loadMenuIcon('help.png');
  const iconFaq = loadMenuIcon('faq.png');
  const iconChangelog = loadMenuIcon('changelog.png');
  const iconHome = loadMenuIcon('homepage.png');
  const iconDonate = loadMenuIcon('donate.png');
  const iconAbout = loadMenuIcon('about.png');
  const iconRecent = loadMenuIcon('recent.png');
  const iconUpdate = loadMenuIcon('update.png');
  const iconQuit = loadMenuIcon('quit.png');

  return [
    {
      label: `CyberLauncher v${version}`,
      ...(iconBrand ? { icon: iconBrand } : {}),
      click: () => {
        pendingTrayAction = null;
        triggerOpenAbout(false);
      },
    },
    { type: 'separator' },
    {
      label: dynamicLabel,
      ...(iconShow ? { icon: iconShow } : {}),
      accelerator: currentShortcut || undefined,
      click: () => { pendingTrayAction = isVisible ? 'hide' : 'show'; },
    },
    {
      label: t.newApp,
      ...(iconAdd ? { icon: iconAdd } : {}),
      click: () => { pendingTrayAction = 'new-app'; },
    },
    {
      label: t.settings,
      ...(iconSettings ? { icon: iconSettings } : {}),
      click: () => { pendingTrayAction = 'settings'; },
    },
    {
      label: t.mostRecent,
      ...(iconRecent ? { icon: iconRecent } : {}),
      submenu: trayRecents.length > 0
        ? trayRecents.map((item, index) => {
            const itemIcon = loadRecentIcon(item.iconPath) || iconRecent;
            return {
              label: `${index + 1}. ${item.name}`,
              ...(itemIcon ? { icon: itemIcon } : {}),
              click: () => {
                pendingTrayAction = 'launch-recent';
                pendingRecentLaunch = item;
              },
            };
          })
        : [{ label: t.noRecents, enabled: false }],
    },
    {
      label: t.help,
      ...(iconHelp ? { icon: iconHelp } : {}),
      submenu: [
        {
          label: t.pinTrayIcon,
          ...(iconSettings ? { icon: iconSettings } : {}),
          click: () => { openTaskbarIconSettings(); },
        },
        { type: 'separator' },
        {
          label: t.help,
          ...(iconHelp ? { icon: iconHelp } : {}),
          click: () => { void shell.openExternal('https://github.com/CyberGems/CyberLauncher/wiki'); },
        },
        {
          label: t.faq,
          ...(iconFaq ? { icon: iconFaq } : {}),
          click: () => { void shell.openExternal('https://github.com/CyberGems/CyberLauncher/wiki/FAQ'); },
        },
        {
          label: t.changelog,
          ...(iconChangelog ? { icon: iconChangelog } : {}),
          click: () => { void shell.openExternal('https://github.com/CyberGems/CyberLauncher/releases'); },
        },
        {
          label: t.homepage,
          ...(iconHome ? { icon: iconHome } : {}),
          click: () => { void shell.openExternal('https://cybergems.org'); },
        },
        {
          label: t.donate,
          ...(iconDonate ? { icon: iconDonate } : {}),
          click: () => { void shell.openExternal('https://github.com/CyberGems/CyberLauncher#%EF%B8%8F-donate'); },
        },
        { type: 'separator' },
        {
          label: t.about,
          ...(iconAbout ? { icon: iconAbout } : {}),
          click: () => {
            pendingTrayAction = null;
            triggerOpenAbout(false);
          },
        },
        {
          label: t.checkUpdates,
          ...(iconUpdate ? { icon: iconUpdate } : {}),
          click: () => {
            pendingTrayAction = null;
            triggerOpenAbout(true);
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: t.quit,
      ...(iconQuit ? { icon: iconQuit } : {}),
      click: () => { pendingTrayAction = 'quit'; },
    },
  ];
}

// =====================================
// CUSTOM TRAY MENU WINDOW (SUITE STANDARD)
// =====================================
const SUITE_SHORT_DESCS: Record<string, { es: string; en: string }> = {
  cyberclock: { es: 'Reloj de escritorio', en: 'Desktop Clock' },
  cyberfeeds: { es: 'Lector RSS', en: 'RSS Reader' },
  cyberlauncher: { es: 'Lanzador de apps', en: 'App Launcher' },
  cybermanager: { es: 'Administrador de tareas', en: 'Task Manager' },
  cybernotes: { es: 'Notas', en: 'Note Taking' },
  cyberpaste: { es: 'Portapapeles', en: 'Clipboard Manager' },
  cybersnap: { es: 'Captura de pantalla', en: 'Screen Capture' },
  cybertray: { es: 'Accesos directos', en: 'Shortcut Manager' },
  cyberviewer: { es: 'Visor de imágenes', en: 'Image Viewer' },
  cyberwall: { es: 'Firewall', en: 'Firewall' },
};

function getSuiteAppsList(lang: 'es' | 'en') {
  try {
    const candidates = [
      path.join(__dirname, '../public/assets/suite/suite.json'),
      path.join(app.getAppPath(), 'dist/assets/suite/suite.json'),
      path.join(app.getAppPath(), 'public/assets/suite/suite.json'),
    ];
    const found = candidates.find(p => fs.existsSync(p));
    if (found) {
      const data = JSON.parse(fs.readFileSync(found, 'utf-8'));
      if (data && Array.isArray(data.apps)) {
        return data.apps.map((a: any) => ({
          slug: a.slug,
          name: a.name,
          desc: (SUITE_SHORT_DESCS[a.slug] && SUITE_SHORT_DESCS[a.slug][lang]) || (a.tagline && a.tagline[lang]) || a.name,
          site: a.site || `https://cybergems.org/apps/${a.slug}/`,
        }));
      }
    }
  } catch { /* fallback */ }

  return Object.entries(SUITE_SHORT_DESCS).map(([slug, descObj]) => ({
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    desc: descObj[lang] || descObj.en,
    site: `https://cybergems.org/apps/${slug}/`,
  }));
}

let trayMenuWin: BrowserWindow | null = null;
let trayMenuAnchor: any = null;
let trayMenuHideTimer: ReturnType<typeof setTimeout> | null = null;
let trayMenuLastShown = 0;
const TRAY_MENU_CARD_WIDTH = 292;
const TRAY_MENU_SHADOW_PAD = 24;
const TRAY_MENU_EST_HEIGHT = 550;
let lastTrayMenuHeight = 550;
let mainViewHeight = 550;

let showTrayRecentsConfig = true;
let showSuiteRecommendationsConfig = true;

function loadTrayConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (typeof cfg.showTrayRecents === 'boolean') showTrayRecentsConfig = cfg.showTrayRecents;
      if (typeof cfg.showSuiteRecommendations === 'boolean') showSuiteRecommendationsConfig = cfg.showSuiteRecommendations;
    }
  } catch { /* ignore */ }
  if (trayRecents.length === 0) {
    trayRecents = loadPersistedTrayRecents();
  }
}

function isLauncherWindowVisible(): boolean {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  if (!mainWindow.isVisible()) return false;
  if (mainWindow.isMinimized()) return false;
  if (windowVisibilityState.startsWith('hidden')) return false;
  return true;
}

function buildTrayMenuState(resetView = false) {
  loadTrayConfig();
  const lang = getTrayLanguage();
  const isVisible = isLauncherWindowVisible();
  const suiteApps = getSuiteAppsList(lang);

  return {
    version: app.getVersion(),
    lang,
    isVisible,
    shortcut: currentShortcut || 'Alt+Shift+L',
    showTrayRecents: showTrayRecentsConfig,
    showSuiteRecommendations: showSuiteRecommendationsConfig,
    recents: trayRecents,
    suiteApps,
    resetView,
  };
}

function trayMenuGeometry(iconBounds: any, windowW: number, windowH: number) {
  let b = (iconBounds && typeof iconBounds.x === 'number' && (iconBounds.width || iconBounds.height))
    ? { x: iconBounds.x, y: iconBounds.y, width: iconBounds.width || 0, height: iconBounds.height || 0 }
    : null;
  if (!b) {
    let p: any = null;
    try { p = screen.getCursorScreenPoint(); } catch (_) { p = { x: 0, y: 0 }; }
    b = { x: p.x, y: p.y, width: 0, height: 0 };
  }
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  let display: any;
  try { display = screen.getDisplayNearestPoint({ x: cx, y: cy }); }
  catch (_) { display = screen.getPrimaryDisplay(); }
  const work = (display && display.workArea) || { x: 0, y: 0, width: windowW, height: windowH };

  const gap = 4;
  const pad = TRAY_MENU_SHADOW_PAD;
  const cardW = windowW - 2 * pad;
  const cardH = windowH - 2 * pad;

  let cardX: number, cardY: number;
  const dLeft = cx - work.x;
  const dRight = (work.x + work.width) - cx;
  const dTop = cy - work.y;
  const dBottom = (work.y + work.height) - cy;

  if (dBottom <= dLeft && dBottom <= dRight && dBottom <= dTop) {
    cardX = cx - cardW / 2;
    cardY = b.y - gap - cardH;
  } else if (dTop <= dLeft && dTop <= dRight) {
    cardX = cx - cardW / 2;
    cardY = b.y + b.height + gap;
  } else if (dLeft <= dRight) {
    cardX = b.x + b.width + gap;
    cardY = cy - cardH / 2;
  } else {
    cardX = b.x - gap - cardW;
    cardY = cy - cardH / 2;
  }

  // Position outer window centered on card
  let windowX = cardX - pad;
  let windowY = cardY - pad;

  // Clamp outer window strictly inside display workArea / screen boundaries.
  // This guarantees that the window padding (where the shadow fades out) never
  // crosses the monitor boundary, eliminating sharp shadow clipping by DWM.
  windowX = Math.min(Math.max(windowX, work.x + 2), work.x + work.width - windowW - 2);

  const screenBottom = (display.bounds ? display.bounds.y + display.bounds.height : work.y + work.height) - 2;
  windowY = Math.min(Math.max(windowY, work.y + 2), screenBottom - windowH);

  return { x: Math.round(windowX), y: Math.round(windowY), width: Math.round(windowW), height: Math.round(windowH) };
}

function getTrayPreloadPath(): string {
  const isDev = Boolean(VITE_DEV_SERVER_URL);
  const candidates = [
    isDev ? path.join(__dirname, '../public/tray/tray-preload.cjs') : '',
    path.join(app.getAppPath(), 'dist/tray/tray-preload.cjs'),
    path.join(__dirname, '../dist/tray/tray-preload.cjs'),
    path.join(__dirname, '../public/tray/tray-preload.cjs'),
    path.join(process.cwd(), 'public/tray/tray-preload.cjs'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(__dirname, '../public/tray/tray-preload.cjs');
}

function getTrayHtmlPath(): string {
  const isDev = Boolean(VITE_DEV_SERVER_URL);
  const candidates = [
    isDev ? path.join(__dirname, '../public/tray/tray-menu.html') : '',
    path.join(app.getAppPath(), 'dist/tray/tray-menu.html'),
    path.join(__dirname, '../dist/tray/tray-menu.html'),
    path.join(__dirname, '../public/tray/tray-menu.html'),
    path.join(process.cwd(), 'public/tray/tray-menu.html'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(__dirname, '../public/tray/tray-menu.html');
}

function ensureTrayMenuWin(): BrowserWindow {
  if (trayMenuWin && !trayMenuWin.isDestroyed()) return trayMenuWin;

  const trayHtml = getTrayHtmlPath();
  const preloadPath = getTrayPreloadPath();

  console.log('[TRAY] Initializing tray menu window:', { trayHtml, preloadPath });

  const windowW = TRAY_MENU_CARD_WIDTH + 2 * TRAY_MENU_SHADOW_PAD;
  trayMenuWin = new BrowserWindow({
    width: windowW,
    height: TRAY_MENU_EST_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  trayMenuWin.webContents.on('console-message', (_e, level, msg, line, src) => {
    console.log(`[TRAY-CONSOLE] [lvl=${level}] ${msg} (${src}:${line})`);
  });

  trayMenuWin.webContents.on('preload-error', (_e, pPath, error) => {
    console.error('[TRAY-PRELOAD-ERROR]', pPath, error);
  });

  trayMenuWin.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[TRAY-FAIL-LOAD]', code, desc, url);
  });

  trayMenuWin.setAlwaysOnTop(true, 'pop-up-menu');
  void trayMenuWin.loadFile(trayHtml);

  trayMenuWin.on('blur', () => {
    if (trayMenuHideTimer) return;
    if (Date.now() - trayMenuLastShown < 250) return;
    trayMenuHideTimer = setTimeout(() => {
      trayMenuHideTimer = null;
      hideCustomTrayMenu();
    }, 120);
  });

  trayMenuWin.on('closed', () => {
    trayMenuWin = null;
    trayMenuOpen = false;
  });

  trayMenuWin.webContents.once('did-finish-load', () => {
    if (!trayMenuWin || trayMenuWin.isDestroyed()) return;
    trayMenuWin.webContents.send('tray-menu-state', buildTrayMenuState(true));
  });

  return trayMenuWin;
}

function showCustomTrayMenu(eventBounds?: any) {
  if (!tray || tray.isDestroyed()) return;
  let b = (eventBounds && typeof eventBounds.x === 'number' && (eventBounds.width || eventBounds.height))
    ? eventBounds : null;
  if (!b) { try { b = tray.getBounds(); } catch (_) { b = null; } }
  if (!b || (!b.width && !b.height)) {
    let p: any = null; try { p = screen.getCursorScreenPoint(); } catch (_) { p = { x: 0, y: 0 }; }
    b = p ? { x: p.x, y: p.y, width: 0, height: 0 } : { x: 0, y: 0, width: 0, height: 0 };
  }

  trayMenuAnchor = b;
  if (trayMenuHideTimer) { clearTimeout(trayMenuHideTimer); trayMenuHideTimer = null; }

  const w = ensureTrayMenuWin();
  if (!w || w.isDestroyed()) return;

  trayMenuOpen = true;
  armTrayMenuGuard(3000);

  const windowW = TRAY_MENU_CARD_WIDTH + 2 * TRAY_MENU_SHADOW_PAD;
  const initialH = mainViewHeight || lastTrayMenuHeight || TRAY_MENU_EST_HEIGHT;
  const geo = trayMenuGeometry(trayMenuAnchor, windowW, initialH);
  w.setBounds(geo);
  if (!w.isVisible()) w.show();
  w.focus();
  trayMenuLastShown = Date.now();

  const freshState = buildTrayMenuState(true);
  w.webContents.send('tray-menu-state', freshState);
  w.webContents.send('tray-menu-show');
  w.webContents.send('tray-menu-reset');
}

function hideCustomTrayMenu() {
  if (trayMenuHideTimer) { clearTimeout(trayMenuHideTimer); trayMenuHideTimer = null; }
  trayMenuOpen = false;
  armTrayMenuGuard(400);
  if (trayMenuWin && !trayMenuWin.isDestroyed()) {
    if (trayMenuWin.isVisible()) {
      trayMenuWin.hide();
    }
    trayMenuWin.webContents.send('tray-menu-reset');
  }
}

function updateCustomTrayMenuState() {
  if (trayMenuWin && !trayMenuWin.isDestroyed()) {
    trayMenuWin.webContents.send('tray-menu-state', buildTrayMenuState(false));
  }
}

// =====================================
// FLOATING TRAY PIN TIP WINDOW (SUITE MODEL)
// =====================================
let trayPinTipWin: BrowserWindow | null = null;

function hasSeenTrayPinTip(): boolean {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (typeof cfg.hasSeenTrayPinTip === 'boolean') return cfg.hasSeenTrayPinTip;
    }
  } catch { /* ignore */ }
  return false;
}

function setSeenTrayPinTip(seen: boolean) {
  try {
    let cfg: any = {};
    if (fs.existsSync(CONFIG_FILE)) {
      cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    cfg.hasSeenTrayPinTip = seen;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

function getTrayPinTipHtmlPath(): string {
  const isDev = Boolean(VITE_DEV_SERVER_URL);
  const candidates = [
    isDev ? path.join(__dirname, '../public/tray/tray-pin-tip.html') : '',
    path.join(app.getAppPath(), 'dist/tray/tray-pin-tip.html'),
    path.join(__dirname, '../dist/tray/tray-pin-tip.html'),
    path.join(__dirname, '../public/tray/tray-pin-tip.html'),
    path.join(process.cwd(), 'public/tray/tray-pin-tip.html'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(__dirname, '../public/tray/tray-pin-tip.html');
}

function ensureTrayPinTipWin(): BrowserWindow {
  if (trayPinTipWin && !trayPinTipWin.isDestroyed()) return trayPinTipWin;

  const htmlPath = getTrayPinTipHtmlPath();
  const preloadPath = getTrayPreloadPath();

  trayPinTipWin = new BrowserWindow({
    width: 380,
    height: 230,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  trayPinTipWin.setAlwaysOnTop(true, 'pop-up-menu');
  void trayPinTipWin.loadFile(htmlPath);

  trayPinTipWin.on('closed', () => {
    trayPinTipWin = null;
  });

  return trayPinTipWin;
}

function trayPinTipGeometry(anchor: any, windowW = 380, windowH = 230) {
  let b = (anchor && typeof anchor.x === 'number' && (anchor.width || anchor.height))
    ? { x: anchor.x, y: anchor.y, width: anchor.width || 0, height: anchor.height || 0 }
    : null;
  if (!b && tray && !tray.isDestroyed()) {
    try { b = tray.getBounds(); } catch (_) { b = null; }
  }
  if (!b || (!b.width && !b.height)) {
    let p: any = null;
    try { p = screen.getCursorScreenPoint(); } catch (_) { p = { x: 0, y: 0 }; }
    b = { x: p.x, y: p.y, width: 0, height: 0 };
  }

  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  let display: any;
  try { display = screen.getDisplayNearestPoint({ x: cx, y: cy }); }
  catch (_) { display = screen.getPrimaryDisplay(); }

  const work = (display && display.workArea) || { x: 0, y: 0, width: 1920, height: 1080 };
  const bounds = (display && display.bounds) || work;

  const pad = 20;
  const cardW = 340;
  const gap = 6;

  const dBottom = (bounds.y + bounds.height) - cy;
  const dTop = cy - bounds.y;
  let edge: 'bottom' | 'top' = 'bottom';
  let windowX: number, windowY: number;

  if (dTop < dBottom && dTop < 100) {
    edge = 'top';
    windowY = b.y + b.height + gap - pad;
  } else {
    edge = 'bottom';
    windowY = b.y - windowH - gap + pad;
  }

  windowX = cx - windowW / 2;
  windowX = Math.min(Math.max(windowX, bounds.x + 4), bounds.x + bounds.width - windowW - 4);
  windowY = Math.min(Math.max(windowY, work.y + 4), bounds.y + bounds.height - windowH - 4);

  const cardLeft = windowX + pad;
  let tailOffset = cx - cardLeft - 8;
  tailOffset = Math.min(Math.max(tailOffset, 16), cardW - 32);

  return {
    x: Math.round(windowX),
    y: Math.round(windowY),
    width: Math.round(windowW),
    height: Math.round(windowH),
    edge,
    tailOffset: Math.round(tailOffset),
  };
}

function showTrayPinTip(customAnchor?: any) {
  const w = ensureTrayPinTipWin();
  if (!w || w.isDestroyed()) return;

  const anchor = customAnchor || (tray && !tray.isDestroyed() ? tray.getBounds() : null);
  const geo = trayPinTipGeometry(anchor);

  w.setBounds({ x: geo.x, y: geo.y, width: geo.width, height: geo.height });
  if (!w.isVisible()) w.show();
  w.focus();

  const lang = getTrayLanguage();
  const sendData = () => {
    if (w && !w.isDestroyed()) {
      w.webContents.send('tray-pin-tip-data', {
        lang,
        edge: geo.edge,
        tailOffset: geo.tailOffset,
      });
    }
  };

  sendData();
  w.webContents.once('did-finish-load', sendData);
}

function hideTrayPinTip() {
  if (trayPinTipWin && !trayPinTipWin.isDestroyed()) {
    trayPinTipWin.hide();
  }
}

// =====================================
// INDEPENDENT DESKTOP TOAST WINDOW
// =====================================
let desktopToastWin: BrowserWindow | null = null;
let desktopToastAutoDismissTimer: NodeJS.Timeout | null = null;
let latestToastPayload: any = null;
let desktopToastVisibilityVersion = 0;
let toastDeliverySettings: NotificationDeliverySettings = {
  botEnabled: true,
  bannersEnabled: true,
  chatterLevel: 'full',
  quietHours: { enabled: false, from: '22:00', to: '07:00' },
};

function updateToastDeliverySettings(value: unknown) {
  if (!value || typeof value !== 'object') return;
  const settings = value as Partial<NotificationDeliverySettings>;
  if (typeof settings.botEnabled === 'boolean') toastDeliverySettings.botEnabled = settings.botEnabled;
  if (typeof settings.bannersEnabled === 'boolean') toastDeliverySettings.bannersEnabled = settings.bannersEnabled;
  if (settings.chatterLevel === 'full' || settings.chatterLevel === 'minimal') toastDeliverySettings.chatterLevel = settings.chatterLevel;
  if (settings.quietHours && typeof settings.quietHours === 'object') {
    const hours = settings.quietHours;
    const validTime = (value: unknown) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    toastDeliverySettings.quietHours = {
      enabled: typeof hours.enabled === 'boolean' ? hours.enabled : toastDeliverySettings.quietHours.enabled,
      from: validTime(hours.from) ? hours.from : toastDeliverySettings.quietHours.from,
      to: validTime(hours.to) ? hours.to : toastDeliverySettings.quietHours.to,
    };
  }
}

function getToastWindowHtmlPath(): string {
  const isDev = Boolean(VITE_DEV_SERVER_URL);
  const candidates = [
    isDev ? path.join(__dirname, '../public/tray/toast-window.html') : '',
    path.join(app.getAppPath(), 'dist/tray/toast-window.html'),
    path.join(app.getAppPath(), 'public/tray/toast-window.html'),
    path.join(process.resourcesPath, 'public/tray/toast-window.html'),
    path.join(__dirname, '../dist/tray/toast-window.html'),
    path.join(__dirname, '../public/tray/toast-window.html'),
    path.join(process.cwd(), 'public/tray/toast-window.html'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(__dirname, '../public/tray/toast-window.html');
}

function ensureDesktopToastWin(): BrowserWindow {
  if (desktopToastWin && !desktopToastWin.isDestroyed()) return desktopToastWin;

  const htmlPath = getToastWindowHtmlPath();
  const preloadPath = getTrayPreloadPath();

  desktopToastWin = new BrowserWindow({
    width: 530,
    height: 180,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  desktopToastWin.setAlwaysOnTop(true, 'screen-saver');
  void desktopToastWin.loadFile(htmlPath);

  desktopToastWin.webContents.on('did-finish-load', () => {
    if (latestToastPayload && desktopToastWin && !desktopToastWin.isDestroyed()) {
      desktopToastWin.webContents.send('desktop-toast-data', latestToastPayload);
    }
  });

  desktopToastWin.on('closed', () => {
    desktopToastWin = null;
  });

  return desktopToastWin;
}

function showDesktopToastInternal(payload: any) {
  const launcherVisible = Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
  if (payload.source === 'system-alert' && launcherVisible) return;
  const channel = chooseNotificationChannel(toastDeliverySettings, {
    critical: payload.level === 'critical',
    essential: payload.type === 'imminent',
    botAvailable: !launcherVisible || !payload.botUnavailable,
  });
  if (channel === 'none' || (channel === 'bot' && launcherVisible)) {
    hideDesktopToastInternal();
    return;
  }
  desktopToastVisibilityVersion++;
  latestToastPayload = { ...payload, presentation: channel };
  const win = ensureDesktopToastWin();

  let targetDisplay: any;
  try {
    const point = screen.getCursorScreenPoint();
    targetDisplay = screen.getDisplayNearestPoint(point);
  } catch (_) {
    targetDisplay = screen.getPrimaryDisplay();
  }

  const work = targetDisplay.workArea || { x: 0, y: 0, width: 1920, height: 1080 };
  const winWidth = 530;
  const winHeight = 180;
  const pad = 12;
  const x = Math.round(work.x + work.width - winWidth - pad);
  const y = Math.round(work.y + work.height - winHeight - pad);

  win.setBounds({ x, y, width: winWidth, height: winHeight });

  if (desktopToastAutoDismissTimer) {
    clearTimeout(desktopToastAutoDismissTimer);
    desktopToastAutoDismissTimer = null;
  }

  if (!win.isVisible()) {
    win.showInactive();
  }

  if (!win.webContents.isLoading()) {
    win.webContents.send('desktop-toast-data', latestToastPayload);
  }

  if (payload.type !== 'imminent') {
    const ms = payload.action ? 8000 : 4500;
    desktopToastAutoDismissTimer = setTimeout(() => {
      hideDesktopToastInternal();
    }, ms);
  }
}

function hideDesktopToastInternal() {
  const version = ++desktopToastVisibilityVersion;
  latestToastPayload = null;
  if (desktopToastAutoDismissTimer) {
    clearTimeout(desktopToastAutoDismissTimer);
    desktopToastAutoDismissTimer = null;
  }
  if (desktopToastWin && !desktopToastWin.isDestroyed()) {
    desktopToastWin.webContents.send('desktop-toast-data', { type: 'hide' });
    setTimeout(() => {
      if (desktopToastVisibilityVersion === version && desktopToastWin && !desktopToastWin.isDestroyed()) {
        desktopToastWin.hide();
      }
    }, 220);
  }
}


function rebuildTrayMenu(): void {
  if (!tray) return;
  const version = app.getVersion();
  tray.setImage(getTrayIcon());
  tray.setToolTip(`CyberLauncher v${version}`);
  updateCustomTrayMenuState();
}

function createTray() {
  if (tray) return;
  tray = new Tray(getTrayIcon());
  rebuildTrayMenu();
  try {
    ensureTrayMenuWin();
  } catch (err: any) {
    console.warn('[TRAY] Failed to prewarm tray window:', err?.message || err);
  }

  setTimeout(() => {
    if (!hasSeenTrayPinTip()) {
      showTrayPinTip();
    }
  }, 2000);

  if (process.platform === 'win32') {
    tray.on('mouse-enter', () => {
      if (!trayMenuOpen) rebuildTrayMenu();
    });
    tray.on('right-click', (_event, bounds) => {
      if (trayMenuOpen && trayMenuWin && trayMenuWin.isVisible()) {
        hideCustomTrayMenu();
      } else {
        showCustomTrayMenu(bounds);
      }
    });
  }

  tray.on('click', () => {
    hideCustomTrayMenu();
    if (process.platform === 'win32') {
      const seq = trayRightClickSeq;
      if (trayClickTimer) clearTimeout(trayClickTimer);
      trayClickTimer = setTimeout(() => {
        trayClickTimer = null;
        if (trayMenuOpen || trayRightClickSeq !== seq || Date.now() - lastTrayRightClickAt < 400) {
          return;
        }
        if (!mainWindow || mainWindow.isDestroyed()) return;
        toggleWindow();
      }, 120);
      return;
    }
    toggleWindow();
  });

  tray.on('double-click', () => {
    hideCustomTrayMenu();
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
      return;
    }
    showMainWindow();
  });
}

// IPC Handlers for custom tray menu
ipcMain.on('tray-menu-action', (_event, action, payload) => {
  hideCustomTrayMenu();

  if (action === 'quit') {
    isQuitting = true;
    app.quit();
    return;
  }

  if (action === 'show') {
    showMainWindow();
    updateCustomTrayMenuState();
    applyRendererThrottling();
    return;
  }

  if (action === 'hide') {
    windowVisibilityState = 'hidden-intentional';
    mainWindow?.hide();
    updateCustomTrayMenuState();
    applyRendererThrottling();
    return;
  }

  if (action === 'new-app') {
    showMainWindow();
    mainWindow?.webContents.send('open-add-app');
    applyRendererThrottling();
    return;
  }

  if (action === 'settings') {
    showMainWindow();
    mainWindow?.webContents.send('open-settings');
    applyRendererThrottling();
    return;
  }

  if (action === 'about-modal') {
    triggerOpenAbout(false);
    applyRendererThrottling();
    return;
  }

  if (action === 'check-updates') {
    triggerOpenAbout(true);
    applyRendererThrottling();
    return;
  }

  if (action === 'help-pin') {
    hideCustomTrayMenu();
    showTrayPinTip();
    return;
  }

  if (action === 'help-faq') {
    void shell.openExternal('https://github.com/CyberGems/CyberLauncher/wiki#faq');
    return;
  }

  if (action === 'help-changelog') {
    void shell.openExternal('https://github.com/CyberGems/CyberLauncher/releases');
    return;
  }

  if (action === 'help-website') {
    void shell.openExternal('https://cybergems.org/apps/cyberlauncher/');
    return;
  }

  if (action === 'help-donate') {
    void shell.openExternal('https://ko-fi.com/cybergems');
    return;
  }

  if (action === 'suite-app' && payload?.site) {
    void shell.openExternal(payload.site);
    return;
  }

  if (action === 'suite-view-all') {
    void shell.openExternal('https://cybergems.org/#apps');
    return;
  }

  if (action === 'suite-home') {
    void shell.openExternal('https://cybergems.org');
    return;
  }

  if (action === 'launch-recent' && payload?.path) {
    void launchAppInternal(payload.path, payload.isAdmin).then((res) => {
      if (!res?.success) {
        console.warn('[TRAY] Recent launch failed:', res?.error || payload.path);
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app-launched-via-hotkey', {
          path: payload.path,
          name: payload.name,
        });
      }
    });
    applyRendererThrottling();
    return;
  }
});

ipcMain.on('tray-menu-hide', () => {
  hideCustomTrayMenu();
});

ipcMain.on('tray-menu-ready', (_event, rect) => {
  if (trayMenuWin && !trayMenuWin.isDestroyed() && trayMenuAnchor && rect && rect.height) {
    const pad = TRAY_MENU_SHADOW_PAD;
    const windowW = TRAY_MENU_CARD_WIDTH + 2 * pad;
    const isMain = rect.view === 'main' || !rect.view;

    if (isMain) {
      const naturalMainH = Math.min(Math.max(rect.height, 350), 750);
      mainViewHeight = naturalMainH;
      lastTrayMenuHeight = naturalMainH;

      const currentBounds = trayMenuWin.getBounds();
      if (Math.abs(currentBounds.height - naturalMainH) > 4 || Math.abs(currentBounds.width - windowW) > 4) {
        const geo = trayMenuGeometry(trayMenuAnchor, windowW, naturalMainH);
        trayMenuWin.setBounds(geo);
      }
    } else {
      // In a submenu: maintain at least mainViewHeight so the window never shrinks awkwardly
      // and forces scrolling. If the submenu needs more space, expand smoothly up to 750px.
      const desiredH = Math.min(Math.max(rect.height, mainViewHeight), 750);
      const currentBounds = trayMenuWin.getBounds();
      if (Math.abs(currentBounds.height - desiredH) > 4 || Math.abs(currentBounds.width - windowW) > 4) {
        const geo = trayMenuGeometry(trayMenuAnchor, windowW, desiredH);
        trayMenuWin.setBounds(geo);
      }
    }
  }
});

ipcMain.on('tray-menu-request-state', (event) => {
  event.reply('tray-menu-state', buildTrayMenuState(false));
});


ipcMain.handle('tray:update-settings', (_event, settings) => {
  if (settings && typeof settings.showTrayRecents === 'boolean') {
    showTrayRecentsConfig = settings.showTrayRecents;
  }
  if (settings && typeof settings.showSuiteRecommendations === 'boolean') {
    showSuiteRecommendationsConfig = settings.showSuiteRecommendations;
  }
  updateCustomTrayMenuState();
  return { success: true };
});

ipcMain.on('tray-pin-tip-ready', (_event, size) => {
  if (trayPinTipWin && !trayPinTipWin.isDestroyed() && size && size.height) {
    const cur = trayPinTipWin.getBounds();
    const h = Math.min(Math.max(size.height, 180), 300);
    const w = Math.min(Math.max(size.width, 340), 450);
    if (Math.abs(cur.height - h) > 4 || Math.abs(cur.width - w) > 4) {
      const geo = trayPinTipGeometry(tray && !tray.isDestroyed() ? tray.getBounds() : null, w, h);
      trayPinTipWin.setBounds({ x: geo.x, y: geo.y, width: geo.width, height: geo.height });
    }
  }
});

ipcMain.on('tray-pin-tip-dismiss', (_event, dontShowAgain) => {
  if (dontShowAgain) {
    setSeenTrayPinTip(true);
  }
  hideTrayPinTip();
});

ipcMain.on('tray-pin-tip-open-settings', (_event, dontShowAgain) => {
  if (dontShowAgain) {
    setSeenTrayPinTip(true);
  }
  hideTrayPinTip();
  openTaskbarIconSettings();
});

ipcMain.handle('show-tray-pin-tip', () => {
  showTrayPinTip();
  return { success: true };
});

ipcMain.handle('get-seen-tray-pin-tip', () => {
  return hasSeenTrayPinTip();
});

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
    if (trayMenuOpen) {
      console.log('[TOGGLE] ignored — tray menu open');
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

function getCheckFullscreenExePath(): string | null {
  const candidates = [
    path.join(process.resourcesPath || '', 'check-fullscreen.exe'),
    path.join(__dirname, '../electron/check-fullscreen.exe'),
    path.join(app.getAppPath(), 'electron', 'check-fullscreen.exe'),
    path.join(__dirname, 'check-fullscreen.exe'),
  ];
  return candidates.find((c) => c && fs.existsSync(c)) || null;
}

function checkFullscreenActive(x: number, y: number, callback: (isFullscreen: boolean) => void) {
  if (!hotspotsDisableInFullscreen) {
    callback(false);
    return;
  }
  const exePath = getCheckFullscreenExePath();
  if (!exePath) {
    callback(false);
    return;
  }
  execFile(exePath, [Math.round(x).toString(), Math.round(y).toString()], { windowsHide: true, timeout: 500 }, (error) => {
    if (error && (error as any).code === 1) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

const HOTSPOT_CORNER_THRESHOLD = 4; // px: margen de entrada en la esquina (amigable con HiDPI)
const HOTSPOT_EXIT_THRESHOLD = 30; // px: distancia mínima para considerar que el cursor abandonó la esquina
// Bounce guard after a hotspot toggle while the cursor is still in the corner.
const HOTSPOT_TOGGLE_SAFETY_MS = 200;

function getCursorHotspotState(): { currentCorner: string; isWithinExitZone: boolean } {
  if (hotspotCorners.length === 0) {
    return { currentCorner: '', isWithinExitZone: false };
  }

  const { x, y } = screen.getCursorScreenPoint();
  const displays = cachedDisplays.length > 0 ? cachedDisplays : screen.getAllDisplays();
  let activeDisplay = displays.find(
    (d) =>
      x >= d.bounds.x &&
      x < d.bounds.x + d.bounds.width &&
      y >= d.bounds.y &&
      y < d.bounds.y + d.bounds.height
  );
  if (!activeDisplay) {
    activeDisplay = screen.getDisplayNearestPoint({ x, y });
  }
  if (!activeDisplay) {
    return { currentCorner: '', isWithinExitZone: false };
  }

  const { x: dx, y: dy, width: dw, height: dh } = activeDisplay.bounds;
  const isTop = y >= dy && y <= dy + HOTSPOT_CORNER_THRESHOLD;
  const isBottom = y >= dy + dh - 1 - HOTSPOT_CORNER_THRESHOLD && y <= dy + dh - 1;
  const isLeft = x >= dx && x <= dx + HOTSPOT_CORNER_THRESHOLD;
  const isRight = x >= dx + dw - 1 - HOTSPOT_CORNER_THRESHOLD && x <= dx + dw - 1;

  let detected = '';
  if (isTop && isLeft) detected = 'top-left';
  else if (isTop && isRight) detected = 'top-right';
  else if (isBottom && isLeft) detected = 'bottom-left';
  else if (isBottom && isRight) detected = 'bottom-right';

  if (detected && hotspotCorners.includes(detected)) {
    return { currentCorner: detected, isWithinExitZone: true };
  }

  for (const corner of hotspotCorners) {
    let inZone = false;
    if (corner === 'top-left') {
      inZone = x >= dx && x <= dx + HOTSPOT_EXIT_THRESHOLD && y >= dy && y <= dy + HOTSPOT_EXIT_THRESHOLD;
    } else if (corner === 'top-right') {
      inZone = x >= dx + dw - 1 - HOTSPOT_EXIT_THRESHOLD && x <= dx + dw - 1 && y >= dy && y <= dy + HOTSPOT_EXIT_THRESHOLD;
    } else if (corner === 'bottom-left') {
      inZone = x >= dx && x <= dx + HOTSPOT_EXIT_THRESHOLD && y >= dy + dh - 1 - HOTSPOT_EXIT_THRESHOLD && y <= dy + dh - 1;
    } else if (corner === 'bottom-right') {
      inZone = x >= dx + dw - 1 - HOTSPOT_EXIT_THRESHOLD && x <= dx + dw - 1 && y >= dy + dh - 1 - HOTSPOT_EXIT_THRESHOLD && y <= dy + dh - 1;
    }
    if (inZone) {
      return { currentCorner: '', isWithinExitZone: true };
    }
  }

  return { currentCorner: '', isWithinExitZone: false };
}

/** Arm the re-entry lock only if the cursor is still in a hotspot. Launching an app
 *  already left the corner — requiring another leave+reenter made the next open fail. */
function syncHotspotLockAfterWindowChange() {
  lastHotspotCorner = '';
  hotspotEntryTime = 0;
  lastHotspotActionTime = Date.now();
  try {
    const { isWithinExitZone } = getCursorHotspotState();
    if (isWithinExitZone) {
      hasCursorExitedSinceLastAction = false;
      hotspotCooldown = true;
    } else {
      hasCursorExitedSinceLastAction = true;
      hotspotCooldown = false;
    }
  } catch {
    hasCursorExitedSinceLastAction = true;
    hotspotCooldown = false;
  }
}

let bootHotspotGuardUntil = Date.now() + 4000;

function startHotspotPolling() {
  stopHotspotPolling();
  lastHotspotPollTime = Date.now();
  lastHotspotCorner = '';
  hotspotEntryTime = 0;
  hotspotCooldown = false;
  // Al arrancar, el cursor NO ha salido aún de una posible esquina (ej. 0,0 al boot de Windows).
  // Debe salir de la zona de esquina antes de que se arme cualquier disparo.
  hasCursorExitedSinceLastAction = false;
  bootHotspotGuardUntil = Date.now() + 4000;

  if (hotspotCorners.length === 0) {
    console.log('[HOTSPOT] No corners configured — polling stopped');
    return;
  }
  
  hotspotTimer = setInterval(() => {
    if (hotspotsPausedByUAC || isCheckingUAC) return;
    if (Date.now() < bootHotspotGuardUntil) return;

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

    const { currentCorner, isWithinExitZone } = getCursorHotspotState();

    if (!isWithinExitZone) {
      hasCursorExitedSinceLastAction = true;
      lastHotspotCorner = '';
      hotspotEntryTime = 0;
    }
    if (now - lastHotspotActionTime >= HOTSPOT_TOGGLE_SAFETY_MS) {
      hotspotCooldown = false;
    }

    if (!currentCorner) return;

    if (currentCorner !== lastHotspotCorner) {
      lastHotspotCorner = currentCorner;
      hotspotEntryTime = now;
    }

    // After a hotspot toggle, the cursor must leave the corner before the next
    // action. After launching an app the cursor is already out, so this is armed.
    if (hotspotCooldown || !hasCursorExitedSinceLastAction) return;

    const timeInCorner = now - hotspotEntryTime;
    if (hotspotDelay > 0 && timeInCorner < hotspotDelay) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;

    hotspotCooldown = true;
    hasCursorExitedSinceLastAction = false;
    lastHotspotActionTime = now;

    const executeHotspotAction = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (mainWindow.isVisible()) {
        console.log(`OCULTAMIENTO VÁLIDO POR HOTSPOT: ${currentCorner} tras ${timeInCorner}ms`);
        if (mainWindow.isAlwaysOnTop()) {
          mainWindow.webContents.send('always-on-top-blur-attempt');
        } else {
          hideMainWindow();
        }
      } else {
        console.log(`ACTIVACIÓN VÁLIDA POR HOTSPOT: ${currentCorner} tras ${timeInCorner}ms`);
        showMainWindow();
      }
    };

    const { x, y } = screen.getCursorScreenPoint();

    const runHotspotWithGuards = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (!mainWindow.isVisible() && hotspotsDisableInFullscreen) {
        checkFullscreenActive(x, y, (isFs) => {
          if (isFs) {
            console.log(`[HOTSPOT] Ignored activation: fullscreen window detected on display under cursor (${currentCorner})`);
            return;
          }
          executeHotspotAction();
        });
      } else {
        executeHotspotAction();
      }
    };

    const isVulnerableToUAC = (currentCorner === 'top-left' || (x === 0 && y === 0));
    if (isVulnerableToUAC) {
      isCheckingUAC = true;
      checkUACActive((isUAC) => {
        isCheckingUAC = false;
        if (isUAC) {
          console.log('[HOTSPOT] Ignored activation due to UAC detection (consent.exe)');
          pauseHotspots();
          watchUACUntilExit();
          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
            windowVisibilityState = 'hidden-os';
            hideMainWindow();
          }
        } else {
          runHotspotWithGuards();
        }
      });
    } else {
      runHotspotWithGuards();
    }
  }, 100);
}

// UAC Guard continuous timer has been replaced with on-demand check + watchdog on exit.
function startUACGuard() {}
function stopUACGuard() {
  if (uacWatchdogTimer) {
    clearInterval(uacWatchdogTimer);
    uacWatchdogTimer = null;
  }
  if (uacResumeTimer) {
    clearTimeout(uacResumeTimer);
    uacResumeTimer = null;
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
  return `${toLocalResourceUrl(outPath)}?t=${Date.now()}`;
}

function resolvePathAndTarget(filePath: string): { normalized: string; resolvedPath: string; resolvedName: string; ext: string; shortcutIcon?: string; uwpAumid?: string } {
  const trimmed = filePath.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  let normalized = path.resolve(trimmed);
  if (!fs.existsSync(normalized)) {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const sys32 = path.join(sysRoot, 'System32', trimmed);
    const win = path.join(sysRoot, trimmed);
    const ps = path.join(sysRoot, 'System32', 'WindowsPowerShell', 'v1.0', trimmed);
    if (fs.existsSync(sys32)) normalized = sys32;
    else if (fs.existsSync(win)) normalized = win;
    else if (fs.existsSync(ps)) normalized = ps;
  }
  let ext = path.extname(normalized).toLowerCase();
  let resolvedPath = normalized;
  let resolvedName = path.basename(normalized, ext);
  let shortcutIcon: string | undefined;
  let uwpAumid: string | undefined;

  // Si la ruta misma es un AUMID UWP (e.g. Microsoft.WindowsTerminal_8wekyb3d8bbwe!App)
  if (trimmed.includes('!') && trimmed.includes('_')) {
    uwpAumid = trimmed;
    resolvedName = trimmed.split('!')[0].split('_')[0];
  } else if (ext === '.lnk') {
    try {
      const shortcut = shell.readShortcutLink(normalized);
      if (shortcut.target && fs.existsSync(shortcut.target)) {
        resolvedPath = path.resolve(shortcut.target);
      } else {
        try {
          const dir = path.dirname(normalized).replace(/'/g, "''");
          const base = path.basename(normalized).replace(/'/g, "''");
          const psCommand = `powershell -NoProfile -Command "$sh=New-Object -ComObject Shell.Application; $f=$sh.Namespace('${dir}'); $i=$f.ParseName('${base}'); $l=$i.GetLink; if ($l) { $p=$l.Path; $t=if ($l.Target) { $l.Target.Path } else { '' }; $ic=''; try { [void]$l.GetIconLocation([ref]$ic) } catch {}; Write-Output ($p + '|||' + $t + '|||' + $ic) }"`;
          const output = execSync(psCommand, { encoding: 'utf-8', timeout: 5000 }).trim();
          if (output) {
            const parts = output.split('|||');
            const lp = parts[0]?.trim();
            const tp = parts[1]?.trim();
            const ic = parts[2]?.trim();
            if (lp && fs.existsSync(lp)) {
              resolvedPath = path.resolve(lp);
            } else if (tp && fs.existsSync(tp)) {
              resolvedPath = path.resolve(tp);
            } else if (tp && tp.includes('!') && tp.includes('_')) {
              uwpAumid = tp;
            }
            if (ic && fs.existsSync(ic)) {
              shortcutIcon = path.resolve(ic);
            }
          }
        } catch { /* ignore fallback error */ }
      }
      if (shortcut.icon && fs.existsSync(shortcut.icon)) {
        shortcutIcon = path.resolve(shortcut.icon);
      }
      ext = path.extname(resolvedPath).toLowerCase();
      resolvedName = path.basename(resolvedPath, ext);
    } catch { /* ignore error */ }
  }

  return { normalized, resolvedPath, resolvedName, ext, shortcutIcon, uwpAumid };
}

function isGenericIcon(buf: Buffer): boolean {
  if (!buf || buf.length <= 600) return true;
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
  // c8c32689cde5c561: Windows generic executable window
  // 9afcae3fbafc7fc5: Windows generic shortcut document sheet
  // 20fd95c1eac7c058: Windows generic document
  // aef5af4525e103c0: Electron / VS Code win32 default.ico (generic document page with blue badge)
  if (
    sha256 === 'c8c32689cde5c561' ||
    sha256 === '9afcae3fbafc7fc5' ||
    sha256 === '20fd95c1eac7c058' ||
    sha256 === 'aef5af4525e103c0'
  ) {
    return true;
  }
  return false;
}

/** Extrae el icono original en alta resolución (256x256) mediante IShellItemImageFactory sin badges de flecha de acceso directo */
async function extractShellItemIcon(itemPath: string): Promise<Buffer | null> {
  if (!itemPath) return null;
  const escaped = itemPath.replace(/'/g, "''");
  const csharp = [
    'using System;',
    'using System.Runtime.InteropServices;',
    'using System.Drawing;',
    'public class ShellItemIconHelper {',
    '  [ComImport, Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]',
    '  interface IShellItemImageFactory {',
    '    [PreserveSig] int GetImage([In, MarshalAs(UnmanagedType.Struct)] SIZE size, [In] int flags, [Out] out IntPtr phbm);',
    '  }',
    '  [StructLayout(LayoutKind.Sequential)] struct SIZE { public int cx; public int cy; public SIZE(int cx, int cy) { this.cx = cx; this.cy = cy; } }',
    '  [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]',
    '  static extern void SHCreateItemFromParsingName([In, MarshalAs(UnmanagedType.LPWStr)] string pszPath, IntPtr pbc, [In, MarshalAs(UnmanagedType.LPStruct)] Guid riid, out IShellItemImageFactory ppv);',
    '  public static string SaveIcon(string path, string outPath, int size) {',
    '    try {',
    '      Guid uuid = new Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b");',
    '      IShellItemImageFactory factory;',
    '      SHCreateItemFromParsingName(path, IntPtr.Zero, uuid, out factory);',
    '      if (factory == null) return null;',
    '      IntPtr hBitmap;',
    '      int hr = factory.GetImage(new SIZE(size, size), 0x100, out hBitmap);',
    '      if (hr != 0) return null;',
    '      using (Bitmap bmp = Bitmap.FromHbitmap(hBitmap)) {',
    '        bmp.Save(outPath, System.Drawing.Imaging.ImageFormat.Png);',
    '      }',
    '      return outPath;',
    '    } catch { return null; }',
    '  }',
    '}'
  ].join('\n');

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$code = @'
${csharp}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
$tmp = [System.IO.Path]::GetTempFileName() + '.png'
$res = [ShellItemIconHelper]::SaveIcon('${escaped}', $tmp, 256)
if ($res -and (Test-Path $res)) { [Console]::WriteLine($res) }
`;

  const tmpPs = path.join(os.tmpdir(), `cl-shellitem-${Date.now()}-${Math.random().toString(36).slice(2)}.ps1`);
  try {
    await fs.promises.writeFile(tmpPs, psScript, 'utf-8');
    const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`, {
      encoding: 'utf-8',
      timeout: 8000,
      windowsHide: true,
    }).trim();
    if (out && fs.existsSync(out)) {
      const buf = await fs.promises.readFile(out);
      await fs.promises.unlink(out).catch(() => {});
      return buf;
    }
  } catch (e: any) {
    console.warn('[ICON] extractShellItemIcon error:', e?.message || e);
  } finally {
    await fs.promises.unlink(tmpPs).catch(() => {});
  }
  return null;
}

/** Extrae el icono original en alta resolución de paquetes UWP/MSIX sin badges de accesos directos */
async function extractUwpIcon(aumid: string): Promise<Buffer | null> {
  const parts = aumid.split('!');
  if (parts.length < 2) {
    return await extractShellItemIcon(`shell:AppsFolder\\${aumid}`);
  }
  const family = parts[0];
  const appId = parts[1];

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$pkg = Get-AppxPackage | Where-Object { $_.PackageFamilyName -eq '${family}' } | Select-Object -First 1
if (-not $pkg -or -not $pkg.InstallLocation) { exit 1 }
$dir = $pkg.InstallLocation
[xml]$manifest = Get-Content (Join-Path $dir 'AppxManifest.xml') -Raw
$ns = New-Object Xml.XmlNamespaceManager $manifest.NameTable
$ns.AddNamespace('ns', 'http://schemas.microsoft.com/appx/manifest/foundation/windows10')
$ns.AddNamespace('uap', 'http://schemas.microsoft.com/appx/manifest/uap/windows10')
$node = $manifest.SelectSingleNode("//ns:Application[@Id='${appId}']", $ns)
if (-not $node) { $node = $manifest.SelectSingleNode("//Application[@Id='${appId}']") }
if (-not $node) { exit 1 }
$ve = $node.SelectSingleNode('uap:VisualElements', $ns)
if (-not $ve) { $ve = $node.SelectSingleNode('VisualElements') }
if (-not $ve) { exit 1 }

$logoRel = ''
foreach ($attr in @('Square44x44Logo', 'Square150x150Logo', 'Logo', 'SmallLogo')) {
    if ($ve.Attributes[$attr] -and $ve.Attributes[$attr].Value) {
        $logoRel = $ve.Attributes[$attr].Value
        break
    }
}
if (-not $logoRel) { exit 1 }

$clean = $logoRel.Replace('/', '\\')
$full = Join-Path $dir $clean
$parent = Split-Path $full
$baseName = [System.IO.Path]::GetFileNameWithoutExtension($full)
$ext = [System.IO.Path]::GetExtension($full)

if (Test-Path $parent) {
    $best = (Get-ChildItem -Path $parent -Filter "$baseName*$ext" |
        Sort-Object -Property @{ Expression = {
            if ($_.Name -like '*targetsize-256*') { 1 }
            elseif ($_.Name -like '*scale-200*') { 2 }
            elseif ($_.Name -like '*targetsize-48*') { 3 }
            elseif ($_.Name -like '*scale-100*') { 4 }
            else { 5 }
        }} | Select-Object -First 1)

    if ($best) { [Console]::WriteLine($best.FullName) }
}
`;

  try {
    const tmpPs = path.join(os.tmpdir(), `cl-uwp-${Date.now()}-${Math.random().toString(36).slice(2)}.ps1`);
    await fs.promises.writeFile(tmpPs, psScript, 'utf-8');
    const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`, {
      encoding: 'utf-8',
      timeout: 6000,
      windowsHide: true,
    }).trim();
    await fs.promises.unlink(tmpPs).catch(() => {});
    if (out && fs.existsSync(out)) {
      return await fs.promises.readFile(out);
    }
  } catch (e) {
    console.warn('[ICON] extractUwpIcon manifest search error:', e);
  }

  // Fallback para paquetes dispersos/externos (e.g. Copilot) o cuando no hay archivos en InstallLocation
  try {
    const shellBuf = await extractShellItemIcon(`shell:AppsFolder\\${aumid}`);
    if (shellBuf && shellBuf.length > 100) {
      return shellBuf;
    }
  } catch (e) {
    console.warn('[ICON] extractUwpIcon shell fallback error:', e);
  }

  return null;
}

function tryCompanionIcons(exePath: string): Buffer | null {
  try {
    const dir = path.dirname(exePath);
    const base = path.basename(exePath, path.extname(exePath));
    const candidates: string[] = [
      path.join(dir, `${base}.ico`),
      path.join(dir, `${base}.png`),
      path.join(dir, 'app.ico'),
      path.join(dir, 'icon.ico'),
      path.join(dir, 'resources', 'app.ico'),
      path.join(dir, 'resources', 'icon.ico'),
      path.join(dir, 'resources', 'app', 'icon.ico')
    ];

    if (base.toLowerCase().includes('code')) {
      candidates.push(path.join(dir, 'resources', 'app', 'resources', 'win32', 'code.ico'));
    }

    // Detectar carpetas de versión como en VS Code: dir/<hash>/resources/app/resources/win32/code.ico
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.length >= 8 && entry !== 'node_modules') {
          const subDir = path.join(dir, entry);
          const c1 = path.join(subDir, 'resources', 'app', 'resources', 'win32', 'code.ico');
          if (fs.existsSync(c1)) candidates.push(c1);
        }
      }
    } catch {}

    for (const cand of candidates) {
      // NUNCA usar default.ico (es el documento genérico de Electron)
      if (path.basename(cand).toLowerCase() === 'default.ico') continue;
      if (fs.existsSync(cand) && fs.statSync(cand).size > 100) {
        if (cand.endsWith('.png')) {
          const buf = fs.readFileSync(cand);
          if (!isGenericIcon(buf)) return buf;
        }
        const img = nativeImage.createFromPath(cand);
        if (img && !img.isEmpty()) {
          const buf = img.toPNG();
          if (buf.length > 500 && !isGenericIcon(buf)) {
            return buf;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[ICON] Companion icons error:', e);
  }
  return null;
}

function tryVisualElementsManifest(exePath: string): Buffer | null {
  try {
    const dir = path.dirname(exePath);
    const base = path.basename(exePath, path.extname(exePath));
    const manifestPath = path.join(dir, `${base}.VisualElementsManifest.xml`);
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      // Priorizar Square44x44Logo / Square70x70Logo (icono real) sobre Square150x150Logo (tile con márgenes enormes)
      const match = content.match(/\bSquare(?:44x44|70x70|150x150)Logo=["']([^"']+)["']/i);
      if (match && match[1]) {
        const logoPath = path.resolve(dir, match[1]);
        if (fs.existsSync(logoPath) && fs.statSync(logoPath).size > 100) {
          return fs.readFileSync(logoPath);
        }
      }
    }
  } catch (e) {
    console.warn('[ICON] VisualElementsManifest error:', e);
  }
  return null;
}

async function extractAndCacheIcon(
  resolvedPath: string,
  force: boolean = false,
  shortcutIcon?: string,
  uwpAumid?: string
): Promise<{ iconPath: string; reextracted: boolean }> {
  if (!resolvedPath || (!uwpAumid && !fs.existsSync(resolvedPath))) {
    return { iconPath: '', reextracted: false };
  }

  const hashKey = uwpAumid || resolvedPath;
  const hash = crypto.createHash('sha1').update(hashKey.toLowerCase()).digest('hex').slice(0, 24);
  const cachedIconPath = path.join(getIconCacheDir(), `${hash}.png`);

  if (!force && fs.existsSync(cachedIconPath)) {
    try {
      const cacheStat = fs.statSync(cachedIconPath);
      if (cacheStat.size > 100) {
        if (uwpAumid) {
          const cachedBuf = fs.readFileSync(cachedIconPath);
          if (!isGenericIcon(cachedBuf)) {
            return { iconPath: toLocalResourceUrl(cachedIconPath), reextracted: false };
          }
        } else if (fs.existsSync(resolvedPath)) {
          const targetStat = fs.statSync(resolvedPath);
          if (targetStat.mtimeMs <= cacheStat.mtimeMs) {
            const cachedBuf = fs.readFileSync(cachedIconPath);
            if (!isGenericIcon(cachedBuf)) {
              return { iconPath: toLocalResourceUrl(cachedIconPath), reextracted: false };
            }
          }
        }
      }
    } catch {
      // Ignorar error y proceder a re-extraer
    }
  }

  let pngBuffer: Buffer | null = null;

  // 1. Si es una app UWP/Windows Store, extraer logo oficial directamente del paquete sin flechas de acceso
  if (uwpAumid) {
    pngBuffer = await extractUwpIcon(uwpAumid);
  }

  // 2. Icono explícito de acceso directo (.lnk) si existe y es válido
  if (!pngBuffer && shortcutIcon && fs.existsSync(shortcutIcon)) {
    try {
      if (shortcutIcon.endsWith('.png')) {
        pngBuffer = fs.readFileSync(shortcutIcon);
      } else {
        const img = nativeImage.createFromPath(shortcutIcon);
        if (img && !img.isEmpty()) {
          const buf = img.toPNG();
          if (!isGenericIcon(buf)) pngBuffer = buf;
        }
      }
    } catch {
      // continuar
    }
  }

  // 3. Extracción nativa: si es un acceso directo (.lnk), usar extractShellItemIcon para evitar badge de flecha;
  // de lo contrario usar getFileIcon de Electron (extrae el icono real embebido en el .exe)
  if (!pngBuffer && fs.existsSync(resolvedPath)) {
    try {
      if (path.extname(resolvedPath).toLowerCase() === '.lnk') {
        pngBuffer = await extractShellItemIcon(resolvedPath);
      }
      if (!pngBuffer) {
        let icon = await app.getFileIcon(resolvedPath, { size: 'large' });
        if (!icon || icon.isEmpty()) {
          icon = await app.getFileIcon(resolvedPath, { size: 'normal' });
        }
        if (icon && !icon.isEmpty()) {
          const buf = icon.toPNG();
          if (!isGenericIcon(buf)) {
            pngBuffer = buf;
          }
        }
      }
    } catch (e) {
      console.warn('[ICON] getFileIcon failed:', e);
    }
  }

  // 4. Iconos compañeros en la carpeta (.ico / .png / resources) (VS Code, Trae, Ollama, CyberManager, etc.)
  if (!pngBuffer && fs.existsSync(resolvedPath) && path.extname(resolvedPath).toLowerCase() === '.exe') {
    pngBuffer = tryCompanionIcons(resolvedPath);
  }

  // 5. Fallback con VisualElementsManifest.xml (Apps que solo tengan manifest y no icono embebido)
  if (!pngBuffer && fs.existsSync(resolvedPath)) {
    pngBuffer = tryVisualElementsManifest(resolvedPath);
  }

  // 6. Fallback con PowerShell System.Drawing.Icon ExtractAssociatedIcon
  if (!pngBuffer && fs.existsSync(resolvedPath)) {
    try {
      const escapedPath = resolvedPath.replace(/'/g, "''");
      const psScript = `Add-Type -AssemblyName System.Drawing; $icon=[System.Drawing.Icon]::ExtractAssociatedIcon('${escapedPath}'); if ($icon) { $bmp=$icon.ToBitmap(); $tmp=[System.IO.Path]::GetTempFileName()+'.png'; $bmp.Save($tmp,[System.Drawing.Imaging.ImageFormat]::Png); Write-Output $tmp; $icon.Dispose(); $bmp.Dispose() }`;
      const tmpPs = path.join(os.tmpdir(), `cl-icon-${Date.now()}-${Math.random().toString(36).slice(2)}.ps1`);
      await fs.promises.writeFile(tmpPs, psScript, 'utf-8');
      const psOutput = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`, {
        encoding: 'utf-8',
        timeout: 8000,
        windowsHide: true,
      }).trim();
      await fs.promises.unlink(tmpPs).catch(() => {});
      if (psOutput && fs.existsSync(psOutput)) {
        const buf = await fs.promises.readFile(psOutput);
        await fs.promises.unlink(psOutput).catch(() => {});
        if (buf.length > 100 && !isGenericIcon(buf)) {
          pngBuffer = buf;
        }
      }
    } catch (psErr: any) {
      console.warn('[ICON] PowerShell fallback failed:', psErr?.message || psErr);
    }
  }

  if (pngBuffer && pngBuffer.length > 100) {
    const iconPath = await persistIconPng(hashKey, pngBuffer);
    return { iconPath, reextracted: true };
  }

  if (fs.existsSync(cachedIconPath) && fs.statSync(cachedIconPath).size > 100) {
    return { iconPath: toLocalResourceUrl(cachedIconPath), reextracted: false };
  }

  return { iconPath: '', reextracted: false };
}

async function resolveFullFileInfo(filePath: string) {
  try {
    const { normalized, resolvedPath, resolvedName, ext, shortcutIcon, uwpAumid } = resolvePathAndTarget(filePath);
    const { iconPath } = await extractAndCacheIcon(resolvedPath, false, shortcutIcon, uwpAumid);

    return {
      name: resolvedName,
      path: uwpAumid || resolvedPath,
      ext,
      exists: !!uwpAumid || fs.existsSync(resolvedPath),
      iconPath,
      debug: { normalized, resolvedPath, uwpAumid, ext, iconCached: !!iconPath },
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
    os.homedir(),
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

function isUserHomePath(p: string): boolean {
  try {
    return path.resolve(p).toLowerCase() === path.resolve(os.homedir()).toLowerCase();
  } catch {
    return false;
  }
}

/** Base name for ranking — path.parse treats ".codex" as ext-only with empty name. */
function itemBaseName(fileName: string): string {
  if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) return fileName;
  const parsed = path.parse(fileName).name;
  return parsed || fileName;
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

/** Ensure user home is indexed (shallow) so ~\.codex / ~\.cursor etc. are discoverable. */
function ensureCoveragePaths(paths: string[]): string[] {
  let merged = ensureStartMenuPaths(paths);
  const home = os.homedir();
  if (home && fs.existsSync(home)) {
    const lower = new Set(merged.map(p => p.toLowerCase()));
    if (!lower.has(home.toLowerCase())) {
      merged = [home, ...merged];
    }
  }
  return merged;
}

function loadIndexerSettings(): { enabled: boolean; maxDepth: number; paths: string[]; includeHiddenFolders: boolean; indexHiddenContent: boolean; _migrateDotfolders2026?: boolean } {
  const defaults = {
    enabled: true,
    maxDepth: 2,
    paths: getDefaultIndexerPaths(),
    includeHiddenFolders: true,
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
          ? ensureCoveragePaths(parsed.paths)
          : defaults.paths
      };
      let needsSave = JSON.stringify(parsed.paths || []) !== JSON.stringify(merged.paths);
      // One-time: enable dotfolders so ~\.codex and similar match Everything-style discovery
      if (!parsed._migrateDotfolders2026) {
        merged.includeHiddenFolders = true;
        merged._migrateDotfolders2026 = true;
        needsSave = true;
      }
      if (needsSave) {
        try { saveIndexerSettings(merged); } catch { /* ignore */ }
      }
      return merged;
    }
  } catch (err) {
    console.error('[INDEXER] Error loading indexer settings:', err);
  }

  return defaults;
}

function saveIndexerSettings(settings: { enabled: boolean; maxDepth: number; paths: string[]; includeHiddenFolders: boolean; indexHiddenContent: boolean; _migrateDotfolders2026?: boolean }) {
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
      // Home: solo hijos inmediatos (encuentra .codex sin rastrear AppData entero)
      const targetDepth = isStartMenuPath(target)
        ? Math.max(maxDepth, 4)
        : isUserHomePath(target)
          ? 1
          : maxDepth;
      await crawlDirectory(target, targetDepth, 0, crawlOpts);
    }
  }

  systemIndexStatus = 'ONLINE';
  console.log(`[INDEXER] Indexación terminada en ${Date.now() - start}ms. Total items: ${systemIndex.length}`);
}

// =====================================
// IPC HANDLERS
// =====================================
async function launchAppInternal(appPath: string, isAdmin?: boolean, keepWindowOpen?: boolean): Promise<{ success: boolean; error?: string; code?: 'not-found' | 'launch-failed' }> {
  if (!appPath) return { success: false, error: 'No path provided' };

  try {
    const trimmedPath = appPath.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

    const isUriProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedPath) &&
      !path.isAbsolute(trimmedPath) &&
      !trimmedPath.match(/^[a-zA-Z]:[\\/]/);
    if (isUriProtocol) {
      console.log(`[LAUNCH] Abriendo esquema URI externo: ${trimmedPath}`);
      await shell.openExternal(trimmedPath);
      if (!keepWindowOpen && !mainWindow?.isAlwaysOnTop()) {
        windowVisibilityState = 'hidden-intentional';
        hideMainWindow();
      }
      return { success: true };
    }

    const isUwp = trimmedPath.includes('!') && trimmedPath.includes('_');
    if (isUwp) {
      console.log(`[LAUNCH] Lanzando app de Windows Store via AUMID: ${trimmedPath}`);
      const command = `explorer.exe shell:AppsFolder\\${trimmedPath}`;
      exec(command, (err) => {
        if (err) {
          console.error('[LAUNCH] Error al lanzar app de Windows Store via AUMID:', err);
        }
      });
      if (!keepWindowOpen && !mainWindow?.isAlwaysOnTop()) {
        windowVisibilityState = 'hidden-intentional';
        hideMainWindow();
      }
      return { success: true };
    }

    let targetPath = path.normalize(trimmedPath);

    if (!fs.existsSync(targetPath)) {
      const sysRoot = process.env.SystemRoot || 'C:\\Windows';
      const sys32Candidate = path.join(sysRoot, 'System32', targetPath);
      const winCandidate = path.join(sysRoot, targetPath);
      const psCandidate = path.join(sysRoot, 'System32', 'WindowsPowerShell', 'v1.0', targetPath);
      if (fs.existsSync(sys32Candidate)) {
        targetPath = sys32Candidate;
      } else if (fs.existsSync(winCandidate)) {
        targetPath = winCandidate;
      } else if (fs.existsSync(psCandidate)) {
        targetPath = psCandidate;
      } else {
        return { success: false, error: `Ruta no encontrada: ${targetPath}`, code: 'not-found' };
      }
    }

    // A .lnk can exist while its destination has been moved or removed.
    // Check absolute/path-like destinations so Windows does not report a broken link as a successful launch.
    if (path.extname(targetPath).toLowerCase() === '.lnk') {
      const shortcut = shell.readShortcutLink(targetPath);
      const shortcutTarget = shortcut.target?.trim();
      const targetIsUri = !!shortcutTarget && /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(shortcutTarget) && !/^[a-zA-Z]:[\\/]/.test(shortcutTarget);
      const targetIsUwp = !!shortcutTarget && shortcutTarget.includes('!') && shortcutTarget.includes('_');
      const targetLooksLikePath = !!shortcutTarget && (path.isAbsolute(shortcutTarget) || /[\\/]/.test(shortcutTarget));
      if (shortcutTarget && !targetIsUri && !targetIsUwp && targetLooksLikePath) {
        const resolvedShortcutTarget = path.isAbsolute(shortcutTarget)
          ? path.normalize(shortcutTarget)
          : path.resolve(shortcut.cwd || path.dirname(targetPath), shortcutTarget);
        if (!fs.existsSync(resolvedShortcutTarget)) {
          return { success: false, error: `Ruta no encontrada: ${resolvedShortcutTarget}`, code: 'not-found' };
        }
      }
    }

    if (isAdmin && process.platform === 'win32') {
      console.log(`[LAUNCH] Intentando lanzar como administrador: ${targetPath}`);
      pauseHotspots();
      watchUACUntilExit();
      const escapedPath = targetPath.replace(/'/g, "''");
      const command = `powershell -NoProfile -Command "Start-Process -FilePath '${escapedPath}' -Verb RunAs"`;

      exec(command, (err) => {
        if (err) {
          console.error('[LAUNCH] Error al ejecutar como administrador:', err);
        }
      });

      if (!keepWindowOpen && !mainWindow?.isAlwaysOnTop()) {
        windowVisibilityState = 'hidden-intentional';
        hideMainWindow();
      }
      return { success: true };
    }

    const errorMessage = await shell.openPath(targetPath);
    if (errorMessage) {
      const extension = path.extname(targetPath).toLowerCase();
      if (extension === '.exe' || extension === '.com') {
        const child = spawn(targetPath, [], { detached: true, stdio: 'ignore', windowsHide: true });
        const spawnError = await new Promise<Error | null>((resolve) => {
          child.once('spawn', () => resolve(null));
          child.once('error', resolve);
        });
        if (spawnError) {
          return { success: false, error: `${errorMessage} (${spawnError.message})`, code: 'launch-failed' };
        }
        child.unref();
      } else {
        return { success: false, error: errorMessage, code: 'launch-failed' };
      }
    }
    if (!keepWindowOpen && !mainWindow?.isAlwaysOnTop()) {
      windowVisibilityState = 'hidden-intentional';
      hideMainWindow();
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error desconocido al lanzar la aplicación', code: 'launch-failed' };
  }
}

function setupIpcHandlers() {
  // --- Obtener configuraciones del indexador global ---
  ipcMain.handle('get-indexer-settings', async () => {
    return loadIndexerSettings();
  });

  // --- Guardar configuraciones del indexador global ---
  ipcMain.handle('save-indexer-settings', async (_event, settings: { enabled: boolean; maxDepth: number; paths: string[]; includeHiddenFolders: boolean; indexHiddenContent: boolean; _migrateDotfolders2026?: boolean }) => {
    // Preservar flag de migración para no reactivar dotfolders si el usuario los apagó
    let migrateFlag = settings._migrateDotfolders2026;
    if (migrateFlag === undefined) {
      try {
        const raw = fs.readFileSync(getSettingsFilePath(), 'utf8');
        migrateFlag = !!JSON.parse(raw)._migrateDotfolders2026;
      } catch {
        migrateFlag = true;
      }
    }
    saveIndexerSettings({ ...settings, _migrateDotfolders2026: migrateFlag });
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
    const isEn = getTrayLanguage() === 'en';
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: isEn ? 'Select folder to index' : 'Seleccionar carpeta para indexar'
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
      const base = itemBaseName(item.name);
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

    // Iconos: nunca confiar en getFileIcon(.lnk) (suelen ser blancos genéricos).
    // Preferir target del acceso; .ico custom; fallback ExtractAssociatedIcon.
    const resolveLnkIconCandidates = (lnkPath: string): string[] => {
      const candidates: string[] = [];
      const push = (p?: string) => {
        if (!p) return;
        const cleaned = p.trim().replace(/^"(.*)"$/, '$1');
        if (!cleaned || candidates.includes(cleaned)) return;
        candidates.push(cleaned);
      };
      try {
        const shortcut = shell.readShortcutLink(lnkPath);
        // Solo .ico custom: icon en DLL/EXE con índice no se puede elegir con getFileIcon
        if (shortcut.icon) {
          const iconPath = shortcut.icon.trim().replace(/^"(.*)"$/, '$1');
          if (path.extname(iconPath).toLowerCase() === '.ico') push(iconPath);
        }
        push(shortcut.target);
      } catch { /* ignore */ }
      push(lnkPath);
      return candidates;
    };

    const nativeIconDataUrl = async (filePath: string): Promise<string> => {
      try {
        if (!fs.existsSync(filePath)) return '';
        const fileIcon = await app.getFileIcon(filePath, { size: 'normal' });
        if (!fileIcon || fileIcon.isEmpty()) return '';
        const png = fileIcon.toPNG();
        // Stubs blancos de .lnk suelen ser muy pequeños
        if (png.length < 600) return '';
        return fileIcon.toDataURL();
      } catch {
        return '';
      }
    };

    const psAssociatedIconDataUrl = (filePath: string): string => {
      let tmpPs = '';
      let tmpPng = '';
      try {
        if (!fs.existsSync(filePath)) return '';
        const escaped = filePath.replace(/'/g, "''");
        tmpPng = path.join(os.tmpdir(), `cl-search-icon-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
        tmpPs = path.join(os.tmpdir(), `cl-search-icon-${Date.now()}-${Math.random().toString(36).slice(2)}.ps1`);
        const script = [
          'Add-Type -AssemblyName System.Drawing',
          `$icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${escaped}')`,
          'if (-not $icon) { exit 1 }',
          '$bmp = $icon.ToBitmap()',
          `$bmp.Save('${tmpPng.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png)`,
          '$icon.Dispose(); $bmp.Dispose()',
        ].join('\r\n');
        fs.writeFileSync(tmpPs, script, 'utf-8');
        execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs}"`, {
          encoding: 'utf-8',
          timeout: 5000,
          windowsHide: true,
        });
        if (!fs.existsSync(tmpPng)) return '';
        const buf = fs.readFileSync(tmpPng);
        if (buf.length < 600) return '';
        return `data:image/png;base64,${buf.toString('base64')}`;
      } catch {
        return '';
      } finally {
        if (tmpPs) fs.unlink(tmpPs, () => {});
        if (tmpPng) fs.unlink(tmpPng, () => {});
      }
    };

    const resolveIcon = async (item: IndexedFile): Promise<string> => {
      if (item.type === 'folder') return '';
      const cached = systemFileIconCache.get(item.path);
      if (cached) return cached;

      const candidates = item.ext === '.lnk'
        ? resolveLnkIconCandidates(item.path)
        : [item.path];

      for (const candidate of candidates) {
        // Evitar getFileIcon sobre el .lnk (icono blanco genérico)
        if (path.extname(candidate).toLowerCase() === '.lnk') continue;
        const data = await nativeIconDataUrl(candidate);
        if (data) {
          systemFileIconCache.set(item.path, data);
          return data;
        }
      }

      // Solo para accesos (y no en queries de 1 letra, para no spawnear PowerShell en masa)
      if (item.ext === '.lnk' && !shortQuery) {
        for (const candidate of candidates) {
          const data = psAssociatedIconDataUrl(candidate);
          if (data) {
            systemFileIconCache.set(item.path, data);
            return data;
          }
        }
      }

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
  // Devuelve path/nombre al cerrar el diálogo; el ícono se resuelve aparte en el renderer
  // para poder mostrar un loader sin bloquear durante el cuadro de diálogo.
  ipcMain.handle('select-file', async (_event, options?: { filters?: Electron.FileFilter[] }) => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const isEn = getTrayLanguage() === 'en';
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [
        { name: isEn ? 'All Files' : 'Todos los archivos', extensions: ['*'] },
        { name: isEn ? 'Executables' : 'Ejecutables', extensions: ['exe', 'lnk', 'bat', 'cmd', 'ps1'] },
      ],
    });
    isDialogOpen = false;
    showMainWindow();
    if (result.canceled || result.filePaths.length === 0) return null;

    const selectedPath = result.filePaths[0];
    const base = path.basename(selectedPath);
    const name = path.extname(base) ? base.replace(/\.[^/.]+$/, '') : base;
    return { name, path: selectedPath, iconPath: '' };
  });

  // --- Seleccionar carpeta desde el explorador de Windows ---
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const isEn = getTrayLanguage() === 'en';
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: isEn ? 'Select Folder' : 'Seleccionar carpeta',
    });
    isDialogOpen = false;
    showMainWindow();
    if (result.canceled || result.filePaths.length === 0) return null;

    const selectedPath = result.filePaths[0];
    const name = path.basename(selectedPath);
    return { name, path: selectedPath, iconPath: '' };
  });

  // --- Locate a moved app, file, shortcut, or folder ---
  ipcMain.handle('locate-app-path', async (_event, previousPath?: string) => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const isEn = getTrayLanguage() === 'en';
    try {
      const previousDirectory = previousPath ? path.dirname(previousPath) : '';
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'openDirectory'],
        title: isEn ? 'Find the app or shortcut in its new location' : 'Busca el acceso en su nueva ubicación',
        ...(previousDirectory && fs.existsSync(previousDirectory) ? { defaultPath: previousDirectory } : {}),
        filters: [
          { name: isEn ? 'All files' : 'Todos los archivos', extensions: ['*'] },
        ],
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      return result.filePaths[0];
    } finally {
      isDialogOpen = false;
      showMainWindow();
    }
  });

  // --- Seleccionar imagen desde el explorador de Windows ---
  ipcMain.handle('select-image', async () => {
    if (!mainWindow) return null;
    isDialogOpen = true;
    const isEn = getTrayLanguage() === 'en';
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: isEn ? 'Images' : 'Imágenes', extensions: ['jpg', 'png', 'gif', 'webp', 'ico'] },
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
  ipcMain.handle('launch-app', (_event, appPath: string, isAdmin?: boolean, keepWindowOpen?: boolean) =>
    launchAppInternal(appPath, isAdmin, keepWindowOpen)
  );

  // --- Mostrar notificación nativa del sistema ---
  ipcMain.handle('show-notification', (_event, payload: { title: string; body: string }) => {
    if (Notification.isSupported()) {
      try {
        const iconPath = path.join(__dirname, '../public/icon.png');
        const notif = new Notification({
          title: payload.title,
          body: payload.body,
          icon: fs.existsSync(iconPath) ? iconPath : undefined,
          silent: false,
        });
        notif.on('click', () => {
          showMainWindow();
        });
        notif.show();
        return true;
      } catch (err) {
        console.error('[NOTIF] Error mostrando notificación de escritorio:', err);
      }
    }
    return false;
  });

  ipcMain.handle('tray:set-recents', (_event, items: unknown) => {
    setTrayRecents(Array.isArray(items) ? items : []);
    return { success: true };
  });

  // --- Desktop Toast Window IPC ---
  ipcMain.handle('show-desktop-toast', (_event, payload: any) => {
    showDesktopToastInternal(payload);
    return true;
  });

  ipcMain.handle('set-toast-preferences', (_event, settings: unknown) => {
    updateToastDeliverySettings(settings);
    return true;
  });

  ipcMain.handle('hide-desktop-toast', () => {
    hideDesktopToastInternal();
    return true;
  });

  ipcMain.on('desktop-toast-action', (_event, action: string, payload: any) => {
    if (action === 'cancel-task') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('cancel-scheduled-task', payload?.taskId);
      }
      hideDesktopToastInternal();
    } else if (action === 'launch-now') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('launch-scheduled-now', payload?.taskId);
      }
      hideDesktopToastInternal();
    } else if (action === 'open-hud') {
      showMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('open-hud-action', payload?.target);
      }
      hideDesktopToastInternal();
    } else if (action === 'open-release' && typeof payload?.url === 'string') {
      try {
        const url = new URL(payload.url);
        if (url.protocol === 'https:') void shell.openExternal(url.toString());
      } catch { /* Ignore malformed release URLs. */ }
      hideDesktopToastInternal();
    }
  });

  ipcMain.on('desktop-toast-hide', () => {
    hideDesktopToastInternal();
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
    rebuildTrayMenu();
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
    hideOnBlurEnabled = !!enabled;
    console.log('[MAIN] set-hide-on-blur:', hideOnBlurEnabled);
    return { success: true, enabled: hideOnBlurEnabled };
  });

  ipcMain.handle('set-ui-modal-open', (_event, open: boolean) => {
    isUiModalOpen = !!open;
    return { success: true, open: isUiModalOpen };
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

  // --- Refresco individual de icono ---
  ipcMain.handle('refresh-app-icon', async (_event, appPath: string) => {
    try {
      if (!appPath) return { success: false, error: 'Path is required' };
      const { resolvedPath, shortcutIcon, uwpAumid } = resolvePathAndTarget(appPath);
      const { iconPath } = await extractAndCacheIcon(resolvedPath, true, shortcutIcon, uwpAumid);
      if (iconPath) {
        return { success: true, iconPath, resolvedPath: uwpAumid || resolvedPath };
      }
      return { success: false, error: 'Could not extract icon' };
    } catch (e: any) {
      console.error('[ICON] Error refreshing app icon:', e);
      return { success: false, error: e?.message || String(e) };
    }
  });

  // --- Refresco masivo de iconos y limpieza de huérfanos ---
  ipcMain.handle('refresh-all-app-icons', async (_event, appList: Array<{ id: number; path?: string }>, force: boolean = true) => {
    try {
      const updatedIcons: Record<number, string> = {};
      const activeHashes = new Set<string>();

      if (Array.isArray(appList)) {
        const concurrency = 3;
        const queue = [...appList];

        const worker = async () => {
          while (queue.length > 0) {
            const item = queue.shift();
            if (!item || !item.path) continue;
            try {
              const { resolvedPath, shortcutIcon, uwpAumid } = resolvePathAndTarget(item.path);
              const hashKey = uwpAumid || resolvedPath;
              const hash = crypto.createHash('sha1').update(hashKey.toLowerCase()).digest('hex').slice(0, 24);
              activeHashes.add(hash);

              const result = await extractAndCacheIcon(resolvedPath, force, shortcutIcon, uwpAumid);
              if (result.iconPath && (force || result.reextracted)) {
                updatedIcons[item.id] = result.iconPath;
              }
            } catch (err) {
              console.warn(`[ICON] Failed to refresh app ${item.id} (${item.path}):`, err);
            }
          }
        };

        const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
        await Promise.all(workers);
      }

      // Limpieza de iconos huérfanos en icon-cache (solo en refresco manual forzado)
      let cleanedCount = 0;
      if (force) {
        try {
          const cacheDir = getIconCacheDir();
          if (fs.existsSync(cacheDir)) {
            const files = await fs.promises.readdir(cacheDir);
            for (const file of files) {
              if (file.endsWith('.png')) {
                const fileHash = file.replace('.png', '');
                if (!activeHashes.has(fileHash)) {
                  await fs.promises.unlink(path.join(cacheDir, file)).catch(() => {});
                  cleanedCount++;
                }
              }
            }
          }
        } catch (cleanErr) {
          console.warn('[ICON] Error cleaning orphaned icon cache:', cleanErr);
        }
      }

      return { success: true, updatedIcons, cleanedCount };
    } catch (e: any) {
      console.error('[ICON] Error refreshing all app icons:', e);
      return { success: false, updatedIcons: {}, cleanedCount: 0, error: e?.message || String(e) };
    }
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

  // --- Respaldo automático programado ---
  ipcMain.handle('backup:now', () => runAutoBackup('manual'));

  ipcMain.handle('backup:list', () => {
    try {
      if (!fs.existsSync(backupsDir)) return [];
      return fs
        .readdirSync(backupsDir)
        .filter(isBackupFile)
        .sort()
        .reverse()
        .map((file) => {
          try {
            const stat = fs.statSync(path.join(backupsDir, file));
            return { file, size: stat.size, mtime: stat.mtime.toISOString() };
          } catch {
            return null;
          }
        })
        .filter((x): x is BackupItem => x !== null);
    } catch {
      return [];
    }
  });

  ipcMain.handle('backup:openFolder', async () => {
    try {
      fs.mkdirSync(backupsDir, { recursive: true });
    } catch { /* ignore */ }
    return shell.openPath(backupsDir);
  });

  ipcMain.handle('backup:restore', async (_event, fileName: string) => {
    try {
      const safeFile = path.basename(fileName);
      const backupPath = path.join(backupsDir, safeFile);
      if (!fs.existsSync(backupPath) || !isBackupFile(safeFile)) {
        return { success: false, error: 'Backup file not found' };
      }
      const content = await fs.promises.readFile(backupPath, 'utf-8');
      await fs.promises.writeFile(CONFIG_FILE, content, 'utf-8');
      return { success: true, content };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('backup:delete', async (_event, fileName: string) => {
    try {
      const safeFile = path.basename(fileName);
      const backupPath = path.join(backupsDir, safeFile);
      if (fs.existsSync(backupPath) && isBackupFile(safeFile)) {
        await fs.promises.unlink(backupPath);
        return { success: true };
      }
      return { success: false, error: 'Backup file not found' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('backup:get-status', () => {
    return {
      config: getAutoBackupConfig(),
      backupsDir,
    };
  });

  // --- Registrar hotspots desde React ---
  ipcMain.handle('set-hotspots', (_event, corners: string[], delay: number, disableInFullscreen?: boolean) => {
    console.log('ACTUALIZANDO HOTSPOTS:', corners, 'Delay:', delay, 'DisableInFullscreen:', disableInFullscreen);
    hotspotCorners = corners;
    hotspotDelay = delay;
    if (disableInFullscreen !== undefined) {
      hotspotsDisableInFullscreen = disableInFullscreen;
    }
    startHotspotPolling(); // no-op interval when corners empty
    return { success: true };
  });

  // --- Abrir Consola de Diagnóstico ---
  ipcMain.handle('open-dev-tools', () => {
    mainWindow?.webContents.openDevTools({ mode: 'detach' });
    return { success: true };
  });

  // --- Opciones de energía del sistema ---
  ipcMain.handle('system-power-action', async (_event, action: string, force?: boolean) => {
    try {
      console.log(`[POWER] Executing power action: ${action} (force: ${!!force})`);
      if (action === 'lock') {
        exec('rundll32.exe user32.dll,LockWorkStation');
        return { success: true };
      }
      if (action === 'sleep') {
        exec('powershell -Command "Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)"');
        return { success: true };
      }
      if (action === 'signout') {
        const flag = force ? '/f' : '';
        exec(`shutdown /l ${flag}`.trim());
        return { success: true };
      }
      if (action === 'restart') {
        const flag = force ? '/f' : '';
        exec(`shutdown /r ${flag} /t 0`.trim());
        return { success: true };
      }
      if (action === 'shutdown') {
        const flag = force ? '/f' : '';
        exec(`shutdown /s ${flag} /t 0`.trim());
        return { success: true };
      }
      return { success: false, error: 'Unknown power action' };
    } catch (err: any) {
      console.error('[POWER] Error executing power action:', err);
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Menú contextual nativo de edición de texto ---
  ipcMain.handle('show-text-context-menu', (_event, { x, y }: { x: number, y: number }) => {
    const webContents = _event.sender;
    const isEn = getTrayLanguage() === 'en';
    const contextMenu = Menu.buildFromTemplate([
      { label: isEn ? 'Cut' : 'Cortar', accelerator: 'CmdOrCtrl+X', click: () => webContents.cut() },
      { label: isEn ? 'Copy' : 'Copiar', accelerator: 'CmdOrCtrl+C', click: () => webContents.copy() },
      { label: isEn ? 'Paste' : 'Pegar', accelerator: 'CmdOrCtrl+V', click: () => webContents.paste() },
      { type: 'separator' },
      { label: isEn ? 'Delete' : 'Eliminar', click: () => webContents.delete() },
      { type: 'separator' },
      { label: isEn ? 'Select All' : 'Seleccionar todo', accelerator: 'CmdOrCtrl+A', click: () => webContents.selectAll() },
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

  // --- Abrir configuración de barra de tareas de Windows (para pinear iconos) ---
  ipcMain.handle('open-taskbar-settings', async () => {
    try {
      openTaskbarIconSettings();
      return { success: true };
    } catch (err: any) {
      console.error('[SETTINGS] Failed to open taskbar settings:', err);
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Keep renderer awake while hidden (scheduled-task countdowns) ---
  ipcMain.handle('set-renderer-awake', (_event, awake: boolean) => {
    keepRendererAwake = !!awake;
    applyRendererThrottling();
    return { success: true, awake: keepRendererAwake };
  });

  ipcMain.on('display-diagnostic-heartbeat', (event, report: unknown) => {
    if (event.sender !== mainWindow?.webContents || typeof report !== 'object' || report === null) return;
    const data = report as Record<string, unknown>;
    displayDiagnostics.write('renderer-heartbeat', {
      visibility: data.visibility === 'visible' ? 'visible' : 'hidden',
      rootMounted: data.rootMounted === true,
      surfaceMounted: data.surfaceMounted === true,
      surfaceChildren: typeof data.surfaceChildren === 'number' && Number.isInteger(data.surfaceChildren) && data.surfaceChildren >= 0
        ? Math.min(data.surfaceChildren, 1000) : 0,
      surfaceOpacity: typeof data.surfaceOpacity === 'number' && Number.isFinite(data.surfaceOpacity)
        ? Math.max(0, Math.min(1, data.surfaceOpacity)) : null,
      devicePixelRatio: typeof data.devicePixelRatio === 'number' && Number.isFinite(data.devicePixelRatio)
        ? Math.round(data.devicePixelRatio * 100) / 100 : 0,
    });
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

  // --- Shell runner & Cyber Terminal engine ---
  const activeProcesses = new Map<string, any>();
  let consoleCwd = os.homedir();

  // Cyber Terminal owns one persistent ConPTY session. The command runner below
  // remains separate because scheduled tasks need finite, independent processes.
  type TerminalSession = { id: string; process: pty.IPty; exited: boolean; closeTimer?: NodeJS.Timeout };
  let terminalSession: TerminalSession | null = null;
  const terminalSender = (event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) =>
    mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents;
  const terminalSize = (value: unknown, fallback: number, max: number) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(2, Math.min(max, Math.floor(value))) : fallback;
  const stopTerminal = (session: TerminalSession) => {
    if (session.exited || session.closeTimer) return;
    try {
      // Exit normally when possible. ConPTY's immediate kill can race its
      // process-list helper before that helper has attached to the console.
      session.process.write('\x03exit\r');
    } catch (error) {
      console.error('[TERMINAL] Graceful shutdown failed:', error);
    }
    session.closeTimer = setTimeout(() => {
      if (session.exited) return;
      try { session.process.kill(); }
      catch (error) { console.error('[TERMINAL] Forced shutdown failed:', error); }
    }, 2000);
    session.closeTimer.unref();
  };
  app.on('before-quit', () => {
    if (terminalSession) stopTerminal(terminalSession);
  });

  ipcMain.handle('terminal-start', (event, options: { id?: string; shell?: string; cwd?: string; cols?: number; rows?: number }) => {
    if (!terminalSender(event)) return { success: false, error: 'Invalid terminal window' };
    if (!options || typeof options.id !== 'string' || !/^[\w-]{1,80}$/.test(options.id) ||
        (options.shell !== 'powershell' && options.shell !== 'cmd')) {
      return { success: false, error: 'Invalid terminal options' };
    }
    const isDirectory = (candidate: unknown): candidate is string => {
      if (typeof candidate !== 'string') return false;
      try { return fs.statSync(candidate).isDirectory(); }
      catch { return false; }
    };
    const cwd = isDirectory(options.cwd) ? options.cwd : isDirectory(consoleCwd) ? consoleCwd : os.homedir();
    const cols = terminalSize(options.cols, 80, 500);
    const rows = terminalSize(options.rows, 24, 200);
    try {
      if (terminalSession) stopTerminal(terminalSession);
      terminalSession = null;
      const env = { ...process.env };
      let executable = 'powershell.exe';
      let args: string[] = [];
      if (options.shell === 'powershell') {
        const historyDir = path.join(app.getPath('userData'), 'Terminal');
        fs.mkdirSync(historyDir, { recursive: true });
        env.CYBER_TERMINAL_HISTORY_PATH = path.join(historyDir, 'PowerShell_history.txt');
        const prompt = '[Console]::OutputEncoding = [Text.Encoding]::UTF8; $OutputEncoding = [Text.Encoding]::UTF8; if (Get-Command Set-PSReadLineOption -ErrorAction SilentlyContinue) { Set-PSReadLineOption -HistorySavePath $env:CYBER_TERMINAL_HISTORY_PATH }; function global:prompt { $p=(Get-Location).ProviderPath; [Console]::Write([char]27 + "]0;CYBERCWD:" + $p + [char]7); "PS $p> " }';
        args = ['-NoLogo', '-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', prompt];
      } else {
        executable = 'cmd.exe';
        env.PROMPT = '\x1b]0;CYBERCWD:$P\x07$P$G';
      }
      const child = pty.spawn(executable, args, {
        name: 'xterm-256color', cols, rows, cwd, env,
      });
      const session: TerminalSession = { id: options.id, process: child, exited: false };
      terminalSession = session;
      child.onData(data => {
        if (terminalSession === session && !event.sender.isDestroyed()) {
          event.sender.send('terminal-data', { id: session.id, data });
        }
      });
      child.onExit(({ exitCode }) => {
        session.exited = true;
        if (session.closeTimer) clearTimeout(session.closeTimer);
        if (terminalSession === session) {
          terminalSession = null;
          if (!event.sender.isDestroyed()) event.sender.send('terminal-exit', { id: session.id, exitCode });
        }
      });
      return { success: true, cwd };
    } catch (error) {
      console.error('[TERMINAL] Start failed:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.on('terminal-write', (event, payload: { id?: string; data?: string }) => {
    if (!terminalSender(event) || terminalSession?.id !== payload?.id ||
        typeof payload.data !== 'string' || payload.data.length > 65536) return;
    try { terminalSession.process.write(payload.data); }
    catch (error) { console.error('[TERMINAL] Write failed:', error); }
  });
  ipcMain.on('terminal-resize', (event, payload: { id?: string; cols?: number; rows?: number }) => {
    if (!terminalSender(event) || terminalSession?.id !== payload?.id) return;
    try { terminalSession.process.resize(terminalSize(payload.cols, 80, 500), terminalSize(payload.rows, 24, 200)); }
    catch (error) { console.error('[TERMINAL] Resize failed:', error); }
  });
  ipcMain.handle('terminal-close', (event, id: string) => {
    if (!terminalSender(event) || terminalSession?.id !== id) return false;
    const session = terminalSession;
    terminalSession = null;
    stopTerminal(session);
    return true;
  });

  function handleCdCommand(fullCommand: string): { handled: boolean; success: boolean; newCwd?: string; output?: string; error?: string } {
    const trimmed = fullCommand.trim();

    // Switch drive letter (e.g. "D:", "d:", "c:")
    const driveMatch = /^[a-zA-Z]:$/.exec(trimmed);
    if (driveMatch) {
      const driveRoot = `${driveMatch[0].toUpperCase()}\\`;
      if (fs.existsSync(driveRoot)) {
        consoleCwd = driveRoot;
        return { handled: true, success: true, newCwd: consoleCwd, output: `${consoleCwd}\n` };
      } else {
        return { handled: true, success: false, error: `Unidad no disponible: ${driveMatch[0].toUpperCase()}` };
      }
    }

    // Direct ".." navigation shortcut
    if (/^\.\.([/\\]|$)/.test(trimmed)) {
      const target = trimmed;
      const resolved = path.resolve(consoleCwd, target);
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        consoleCwd = resolved;
        return { handled: true, success: true, newCwd: consoleCwd };
      }
    }

    // CD or CHDIR command (matches: cd, cd.., cd .., cd/, cd\, cd C:\foo, chdir.., etc.)
    const cdMatch = /^(?:cd|chdir)(?:$|(?=[\s/\\.])(.*)$)/i.exec(trimmed);
    if (!cdMatch) return { handled: false, success: false };

    // 'cd' without arguments: print current working directory
    const rawArg = cdMatch[1] ? cdMatch[1].trim() : '';
    if (!rawArg) {
      return { handled: true, success: true, newCwd: consoleCwd, output: `${consoleCwd}\n` };
    }

    let target = rawArg;
    // Strip cmd's /d switch if present (e.g. "cd /d D:\Games")
    if (/^\/d\s+/i.test(target)) {
      target = target.replace(/^\/d\s+/i, '').trim();
    } else if (/^d\s+/i.test(target)) {
      target = target.replace(/^d\s+/i, '').trim();
    }

    // Strip surrounding quotes
    target = target.replace(/^["'](.*)["']$/, '$1').trim();

    // Handle drive letter with cd (e.g. "cd D:" -> "D:\")
    if (/^[a-zA-Z]:$/i.test(target)) {
      target = `${target.toUpperCase()}\\`;
    }

    // Handle ~ (user home)
    if (target === '~') {
      target = os.homedir();
    } else if (target.startsWith('~/') || target.startsWith('~\\')) {
      target = path.join(os.homedir(), target.substring(2));
    }

    // Resolve path relative to current consoleCwd
    const resolved = path.resolve(consoleCwd, target);

    try {
      if (fs.existsSync(resolved)) {
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          consoleCwd = resolved;
          return { handled: true, success: true, newCwd: consoleCwd };
        } else {
          return { handled: true, success: false, error: `El elemento no es un directorio: ${target}` };
        }
      } else {
        return { handled: true, success: false, error: `El sistema no puede encontrar la ruta especificada: ${target}` };
      }
    } catch (err: any) {
      return { handled: true, success: false, error: err?.message || `Error al acceder a: ${target}` };
    }
  }

  ipcMain.handle('open-path', async (_event, targetPath: string) => {
    try {
      return await shell.openPath(targetPath);
    } catch (e: any) {
      return e?.message || 'Error opening path';
    }
  });

  ipcMain.handle('get-console-cwd', () => {
    return consoleCwd;
  });

  ipcMain.handle('set-console-cwd', (_event, targetPath: string) => {
    if (targetPath && fs.existsSync(targetPath)) {
      try {
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
          consoleCwd = path.resolve(targetPath);
          return { success: true, cwd: consoleCwd };
        }
      } catch {}
    }
    return { success: false, error: 'Invalid directory', cwd: consoleCwd };
  });

  ipcMain.handle('open-external-terminal', async (_event, targetPath?: string) => {
    const isDirectory = (candidate: unknown): candidate is string => {
      if (typeof candidate !== 'string') return false;
      try { return fs.statSync(candidate).isDirectory(); }
      catch { return false; }
    };
    const dir = path.resolve(isDirectory(targetPath) ? targetPath : isDirectory(consoleCwd) ? consoleCwd : os.homedir());
    const launch = (executable: string, args: string[]) => new Promise<boolean>((resolve) => {
      try {
        const child = spawn(executable, args, { cwd: dir, detached: true, stdio: 'ignore', windowsHide: false });
        child.once('spawn', () => { child.unref(); resolve(true); });
        child.once('error', (error) => {
          console.error(`[TERMINAL] Failed to start ${executable}:`, error);
          resolve(false);
        });
      } catch (error) {
        console.error(`[TERMINAL] Failed to start ${executable}:`, error);
        resolve(false);
      }
    });

    if (mainWindow?.isFocused()) externalTerminalBlurGuardUntil = Date.now() + 10000;
    // Argument arrays preserve spaces and trailing backslashes in the folder.
    if (await launch('wt.exe', ['-d', dir])) return true;
    if (await launch('powershell.exe', ['-NoExit'])) return true;
    externalTerminalBlurGuardUntil = 0;
    return false;
  });

  ipcMain.handle('kill-shell-command', (_event, cmdId?: string) => {
    if (cmdId && activeProcesses.has(cmdId)) {
      const p = activeProcesses.get(cmdId);
      try {
        if (process.platform === 'win32' && p.pid) {
          exec(`taskkill /pid ${p.pid} /T /F`);
        } else {
          p.kill();
        }
      } catch {}
      activeProcesses.delete(cmdId);
      return true;
    } else if (!cmdId) {
      for (const [, p] of activeProcesses.entries()) {
        try {
          if (process.platform === 'win32' && p.pid) {
            exec(`taskkill /pid ${p.pid} /T /F`);
          } else {
            p.kill();
          }
        } catch {}
      }
      activeProcesses.clear();
      return true;
    }
    return false;
  });

  ipcMain.handle('run-shell-command', (_event, payload: any, maybeOpts?: any) => {
    const cmdId = Math.random().toString(36).substring(7);
    let commandStr = '';
    let shellType: 'powershell' | 'cmd' = 'powershell';

    if (typeof payload === 'string') {
      commandStr = payload;
      if (maybeOpts && typeof maybeOpts === 'object') {
        if (maybeOpts.shellType) shellType = maybeOpts.shellType;
        if (maybeOpts.cwd && fs.existsSync(maybeOpts.cwd)) {
          try {
            if (fs.statSync(maybeOpts.cwd).isDirectory()) consoleCwd = path.resolve(maybeOpts.cwd);
          } catch {}
        }
      }
    } else if (typeof payload === 'object' && payload !== null) {
      commandStr = payload.command || '';
      if (payload.shellType) shellType = payload.shellType;
      if (payload.cwd && fs.existsSync(payload.cwd)) {
        try {
          if (fs.statSync(payload.cwd).isDirectory()) consoleCwd = path.resolve(payload.cwd);
        } catch {}
      }
    }

    // Limpiar cualquier prefijo '>' accidental antes de ejecutar
    commandStr = commandStr.replace(/^>+\s*/, '').trim();

    try {
      console.log(`[SHELL RUNNER] [${shellType}] in [${consoleCwd}]: ${commandStr} with ID: ${cmdId}`);
      
      // Check for navigation / cd commands
      const cdResult = handleCdCommand(commandStr);
      if (cdResult.handled) {
        if (cdResult.output) {
          mainWindow?.webContents.send('shell-command-output', {
            id: cmdId,
            type: 'stdout',
            text: cdResult.output,
          });
        }
        if (!cdResult.success && cdResult.error) {
          mainWindow?.webContents.send('shell-command-output', {
            id: cmdId,
            type: 'stderr',
            text: `${cdResult.error}\n`,
          });
        }
        mainWindow?.webContents.send('shell-command-exit', {
          id: cmdId,
          exitCode: cdResult.success ? 0 : 1,
          cwd: consoleCwd,
        });
        return { success: cdResult.success, cmdId, cwd: consoleCwd, error: cdResult.error };
      }

      let child;
      if (process.platform === 'win32') {
        if (shellType === 'cmd') {
          child = spawn('cmd.exe', ['/c', commandStr], {
            cwd: consoleCwd,
            windowsHide: true,
          });
        } else {
          // PowerShell with forced UTF-8 console output encoding
          child = spawn('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command',
            `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; ${commandStr}`
          ], {
            cwd: consoleCwd,
            windowsHide: true,
          });
        }
      } else {
        child = spawn('sh', ['-c', commandStr], {
          cwd: consoleCwd,
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
          cwd: consoleCwd,
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
          cwd: consoleCwd,
        });
        activeProcesses.delete(cmdId);
      });

      return { success: true, cmdId, cwd: consoleCwd };
    } catch (err: any) {
      console.error('[SHELL RUNNER] Spawn error:', err);
      return { success: false, error: err.message, cwd: consoleCwd };
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
      if (config) {
        updateSystemAlertsConfig({
          systemAlertsEnabled: config.systemAlertsEnabled,
          diskAlertsEnabled: config.diskAlertsEnabled,
          ramAlertsEnabled: config.ramAlertsEnabled,
          ramThresholdPercent: config.ramThresholdPercent,
          ramLowAbsoluteAlertEnabled: config.ramLowAbsoluteAlertEnabled,
          language: config.language,
        });
        startAutoBackupWatcher();
      }
      rebuildTrayMenu();
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
  app.on('second-instance', (_event, commandLine) => {
    console.log('[SINGLE-INSTANCE] Intento de segunda instancia (state=' + windowVisibilityState + ')');
    // Si la segunda instancia fue invocada por el sistema con flag de arranque minimizado, ignorar
    if (hasStartupMinimizedArg(commandLine)) {
      console.log('[SINGLE-INSTANCE] Ignored second-instance launch because it had start-minimized flag');
      return;
    }
    // Apertura manual por el usuario (acceso directo, lanzador, etc.): SIEMPRE mostrar y enfocar
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

// Supervisión de procesos secundarios (GPU, utilidades)
app.on('child-process-gone', (_event, details) => {
  displayDiagnostics.write('child-process-gone', {
    type: details.type,
    reason: details.reason,
    exitCode: details.exitCode,
    ...displayWindowState(),
  });
  if (details.type === 'GPU') {
    console.warn('[GPU] Proceso secundario GPU terminado:', details.reason, 'código:', details.exitCode);
  }
});

app.on('gpu-info-update', () => {
  try {
    const status = app.getGPUFeatureStatus();
    displayDiagnostics.write('gpu-info', {
      compositing: status.gpu_compositing,
      rasterization: status.rasterization,
    });
  } catch (error) {
    displayDiagnostics.write('gpu-info-error', { error: error instanceof Error ? error.name : 'unknown' });
  }
});

// =====================================
// APP LIFECYCLE
// =====================================

app.whenReady().then(() => {
  displayDiagnostics.write('session-start', {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron || 'unknown',
    windowsVersion: os.release(),
    portable: !!process.env.PORTABLE_EXECUTABLE_DIR,
  });
  // Limpiar cualquier clave residual de desarrollo en el registro de inicio de Windows
  if (process.platform === 'win32') {
    try {
      exec('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "electron.app.Electron" /f', () => {});
    } catch { /* ignore */ }
  }

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
      if (config.hideOnBlur !== undefined && config.hideOnBlur !== null) {
        hideOnBlurEnabled = typeof config.hideOnBlur === 'boolean' ? config.hideOnBlur : config.hideOnBlur !== 'false';
        console.log('Hide-on-blur cargado desde configuración central:', hideOnBlurEnabled);
      }
      // (CyberTray config load removed)
    }
  } catch (e) {
    console.error('Error cargando configuración central:', e);
  }
  
  // Configurar el protocolo local-resource para cargar archivos locales
  protocol.handle('local-resource', async (request) => {
    try {
      // Obtener la ruta cruda eliminando el prefijo del protocolo y los parámetros query/hash (?t=...)
      const rawUrl = request.url.split('?')[0].split('#')[0];
      let filePath = decodeURIComponent(rawUrl.replace(/^local-resource:\/\//i, ''));
      
      // En Windows, a veces quedan barras triples o iniciales
      while (filePath.startsWith('/')) {
        filePath = filePath.slice(1);
      }
      
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
        headers: {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (e) {
      console.error('Error en protocolo local-resource:', e);
      return new Response('Error', { status: 500 });
    }
  });

  createWindow();
  createTray();
  ensureDesktopToastWin();

  const displayHeartbeat = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      displayDiagnostics.write('main-heartbeat', displayWindowState());
      requestVisibleRepaint('periodic');
    }
  }, 30_000);
  displayHeartbeat.unref();

  // Initialize display cache and listen for changes
  updateCachedDisplays();
  screen.on('display-added', updateCachedDisplays);
  screen.on('display-removed', updateCachedDisplays);
  screen.on('display-metrics-changed', updateCachedDisplays);
  screen.on('display-added', (_event, display) => {
    displayDiagnostics.write('display-added', { scaleFactor: display.scaleFactor });
  });
  screen.on('display-removed', () => {
    displayDiagnostics.write('display-removed', { displayCount: screen.getAllDisplays().length });
  });
  screen.on('display-metrics-changed', (_event, display, metrics) => {
    displayDiagnostics.write('display-metrics-changed', {
      scaleFactor: display.scaleFactor,
      metrics: metrics.join(','),
    });
  });

  // Listen for session lock / suspend to guard hotspots
  powerMonitor.on('lock-screen', () => {
    displayDiagnostics.write('screen-locked', displayWindowState());
    console.log('[POWER] Screen locked — pausing hotspots');
    pauseHotspots();
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && hideOnBlurEnabled) {
      windowVisibilityState = 'hidden-os';
      hideMainWindow();
    }
  });
  powerMonitor.on('unlock-screen', () => {
    displayDiagnostics.write('screen-unlocked', displayWindowState());
    console.log('[POWER] Screen unlocked — resuming hotspots');
    resumeHotspotsAfterUAC(1000);
  });
  powerMonitor.on('suspend', () => {
    displayDiagnostics.write('system-suspended', displayWindowState());
    console.log('[POWER] System suspended — pausing hotspots');
    pauseHotspots();
  });
  powerMonitor.on('resume', () => {
    displayDiagnostics.write('system-resumed', displayWindowState());
    console.log('[POWER] System resumed — resuming hotspots');
    resumeHotspotsAfterUAC(1500);
  });

  // Auto-update (GitHub Releases via electron-updater)
  let bootAutoUpdate = true;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (typeof config.autoUpdate === 'boolean') bootAutoUpdate = config.autoUpdate;
    }
  } catch { /* keep default */ }
  initUpdater({ autoUpdate: bootAutoUpdate });

  // Monitorización de salud de sistema (Disco y Memoria RAM en segundo plano)
  let bootAlertsConfig = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (cfg.cyberBotSettings && typeof cfg.cyberBotSettings === 'object') {
        updateToastDeliverySettings({
          botEnabled: cfg.cyberBotSettings.enabled,
          bannersEnabled: cfg.cyberBotSettings.bannersEnabled,
          chatterLevel: cfg.cyberBotSettings.chatterLevel,
          quietHours: cfg.cyberBotSettings.quietHours,
        });
      }
      bootAlertsConfig = {
        systemAlertsEnabled: cfg.systemAlertsEnabled,
        diskAlertsEnabled: cfg.diskAlertsEnabled,
        ramAlertsEnabled: cfg.ramAlertsEnabled,
        ramThresholdPercent: cfg.ramThresholdPercent,
        ramLowAbsoluteAlertEnabled: cfg.ramLowAbsoluteAlertEnabled,
        language: cfg.language,
      };
    }
  } catch { /* keep defaults */ }
  initSystemAlerts(
    () => mainWindow,
    () => getAppIconPath(),
    () => showMainWindow(),
    bootAlertsConfig,
    (payload) => showDesktopToastInternal({ ...payload, source: 'system-alert' })
  );

  // Iniciar vigilante de respaldo automático programado
  startAutoBackupWatcher();

  // Iniciar guardia de hotspots
  startHotspotPolling();

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
  displayDiagnostics.write('session-quit', displayWindowState());
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopUACGuard();
  stopSystemAlerts();
  stopAutoBackupWatcher();
});
