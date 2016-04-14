"use strict";

const d3 = require("d3");
const fs = require("fs");
const pa = require("path");
const topojson = require("topojson");
const png = require("save-svg-as-png");
const jQuery = require("jquery");

const dialog = require("electron").remote.require("dialog");
const addon = require("../build/Release/module.node");

require("d3-geo-projection")(d3);
require("d3-tip")(d3);
require("bootstrap");

//-----------------------------------------------------------------------------

let g;
let svg;
let file;
let projection;

let nform = true;
let rform = true;
let scale = 330;
let rotate = [0, 0];

let color = d3.scale.log()
  .range(["blue", "green", "yellow", "red"])
  .domain([1, 3, 5, 7]);

let tip = d3.tip()
  .attr("class", "d3-tip")
  .offset([-10, 0])
  .html(function(d) {
    let str = "<strong>Value: </strong><span style='color:" + color(d.point[2]) + "'>" + d.point[2] + "</span><br>";
    str += "<strong>Type: </strong><span style='color:white'>" + type(d.point[3]) + "</span>";
    return str;
  })

let drag = d3.behavior.drag()
  .origin(function() {
    return {
      x: rotate[0],
      y: -rotate[1]
    };
  })
  .on("drag", dragged);

let zoom = d3.behavior.zoom()
  .scale(330)
  .scaleExtent([100, 10000])
  .on("zoom", zoomed);

//-----------------------------------------------------------------------------

function type(t) {
  if (!t) return "N/A";
  if (t == 0) return "original";
  if (t == 1) return "computed";
  if (t == 2) return "corrected";
}

function dragged() {
  rotate[0] = d3.event.x;
  rotate[1] = -d3.event.y;
  drawMap();
}

function zoomed() {
  if (d3.event.sourceEvent.type == "wheel") {
    scale = d3.event.scale;
    drawMap();
  }
}

function clearVoronoi() {
  d3.selectAll(".voronoi").remove();
  jQuery(".d3-tip").css("opacity", "0");
}

function drawMap() {
  clearVoronoi();

  let width = jQuery("#map").width();
  let height = jQuery("#map").height();

  projection.translate([width / 2, height / 2])
    .scale(scale)
    .rotate(rotate);

  let path = d3.geo.path().projection(projection);
  d3.selectAll("path")
    .attr("stroke", "#000")
    .attr("stroke-width", "1px")
    .attr("d", path);
}

function openFile() {
  let opts = {
    neighbours: jQuery("#neighbours").val(),
    normalize: jQuery("#ratio").val(),
    type: jQuery("#type").val()
  };
  if (file) {
    return addon.process(file, opts);
  }
}

function generateVoronoi(data) {
  let voronoi = d3.geom.voronoi().clipExtent([
    [-180, -90],
    [180, 90]
  ]);
  return voronoi(data);
}

function drawVoronoi(data) {
  clearVoronoi();

  let path = d3.geo.path().projection(projection);
  d3.selectAll("path")
    .attr("stroke", "#fff")
    .attr("stroke-width", "2px")
    .attr("d", path);

  g.selectAll(".voronoi")
    .data(data)
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
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);
}

function validate() {
  if (nform && rform && file) {
    jQuery("#generate").prop("disabled", false);
  } else {
    jQuery("#generate").prop("disabled", true);
  }
}

function validationListeners() {
  jQuery("#neighbours").on("input", function() {
    let val = parseInt(jQuery(this).val());
    if (jQuery.isNumeric(jQuery(this).val()) && val % 1 == 0 && val >= 0) {
      jQuery("#nform").removeClass("has-error");
      nform = true;
    } else {
      jQuery("#nform").addClass("has-error");
      nform = false;
    }
    validate();
  });

  jQuery("#ratio").on("input", function() {
    let val = parseFloat(jQuery(this).val());
    if (jQuery.isNumeric(jQuery(this).val()) && (val >= 1 || val == 0)) {
      jQuery("#rform").removeClass("has-error");
      rform = true;
    } else {
      jQuery("#rform").addClass("has-error");
      rform = false;
    }
    validate();
  });
}

//-----------------------------------------------------------------------------

function onLoad() {
  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      file = fileNames[0];
      validate();
    });
}

function onResize() {
  drawMap();
}

function onAbout() {
  dialog.showMessageBox({
    type: "none",
    buttons: ["Close"],
    message: "SatGraph v" + process.env.npm_package_version +
      "\n\nOndřej Bílek\nbilekon1@fit.cvut.cz\ngithub.com/OndrejBilek/satgraph"
  });
}

function onGenerate() {
  let data = openFile();
  let voronoi = generateVoronoi(data);
  drawVoronoi(voronoi);
}

function onDownloadPNG() {
  dialog.showSaveDialog({
      filters: [{
        name: "*.png",
        extensions: ["png"]
      }]
    },
    function(file) {
      if (file === undefined) return;
      png.svgAsPngUri(document.getElementById("map"), {
        scale: 2
      }, function(uri) {
        let buffer = new Buffer(uri.split(",")[1], "base64");
        fs.writeFile(file, buffer);
      });
    });
}

function onDownloadSVG() {
  let data = svg.node().outerHTML;

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

function onProjection(value) {
  switch (value) {
    case "equirectangular":
      projection = d3.geo.equirectangular().precision(.1);
      break;
    case "orthographic":
      projection = d3.geo.orthographic().clipAngle(90).precision(.1);
      break;
    case "mollweide":
      projection = d3.geo.mollweide().precision(.1);
      break;
    case "mercator":
      projection = d3.geo.mercator().precision(.1);
      break;
  }
  drawMap();
}

function onInit() {
  validationListeners();
  jQuery("#generate").prop("disabled", true);

  svg = d3.select("#mapBox").append("svg")
    .attr("id", "map")
    .attr("class", "frow content")
    .attr("width", "100%")
    .attr("height", "100%")
    .call(drag)
    .call(zoom)
    .call(tip);

  svg.append("rect")
    .attr("height", "100%")
    .attr("width", "100%")
    .attr("fill", "white");

  g = svg.append("g");

  d3.json("../data/world.json", function(error, data) {
    if (error) throw error;

    projection = d3.geo.equirectangular()
      .precision(.1);
    let path = d3.geo.path().projection(projection);

    svg.append("g").append("path")
      .datum(topojson.feature(data, data.objects.land))
      .attr("fill-opacity", "0.0")
      .attr("stroke", "#000")
      .attr("stroke-width", "1px")
      .attr("pointer-events", "none")
      .attr("d", path);
    drawMap();
  });

}
