var request = require("request");
var cheerio = require("cheerio");
var fs = require('fs');
var firebase = require("firebase");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
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
var stagedata;
firebase.initializeApp(config);
var database = firebase.database();
console.log('start');

fs.readFile("./public/data/treasure.json",(err,data)=>{
  data = JSON.parse(data);
  for(let i in data.universe){
    temp = data.universe[i].treasure;
    for(let j in temp){
      console.log(temp[j].stage,temp[j].name);
      // database.ref("/stagedata/universe/s03006/"+temp[j].stage+"/reward/0/prize").update({name:"寶物",amount:temp[j].name,amoumt:null})
      // database.ref("/stagedata/universe/s03007/"+temp[j].stage+"/reward/0/prize").update({name:"寶物",amount:temp[j].name,amoumt:null})
      // database.ref("/stagedata/universe/s03008/"+temp[j].stage+"/reward/0/prize").update({name:"寶物",amount:temp[j].name,amoumt:null})
    }
  }
})

// database.ref("/newCatData").once("value",function (snapshot) {
//   console.log('load complete');
//   catdata = snapshot.val();
//   let exist = '000',current,data='';
//   for(let i in catdata){
//     console.log(i);
//     current = i.substring(0,3);
//     if(current == exist){
//       if(catdata[i].name) data += ',"'+catdata[i].name+'"'
//       if(catdata[i].statistic)
//         for(let j in catdata[i].statistic.nickname){
//           data += ',"'+catdata[i].statistic.nickname[j].nickname+'"'
//         }
//     }
//     else {
//       exist = current;
//       data += '\r\n"'+current+'","'+current+'","'+catdata[i].jp_name+'"'
//       if(catdata[i].name) data += ',"'+catdata[i].name+'"';
//       if(catdata[i].statistic)
//         for(let j in catdata[i].statistic.nickname){
//           data += ',"'+catdata[i].statistic.nickname[j].nickname+'"'
//         }
//     }
//   }
//   fs.appendFile('cat.txt', data,(err) =>{
//     if (err) throw err;
//     console.log('Is saved!');
//     process.exit();
//   });
// });

// var stagedata
// database.ref("/stagedata").once("value",function (snapshot){
//   console.log('finish');
//   stagedata = snapshot.val();
//   var exist = [];
//   for(let i in stagedata){
//     for(let j in stagedata[i]){
//       if(j == 'name') continue
//       for(let k in stagedata[i][j]){
//         if(k == 'name') continue
//         var reward = stagedata[i][j][k].reward;
//         for(let l in reward){
//           var name = reward[l].prize.name;
//           if(exist.indexOf(name) == -1){
//             console.log(name);
//             exist.push(name);
//           }
//         }
//       }
//     }
//   }
// });

// database.ref("/enemydata").once("value",(snapshot)=>{
//   var enemydata = snapshot.val();
//   for(let i in enemydata){
//     if(enemydata[i].tag){
//       if(enemydata[i].tag.indexOf("傳送")!=-1){
//         console.log(enemydata[i].id);
//         console.log(enemydata[i].char);
//       }
//     }
//   }
// });


function AddZero(n) {
  return n>9 ? n : "0"+n
}
