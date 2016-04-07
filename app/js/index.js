'use strict';

const d3 = require('d3');
const fs = require('fs');
const pa = require('path');
const topojson = require('topojson');
const png = require('save-svg-as-png');
const $ = require('jquery');

const electron = require('electron');
const dialog = electron.remote.require('dialog');
const mainWindow = electron.remote.getCurrentWindow();

var addon = require("../build/Release/module.node");

require("d3-geo-projection")(d3);
require("d3-tip")(d3);

var map;
var svg;
var path;
var layer1;
var layer2;

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    let str = "<strong>Value: </strong><span style='color:red'>" + d.point[2] + "</span><br>";
    str += "<strong>Type: </strong><span style='color:red'>" + type(d.point[3]) + "</span>";
    return str;
  })

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
  $('.d3-tip').css('opacity', '0');
  visible = false;
}

function redrawVoronoi() {
  var voronoi = d3.geom.voronoi().clipExtent([
    [-180, -90],
    [180, 90]
  ]);

  layer1.selectAll(".voronoi")
    .data(voronoi(map))
    .enter().append("svg:path")
    .attr("stroke-width", "1")
    .attr("class", "voronoi")
    .attr("d", function(d) {
      d = d.map(projection);
      return "M" + d.join("L") + "Z";
    })
    .attr("fill", function(d) {
      return color(d.point[2]);
    })
    .attr("stroke", function(d) {
      return color(d.point[2]);
    })
    .attr("visibility", function(d) {
      d = d.map(projection);
      if (d3.geom.polygon(d).area() > 100)
        return "hidden";
      return "visible";
    })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);
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
  map = addon.process(path);
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

function onDownload() {
  var data = svg.node().outerHTML;

  svg.attr("width", width)
    .attr("height", height);

  dialog.showSaveDialog(
    function(p) {
      if (p === undefined) return;
      var parsed = pa.parse(p);
      fs.writeFileSync(pa.join(parsed.dir, parsed.name + ".svg"), data);
      png.svgAsPngUri(document.getElementById("map"), {
        scale: 2
      }, function(uri) {
        var buffer = new Buffer(uri.split(",")[1], 'base64');
        fs.writeFileSync(pa.join(parsed.dir, parsed.name + ".png"), buffer);
      });
    });
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

function onMollweide() {
  projection = d3.geo.mollweide()
    .precision(.1);
  redrawMap();
}

function onMercator() {
  projection = d3.geo.mercator()
    .precision(.1);
  redrawMap();
}

function type(t) {
  if (t == null) return "N/A";
  if (t == 0) return "original";
  if (t == 1) return "computed";
  if (t == 2) return "normalized";
}

function onInit() {
  svg = d3.select("#mapBox").append("svg")
    .attr("id", "map")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(drag)
    .call(zoom)
    .call(tip);

  layer1 = svg.append("g");
  layer2 = svg.append("g");

  d3.json("../data/world.json", function(error, data) {
    if (error) throw error;

    layer2.append("path")
      .datum(topojson.feature(data, data.objects.land))
      .attr("class", "land")
      .attr("fill-opacity", "0.0")
      .attr("fill", "#aaa")
      .attr("stroke", "#fff")
      .attr("stroke-width", "2px")
      .attr("pointer-events", "none")
      .attr("d", path);
  });

  d3.tsv("../data/map.tsv", function(error, data) {
    if (error) throw error;

    map = data;
  });

}
