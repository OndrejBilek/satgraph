"use strict";

const d3 = require("d3");
const fs = require("fs");
const pa = require("path");
const png = require("save-svg-as-png");
const jQuery = require("jquery");

require("bootstrap");
require("../js/common.js");

let svg;
let data;
let xAxis;
let yAxis;
let area;
let line;

//-----------------------------------------------------------------------------

function embeddCssToSvg(path, svg, cb) {
  fs.readFile(path, "utf-8", function(err, data) {
    if (err) throw err;
    svg.append("defs").append("style")
      .attr("type", "text/css")
      .text(data);
    cb();
  });
}

function correct() {
  data.sort(function(a, b) {
    return a[0] - b[0];
  });
  data = data.filter(function(item, pos, ary) {
    return !pos || item[0] != ary[pos - 1][0];
  })
}

function zoomed() {
  svg.select("g.x.axis").call(xAxis);
  svg.select("g.y.axis").call(yAxis);
  svg.select("path.area").attr("d", area);
  svg.select("path.line").attr("d", line);
}

function draw() {

  let margin = {
    top: 20,
    right: 120,
    bottom: 100,
    left: 20
  }

  let g = svg.append("g")
    .attr("id", "main")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let width = jQuery("#hist").width() - margin.left - margin.right;
  let height = jQuery("#hist").height() - margin.top - margin.bottom;

  let x = d3.scale.linear()
    .domain([0, d3.max(data, function(d) {
      return d[0];
    })])
    .range([0, width]);

  let y = d3.scale.linear()
    .range([height, 0])
    .domain([0, 8]);

  xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height, 0)
    .tickPadding(6);

  yAxis = d3.svg.axis()
    .scale(y)
    .orient("right")
    .tickSize(-width)
    .tickPadding(6)
    .tickFormat(d3.format("E>2"));

  area = d3.svg.area()
    .interpolate("step-after")
    .x(function(d) {
      return x(d[0]);
    })
    .y0(height)
    .y1(function(d) {
      return y(d[1]);
    });

  line = d3.svg.line()
    .interpolate("step-after")
    .x(function(d) {
      return x(d[0]);
    })
    .y(function(d) {
      return y(d[1]);
    });

  let zoom = d3.behavior.zoom()
    .on("zoom", zoomed);

  let gradient = g.append("defs").append("linearGradient")
    .attr("id", "gradient")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#fff")
    .attr("stop-opacity", .5);

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#999")
    .attr("stop-opacity", 1);

  g.append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);

  g.append("g")
    .attr("font-size", "25")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)");

  g.append("path")
    .attr("class", "area")
    .attr("clip-path", "url(#clip)")
    .style("fill", "url(#gradient)");

  g.append("g")
    .attr("font-size", "25")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");

  g.append("path")
    .attr("class", "line")
    .attr("clip-path", "url(#clip)");

  g.append("rect")
    .attr("class", "pane")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("font-size", "40")
    .attr("transform", "translate(" + (width + 80) + "," + (height / 2) + ")rotate(-90)")
    .text("Count rate [log #/min/cm2]");

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("font-size", "40")
    .attr("transform", "translate(" + (width / 2) + "," + (height + 70) + ")")
    .text("Time [days]");

  zoom.x(x);

  g.select("path.area").data([data]);
  g.select("path.line").data([data]);

  zoomed();
}

//-----------------------------------------------------------------------------

function onLoad() {
  let dsv = d3.dsv(" ", "text/plain");

  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      d3.text(fileNames[0], function(text) {
        data = dsv.parseRows(text, function(d) {
          return d.map(Number);
        });
        correct();
        draw();
      });
    });
}

function onResize() {
  if (data) {
    d3.select("#main").remove();
    draw();
  }
}

function onDownloadPNG() {
  downloadPNG("hist");
}

function onDownloadSVG() {
  downloadSVG("hist");
}

function onInit() {
  svg = d3.select("#box").append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("height", "100%")
    .attr("width", "100%")
    .attr("version", "1.1")
    .attr("id", "hist");

  embeddCssToSvg(pa.join(__dirname, "..", "css/hist.css"), svg, function() {
    svg.append("rect")
      .attr("height", "100%")
      .attr("width", "100%")
      .attr("fill", "white");
  });
}
