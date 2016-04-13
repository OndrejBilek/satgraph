'use strict';

const electron = require('electron');

const app = electron.app;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

app.on('ready', function() {
  handleStartupEvent();
  createWindow();
  addListeners();
});

function handleStartupEvent() {
  if (process.platform !== 'win32') {
    return;
  }

  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
      app.quit();
      return;
    case '--squirrel-updated':
      app.quit();
      return;
    case '--squirrel-uninstall':
      app.quit();
      return
    case '--squirrel-obsolete':
      app.quit();
      return;
  }
};

function createWindow() {
  mainWindow = new BrowserWindow();
  mainWindow.maximize();
  mainWindow.setMenu(null);

  mainWindow.loadURL("file://" + __dirname + "/html/index.html");
}

function addListeners() {
  app.on('window-all-closed', quit);
}

function quit() {
  app.quit();
}
