Template.room.events({
  "change .length": function() {
    Rooms.update(this._id, {$set: {length: event.target.valueAsNumber}});
  },

  "change .width": function() {
    Rooms.update(this._id, {$set: {width: event.target.valueAsNumber}});
  },
  "change .TAzone": function() {
    Rooms.update(this._id, {$set: {TAzone: event.target.valueAsNumber}});
  },
});

Template.room.helpers({
  defaultRoom: function() {
    return getDefaultRoom();
  }
})

defaultLeftRight = function () {
  var left = Session.get("left");
  var right = Session.get("right");
  if (left || right)
    return;
  //console.log("I RUN");
  var all = Kinects.find().fetch();
  console.log(all);
  if (all.length >= 2) {
    console.log("all");
    console.log(Session.get("left"));
    if (!Session.get("left"))
      Session.set("left", all[0]._id);
    if (!Session.get("right"))
      Session.set("right", all[1]._id);
  }
}
