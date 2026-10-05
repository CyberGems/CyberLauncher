import { contextBridge, ipcRenderer, webUtils } from 'electron';

// =====================================
// Electron API Bridge — Expone funciones seguras al mundo del navegador (React)
// =====================================
contextBridge.exposeInMainWorld('electronAPI', {
  // --- Lanzar aplicación (.exe, .lnk, URL, etc.) ---
  launchApp: (appPath: string, isAdmin?: boolean, keepWindowOpen?: boolean) => ipcRenderer.invoke('launch-app', appPath, isAdmin, keepWindowOpen),
  getUwpApps: () => ipcRenderer.invoke('get-uwp-apps'),

  // --- Diálogos nativos de archivos ---
  selectFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('select-file', options),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  locateAppPath: (previousPath?: string) => ipcRenderer.invoke('locate-app-path', previousPath),
  selectImage: () => ipcRenderer.invoke('select-image'),
  getImageData: (filePath: string) => ipcRenderer.invoke('get-image-data', filePath),

  // --- Monitores ---
  getMonitors: () => ipcRenderer.invoke('get-monitors'),
  setMonitor: (monitorId: string) => ipcRenderer.invoke('set-monitor', monitorId),

  // --- Atajo global ---
  registerShortcut: (shortcut: string) => ipcRenderer.invoke('register-shortcut', shortcut),

  // --- Controles de ventana ---
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximizeToggle: () => ipcRenderer.invoke('window-maximize-toggle'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowHideToTray: () => ipcRenderer.invoke('window-hide-to-tray'),

  // --- Auto-launch (Iniciar con Windows) ---
  setAutoLaunch: (enabled: boolean, startMinimized?: boolean) =>
    ipcRenderer.invoke('set-auto-launch', enabled, startMinimized),
  setHideOnBlur: (enabled: boolean) => ipcRenderer.invoke('set-hide-on-blur', enabled),
  setUiModalOpen: (open: boolean) => ipcRenderer.invoke('set-ui-modal-open', open),
  setShowTaskbarIcon: (enabled: boolean) => ipcRenderer.invoke('set-show-taskbar-icon', enabled),

  // --- Info del sistema (CPU/Memoria real) ---
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // --- Info de discos ---
  getDiskInfo: () => ipcRenderer.invoke('get-disk-info'),

  // --- Drag & Drop: resolver ruta de archivo ---
  resolveFilePath: (filePath: string) => ipcRenderer.invoke('resolve-file-path', filePath),
  refreshAppIcon: (appPath: string) => ipcRenderer.invoke('refresh-app-icon', appPath),
  refreshAllAppIcons: (apps: Array<{ id: number; path?: string }>, force?: boolean) =>
    ipcRenderer.invoke('refresh-all-app-icons', apps, force),
  openFileLocation: (filePath: string) => ipcRenderer.invoke('open-file-location', filePath),
  searchSystemFiles: (query: string) => ipcRenderer.invoke('search-system-files', query),
  getIndexerSettings: () => ipcRenderer.invoke('get-indexer-settings'),
  saveIndexerSettings: (settings: { enabled: boolean; maxDepth: number; paths: string[] }) =>
    ipcRenderer.invoke('save-indexer-settings', settings),
  getIndexerStats: () => ipcRenderer.invoke('get-indexer-stats'),
  selectIndexerFolder: () => ipcRenderer.invoke('select-indexer-folder'),
  getSystemDrives: () => ipcRenderer.invoke('get-system-drives'),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // --- Hotspots ---
  setHotspots: (corners: string[], delay: number, disableInFullscreen?: boolean) => ipcRenderer.invoke('set-hotspots', corners, delay, disableInFullscreen),

  // --- Diagnóstico y Sistema ---
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
  openTaskbarSettings: () => ipcRenderer.invoke('open-taskbar-settings'),
  systemPowerAction: (action: 'shutdown' | 'restart' | 'sleep' | 'lock' | 'signout', force?: boolean) =>
    ipcRenderer.invoke('system-power-action', action, force),

  // --- Menú contextual nativo ---
  showTextContextMenu: (x: number, y: number) => ipcRenderer.invoke('show-text-context-menu', { x, y }),

  // --- Exportar/Importar configuración con diálogos nativos ---
  exportConfig: (jsonData: string) => ipcRenderer.invoke('export-config', jsonData),
  importConfig: () => ipcRenderer.invoke('import-config'),

  // --- Respaldo automático programado ---
  backupNow: () => ipcRenderer.invoke('backup:now'),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  openBackupsFolder: () => ipcRenderer.invoke('backup:openFolder'),
  restoreBackup: (fileName: string) => ipcRenderer.invoke('backup:restore', fileName),
  deleteBackup: (fileName: string) => ipcRenderer.invoke('backup:delete', fileName),
  getBackupStatus: () => ipcRenderer.invoke('backup:get-status'),
  onBackupCompleted: (callback: (data: { at: string; file: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('backup:completed', handler);
    return () => { ipcRenderer.removeListener('backup:completed', handler); };
  },

  // --- Persistencia centralizada automática ---
  saveConfig: (config: any) => ipcRenderer.invoke('saveConfig', config),
  loadConfig: () => ipcRenderer.invoke('loadConfig'),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  onReloadConfig: (callback: () => void) => {
    const handler = (_event: any) => {
      console.log('[PRELOAD] reload-config event received');
      callback();
    };
    ipcRenderer.on('reload-config', handler);
    return () => { ipcRenderer.removeListener('reload-config', handler); };
  },
  onLauncherShown: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('launcher-shown', handler);
    return () => { ipcRenderer.removeListener('launcher-shown', handler); };
  },

  // --- Window Pinning (Always-on-top) ---
  setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('set-always-on-top', enabled),
  setRendererAwake: (awake: boolean) => ipcRenderer.invoke('set-renderer-awake', awake),
  reportDisplayHeartbeat: (report: { visibility: 'visible' | 'hidden'; rootMounted: boolean; surfaceMounted: boolean; surfaceChildren: number; surfaceOpacity: number | null; devicePixelRatio: number }) =>
    ipcRenderer.send('display-diagnostic-heartbeat', report),

  // --- Dynamic shortcuts ---
  registerAppShortcuts: (shortcuts: Array<{ id: number; path: string; shortcut: string; isAdmin: boolean; name?: string; icon?: string }>) =>
    ipcRenderer.invoke('register-app-shortcuts', shortcuts),
  onAppLaunchedViaHotkey: (callback: (data: { id?: number; path: string; name?: string; icon?: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('app-launched-via-hotkey', handler);
    return () => { ipcRenderer.removeListener('app-launched-via-hotkey', handler); };
  },

  // --- Shell runner & Cyber Terminal ---
  runShellCommand: (command: string, opts?: { shellType?: 'powershell' | 'cmd'; cwd?: string }) =>
    ipcRenderer.invoke('run-shell-command', typeof command === 'string' && opts ? { command, ...opts } : command),
  getConsoleCwd: () => ipcRenderer.invoke('get-console-cwd'),
  setConsoleCwd: (targetPath: string) => ipcRenderer.invoke('set-console-cwd', targetPath),
  openPath: (targetPath: string) => ipcRenderer.invoke('open-path', targetPath),
  openExternalTerminal: (targetPath?: string) => ipcRenderer.invoke('open-external-terminal', targetPath),
  killShellCommand: (cmdId?: string) => ipcRenderer.invoke('kill-shell-command', cmdId),
  terminalStart: (options: { id: string; shell: 'powershell' | 'cmd'; cwd: string; cols: number; rows: number }) =>
    ipcRenderer.invoke('terminal-start', options),
  terminalWrite: (id: string, data: string) => ipcRenderer.send('terminal-write', { id, data }),
  terminalResize: (id: string, cols: number, rows: number) => ipcRenderer.send('terminal-resize', { id, cols, rows }),
  terminalClose: (id: string) => ipcRenderer.invoke('terminal-close', id),
  onTerminalData: (callback: (event: { id: string; data: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { id: string; data: string }) => callback(data);
    ipcRenderer.on('terminal-data', handler);
    return () => ipcRenderer.removeListener('terminal-data', handler);
  },
  onTerminalExit: (callback: (event: { id: string; exitCode: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { id: string; exitCode: number }) => callback(data);
    ipcRenderer.on('terminal-exit', handler);
    return () => ipcRenderer.removeListener('terminal-exit', handler);
  },
  onShellOutput: (callback: (data: { id: string; type: 'stdout' | 'stderr'; text: string }) => void) => {
    const handler = (_event: any, data: { id: string; type: 'stdout' | 'stderr'; text: string }) => callback(data);
    ipcRenderer.on('shell-command-output', handler);
    return () => { ipcRenderer.removeListener('shell-command-output', handler); };
  },
  onShellExit: (callback: (data: { id: string; exitCode: number; cwd?: string }) => void) => {
    const handler = (_event: any, data: { id: string; exitCode: number; cwd?: string }) => callback(data);
    ipcRenderer.on('shell-command-exit', handler);
    return () => { ipcRenderer.removeListener('shell-command-exit', handler); };
  },
  onAlwaysOnTopBlurAttempt: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('always-on-top-blur-attempt', handler);
    return () => { ipcRenderer.removeListener('always-on-top-blur-attempt', handler); };
  },
  onOpenAddApp: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('open-add-app', handler);
    return () => { ipcRenderer.removeListener('open-add-app', handler); };
  },
  onOpenSettings: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('open-settings', handler);
    return () => { ipcRenderer.removeListener('open-settings', handler); };
  },
  onOpenAbout: (callback: (opts?: { checkUpdates?: boolean }) => void) => {
    const handler = (_event: any, opts?: { checkUpdates?: boolean }) => callback(opts);
    ipcRenderer.on('open-about', handler);
    return () => { ipcRenderer.removeListener('open-about', handler); };
  },
  setTrayRecents: (items: Array<{ name: string; path: string; isAdmin?: boolean; iconPath?: string }>) =>
    ipcRenderer.invoke('tray:set-recents', items),
  updateTraySettings: (settings: { showTrayRecents?: boolean; showSuiteRecommendations?: boolean }) =>
    ipcRenderer.invoke('tray:update-settings', settings),
  showTrayPinTip: () => ipcRenderer.invoke('show-tray-pin-tip'),
  getSeenTrayPinTip: () => ipcRenderer.invoke('get-seen-tray-pin-tip'),

  // --- App versions / updates (CyberFeeds model) ---
  getAppVersions: () => ipcRenderer.invoke('app:get-versions'),
  getUpdateStatus: () => ipcRenderer.invoke('update:get-status'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  setAutoUpdate: (enabled: boolean) => ipcRenderer.invoke('set-auto-update', enabled),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onUpdateStatus: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('update:status', handler);
    return () => { ipcRenderer.removeListener('update:status', handler); };
  },

  // --- System Health Alerts ---
  onSystemAlertToast: (callback: (data: { type: 'disk' | 'ram'; title: string; message: string; level: 'warning' | 'critical' }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('system-alert-toast', handler);
    return () => { ipcRenderer.removeListener('system-alert-toast', handler); };
  },
  onSystemAlertAction: (callback: (data: { type: 'disk' | 'ram' }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('system-alert-action', handler);
    return () => { ipcRenderer.removeListener('system-alert-action', handler); };
  },
  showNotification: (options: { title: string; body: string }) =>
    ipcRenderer.invoke('show-notification', options),
  showDesktopToast: (payload: any) =>
    ipcRenderer.invoke('show-desktop-toast', payload),
  setToastPreferences: (settings: any) =>
    ipcRenderer.invoke('set-toast-preferences', settings),
  hideDesktopToast: () =>
    ipcRenderer.invoke('hide-desktop-toast'),
  onCancelScheduledTask: (callback: (taskId: string) => void) => {
    const handler = (_event: any, taskId: string) => callback(taskId);
    ipcRenderer.on('cancel-scheduled-task', handler);
    return () => { ipcRenderer.removeListener('cancel-scheduled-task', handler); };
  },
  onLaunchScheduledNow: (callback: (taskId: string) => void) => {
    const handler = (_event: any, taskId: string) => callback(taskId);
    ipcRenderer.on('launch-scheduled-now', handler);
    return () => { ipcRenderer.removeListener('launch-scheduled-now', handler); };
  },
  onOpenHudAction: (callback: (target: string) => void) => {
    const handler = (_event: any, target: string) => callback(target);
    ipcRenderer.on('open-hud-action', handler);
    return () => { ipcRenderer.removeListener('open-hud-action', handler); };
  },
});

contextBridge.exposeInMainWorld('trayMenu', {
  onState: (cb: (state: any) => void) => {
    const handler = (_event: any, state: any) => cb(state);
    ipcRenderer.on('tray-menu-state', handler);
    return () => { ipcRenderer.removeListener('tray-menu-state', handler); };
  },
  onShow: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('tray-menu-show', handler);
    return () => { ipcRenderer.removeListener('tray-menu-show', handler); };
  },
  onReset: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('tray-menu-reset', handler);
    return () => { ipcRenderer.removeListener('tray-menu-reset', handler); };
  },
  action: (action: string, payload?: any) => ipcRenderer.send('tray-menu-action', action, payload),
  ready: (rect: any) => ipcRenderer.send('tray-menu-ready', rect),
  hide: () => ipcRenderer.send('tray-menu-hide'),
  requestState: () => ipcRenderer.send('tray-menu-request-state'),
});

