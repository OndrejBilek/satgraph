"use strict";

const electron = require("electron");
const path = require("path");
const cp = require("child_process");

const app = electron.app;
const dialog = electron.dialog;
const autoUpdater = electron.autoUpdater;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

app.on("ready", function() {
  if (handleSquirrelEvent()) {
    createWindow();
    addListeners();
    registerUpdater();
  }
});

function install(done) {
  let target = path.basename(process.execPath);
  executeSquirrelCommand(["--createShortcut", target], done);
};

function uninstall(done) {
  let target = path.basename(process.execPath);
  executeSquirrelCommand(["--removeShortcut", target], done);
};

function executeSquirrelCommand(args, done) {
  let updateDotExe = path.resolve(path.dirname(process.execPath),
    "..", "update.exe");
  let child = cp.spawn(updateDotExe, args, {
    detached: true
  });
  child.on("close", function(code) {
    done();
  });
};

function handleSquirrelEvent() {
  if (process.platform !== "win32") {
    return true;
  }

  let squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case "--squirrel-install":
      install(quit);
      return false;
    case "--squirrel-updated":
      install(quit);
      updated();
      return false;
    case "--squirrel-uninstall":
      uninstall(quit);
      return false;
    case "--squirrel-obsolete":
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
  app.on("window-all-closed", quit);
  autoUpdater.on("update-available", updateAvailable);
  autoUpdater.on("update-downloaded", updateDownloaded);
}

function updateAvailable() {
  dialog.showMessageBox({
    type: "info",
    buttons: ["Ok"],
    message: "Update available."
  });
}

function updateDownloaded() {
  dialog.showMessageBox({
    title: "Application updater",
    type: "question",
    buttons: ["Yes", "No"],
    message: "Update available\nDo you want to update now?"
  }, function(response) {
    if (response == 0) {
      autoUpdater.quitAndInstall();
    }
  });
}

function updated() {
  dialog.showMessageBox({
    title: "Application updater",
    type: "info",
    buttons: ["Ok"],
    message: "Update successfully installed"
  });
}

function registerUpdater() {
  if (process.platform == "win32") {
    //autoUpdater.setFeedURL("");
    //autoUpdater.checkForUpdates();
  }
}

function quit() {
  app.quit();
}
