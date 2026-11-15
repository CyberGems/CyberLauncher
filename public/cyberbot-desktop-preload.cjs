'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopCyberBot', {
  getContext: () => ipcRenderer.invoke('desktop-cyberbot:get-context'),
  resize: height => ipcRenderer.send('desktop-cyberbot:resize', height),
  onPlacement: callback => {
    const listener = (_event, placement) => callback(placement);
    ipcRenderer.on('desktop-cyberbot:placement', listener);
    return () => ipcRenderer.removeListener('desktop-cyberbot:placement', listener);
  },
  toggleBubble: () => ipcRenderer.send('desktop-cyberbot:toggle-bubble'),
  drag: (phase, offset) => ipcRenderer.send('desktop-cyberbot:drag', phase, offset),
  close: () => ipcRenderer.send('desktop-cyberbot:close'),
  launch: id => ipcRenderer.invoke('desktop-cyberbot:launch', id),
});
