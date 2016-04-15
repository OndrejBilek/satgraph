"use strict"

const mainWindow = require('electron').remote.getCurrentWindow();
const dialog = require("electron").remote.require("dialog");

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

function onAbout() {
  dialog.showMessageBox({
    title: "About",
    type: "info",
    buttons: ["Close"],
    message: "SatGraph v0.1.2\n\nOndřej Bílek\nbilekon1@fit.cvut.cz\ngithub.com/OndrejBilek/satgraph"
  });
}

function downloadPNG(el) {
  dialog.showSaveDialog({
      filters: [{
        name: "*.png",
        extensions: ["png"]
      }]
    },
    function(file) {
      if (file === undefined) return;
      png.svgAsPngUri(document.getElementById(el), {
        scale: 2
      }, function(uri) {
        let buffer = new Buffer(uri.split(",")[1], "base64");
        fs.writeFile(file, buffer);
      });
    });
}

function downloadSVG(el) {
  let data = jQuery("#" + el)[0].outerHTML;

  dialog.showSaveDialog({
      filters: [{
        name: "*.svg",
        extensions: ["svg"]
      }]
    },
    function(file) {
      if (file === undefined) return;
      fs.writeFile(file, data);
    });
}
