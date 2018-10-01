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
var gsjson = require('google-spreadsheet-to-json');
var userdata;
var catdata;
firebase.initializeApp(config);
var database = firebase.database();
console.log('start');
var stdin = process.openStdin();

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

database.ref('/vote').once("value",function (snapshot) {
  var data = snapshot.val();
  var result = {
    0:{
      "移除功能":0,
      "留下功能":0
    },
    1:{
      "移除功能":0,
      "留下功能":0
    },
    2:{
      "不要改變":0,
      "純嵌入式":0,
      "純新視窗":0
    }},count = 0;
  for(let i in data){
    if(data[i].length!=4)continue
    count ++;
    if(data[i][3]&&data[i][3]!=""&&data[i][3]!=" ") console.log(data[i][3]);
    for(let j in data[i]) {
      if(j==3)continue
      result[j][data[i][j]] ++;
    }
  }
  console.log(result);
  // console.log('finish');
  process.exit();
});

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
  return n>9 ? "0"+n : n
}
//
//
// var ID = '1lGJC6mfH9E0D2bYNKVBz78He1QhLMUYNFSfASzaZE9A' ;
// gsjson({
//     spreadsheetId: ID,
//     // hash : 'id' ,
//     //propertyMode: 'pascal'
//     worksheet: 1
//     // other options...
// })
// .then(function (result) {
//   // console.log(result);
//   for(let i in result){
//     console.log(result[i].id);
//     result[i] = {
//       id : result[i].id,
//       catagory : result[i].catagory,
//       name : result[i].name,
//       effect : result[i].effect,
//       amount : result[i].amount,
//       cat : [result[i].cat_1,result[i].cat_2,result[i].cat_3,result[i].cat_4,result[i].cat_5]
//     }
//     database.ref("/combodata/"+result[i].id).update(result[i]);
//   }
// });
