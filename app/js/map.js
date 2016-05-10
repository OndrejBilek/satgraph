"use strict";

const d3 = require("d3");
const fs = require("fs");
const pa = require("path");
const topojson = require("topojson");
const png = require("save-svg-as-png");
const jQuery = require("jquery");

const addon = require("../build/Release/module.node");

require("../js/common.js");
require("d3-geo-projection")(d3);
require("d3-tip")(d3);
require("bootstrap");
require('d3-svg-legend');


//-----------------------------------------------------------------------------


let svg;
let g1;
let g2;
let g3;
let leg1;
let leg2;
let mag;

let file1;
let file2;

let projection;

let nform = true;
let sform = true;
let dform = true;
let scale = 330;
let rotate = [0, 0];

let color = d3.scale.linear()
  .range(["cyan", "green", "yellow", "red", "purple"])
  .domain([1, 3, 5, 7, 9]);

let log = d3.scale.log();

let size = d3.scale.linear()
  .domain([1, 1000])
  .range([1, 5]);

let legsize = d3.scale.linear()
  .domain([0, 1])
  .range([1, 5]);

let legend1 = d3.legend.color()
  .shapeWidth(30)
  .orient('horizontal')
  .scale(color)
  .title("Dose rate [log nGy/h]")
  .cells([1, 2, 3, 4, 5, 6, 7, 8, 9])
  .labelFormat(d3.format("E>2"));

let legend2 = d3.legend.size()
  .scale(legsize)
  .shape('circle')
  .shapePadding(25)
  .labelOffset(20)
  .title("Ratio")
  .cells([0.2, 0.4, 0.6, 0.8, 1])
  .labelFormat(d3.format("%"))
  .orient('horizontal');

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
  if (t == null) return "N/A";
  if (t == 0) return "original";
  if (t == 1) return "imputed";
  if (t == 2) return "cleaned";
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
  d3.selectAll(".params").remove();
  d3.selectAll(".legend").remove();
  d3.selectAll(".isoband").remove();
  d3.select("#g3").selectAll("*").remove();
  d3.select("#leg1").selectAll("*").remove();
  d3.select("#leg2").selectAll("*").remove();
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
  mag.attr("fill-opacity", "1");
  d3.selectAll("path")
    .attr("stroke", "black")
    .attr("stroke-width", "1px")
    .attr("d", path);
}

function openFileMap() {
  let opts = {
    neighbours: jQuery("#neighbours").val(),
    smooth: jQuery("#smooth").val(),
    diff: jQuery("#diff").val(),
    binning: jQuery("#binning").val()
  };
  if (file1) {
    return addon.process(file1, opts);
  } else {
    return false;
  }
}

function openFileParams() {
  let opts = {
    neighbours: 0,
    smooth: 0,
    diff: 0,
    binning: jQuery("#binning").val()
  };
  if (file2) {
    return addon.process(file2, opts);
  } else {
    return false;
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

  g1.selectAll(".voronoi")
    .data(data)
    .enter().append("svg:path")
    .attr("stroke-width", "1")
    .attr("class", "voronoi")
    .attr("d", function(d) {
      d = d.map(projection);
      return "M" + d.join("L") + "Z";
    })
    .attr("fill", function(d) {
      if (d.point[2] == 0 || d.point[2] == -1) {
        return "black"
      } else {
        return color(d.point[2]);
      }
    })
    .attr("stroke", function(d) {
      if (d.point[2] == 0 || d.point[2] == -1) {
        return "black"
      } else {
        return color(d.point[2]);
      }
    })
    .attr("visibility", function(d) {
      d = d.map(projection);
      if (d3.geom.polygon(d).area() > 100)
        return "hidden";
      return "visible";
    })
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);

  mag.attr("fill-opacity", "0.0");

  g3.append("rect")
    .attr("width", "297px")
    .attr("height", "80px")
    .attr("fill", "white")
    .attr("class", "legend")
    .attr("transform", "translate(15,5)");

  leg1.attr("transform", "translate(20,20)")
    .call(legend1);

}

function generateBands(data) {
  let matrix = new Array(180);
  let a = 0;
  let b = 0;

  matrix[0] = new Array(360);

  for (let i = 0; i < data.length; i++) {
    matrix[a][b++] = data[i][2];

    if (b == 360 && a != 179) {
      a++;
      b = 0;
      matrix[a] = new Array(360);
    }
  }

  for (let i = 0; i < 10; i++) {
    let band = MarchingSquaresJS.IsoBands(matrix, i, i + 1);
    drawBand(band, i);
  }
}

