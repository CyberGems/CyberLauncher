'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('trayMenu', {
  onState: (cb) => {
    const handler = (_event, state) => cb(state);
    ipcRenderer.on('tray-menu-state', handler);
    return () => ipcRenderer.removeListener('tray-menu-state', handler);
  },
  onShow: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('tray-menu-show', handler);
    return () => ipcRenderer.removeListener('tray-menu-show', handler);
  },
  action: (action, payload) => ipcRenderer.send('tray-menu-action', action, payload),
  ready: (rect) => ipcRenderer.send('tray-menu-ready', rect),
  hide: () => ipcRenderer.send('tray-menu-hide')
});
