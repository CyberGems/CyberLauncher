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

const trayPinTipBridge = {
  onData: (cb) => {
    const handler = (_event, data) => {
      try {
        if (typeof cb === 'function') cb(data);
      } catch (err) {
        console.error('[PIN-TIP-PRELOAD] onData handler error:', err);
      }
    };
    ipcRenderer.on('tray-pin-tip-data', handler);
    return () => ipcRenderer.removeListener('tray-pin-tip-data', handler);
  },
  ready: (size) => {
    try {
      ipcRenderer.send('tray-pin-tip-ready', size);
    } catch (err) {
      console.error('[PIN-TIP-PRELOAD] ready error:', err);
    }
  },
  dismiss: (dontShowAgain) => {
    try {
      ipcRenderer.send('tray-pin-tip-dismiss', !!dontShowAgain);
    } catch (err) {
      console.error('[PIN-TIP-PRELOAD] dismiss error:', err);
    }
  },
  openSettings: (dontShowAgain) => {
    try {
      ipcRenderer.send('tray-pin-tip-open-settings', !!dontShowAgain);
    } catch (err) {
      console.error('[PIN-TIP-PRELOAD] openSettings error:', err);
    }
  },
};

const desktopToastBridge = {
  onData: (cb) => {
    const handler = (_event, data) => {
      try {
        if (typeof cb === 'function') cb(data);
      } catch (err) {
        console.error('[TOAST-PRELOAD] onData handler error:', err);
      }
    };
    ipcRenderer.on('desktop-toast-data', handler);
    return () => ipcRenderer.removeListener('desktop-toast-data', handler);
  },
  action: (actionName, payload) => {
    try {
      ipcRenderer.send('desktop-toast-action', actionName, payload);
    } catch (err) {
      console.error('[TOAST-PRELOAD] action error:', err);
    }
  },
  hide: () => {
    try {
      ipcRenderer.send('desktop-toast-hide');
    } catch (err) {
      console.error('[TOAST-PRELOAD] hide error:', err);
    }
  }
};

try {
  contextBridge.exposeInMainWorld('trayMenu', trayMenuBridge);
  contextBridge.exposeInMainWorld('trayPinTip', trayPinTipBridge);
  contextBridge.exposeInMainWorld('desktopToast', desktopToastBridge);
  contextBridge.exposeInMainWorld('electronAPI', {
    trayMenu: trayMenuBridge,
    trayPinTip: trayPinTipBridge,
    desktopToast: desktopToastBridge,
  });
} catch (err) {
  console.error('[TRAY-PRELOAD] Failed to expose bridges:', err);
}

