Session.set("condition",false);
Session.set("sessionID",false);
Session.set("recording",false);
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

var States = {
  TEACHER: 0,
  CADENCE: 4,
  WT1: 1,
  NOTIFIED: 2,
  STUDENT: 3
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
  recording:function() {
    return Session.get("recording");
  },
  sessionID:function() {
    return Session.get("sessionID");
  },
  silentClass:function() {
    return "";
    //return Session.get("silentClass");
  },
  silentStyle:function() {
    return "opacity:1.0";
    //return Session.get("silentStyle");
  },
  studentClass:function() {
    if ((Session.get("lastState") == States.STUDENT && Session.get("currState") == States.CADENCE) ||
      (Session.get("lastState") == States.CADENCE && Session.get("currState") == States.WT1)){
      return "icon-anim";
    }
    else {
      return "";
    }
    //return Session.get("studentClass");
  },
  studentStyle:function() {
    switch(Session.get("currState")) {
      //Use this only for Test Condition B
      case States.STUDENT:
        return "opacity:1.0;"
      default:
        return "opacity:0;";
      
      //Use this and above for Test Condition A
      // case WT1:
      //   return "opacity:1.0;"
      // case States.NOTIFIED:
      //   return "opacity:1.0;"
      
    }
    //return Session.get("studentStyle");
  },
  taClass:function() {
    if ((Session.get("lastState") == States.TEACHER && Session.get("currState") == States.CADENCE) ||
      (Session.get("lastState") == States.CADENCE && Session.get("currState") == States.WT1)){
      return "icon-anim";
    }
    else {
      return "";
    }
    //return Session.get("taClass");
  },
  taStyle:function() {
    switch(Session.get("currState")) {
      case States.TEACHER:
        return "opacity:1.0;"
      default:
        return "opacity:0;";
    }
    //return Session.get("taStyle");
  }
});

Template.body.events({
  "click #showAdminPanel": function() {
    Session.set("showAdminPanel", true);
  },
  "click #hideAdminPanel": function() {
    Session.set("showAdminPanel", false);
  }
});



Template.record.helpers({
   recording:function() {
    return Session.get("recording");
  },
  sessionID:function() {
    return Session.get("sessionID");
  }
});

Template.record.events({
  "change #session-input":function(evt) {
    Session.set("sessionID",$(evt.target).val());
  },
  "change #condition-select":function(evt) {
    Session.set("condition",$(evt.target).val());
  },
  "click #start-record":function() {
    if(!(Session.get("condition") && Session.get("sessionID"))) {
      Session.set("recording",true);
    }
  },
  "click #stop-record":function() {
    Session.set("recording",false);
  }
});
