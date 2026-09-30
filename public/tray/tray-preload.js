'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const trayMenuBridge = {
  onState: (cb) => {
    const handler = (_event, state) => {
      try {
        if (typeof cb === 'function') cb(state);
      } catch (err) {
        console.error('[TRAY-PRELOAD] onState handler error:', err);
      }
    };
    ipcRenderer.on('tray-menu-state', handler);
    return () => ipcRenderer.removeListener('tray-menu-state', handler);
  },
  onShow: (cb) => {
    const handler = () => {
      try {
        if (typeof cb === 'function') cb();
      } catch (err) {
        console.error('[TRAY-PRELOAD] onShow handler error:', err);
      }
    };
    ipcRenderer.on('tray-menu-show', handler);
    return () => ipcRenderer.removeListener('tray-menu-show', handler);
  },
  onReset: (cb) => {
    const handler = () => {
      try {
        if (typeof cb === 'function') cb();
      } catch (err) {
        console.error('[TRAY-PRELOAD] onReset handler error:', err);
      }
    };
    ipcRenderer.on('tray-menu-reset', handler);
    return () => ipcRenderer.removeListener('tray-menu-reset', handler);
  },
  action: (action, payload) => {
    try {
      ipcRenderer.send('tray-menu-action', action, payload);
    } catch (err) {
      console.error('[TRAY-PRELOAD] action error:', err);
    }
  },
  ready: (rect) => {
    try {
      ipcRenderer.send('tray-menu-ready', rect);
    } catch (err) {
      console.error('[TRAY-PRELOAD] ready error:', err);
    }
  },
  hide: () => {
    try {
      ipcRenderer.send('tray-menu-hide');
    } catch (err) {
      console.error('[TRAY-PRELOAD] hide error:', err);
    }
  },
  requestState: () => {
    try {
      ipcRenderer.send('tray-menu-request-state');
    } catch (err) {
      console.error('[TRAY-PRELOAD] requestState error:', err);
    }
  },
};

try {
  contextBridge.exposeInMainWorld('trayMenu', trayMenuBridge);
  contextBridge.exposeInMainWorld('electronAPI', { trayMenu: trayMenuBridge });
} catch (err) {
  console.error('[TRAY-PRELOAD] Failed to expose trayMenu bridge:', err);
}
