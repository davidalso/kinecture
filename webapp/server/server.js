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
