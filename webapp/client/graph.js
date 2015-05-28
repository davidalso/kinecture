  var ta = new Date();
  var tb = new Date();

  var delay = 0;
  var delayTotal = 0;
  var delayAbsTot = 0;
  var delayCount = 0;

  var waittime = 3000;
  var silencesupport = 0;
  var noisesupport = 0;
  var notifysupport = 0;
  var minsupport = 2;
  var lastSilence = new Date();

  var lerpTime = 2000;

  // timestate 0 <- idle
  // timestate 1 <- double_silence
  // timestate 2 <- noted
  var timestate = 0;

function lerp(from, to, by) {
  return form + (to - from) * by;
}

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

      ta = tb;
      tb = new Date();
      delay = tb.getTime() - ta.getTime();
      
      delayTotal += delay;
      delayCount +=1;
      var delavg = delayTotal / delayCount;

      Session.set("delayframe", delay);
      Session.set("delayaverage", delavg);
    
      var tdiff = 0;

     if(e1.silence && e2.silence){
        switch(timestate){
          // idle so track support until we start the clock
          case 0:
            silencesupport += 1;
            if (silencesupport > minsupport) {
              lastSilence = new Date();
              noisesupport = 0;
              notifysupport = 0;
              timestate = 1;
            }
          break;

          //
          case 1:
            var now = new Date()
            tdiff = Math.abs(now.getTime() - lastSilence.getTime());
            
            if (tdiff > waittime) {
              notifysupport += 1
            }
            if(notifysupport > minsupport){
              Session.set("notificationColor","hsl(120,85%,40%)");
              Session.set("notificationColor2","hsl(120,20%,40%");
              if(navigator && navigator.vibrate) {
                navigator.vibrate(500);
              }
              timestate = 2;
            }
          break;

          case 2:
            //don't care
          break;
        }
      }
      else {
        switch(timestate) {
          case 0:
            //don't care
          break;

          case 1:
            //go to ts 0
            noisesupport +=1;
            if(noisesupport > minsupport) {
              timestate = 0;
              silencesupport = 0;
              Session.set("notificationColor","hsl(250,85%,50%)");
              Session.set("notificationColor2","hsl(250,20%,50%)");

            }
          break;
          
          case 2:
            //go to ts 0
            noisesupport +=1;
            if(noisesupport > minsupport) {
              timestate = 0;
              silencesupport = 0;
              Session.set("notificationColor","hsl(250,85%,50%)");
              Session.set("notificationColor2","hsl(250,20%,50%)");
            }
          break;
        }
      }
      
      Session.set("notestate",{"timestate":timestate,"silencesupport":silencesupport,"noisesupport":noisesupport,"notifysupport":notifysupport,"tdiff":tdiff})

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
