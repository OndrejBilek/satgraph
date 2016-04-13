'use strict';

const d3 = require('d3');
const fs = require('fs');
const pa = require('path');
const topojson = require('topojson');
const png = require('save-svg-as-png');
const jQuery = require('jquery');
const $ = require('jquery');
require("bootstrap");

const dialog = require('electron').remote.require('dialog');


var addon = require("../build/Release/module.node");

require("d3-geo-projection")(d3);
require("d3-tip")(d3);

var map;
var hist;
var svg;
var path;
var layer1;
var layer2;
var fileName;
var voronoiMap;

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    let str = "<strong>Value: </strong><span style='color:" + color(d.point[2]) + "'>" + d.point[2] + "</span><br>";
    str += "<strong>Type: </strong><span style='color:white'>" + type(d.point[3]) + "</span>";
    return str;
  })

var color = d3.scale.log()
  .range(["blue", "green", "yellow", "red"])
  .domain([1, 3, 5, 7]);

var scale = 310;

var width = 1200,
  height = 800,
  rotate = [0, 0];

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
  .scale(310)
  .scaleExtent([100, 10000])
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
}

function redrawVoronoi() {
  clearVoronoi();

  layer1.selectAll(".voronoi")
    .data(voronoiMap)
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

function generateVoronoi() {
  var voronoi = d3.geom.voronoi().clipExtent([
    [-180, -90],
    [180, 90]
  ]);
  voronoiMap = voronoi(map);
}

function openFile() {
  let opts = {
    neighbours: $("#neighbours").val(),
    normalize: $("#normalize").val(),
    type: $("#type").val()
  };
  if (fileName) {
    map = addon.process(fileName, opts);
  }
}

function onResizeHist() {
  redrawMap();
}

function onOpenMap() {
  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      fileName = fileNames[0];
    });
}

function onGenerate() {
  openFile();
  generateVoronoi();
  redrawVoronoi();
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

function onInitMap() {
  svg = d3.select("#mapBox").append("svg")
    .attr("id", "map")
    .attr("class", "frow content")
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
      .attr("fill-opacity", "0.0")
      .attr("stroke", "#000")
      .attr("stroke-width", "1px")
      .attr("pointer-events", "none")
      .attr("d", path);

    redrawMap();
  });

}
