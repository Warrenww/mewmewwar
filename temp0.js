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

var i=1;
getthewww(i)
function getthewww(i) {
  // console.log(AddZero(i));
  request({
    url: "http://battlecats-db.com/unit/"+AddZero(i)+".html",
    method: "GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      let j = 1;
      $("tr").each(function () {
        let stage = $(this).children("td").eq(0).text();
        let name = $(this).children("td").eq(1).text();
        // console.log(stage+":"+name);
        if(stage == '開放条件'){
          console.log(AddZero(i)+"-"+j+":"+name);
          j++
        }
        // console.log("/stagedata/story/s000"+(AddZero(stage[0])-1)+"/"+stage[1]);
      });
      i++;
      if(i<50) getthewww(i)

    } else {console.log(e);}
  });

}
function AddZero(n) {
  return n>99 ? n : (n>9 ? "0"+n : "00"+n)
}
//
// encode('cat&273-1&50')
// function encode(str) {
//   let code = [];
//   for (let i in str){
//     process.stdout.write(str[i]);
//     code.push(str.charCodeAt(i))
//   }
//   process.stdout.write('\n');
//   console.log(code);
//   let output=[]
//   for(let i in code){
//     code[i] += 8;
//     output.push(String.fromCharCode(code[i]));
//   }
//   console.log(output.join(''));
// }
// decode('mk~0<A=7;0?:')
// function decode(str) {
//   let code = [];
//   for (let i in str){
//     process.stdout.write(str[i]);
//     code.push(str.charCodeAt(i))
//   }
//   process.stdout.write('\n');
//   console.log(code);
//   let output=[]
//   for(let i in code){
//     code[i] -= 8;
//     output.push(String.fromCharCode(code[i]));
//   }
//   console.log(output.join(''));
// }
