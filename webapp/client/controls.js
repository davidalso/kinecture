Session.set("randomState", 0);

var randomPos;
Template.controls.events({
  "click #deleteEverything": function() {
    Meteor.call("deleteEverything");
  },

  "click #randomize": function() {
    var cursor = Kinects.find({});
    if (!cursor.count()) return;

    var randomState = Number(Session.get("randomState"));
    var CONFIDENCE_STAGES = [0, 0.3, 0.7, 0.9, 0.95, 0.99, 1.0];
    var randomStateMod = randomState % CONFIDENCE_STAGES.length;
    var roomWidth = Session.get("roomWidth");
    var roomLength = Session.get("roomLength");

    var randomPos;
    if (randomStateMod == 0)
      randomPos = {x: Math.random() * roomWidth, y: Math.random() * roomLength};

    Session.set("randomState", randomState + 1);

    var confidence = CONFIDENCE_STAGES[randomStateMod];
    confidence += (Math.random() - 0.5) * 0.1;
    confidence = Math.max(Math.min(confidence, 1.0), 0.0);

    cursor.forEach(function (row) {
        var silence = Math.random() < 0.5;
        Kinects.update(
          row._id,
          {"$set":
            {
              angle: Math.random() * 100.0 - 50.0,
              timestamp: new Date(),
              confidence: confidence,
              loudness: Math.random() / 1000.0,
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
