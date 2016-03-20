'use strict';

var app = require('app');
const ipc = require("electron").ipcMain
var BrowserWindow = require('browser-window');

var mainWindow;

app.on('ready', function() {
  createWindow();
  addListeners();
});

function createWindow() {
  mainWindow = new BrowserWindow();
  mainWindow.maximize();
  mainWindow.setMenu(null);

  mainWindow.loadURL('file://' + __dirname + '/app/index.html');
}

function addListeners() {
  app.on('window-all-closed', quit);
  ipc.on('quit', quit);
  ipc.on('reload', reload);
  ipc.on('dev-tools', devTools);
  ipc.on('fullscreen', fullscreen);

}

function quit() {
  app.quit();
}

function reload() {
  mainWindow.reload();
}

function devTools() {
  mainWindow.toggleDevTools();
}

function fullscreen() {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
}
