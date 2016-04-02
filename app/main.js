'use strict';

const app = require('app');
const dialog = require('electron').dialog;
const BrowserWindow = require('browser-window');

let mainWindow;

app.on('ready', function() {
  handleStartupEvent();
  createWindow();
  addListeners();
});

function handleStartupEvent(){
  if (process.platform !== 'win32') {
    return;
  }

  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
      dialog.showErrorBox("Install", "Install");
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

  mainWindow.loadURL('file://' + __dirname + '/html/index.html');
}

function addListeners() {
  app.on('window-all-closed', quit);
}

function quit() {
  app.quit();
}
