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
