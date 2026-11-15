'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopCyberBot', {
  getContext: () => ipcRenderer.invoke('desktop-cyberbot:get-context'),
  resize: height => ipcRenderer.send('desktop-cyberbot:resize', height),
  close: () => ipcRenderer.send('desktop-cyberbot:close'),
  launch: id => ipcRenderer.invoke('desktop-cyberbot:launch', id),
});
