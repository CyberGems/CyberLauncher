import electronUpdater from 'electron-updater';
import { ipcMain, BrowserWindow, app, shell } from 'electron';
import os from 'node:os';

// electron-updater is CJS; named ESM import fails when the module is externalized.
const { autoUpdater } = electronUpdater;

/**
 * Update lifecycle (CyberFeeds model) via electron-updater + GitHub Releases.
 * Auto-download is gated on the autoUpdate setting.
 */

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string };

let autoUpdateEnabled = false;
let lastStatus: UpdateStatus = { state: 'idle' };
let ipcRegistered = false;

function broadcast(status: UpdateStatus): void {
  lastStatus = status;
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('update:status', status);
  }
}

export function getLastUpdateStatus(): UpdateStatus {
  return lastStatus;
}

export function setAutoUpdate(enabled: boolean): void {
  autoUpdateEnabled = enabled;
}

export function initUpdater(opts: { autoUpdate: boolean }): void {
  autoUpdateEnabled = opts.autoUpdate;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.removeAllListeners();

  autoUpdater.on('checking-for-update', () => broadcast({ state: 'checking' }));

  autoUpdater.on('update-available', (info) => {
    broadcast({ state: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', (info) => {
    broadcast({ state: 'not-available', version: info.version });
  });

  autoUpdater.on('download-progress', (p) => {
    broadcast({ state: 'downloading', percent: Math.round(p.percent) });
  });

  autoUpdater.on('update-downloaded', (info) => {
    broadcast({ state: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (err) => {
    broadcast({ state: 'error', message: String(err?.message || err) });
  });

  registerUpdateIpc();

  if (autoUpdateEnabled) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => { /* offline: ignore */ });
    }, 8000);
  }
}

function registerUpdateIpc(): void {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('update:get-status', () => lastStatus);

  ipcMain.handle('update:check', async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update check timed out')), 20000);
      });
      const result = await Promise.race([
        autoUpdater.checkForUpdates(),
        timeoutPromise,
      ]) as { updateInfo?: { version?: string } } | null;
      return { ok: true, version: result?.updateInfo?.version };
    } catch (err) {
      console.error('[Updater] Check failed:', err);
      const message = String((err as Error)?.message || err);
      broadcast({ state: 'error', message });
      return { ok: false, error: message };
    }
  });

  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (err) {
      const message = String((err as Error)?.message || err);
      broadcast({ state: 'error', message });
      return { ok: false, error: message };
    }
  });

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('app:get-versions', () => ({
    app: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    osRelease: os.release(),
    osType: os.type(),
  }));

  ipcMain.handle('open-external', async (_event, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      await shell.openExternal(url);
      return { success: true };
    }
    return { success: false, error: 'Invalid URL' };
  });

  ipcMain.handle('set-auto-update', (_event, enabled: boolean) => {
    setAutoUpdate(!!enabled);
    return { success: true, enabled: !!enabled };
  });
}
