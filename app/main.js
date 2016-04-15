'use strict';

const electron = require("electron");
const path = require("path");
const cp = require("child_process");

const app = electron.app;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

app.on('ready', function() {
  if (handleSquirrelEvent()) {
    createWindow();
    addListeners();
  }
});

function install(done) {
  var target = path.basename(process.execPath);
  executeSquirrelCommand(["--createShortcut", target], done);
};

function uninstall(done) {
  var target = path.basename(process.execPath);
  executeSquirrelCommand(["--removeShortcut", target], done);
};

function executeSquirrelCommand(args, done) {
  var updateDotExe = path.resolve(path.dirname(process.execPath),
    '..', 'update.exe');
  var child = cp.spawn(updateDotExe, args, {
    detached: true
  });
  child.on('close', function(code) {
    done();
  });
};

function handleSquirrelEvent() {
  if (process.platform !== 'win32') {
    return true;
  }

  var squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
      install(quit);
      return false;
    case '--squirrel-updated':
      install(quit);
      return false;
    case '--squirrel-uninstall':
      uninstall(quit);
      return false;
    case '--squirrel-obsolete':
      quit();
      return false;
  }

  return true;
};

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: __dirname + "/icon.png"
  });
  mainWindow.maximize();
  mainWindow.setMenu(null);

  mainWindow.loadURL("file://" + __dirname + "/html/map.html");
}

function addListeners() {
  app.on('window-all-closed', quit);
}

function quit() {
  app.quit();
}
