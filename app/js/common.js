const mainWindow = require('electron').remote.getCurrentWindow();

function onFullscreen() {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
}

function onReload() {
  mainWindow.reload();
}

function onDevTools() {
  mainWindow.toggleDevTools();
}
