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

database.ref('/user').once("value",function (snapshot) {
  var data = snapshot.val();
  var count = 0;
  for(let i in data){
    var history = data[i].history.gacha,
        variable = data[i].variable.cat;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.write(i,count,"-----",count/2248*100,"%");
    count ++;
    for(let j in history){
      var id = history[j].name?history[j].name:history[j].id;
      database.ref("/user/"+i+"/history/gacha/"+j).update({id:id,name:null});
    }
    for(let j in variable){
      if(j == 'undefine'||j.indexOf("-")!=-1){
        database.ref("/user/"+i+"/variable/cat/"+j).set(null);
      }
    }
  }

});

// var stagedata
// database.ref("/stagedata/universe").once("value",function (snapshot){
//   stagedata = snapshot.val();
//   var ch1 = stagedata['s03006'];
//   for(let i in ch1){
//     if(i=='name') continue
//     console.log(ch1[i].name);
//     console.log(ch1[i].reward);
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
