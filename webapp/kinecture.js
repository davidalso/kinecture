Kinects = new Mongo.Collection("kinects");

var Schemas = {};


Schemas.Kinect = new SimpleSchema({
    name: {
      type: String,
      min: 0,
      unique: false
    },
    dx: {
      type: Number,
      min: 0,
      decimal: true,
      defaultValue: 0,
      optional: true
    },
    dy: {
      type: Number,
      min: 0,
      decimal: true,
      defaultValue: 0,
      optional: true
    },
    dtheta: {
      type: Number,
      min: 0,
      decimal: true,
      defaultValue: 12,
      optional: true
    },
    angle: {
      type: Number,
      min: -180,
      max: 180,
      decimal: true
    },
    confidence: {
      type: Number,
      min: 0.0,
      max: 1.0,
      decimal: true
    },
    loudness: {
        type: Number,
        max: 1,
        decimal: true
    },
    speech: {
      type: Boolean
    },
    custom_speech: {
      type: Boolean
    },
    silence: {
      type: Boolean
    },
    bins: {
      type: [Number],
      decimal: true
    }
});

Kinects.attachSchema(Schemas.Kinect);

function lineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
  // http://jsfiddle.net/justin_c_rounds/Gd2S2/light/
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
  var denominator, a, b, numerator1, numerator2, result = {
      x: null,
      y: null
  };
  denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
  if (denominator == 0) {
      return false;
  }
  a = line1StartY - line2StartY;
  b = line1StartX - line2StartX;
  numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
  numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = line1StartX + (a * (line1EndX - line1StartX));
  result.y = line1StartY + (a * (line1EndY - line1StartY));

  return result;
};

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    kinects: function() {
      return Kinects.find({});
    }
  });

  Template.kinect.helpers({
    left: function() {
      return Session.get("left") == this._id;
    },
    right: function() {
      return Session.get("right") == this._id;
    },
    fixed: function(v) {
      return v.toFixed(2);
    },
    bins_fixed: function() {
      return _.map(this.bins, function(num) { return num.toFixed(2);});
    }
  });

  Template.kinect.events({
    "click .setleft": function() {
      Session.set("left", this._id);
    },

    "click .setright": function() {
      Session.set("right", this._id);
    },

    "change .dx": function() {
      Kinects.update(this._id, {$set: {dx: event.target.valueAsNumber}});
    },
    "change .dy": function() {
      Kinects.update(this._id, {$set: {dy: event.target.valueAsNumber}});
    },
    "change .dtheta": function() {
      Kinects.update(this._id, {$set: {dtheta: event.target.valueAsNumber}});
    }
  });

  Session.set("roomWidth", 10);
  Session.set("roomLength", 10);
  sessionBind(Template.body);

  Template.body.events({
    "click #deleteEverything": function() {
      Meteor.call("deleteEverything");
    },

    "click #randomize": function() {
      var cursor = Kinects.find({});
      if (!cursor.count()) return;

      cursor.forEach(function (row) {
          var silence = Math.random() < 0.5;
          Kinects.update(
            row._id,
            {"$set":
              {
                angle: Math.random() * 100.0 - 50.0,
                timestamp: new Date(),
                confidence: Math.random(),
                loudness: Math.random() / 10,
                speech: !silence && Math.random() < 0.5,
                custom_speech: !silence && Math.random() < 0.5,
                silence: silence,
                bins: [1,2,3,4]
              }
            }
          );
      });
    }
  });

  Template.scatterPlot.rendered = function(){
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
    var svg = d3.select("#scatterPlot")
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

    Deps.autorun(function(){
      var query = {_id: {$in: [Session.get("left"), Session.get("right")]}};
      var dataset = Kinects.find(query).fetch();

      var length = Math.round(1 + Math.sqrt(Math.pow(Session.get("roomWidth"),2) + Math.pow(Session.get("roomLength"),2)));
      _.each(dataset, function(element) {
        if (element._id == Session.get("left")) {
          element.x = element.dx;
          element.y = Session.get("roomLength") - element.dy;
        } else {
          element.x = Session.get("roomWidth") - element.dx;
          element.y = Session.get("roomLength") - element.dy;
        }

        element.x2 = element.x + length * Math.cos((element.dtheta + Number(element.angle)) * Math.PI / 180.0);
        element.y2 = element.y + length * Math.sin((element.dtheta + Number(element.angle)) * Math.PI / 180.0);
      });

      //Update scale domains
      xScale.domain([0, Session.get("roomWidth")]);
      yScale.domain([0, Session.get("roomLength")]);

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
        if (intersect) {
          svg.select("circle")
            .attr("cx", function() {
              return xScale(intersect.x);
            })
            .attr("cy", function() {
              return yScale(intersect.y);
            })
            .attr("r", r);
        }
      }

      var lines = svg
        .selectAll("line")
        .data(dataset, key);

      //Create
      lines
        .enter()
        .append("line")
        .attr("x1", function(d) {
          return xScale(d.x);
        })
        .attr("y1", function(d) {
          return yScale(d.y);
        })
        .attr("x2", function(d) {
          return xScale(d.x2);
        })
        .attr("y2", function(d) {
          return yScale(d.y2);
        })
        .attr("stroke", "black");

      //Update
      lines
        .transition()
        .duration(100)
        .attr("x1", function(d) {
          return xScale(d.x);
        })
        .attr("y1", function(d) {
          return yScale(d.y);
        })
        .attr("x2", function(d) {
          return xScale(d.x2);
        })
        .attr("y2", function(d) {
          return yScale(d.y2);
        })
        .attr("stroke-width", function(d) {
          return Math.min(5, Math.round(1 + d.loudness * 5.0 * 500.0));
        })
        .attr("stroke", function(d) {
          return d.speech ? "red" : "black";
        });

      //Remove
      lines
        .exit()
        .remove();
      });

  };
}

if (Meteor.isServer) {
  HTTP.methods({
    '/kinect': function() {
      var stuff = this.query;

      stuff = _.object(_.map(stuff, function (val, key) {
          return [key, JSON.parse(val)];
      }));

      Kinects.update(
        {name: stuff.name},
        {$set: stuff},
        {upsert: true}
      );

      return "YOU GOT DA PAGE";
    }
  });

  Meteor.methods({
    deleteEverything: function() {
      Kinects.remove({});
    }
  });
}
