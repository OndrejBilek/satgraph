'use strict';

var map = require('./js/map');
var d3 = require('d3');
var topojson = require('topojson');

var map;
var svg;
var projection;
var path;
var layer1;
var layer2;
var idx;

var color = d3.scale.log()
  .range(["blue", "red"]);

var scale = 200;

var width = 1200,
  height = 800,
  rotate = [0, 0],
  visible = false;

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
  console.log("Drag");
  redrawMap();
}

function zoomed() {
  if (d3.event.sourceEvent.type == "wheel"){
    scale = d3.event.scale;
    redrawMap();
    console.log("Zoom")
  }
}

function redrawVoronoi() {
  idx = 0;

  d3.geom.voronoi(map.map(projection)).forEach(function(v) {
    layer1.append("path")
      .datum(v)
      .attr("fill", function(d) {
        return color(map[idx++][2]);
      })
      .attr("class", "voronoi")
      .attr("d", function(d) {
        return "M" + d.join("L") + "Z";
      });
  });
}

function redrawMap() {
  var mapElement = document.getElementById("map");
  width = mapElement.clientWidth;
  height = mapElement.clientHeight;

  projection = d3.geo.orthographic()
    .scale(scale)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .rotate(rotate);

  path = d3.geo.path().projection(projection);
  d3.selectAll("path").attr("d", path);
}

function onResize() {
  redrawMap();
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

function onInit() {
  svg = d3.select("#mapBox").append("svg")
    .attr("id", "map")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(drag)
    .call(zoom);

  layer1 = svg.append("g");
  layer2 = svg.append("g");

  d3.json("world.json", function(error, data) {
    if (error) throw error;

    layer2.append("path")
      .datum(topojson.feature(data, data.objects.land))
      .attr("class", "land")
      .attr("fill-opacity", "0.0")
      .attr("d", path);
  });

  d3.tsv("map.tsv", function(error, data) {
    if (error) throw error;

    map = data;
  });

}
