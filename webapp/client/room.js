Template.room.events({
  "click .length": function() {
    Rooms.update(this._id, {$set: {length: event.target.valueAsNumber}});
  },

  "change .width": function() {
    Rooms.update(this._id, {$set: {width: event.target.valueAsNumber}});
  },
});

Template.room.helpers({
  defaultRoom: function() {
    return Rooms.findOne({name: "default"});
  }
})
