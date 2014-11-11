Kinects = new Mongo.Collection("kinects");

Schemas.Kinect = new SimpleSchema({
    dx: {
      type: Number,
      min: 0
    },
    dy: {
      type: Number,
      min: 0
    },
    dtheta: {
      type: Number,
      min: 0,
    },
    angle: {
      type: Number,
      min: -180,
      max: 180
    }
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    loudness: {
        type: Number,
        max: 1
    },
    speech: {
      type: boolean
    },
    custom_speech: {
      type: boolean
    },
    silence: {
      type: boolean
    },
    bins: {
      type: [Number]
    }
});

Kinects.attachSchema(Schemas.Kinect);

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
                loudness: Math.random(),
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

    Deps.autorun(function(){
      var query = {_id: {$in: [Session.get("left"), Session.get("right")]}};
      var dataset = Kinects.find(query).fetch();

      //Update scale domains
      xScale.domain([0, d3.max(dataset, function(d) { return d.dx + 2; })]);
      yScale.domain([0, d3.max(dataset, function(d) { return d.dy + 2; })]);

      //Update X axis
      svg.select(".x.axis")
        .transition()
        .duration(1000)
        .call(xAxis);

      //Update Y axis
      svg.select(".y.axis")
        .transition()
        .duration(1000)
        .call(yAxis);


      var lines = svg
        .selectAll("line")
        .data(dataset, key);

      var length = 300;

      //Create
      lines
        .enter()
        .append("line")
        .attr("x1", function(d) {
          return xScale(d.dx);
        })
        .attr("y1", function(d) {
          return yScale(d.dy);
        })
        .attr("x2", function(d) {
          return xScale(d.dx) + length * Math.cos((d.dtheta + Number(d.angle)) * Math.PI / 180.0);
        })
        .attr("y2", function(d) {
          return yScale(d.dy) - length * Math.sin((d.dtheta + Number(d.angle)) * Math.PI / 180.0);
        }).
        attr("stroke", "black");

      //Update
      lines
        .transition()
        .duration(100)
        .attr("x1", function(d) {
          return xScale(d.dx);
        })
        .attr("y1", function(d) {
          return yScale(d.dy);
        })
        .attr("x2", function(d) {
          return xScale(d.dx) + length * Math.cos((d.dtheta + Number(d.angle)) * Math.PI / 180.0);
        })
        .attr("y2", function(d) {
          return yScale(d.dy) - length * Math.sin((d.dtheta + Number(d.angle)) * Math.PI / 180.0);
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

      Kinects.update(
        {name: this.query.name},
        {$set: this.query},
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
