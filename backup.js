var fs = require('fs');
var firebase = require("firebase");
var config = {
    apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
    authDomain: "battlecat-smart.firebaseapp.com",
    databaseURL: "https://battlecat-smart.firebaseio.com",
    projectId: "battlecat-smart",
    storageBucket: "battlecat-smart.appspot.com",
    messagingSenderId: "268279710428"
  };

var userdata,count = 0,text='';

firebase.initializeApp(config);
var database = firebase.database();

database.ref("/user").once("value",function (snapshot) {
  console.log('loading') ;
  userdata = snapshot.val() ;
  for(let i in userdata){
    process.stdout.clearLine();  // clear current text
    process.stdout.cursorTo(0);  // move cursor to beginning of line
    process.stdout.write("loading user "+i);  // write text
    count++;
  }
  console.log(JSON.stringify(userdata).length);
  console.log('load complete') ;
  fs.writeFile('userdataBackup.json',JSON.stringify(userdata),(err) =>{
    if (err) throw err;
    console.log('It\'s saved!');
    setTimeout(function () {
      process.exit()
    },2000);
  });
});
