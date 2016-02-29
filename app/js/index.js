'use strict';

var map = require('./js/map');
var d3 = require('d3');
var topojson = require('topojson');
var map;
var svg;

var color = d3.scale.log()
  .range(["blue", "red"]);

var width = 1200,
  height = 800,
  rotate = [0, 0],
  visible = true;

function toggle() {
  if(visible){
    d3.selectAll(".point").remove();
    visible = false;
  } else {
    draw();
    visible = true;
  }
}

function draw(){
  map.forEach(function(d) {
    svg.append("path")
      .datum({
        type: "Point",
        coordinates: [d.lon, d.lat]
      })
      .attr("class", "point")
      .attr("fill", color(d.val));

  });
}

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

  svg = d3.select("body").append("svg")
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

  d3.csv("map.csv", function(error, m) {
    if (error) throw error;
    map = m;
    draw();
  });

}
