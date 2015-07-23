  var ta = new Date();
  var tb = new Date();

  var delay = 0;
  var delayTotal = 0;
  var delayAbsTot = 0;
  var delayCount = 0;

  var waittime = 3000;
  var silencesupport = 0;
  var noisesupport = 0;
  var waitsupport = 0;
  var minsupport = 2;
  var cadenceTime = 1500;
  var lastTransition = new Date();


  // timestate 0 <- idle
  // timestate 1 <- double_silence
  // timestate 2 <- noted
  var timestate = 0;

  var States = {
    TEACHER: 0,
    STUDENT: 3,
    CADENCE_TEACHER: 4,
    CADENCE_STUDENT: 6,
    WAITING_TEACHER: 1,
    WAITING_STUDENT: 5,
    SILENCE: 2,
  };

  var NoTalkIcon = "/artwork/No-Talk-icon-v2.jpg"; // When we add WT2, this will change to WAITING_TEACHERicon
  var StudentTalkIcon = "/artwork/Student-speak-v2.jpg";
  var TATalkIcon = "/artwork/TA-Talk-v2.jpg";
  // var WT2icon = ""                       // This doesn't exist yet, but might want it later.

  Session.set("lastState", States.TEACHER);

  Session.set("noteIconTA", "none");
  Session.set("noteIconStudent", "none");
  Session.set("noteIconSilent", "none"); // When we add WT2, this will change to WAITING_TEACHER
  //  Session.set("noteIconWT2","none");    // This doesn't exist yet, but might want it later.

  Session.set("lastState", States.TEACHER);
  Session.set("currState", States.WAITING_TEACHER);



  function lerp(from, to, by) {
    return form + (to - from) * by;
  }

  // What is this? Why "stat"? Is it reporting a "status"?
  function reverseState(stat) {
    switch(stat){
      case States.TEACHER:
        return "Teacher";
      case States.STUDENT:
        return "Student";
      case States.CADENCE_TEACHER:
        return "Cadence_Teacher";
      case States.CADENCE_STUDENT:
      	return "Cadence_Student";
      case States.WAITING_TEACHER:
        return "Waiting_Teacher";
      case States.WAITING_STUDENT:
      	return "Waiting_Student";
      case States.SILENCE:
        return "Silence";
    }
  }

  function goToState(newState) {
    if(newState == timestate) {
      return;
    }

    Session.set("lastState", timestate);
    Session.set("currState", newState);
    timestate = newState;
    silencesupport = 0;
    noisesupport = 0;
    waitsupport = 0;
    lastTransition = new Date();
    // if(Session.get("recording")) {
    // 	log_event();
	  // }
  }

  /* 
   *  Anything that does a 1 shot notification should go in this function (like the
   *  vibration). Things that have long lasting state effects (like the icon and
   *  color changes) should go in the goToState() function
   */
   function notify() {
  /*   if (navigator && navigator.vibrate) {
       navigator.vibrate(500);
     }
  */     
   }

   // This is a copy of what happens later just so I can get access to the kinects. 
   // If this doesn't work I may need to put the log functions inside the autorun, but I don't know if that's an option.
   // Then again, it looks like I might be able to access these if I do a Session.set? It happens with intersect where we get.intersect before it's been set.
   var request = {
      _id: {
        $in: [Session.get("left"), Session.get("right")]
      }
    }
   var datatemp = Kinects.find(request).fetch();
   if (datatemp.length >= 2) {
      var t1 = datatemp[0];
      var t2 = datatemp[1];
    }


   function log_event() {
   	url = "http://gcf.cmu-tbank.com/david/add_classroom_value.php";
   	dict = {};
   	// This was to test the php.
    // "timestamp=12345&eventType=abc&speakerX=1&speakerY=2&condition=blah&sessionID=session1";
    

    // We're going to act like order doesn't matter.

   	var d = new Date();

   	//timestamp
   	dict["timestamp"]=d.getTime();
	
   	//event type
  	dict["eventType"]=encodeURIComponent(reverseState(Session.get("currState")));
  	
  	//intersection
  	inter = Session.get("intersection");
     	if(inter){
     		dict["speakerX"]=inter.x;
     		dict["speakerY"]=inter.y;
     	}
     	else {
     		dict["speakerX"]="NA";
     		dict["speakerY"]="NA";
     	}

	//condition
   	// dict["condition"]=encodeURIComponent(Session.get("condition"));

   	//session
   	dict["sessionID"]=encodeURIComponent(Session.get("sessionID"));
    console.log("sending",dict);
    HTTP.call("GET",url,
	   	{params:dict},
	   	function(error,result){
	   		if(error) {
	   			console.log("HTTP POST error: ",result,error);
	   		}
	   	});
   }

   // angleLeft
   dict["angleLeft"]=t2.angle;

   // angleRight
   dict["angleRight"]=t1.angle;

   // confidenceLeft
   dict["confidenceLeft"]=t2.confidence;

   // confidenceRight
   dict["confidenceRight"]=t1.confidence;

   // loudnessLeft
   dict["loudnessLeft"]=t2.loudness;

   // loudnessRight
   dict["loudnessRight"]=t1.loudness;

   // silenceLeft
   dict["silenceLeft"]=t2.silence;

   // silenceRight
   dict["silenceRight"]=t1.silence;


   function log_start() {
    url = "http://gcf.cmu-tbank.com/david/add_classroom_value.php";
    dict = {};
    //"timestamp=12345&eventType=abc&speakerX=1&speakerY=2&condition=blah&sessionID=session1";
    var d = new Date();
    dict["timestamp"]=d.getTime();
    dict["eventType"]="Session_Start";
    dict["speakerX"]="NA";
    dict["speakerY"]="NA";
    // dict["condition"]=encodeURIComponent(Session.get("condition"));
    dict["sessionID"]=encodeURIComponent(Session.get("sessionID"));
    dict["angleLeft"]="NA";
    dict["angleRight"]="NA";
    dict["confidenceLeft"]="NA";
    dict["confidenceRight"]="NA";
    dict["loudnessLeft"]="NA";
    dict["loudnessRight"]="NA";
    dict["silenceLeft"]="NA";
    dict["silenceRight"]="NA";
    
    HTTP.call("GET",url,
      {params:dict},
      function(error,result){
        if(error) {
          console.log("HTTP GET error: ",result,error);
        }
      });
   }

  function log_end() {
    url = "http://gcf.cmu-tbank.com/david/add_classroom_value.php";
    dict = {};
    //"timestamp=12345&eventType=abc&speakerX=1&speakerY=2&condition=blah&sessionID=session1";
    var d = new Date();
    dict["timestamp"]=d.getTime();
    dict["eventType"]="Session_End";
    dict["speakerX"]="NA";
    dict["speakerY"]="NA";
    // dict["condition"]=encodeURIComponent(Session.get("condition"));
    dict["sessionID"]=encodeURIComponent(Session.get("sessionID"));
    dict["angleLeft"]="NA";
    dict["angleRight"]="NA";
    dict["confidenceLeft"]="NA";
    dict["confidenceRight"]="NA";
    dict["loudnessLeft"]="NA";
    dict["loudnessRight"]="NA";
    dict["silenceLeft"]="NA";
    dict["silenceRight"]="NA";
    
    HTTP.call("GET",url,
      {params:dict},
      function(error,result){
        if(error) {
          console.log("HTTP GET error: ",result,error);
        }
      });
   }


  Template.graph.rendered = function() {
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
    var svg = d3.select("#graph")
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

    svg.append("line")
      .attr("id", "TA-line")
      .attr("stroke-width", 2)
      .attr("stroke", "black")
      .attr("x1", padding)
      .attr("x2", w - padding)
      .attr("y1", 0)
      .attr("y2", 0);

    //This is the accessor function we talked about above
    var lineFunction = d3.svg.line()
      .x(function(d) {
        return xScale(d.x);
      })
      .y(function(d) {
        return yScale(d.y);
      })
      .interpolate("linear");
    var closedLineFunction = function(d) {
      return lineFunction(d) + "Z";
    };


    Deps.autorun(function() {

      var defaultRoom = getDefaultRoom();
      if (defaultRoom == null) {
        return;
      } 
      //else
      //  console.log("yes default room");

      defaultLeftRight();

      var roomLength = defaultRoom.length;
      var roomWidth = defaultRoom.width;
      var roomTAzone = defaultRoom.TAzone;
      var roomThreshold = defaultRoom.threshold;

      // w += 50;
      h = roomLength * w / roomWidth;
      xScale.range([padding, w - padding * 2]);
      yScale.range([h - padding, padding]);
      svg.attr("width", w)
        .attr("height", h);

      svg.select(".x.axis")
        .attr("transform", "translate(0," + (h - padding) + ")");

      //Update Y axis
      svg.select(".y.axis")
        .attr("transform", "translate(" + padding + ",0)");



      var query = {
        _id: {
          $in: [Session.get("left"), Session.get("right")]
        }
      };
      var dataset = Kinects.find(query).fetch();

      // Make sure the cones are long enough to extend past the graph
      var length = Math.round(1 + Math.sqrt(Math.pow(roomWidth, 2) + Math.pow(roomLength, 2)));

      //for each kinect
      _.each(dataset, function(element) {
        var getX = function(offsetAngle) {
          return element.x + length * Math.cos((element.dtheta + Number(element.angle) + offsetAngle) * Math.PI / 180.0);
        }

        var getY = function(offsetAngle) {
          return element.y + length * Math.sin((element.dtheta + Number(element.angle) + offsetAngle) * Math.PI / 180.0);
        }

        if (element._id == Session.get("left")) {
          element.x = element.dx;
          element.y = roomLength - element.dy;
        } else {
          element.x = roomWidth - element.dx;
          element.y = roomLength - element.dy;
        }

        element.x2 = getX(0);
        element.y2 = getY(0);

        var confidenceAngle = Math.max(1, 45 * (1 - element.confidence));

        element.x2l = getX(-confidenceAngle);
        element.y2l = getY(-confidenceAngle);
        element.x2r = getX(confidenceAngle);
        element.y2r = getY(confidenceAngle);
      });

      //Update scale domains
      xScale.domain([0, roomWidth]);
      yScale.domain([0, roomLength]);

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
/*
      .log(JSON.stringify({
        "h": h,
        "padding": padding,
        "roomLength": roomLength,
        "roomWidth": roomWidth,
        "w": w,
        "TAzone": roomTAzone,
        "TAzone-scaled": yScale(roomTAzone)
      }));
*/
      //Draw the line for the TAzone
      svg.select("#TA-line")
        // .attr("transform", "translate(0, " + roomTAzone + ")");
        .attr("y1", h - yScale(roomTAzone))
        .attr("y2", h - yScale(roomTAzone));


      var cx, cy;
      if (dataset.length >= 2) {

        var e1 = dataset[0];
        var e2 = dataset[1];

        var loudness = (e1.loudness + e2.loudness) / 2;
        var loudness_scaled = Math.min(loudness * 500.0, 1.0); // usually loudness <= 0.1
        var r = loudness_scaled * 20.0 + 5.0;
        
        // For human comprehension
        var LeftSound = (e2.loudness * 100000.0  + 5.0) | 0;
        var RightSound = (e1.loudness * 100000.0  + 5.0) | 0;
        var sound = (((e1.loudness + e2.loudness) / 2) * 100000.0  + 5.0) | 0;

        var angleLeft = e2.angle;
        var angleRight = e1.angle;

        
        var intersect = lineIntersection(e1.x, e1.y, e1.x2, e1.y2, e2.x, e2.y, e2.x2, e2.y2);
         
        if (sound > roomThreshold) {
          Session.set("intersection", intersect);
        } 
        else {
          Session.set("intersection", false);
          intersect = false;
        }

        ta = tb;
        tb = new Date();
        delay = tb.getTime() - ta.getTime();

        // COMMENTING OUT TO SAVE PROCESSING
        delayTotal += delay;
        delayCount += 1;
        var delavg = delayTotal / delayCount;

        Session.set("delayframe", delay);
        Session.set("delayaverage", delavg);

        var now = new Date()
        tdiff = Math.abs(now.getTime() - lastTransition.getTime());

      if(Session.get("recording")) {
        log_event();
      }

        if (e1.silence && e2.silence) {
          Session.set("intersection", false);
          switch (timestate) {
            // if idle then track support for transition to WAITING_TEACHER
            case States.STUDENT:
            	silencesupport += 1;
            	if(silencesupport > minsupport) {
            		goToState(States.CADENCE_STUDENT);
            	}
            	break;
            case States.TEACHER:
              silencesupport += 1;
              if (silencesupport > minsupport) {
                goToState(States.CADENCE_TEACHER);
              }
              break;

            case States.CADENCE_TEACHER:
              if (tdiff > cadenceTime) {
                goToState(States.WAITING_TEACHER);
              }
              break;

            case States.CADENCE_STUDENT:
            	if(tdiff > cadenceTime) {
            		goToState(States.WAITING_STUDENT);
            	}
            	break;

              // if waiting track, wait and track support for
            case States.WAITING_STUDENT:
            case States.WAITING_TEACHER:
              if (tdiff + cadenceTime > waittime) {
                goToState(States.SILENCE);
              }
              break;
          }

          // we also need to hide the circle on a double silence.
          svg.select("circle").style("visibility", "hidden");
        }

        else if (intersect) {
          // Make intersections impossible if either of the Kinects returns silence
          if ((e1.silence && !e2.silence) || (!e1.silence && e2.silence)) {
            Session.set("intersection", false);
            intersect = false;
          }

          else{

            // draw a circle on the graph
            svg.select("circle")
              .attr("cx", function() {
                return xScale(intersect.x);
              })
              .attr("cy", function() {
                return yScale(intersect.y);
              })
              .style("visibility", "visible")
              .attr("r", r);

            // follow these rules to check for evidence of state change
            switch (timestate) {
              case States.TEACHER:
                //we've already heard noise so stay in the same state.
                //We could put minsupport here if we find that STUDENT is getting called too often
                if (intersect.y < (roomLength - roomTAzone)) {
                  goToState(States.STUDENT)
                }
                break;

              case States.STUDENT:
                //We could put minsupport here if we find that TEACHER is getting called too often
                if (intersect.y >= (roomLength - roomTAzone)) {
                  goToState(States.TEACHER)
                }
                break;

              case States.SILENCE:
              case States.CADENCE_TEACHER:
              case States.CADENCE_STUDENT:
              case States.WAITING_TEACHER:
              case States.WAITING_STUDENT:
                //go to ts 0
                noisesupport += 1;
                if (noisesupport > minsupport) {
                  if (intersect.y >= (roomLength - roomTAzone)) {
                    goToState(States.TEACHER);
                  } 
                  else {
                    goToState(States.STUDENT);
                  }
                }
                break;
            }
          }
        } 
        // when there is no intersection, don't draw a circle
        else {
          svg.select("circle").style("visibility", "hidden");
          //This would be the place to do anything for noise detection 
          // on one side and not the other, or when two noises do not intersect

        }
       
       // Declaring notestate
       Session.set("notestate", {
          "timestate": reverseState(timestate),
          "sound": sound,
          "LeftSound": LeftSound,
          "RightSound": RightSound,
          "angleLeft": angleLeft, // might not be nec to have angleLeft for log. It's just e2.angle
          "angleRight": angleRight,
          "silencesupport": silencesupport,
          "noisesupport": noisesupport,
          "waitsupport": waitsupport,
          "tdiff": tdiff
        }); 
      } 

      else {
        svg.select("circle").style("visibility", "hidden");
        Session.set("intersection", false);
      }


      var lineFunction = d3.svg.line()
        .x(function(d) {
          return d.x;
        })
        .y(function(d) {
          return d.y;
        })
        .interpolate("linear");

      var lines = svg
        .selectAll("path.cone")
        .data(dataset, key);

      //Create
      lines
        .enter()
        .append("path")
        .attr("class", "cone")
        .attr("fill", "rgba(0,0,255,0.5)")
        .attr("d", function(d) {
          return closedLineFunction([{
            x: d.x,
            y: d.y
          }, {
            x: d.x2l,
            y: d.y2l
          }, {
            x: d.x2r,
            y: d.y2r
          }]);
        });

      //Update
      lines
        .transition()
        .duration(100)
        .attr("d", function(d) {
          return closedLineFunction([{
            x: d.x,
            y: d.y
          }, {
            x: d.x2l,
            y: d.y2l
          }, {
            x: d.x2r,
            y: d.y2r
          }]);
        });
      // .attr("stroke", function(d) {
      //   return d.speech ? "rgba(255,0,0,0.5)" : "rgba(0,0,0,0.5)";
      // });

      //Remove
      lines
        .exit()
        .remove();
    });

  };