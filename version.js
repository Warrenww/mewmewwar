var firebase = require("firebase");
var fs = require("fs");
var config = {
    apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
    authDomain: "battlecat-smart.firebaseapp.com",
    databaseURL: "https://battlecat-smart.firebaseio.com",
    projectId: "battlecat-smart",
    storageBucket: "battlecat-smart.appspot.com",
    messagingSenderId: "268279710428"
  };
  firebase.initializeApp(config);
  var database = firebase.database();
  var stdin = process.openStdin();

  // stdin.addListener("data", function(d) {
  //     // note:  d is an object, and when converted to a string it will
  //     // end with a linefeed.  so we (rather crudely) account for that
  //     // with toString() and then trim()
  //     let version = d.toString().trim();
  //   });
  if(process.argv[2]){
    database.ref("/version").set(process.argv[2]);
    database.ref("/error_log").set(null);
    database.ref("/").once("value",(snapshot)=>{
      var data = snapshot.val(),
          date = new Date().toLocaleDateString().split("/").join("-");
      fs.writeFileSync("./backup/"+date+"User.json",JSON.stringify(data.user));
      fs.writeFileSync("./backup/"+date+"Cat.json",JSON.stringify(data.CatData));
      fs.writeFileSync("./backup/"+date+"Stage.json",JSON.stringify(data.stagedata));
      setTimeout(function () {
        console.log("version update and data backup");
        process.exit();
      },5000);
    })
  } else {
    console.log("undefine version!!");
    process.exit();
  }
