const { app } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Graceful shutdown lets Electron close its renderer, GPU and tray processes.
process.on('message', message => {
  if (message === 'quit-cyberbot-review') app.quit();
});
import(pathToFileURL(path.resolve(__dirname, '../dist-electron/main.js')).href).catch(error => {
  console.error(error);
  app.exit(1);
});
