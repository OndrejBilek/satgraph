'use strict';

const app = require('app');
const BrowserWindow = require('browser-window');

let mainWindow;

app.on('ready', function() {
  createWindow();
  addListeners();
});

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
