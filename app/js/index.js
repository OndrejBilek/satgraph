'use strict';

const d3 = require('d3');
const topojson = require('topojson');

const electron = require('electron');
const dialog = electron.remote.require('dialog');
const mainWindow = electron.remote.getCurrentWindow();

var addon = require("../build/Release/tools.node");

var map;
var svg;
var path;
var layer1;
var layer2;
var idx;

var color = d3.scale.log()
  .range(["blue", "green", "yellow", "red"])
  .domain([1, 3, 5, 7]);

var scale = 200;

var width = 1200,
  height = 800,
  rotate = [0, 0],
  visible = false;

var projection = d3.geo.equirectangular()
  .precision(.1);

var drag = d3.behavior.drag()
  .origin(function() {
    return {
      x: rotate[0],
      y: -rotate[1]
    };
  })
  .on("drag", dragged);

var zoom = d3.behavior.zoom()
  .scaleExtent([200, 10000])
  .on("zoom", zoomed);

function dragged() {
  rotate[0] = d3.event.x;
  rotate[1] = -d3.event.y;
  redrawMap();
}

function zoomed() {
  if (d3.event.sourceEvent.type == "wheel") {
    scale = d3.event.scale;
    redrawMap();
  }
}

function clearVoronoi() {
  d3.selectAll(".voronoi").remove();
  visible = false;
}

function redrawVoronoi() {
  idx = 0;

  var voronoi = d3.geom.voronoi().clipExtent([
    [-180, -90],
    [180, 90]
  ]);

  voronoi(map).forEach(function(v) {
    v = v.map(projection);
    layer1.append("path")
      .datum(v)
      .attr("fill", function(d) {
        return color(map[idx][2]);
      })
      .attr("stroke", function(d) {
        return color(map[idx++][2]);
      })
      .attr("stroke-width", "1")
      .attr("class", "voronoi")
      .attr("d", function(d) {
        return "M" + d.join("L") + "Z"
      });
  });
}

function redrawMap() {
  clearVoronoi();

  var mapElement = document.getElementById("map");
  width = mapElement.clientWidth;
  height = mapElement.clientHeight;

  projection.translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotate);

  path = d3.geo.path().projection(projection);
  d3.selectAll("path").attr("d", path);
}

function openFile(path) {
  console.log(path);
}

function onResize() {
  redrawMap();
}

function onOpen() {
  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      openFile(fileNames[0]);
    });
}

function onToggle() {
  if (visible) {
    d3.selectAll(".voronoi").remove();
    visible = false;
  } else {
    redrawVoronoi();
    visible = true;
  }
}

function onFullscreen() {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
}

function onReload() {
  mainWindow.reload();
}

function onDevTools() {
  mainWindow.toggleDevTools();
}

function onEquirectangular() {
  projection = d3.geo.equirectangular()
    .precision(.1);
  redrawMap();
}

function onOrthographic() {
  projection = d3.geo.orthographic()
    .clipAngle(90)
    .precision(.1);
  redrawMap();
}

function onInit() {
  console.log('This should be eight:', addon.add(3, 5));

  svg = d3.select("#mapBox").append("svg")
    .attr("id", "map")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(drag)
    .call(zoom);

  layer1 = svg.append("g");
  layer2 = svg.append("g");

  d3.json("../data/world.json", function(error, data) {
    if (error) throw error;

    layer2.append("path")
      .datum(topojson.feature(data, data.objects.land))
      .attr("class", "land")
      .attr("fill-opacity", "0.0")
      .attr("d", path);
  });

  d3.tsv("../data/map.tsv", function(error, data) {
    if (error) throw error;

    map = data;
  });

}
