"use strict"

const mainWindow = require('electron').remote.getCurrentWindow();

function onFullscreen() {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
}

function onDevTools() {
  mainWindow.toggleDevTools();
}

function onSatgraph() {
  mainWindow.loadURL("file://" + __dirname + "/index.html");
}

function onMap() {
  mainWindow.loadURL("file://" + __dirname + "/map.html");
}

function onHistogram() {
  mainWindow.loadURL("file://" + __dirname + "/hist.html");
}
