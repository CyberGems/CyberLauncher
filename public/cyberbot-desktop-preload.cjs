'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel, callback) => {
  const listener = (_event, value) => callback(value);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('desktopCyberBot', {
  getContext: () => ipcRenderer.invoke('desktop-cyberbot:get-context'),
  resize: height => ipcRenderer.send('desktop-cyberbot:resize', height),
  onBubblePlacement: callback => subscribe('desktop-cyberbot:bubble-placement', callback),
  onExpanded: callback => subscribe('desktop-cyberbot:expanded', callback),
  onPresent: callback => subscribe('desktop-cyberbot:present', callback),
  onLanguage: callback => subscribe('desktop-cyberbot:language', callback),
  onCatalog: callback => subscribe('desktop-cyberbot:catalog', callback),
  onResetSearch: callback => subscribe('desktop-cyberbot:reset-search', callback),
  onActivity: callback => subscribe('desktop-cyberbot:activity', callback),
  activity: () => ipcRenderer.send('desktop-cyberbot:activity'),
  avatarReady: () => ipcRenderer.send('desktop-cyberbot:avatar-ready'),
  toggleBubble: () => ipcRenderer.send('desktop-cyberbot:toggle-bubble'),
  contextMenu: () => ipcRenderer.send('desktop-cyberbot:context-menu'),
  drag: (phase, offset) => ipcRenderer.send('desktop-cyberbot:drag', phase, offset),
  close: () => ipcRenderer.send('desktop-cyberbot:close'),
  launch: id => ipcRenderer.invoke('desktop-cyberbot:launch', id),
});
