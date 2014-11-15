Kinects = new Mongo.Collection("kinects");
Rooms = new Mongo.Collection("rooms");

var Schemas = {};

Schemas.Room = new SimpleSchema({
  name: {
    type: String,
    min: 0,
    unique: true
  },
  length: {
    type: Number,
    min: 0,
    decimal: true,
    defaultValue: 10,
  },
  width: {
    type: Number,
    min: 0,
    decimal: true,
    defaultValue: 10,
  }
});

Rooms.attachSchema(Schemas.Room);

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

getDefaultRoom = function() {return Rooms.findOne({name: "default"})};

if (Meteor.isServer) {
  if (!getDefaultRoom()) {
    Rooms.insert({name: "default", width: 10, roomLength: 9});
  }
}
