lineIntersection = function(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
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

  if (a < 0 || b < 0)
    return false;

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = line1StartX + (a * (line1EndX - line1StartX));
  result.y = line1StartY + (a * (line1EndY - line1StartY));

  return result;
};

Template.body.helpers({
  kinects: function() {
    return Kinects.find({});
  },
  intersection: function() {
    return JSON.stringify(Session.get("intersection"));
  },
  notestate: function() {
    return JSON.stringify(Session.get("notestate"));
  },
  delayframe:function() {
    return Session.get("delayframe");
  },
  delayaverage:function() {
    return Session.get("delayaverage");
  },
  absdelay:function() {
    return Session.get("absdelay");
  },
  showAdminPanel: function() {
    return Session.get("showAdminPanel");
  },
  notificationColor:function() {
    return Session.get("notificationColor");
  },
  noteIconTA:function() {
    return Session.get("noteIconTA");
  },
  noteIconStudent:function() {
    return Session.get("noteIconStudent");
  },
  noteIconSilent:function() {
    return Session.get("noteIconSilent");
  },
  silentAnim:function() {
    return "";
    //return Session.get("silentAnim");
  },
  silentStyle:function() {
    return "opacity:1.0";
    //return Session.get("silentStyle");
  },
  studentAnim:function() {
    if ((Session.get("lastState") == 3 && Session.get("currState") == 4) ||
      (Session.get("lastState") == 4 && Session.get("currState") == 1)){
      return "icon-anim";
    }
    else {
      return "";
    }
    //return Session.get("studentAnim");
  },
  studentStyle:function() {
    switch(Session.get("currState")) {
      case 0:
        return "opacity:0;";
      case 3:
        return "opacity:1.0;"
      default:
        return "opacity:0;";
    }
    //return Session.get("studentStyle");
  },
  taAnim:function() {
    if ((Session.get("lastState") == 0 && Session.get("currState") == 4) ||
      (Session.get("lastState") == 4 && Session.get("currState") == 1)){
      return "icon-anim";
    }
    else {
      return "";
    }
    //return Session.get("taAnim");
  },
  taStyle:function() {
    switch(Session.get("currState")) {
      case 3:
        return "opacity:0;";
      case 0:
        return "opacity:1.0;"
      default:
        return "opacity:0;";
    }
    //return Session.get("taStyle");
  }
});


  /*var States = {
    TEACHER: 0,
    CADENCE: 4,
    WT1: 1,
    NOTIFIED: 2,
    STUDENT: 3
  };*/

Template.body.events({
  "click #showAdminPanel": function() {
    Session.set("showAdminPanel", true);
  },
  "click #hideAdminPanel": function() {
    Session.set("showAdminPanel", false);
  }
})
