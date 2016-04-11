const d3 = require('d3');
const $ = require('jquery');
const fs = require('fs');
const pa = require('path');
const png = require('save-svg-as-png');

const dialog = require('electron').remote.require('dialog');

let svg;
let data;
let xAxis;
let yAxis;
let area;
let line;

function onInitHist() {

}

function onResizeHist() {
  draw();
}

function onDownload() {
  var data = svg.node().outerHTML;

  dialog.showSaveDialog(
    function(p) {
      if (p === undefined) return;
      var parsed = pa.parse(p);
      fs.writeFileSync(pa.join(parsed.dir, parsed.name + ".svg"), data);
      png.svgAsPngUri(document.getElementById("hist"), {
        scale: 2
      }, function(uri) {
        var buffer = new Buffer(uri.split(",")[1], 'base64');
        fs.writeFileSync(pa.join(parsed.dir, parsed.name + ".png"), buffer);
      });
    });
}

function draw() {
  d3.select("#hist").remove();

  let margin = {
    top: 20,
    right: 60,
    bottom: 30,
    left: 20
  }

  svg = d3.select("#histBox").append("svg")
    .attr("id", "hist")
    .attr("width", "100%")
    .attr("height", "100%")

  svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "white");

  svg = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let width = $("#hist").width() - margin.left - margin.right;
  let height = $("#hist").height() - margin.top - margin.bottom;

  let x = d3.scale.linear()
    .domain([0, d3.max(data, function(d) {
      return d[0];
    })])
    .range([0, width]);

  let y = d3.scale.log()
    .range([height, 0]);

  xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height, 0)
    .tickPadding(6);

  yAxis = d3.svg.axis()
    .scale(y)
    .orient("right")
    .tickSize(-width)
    .tickPadding(6);

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

  let gradient = svg.append("defs").append("linearGradient")
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

  svg.append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)");

  svg.append("path")
    .attr("class", "area")
    .attr("clip-path", "url(#clip)")
    .style("fill", "url(#gradient)");

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");

  svg.append("path")
    .attr("class", "line")
    .attr("clip-path", "url(#clip)");

  svg.append("rect")
    .attr("class", "pane")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  zoom.x(x);

  svg.select("path.area").data([data]);
  svg.select("path.line").data([data]);
  zoomed();
}

function onOpenHist() {
  let dsv = d3.dsv(" ", "text/plain");

  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      d3.text(fileNames[0], function(text) {
        data = dsv.parseRows(text, function(d) {
          return d.map(Number);
        });
        draw();
      });
    });
}

function zoomed() {
  svg.select("g.x.axis").call(xAxis);
  svg.select("g.y.axis").call(yAxis);
  svg.select("path.area").attr("d", area);
  svg.select("path.line").attr("d", line);
}
