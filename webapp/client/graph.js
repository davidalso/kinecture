Template.graph.rendered = function(){
  //Width and height
  var w = 500;
  var h = 300;
  var padding = 30;

  //Create scale functions
  var xScale = d3.scale.linear()
             .range([padding, w - padding * 2]);

  var yScale = d3.scale.linear()
             .range([h - padding, padding]);

  //Define X axis
  var xAxis = d3.svg.axis()
          .scale(xScale)
          .orient("bottom")
          .ticks(5);

  //Define Y axis
  var yAxis = d3.svg.axis()
          .scale(yScale)
          .orient("left")
          .ticks(5);

  //Create SVG element
  var svg = d3.select("#graph")
        .attr("width", w)
        .attr("height", h);

  //Define key function, to be used when binding data
  var key = function(d) {
    return d._id;
  };

  //Create X axis
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (h - padding) + ")");

  //Create Y axis
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + padding + ",0)");

  svg.append("circle");

  //This is the accessor function we talked about above
  var lineFunction = d3.svg.line()
                           .x(function(d) { return xScale(d.x); })
                           .y(function(d) { return yScale(d.y); })
                           .interpolate("linear");
  var closedLineFunction = function(d) { return lineFunction(d) + "Z"; };

  Deps.autorun(function(){
    var defaultRoom = getDefaultRoom();
    if (defaultRoom == null) {
      return;
    } else
      console.log("yes default room");

    defaultLeftRight();

    var roomLength = defaultRoom.length;
    var roomWidth = defaultRoom.width;

    // w += 50;
    h = roomLength * w / roomWidth;
    xScale.range([padding, w - padding * 2]);
    yScale.range([h - padding, padding]);
    svg.attr("width", w)
        .attr("height", h);

    svg.select(".x.axis")
      .attr("transform", "translate(0," + (h - padding) + ")");

    //Update Y axis
    svg.select(".y.axis")
      .attr("transform", "translate(" + padding + ",0)");

    var query = {_id: {$in: [Session.get("left"), Session.get("right")]}};
    var dataset = Kinects.find(query).fetch();

    // Make sure the cones are long enough to extend past the graph
    var length = Math.round(1 + Math.sqrt(Math.pow(roomWidth,2) + Math.pow(roomLength,2)));
    _.each(dataset, function(element) {
      var getX = function(offsetAngle) {
        return element.x + length * Math.cos((element.dtheta + Number(element.angle) + offsetAngle) * Math.PI / 180.0);
      }

      var getY = function(offsetAngle) {
        return element.y + length * Math.sin((element.dtheta + Number(element.angle) + offsetAngle) * Math.PI / 180.0);
      }

      if (element._id == Session.get("left")) {
        element.x = element.dx;
        element.y = roomLength - element.dy;
      } else {
        element.x = roomWidth - element.dx;
        element.y = roomLength - element.dy;
      }

      element.x2 = getX(0);
      element.y2 = getY(0);

      var confidenceAngle = Math.max(1, 45 * (1 - element.confidence));

      element.x2l = getX(-confidenceAngle);
      element.y2l = getY(-confidenceAngle);
      element.x2r = getX(confidenceAngle);
      element.y2r = getY(confidenceAngle);
    });

    //Update scale domains
    xScale.domain([0, roomWidth]);
    yScale.domain([0, roomLength]);

    //Update X axis
    svg.select(".x.axis")
      .transition()
      .duration(100)
      .call(xAxis);

    //Update Y axis
    svg.select(".y.axis")
      .transition()
      .duration(100)
      .call(yAxis);

    var cx, cy;
    if (dataset.length >= 2) {
      var e1 = dataset[0];
      var e2 = dataset[1];

      var loudness = (e1.loudness + e2.loudness)/2;
      var loudness_scaled = Math.min(loudness * 500.0, 1.0); // usually loudness <= 0.1
      var r = loudness_scaled * 20.0 + 5.0;

      var intersect = lineIntersection(e1.x, e1.y, e1.x2, e1.y2, e2.x, e2.y, e2.x2, e2.y2);
      Session.set("intersection", intersect);
      if (intersect) {
        svg.select("circle")
          .attr("cx", function() {
            return xScale(intersect.x);
          })
          .attr("cy", function() {
            return yScale(intersect.y);
          })
          .style("visibility", "visible")
          .attr("r", r);
      } else {
        svg.select("circle").style("visibility", "hidden");
      }
    } else {
      svg.select("circle").style("visibility", "hidden");
      Session.set("intersection", false);
    }

    var lineFunction = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .interpolate("linear");

    var lines = svg
      .selectAll("path.cone")
      .data(dataset, key);

    //Create
    lines
      .enter()
      .append("path")
      .attr("class", "cone")
      .attr("fill", "rgba(0,0,255,0.5)")
      .attr("d", function(d) {
        return closedLineFunction([{x: d.x, y: d.y}, {x: d.x2l, y: d.y2l}, {x: d.x2r, y: d.y2r}]);
      });

    //Update
    lines
      .transition()
      .duration(100)
      .attr("d", function(d) {
        return closedLineFunction([{x: d.x, y: d.y}, {x: d.x2l, y: d.y2l}, {x: d.x2r, y: d.y2r}]);
      });
      // .attr("stroke", function(d) {
      //   return d.speech ? "rgba(255,0,0,0.5)" : "rgba(0,0,0,0.5)";
      // });

    //Remove
    lines
      .exit()
      .remove();
    });

};
