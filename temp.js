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
console.log('start');

// process.stdout.write("www");
// process.stdin.setEncoding('utf8');
database.ref("/user").once("value",function (snapshot) {
  console.log('get user data');
  userdata = snapshot.val();

  // for(let i in userdata){
  //   console.log(i);
    // database.ref("/user/"+i+"/history/stage").set('0');
  // }
});
database.ref("/stagedata/story").once('value',function (snapshot) {
  let data = snapshot.val() ;
  for (let i in data){
    for(let j in data[i]){
      if(j == 'name') continue
      database.ref("/stagedata/story/"+i+"/"+j+"/continue").set(true);

    }
  }
});
// request({
//   url: "http://battlecats-db.com/stage/s00000-02.html",
//   method: "GET"
// },function (e,r,b) {
//   if(!e){
//     $ = cheerio.load(b);
//     let content = $(".maincontents table"),
//     final = content.children().length == 6 ? true : false,
//     tbody_2 = content.children("tbody").eq(final?2:1).children("tr"),
//     enemy=[];
//     for(let k=0;k<tbody_2.length;k++){
//       console.log("enemy "+k);
//       let ene = tbody_2.eq(k).children("td");
//       console.log(ene.eq(0).text());
//       enemy.push({
//         Boss : ene.eq(0).text() == "BOSS" ? true : false
//       });
//     }
//     console.log(enemy);
//   }
// });
function AddZero(n) {
  return n<10 ? "0"+n : n
}
