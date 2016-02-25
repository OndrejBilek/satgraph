'use strict';

var map = require('./js/map');
var d3 = require('d3');
var topojson = require('topojson');


var width = 1200,
  height = 800,
  rotate = [0, 0];

function init() {
  var projection = d3.geo.orthographic()
    .scale(250)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .rotate(rotate);

  var path = d3.geo.path()
    .projection(projection);

  var drag = d3.behavior.drag()
    .origin(function() {
      return {
        x: rotate[0],
        y: -rotate[1]
      };
    })
    .on("drag", function() {
      rotate[0] = d3.event.x;
      rotate[1] = -d3.event.y;

      projection.rotate(rotate);
      path = d3.geo.path().projection(projection);
      d3.selectAll("path").attr("d", path);
    });

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(drag);

  d3.json("world.json", function(error, world) {
    if (error) throw error;

    svg.append("path")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);
  });

}
