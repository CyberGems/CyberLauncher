import { contextBridge, ipcRenderer, webUtils } from 'electron';

// =====================================
// Electron API Bridge — Expone funciones seguras al mundo del navegador (React)
// =====================================
contextBridge.exposeInMainWorld('electronAPI', {
  // --- Lanzar aplicación (.exe, .lnk, URL, etc.) ---
  launchApp: (appPath: string, isAdmin?: boolean) => ipcRenderer.invoke('launch-app', appPath, isAdmin),

  // --- Diálogos nativos de archivos ---
  selectFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('select-file', options),
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
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  setHideOnBlur: (enabled: boolean) => ipcRenderer.invoke('set-hide-on-blur', enabled),
  setShowTaskbarIcon: (enabled: boolean) => ipcRenderer.invoke('set-show-taskbar-icon', enabled),

  // --- Info del sistema (CPU/Memoria real) ---
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // --- Info de discos ---
  getDiskInfo: () => ipcRenderer.invoke('get-disk-info'),

  // --- Drag & Drop: resolver ruta de archivo ---
  resolveFilePath: (filePath: string) => ipcRenderer.invoke('resolve-file-path', filePath),
  openFileLocation: (filePath: string) => ipcRenderer.invoke('open-file-location', filePath),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // --- Hotspots ---
  setHotspots: (corners: string[], delay: number) => ipcRenderer.invoke('set-hotspots', corners, delay),

  // --- Diagnóstico ---
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),

  // --- Menú contextual nativo ---
  showTextContextMenu: (x: number, y: number) => ipcRenderer.invoke('show-text-context-menu', { x, y }),

  // --- Exportar/Importar configuración con diálogos nativos ---
  exportConfig: (jsonData: string) => ipcRenderer.invoke('export-config', jsonData),
  importConfig: () => ipcRenderer.invoke('import-config'),

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

  // --- Window Pinning (Always-on-top) ---
  setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('set-always-on-top', enabled),

  // --- Dynamic shortcuts ---
  registerAppShortcuts: (shortcuts: Array<{ id: number; path: string; shortcut: string; isAdmin: boolean }>) =>
    ipcRenderer.invoke('register-app-shortcuts', shortcuts),

  // --- Shell runner ---
  runShellCommand: (command: string) => ipcRenderer.invoke('run-shell-command', command),
  onShellOutput: (callback: (data: { id: string; type: 'stdout' | 'stderr'; text: string }) => void) => {
    const handler = (_event: any, data: { id: string; type: 'stdout' | 'stderr'; text: string }) => callback(data);
    ipcRenderer.on('shell-command-output', handler);
    return () => { ipcRenderer.removeListener('shell-command-output', handler); };
  },
  onShellExit: (callback: (data: { id: string; exitCode: number }) => void) => {
    const handler = (_event: any, data: { id: string; exitCode: number }) => callback(data);
    ipcRenderer.on('shell-command-exit', handler);
    return () => { ipcRenderer.removeListener('shell-command-exit', handler); };
  },
  onAlwaysOnTopBlurAttempt: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('always-on-top-blur-attempt', handler);
    return () => { ipcRenderer.removeListener('always-on-top-blur-attempt', handler); };
  },
  onOpenSettings: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('open-settings', handler);
    return () => { ipcRenderer.removeListener('open-settings', handler); };
  },
});
