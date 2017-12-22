var request = require("request");
var cheerio = require("cheerio");
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

var userdata;
var catdata;
firebase.initializeApp(config);
var database = firebase.database();
// process.stdout.write("www");
// process.stdin.setEncoding('utf8');
database.ref("/catdata").once("value",function (snapshot) {
  catdata = snapshot.val();
});
database.ref("/stagedata").once("value",function (snapshot) {

});
request({
  url: "http://battlecats-db.com/stage/index_legendstory.html",
  method: "GET"
},function (e,r,b) {
  if(!e){
    $ = cheerio.load(b);
    let count=0;
    $("#List").children("thead").each(function () {
      process.stdout.write(count+":");
      let name = $(this).find('a').eq(0).text();
      process.stdout.write(name+"\n");
      database.ref("/stagedata/s000"+AddZero(count)+"/name").set(name);
      count++;
    });

  }
});
function AddZero(n) {
  return n<10 ? "0"+n : n
}