function drawBand(band, idx) {
  g2.selectAll(".isoband")
    .data(band)
    .enter().append("svg:path")
    .attr("stroke-width", "1px")
    .attr("stroke", "black")
    .attr("fill", "none")
    .attr("class", "isoband" + idx)
    .attr("d", function(d) {
      for (var i = 0; i < d.length; i++) {
        d[i][0] -= 180;
        d[i][1] -= 90;
      }
      d = d3.geom.polygon(d);
      d.clip([
        [-180, -90],
        [180, 90]
      ]);
      d = d.map(projection);
      return "M" + d.join("L") + "Z";
    })
}

function drawParams(data) {
  g2.selectAll(".params")
    .data(data)
    .enter().append("svg:circle")
    .attr("class", "params")
    .attr("cx", function(d) {
      return projection([d[0], d[1]])[0];
    })
    .attr("cy", function(d) {
      return projection([d[0], d[1]])[1];
    })
    .attr("r", function(d) {
      if (d[2] == -1) {
        return "1px";
      } else if (d[2] == -2) {
        return "0px";
      } else {
        let val = size(log.invert(d[2]));
        return val + "px";
      }
    })
    .attr("fill", function(d) {
      if (d[2] == -1) {
        return "black";
      } else {
        return "none";
      }
    })
    .attr("stroke", "black");

  mag.attr("fill-opacity", "0.0");

  g3.append("rect")
    .attr("width", "170px")
    .attr("height", "80px")
    .attr("fill", "white")
    .attr("class", "legend")
    .attr("transform", "translate(15,90)");

  leg2.attr("transform", "translate(20,110)")
    .call(legend2);
}

function validate() {
  if (nform && sform && dform && (file1 || file2)) {
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

  jQuery("#smooth").on("input", function() {
    let val = parseFloat(jQuery(this).val());
    if (jQuery.isNumeric(jQuery(this).val()) && (val >= 0)) {
      jQuery("#sform").removeClass("has-error");
      sform = true;
    } else {
      jQuery("#sform").addClass("has-error");
      sform = false;
    }
    validate();
  });

  jQuery("#diff").on("input", function() {
    let val = parseFloat(jQuery(this).val());
    if (jQuery.isNumeric(jQuery(this).val()) && (val >= 0)) {
      jQuery("#dform").removeClass("has-error");
      dform = true;
    } else {
      jQuery("#dform").addClass("has-error");
      dform = false;
    }
    validate();
  });
}

//-----------------------------------------------------------------------------

function onLoad() {
  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      file1 = fileNames[0];
      validate();
    });
}

function onParams() {
  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      file2 = fileNames[0];
      validate();
    });
}

function onParamsOld() {
  let dsv = d3.dsv(" ", "text/plain");

  dialog.showOpenDialog(
    function(fileNames) {
      if (fileNames === undefined) return;
      d3.text(fileNames[0], function(text) {
        params = dsv.parseRows(text, function(d) {
          return d.map(Number);
        });
        validate();
      });
    });
}

function onResize() {
  drawMap();
}

function onGenerate() {
  let map = openFileMap();
  let params = openFileParams();

  if (map) {
    drawVoronoi(generateVoronoi(map));
    if (jQuery("#contour").val() == "yes") {
      generateBands(map)
    }
  }
  if (params) {
    drawParams(params);
  }
}

function onDownloadPNG() {
  downloadPNG("map");
}

function onDownloadSVG() {
  downloadSVG("map");
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

  svg = d3.select("#box").append("svg")
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

  g1 = svg.append("g").attr("id", "g1");
  mag = svg.append("g").attr("id", "mag");
  g2 = svg.append("g").attr("id", "g2");
  g3 = svg.append("g").attr("id", "g3");
  leg1 = svg.append("g").attr("id", "leg1");
  leg2 = svg.append("g").attr("id", "leg2");

  d3.json("../data/world.json", function(error, data) {
    if (error) throw error;

    projection = d3.geo.equirectangular()
      .precision(.1);
    let path = d3.geo.path().projection(projection);
    let graticule = d3.geo.graticule().step([20, 20]);

    mag.append("path")
      .datum(topojson.feature(data, data.objects.land))
      .attr("stroke", "black")
      .attr("fill", "black")
      .attr("stroke-width", "1px")
      .attr("pointer-events", "none")
      .attr("d", path);

    mag.attr("fill-opacity", "1");

    mag.append("path")
      .datum(graticule)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("d", path);

    mag.append("path")
      .datum(graticule.outline)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", "2px")
      .attr("d", path);

    drawMap();
  });
}
