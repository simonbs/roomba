var request = require("request");

function Roomba(blid, robotpwd, assetid) {
  this.blid = blid;
  this.robotpwd = robotpwd;
  this.assetId = assetid;
}

module.exports = Roomba;

Roomba.prototype.sendRequest = function(method, value, callback) {
  var form = {
    "blid": this.blid,
    "robotpwd": this.robotpwd,
    "method": method
  }
  if (value != null) {
    form["value"] = JSON.stringify(value);
  }
  request.post({
    url: "https://irobot.axeda.com/services/v1/rest/Scripto/execute/AspenApiRequest", 
    form: form,
    headers: {
      "ASSET-ID": this.assetId
    }
  }, callback);
}

Roomba.prototype.getStatus = function(callback) {
  this.sendRequest("getStatus", null, function(err, httpResponse, body) {
    if (err || httpResponse.statusCode != 200) {
      return callback(err, null);
    }
    var json = JSON.parse(body);
    var theStatus = json;
    theStatus["robot_status"] = JSON.parse(json["robot_status"]);
    callback(null, theStatus);
  });
}

Roomba.prototype.pollPhase = function(desiredPhase, callback) {
  var roomba = this;
  this.getStatus(function(err, theStatus) {
    if (err) {
      return callback(err);
    }
    if (theStatus.robot_status.phase == desiredPhase) {
      return callback(null);
    }
    setTimeout(function() {
      roomba.pollPhase(desiredPhase, callback);
    }, 3000);
  });
}

Roomba.prototype.pauseAndDock = function(callback) {
  var roomba = this;
  this.sendRequest("multipleFieldSet", {"remoteCommand": "pause"}, function(err, httpResponse, body) {
    if (err || httpResponse.statusCode != 200) {
      return callback(err);
    }
    roomba.pollPhase("stop", function(err) {
      if (err) {
        return callback(err);
      }
      roomba.sendRequest("multipleFieldSet", {"remoteCommand": "dock"}, function(err, httpResponse, body) {
        if (err || httpResponse.statusCode != 200) {
          callback(err);
          return;
        }
        callback();
      });
    });
  });
}

Roomba.prototype.start = function(callback) {
  this.sendRequest("multipleFieldSet", { "remoteCommand": "start" }, function(err, httpResponse, body) {
    if (err || httpResponse.statusCode != 200) {
      return callback(err);
    }
    callback();
  });
}

Roomba.prototype.isRunning = function(callback) {
  this.getStatus(function(err, theStatus) {
    if (err) {
      return callback(err);
    }
    return callback(null, theStatus.robot_status.phase == "run")
  });
}

