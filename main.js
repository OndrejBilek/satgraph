'use strict';

var app = require('app');
var ipc = require("electron").ipcMain
var BrowserWindow = require('browser-window');

var mainWindow;

app.on('ready', function() {
  createWindow();
  addListeners();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800
  });
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');
}

function addListeners() {
  app.on('window-all-closed', function() {
    quit();
  });

  ipc.on('quit', function() {
    quit();
  });
}

function quit() {
  app.quit();
}
