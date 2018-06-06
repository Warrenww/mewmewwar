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

// database.ref('/user').once("value",function (snapshot) {
//   console.log('finish');
// });
var stagedata
database.ref("/stagedata").once("value",function (snapshot){
  stagedata = snapshot.val();
  getthewww();
});
function stageID(s) {
  if(s == '超級游擊經驗值！') return 'XP-s01059'
  if(s == '寶物嘉年華（世界篇）') return 'world-s03000'
  if(s == '寶物嘉年華（未來篇）') return 'future-s03003'
  for(let i in stagedata){
    for(let j in stagedata[i]){
      if(j == 'name') continue
      if(stagedata[i][j].name == s) return [i,j].join("-")
      for(let k in stagedata[i][j]){
        if(k == 'name') continue
        if(stagedata[i][j][k].name == s) return [i,j,k].join("-")
      }
    }
  }
}

function getthewww() {
  // console.log(AddZero(i));

  request({
    url: "https://ponos.s3.amazonaws.com/information/appli/battlecats/calendar/tw/index.html",
    method: "GET"
  },function (e,r,b) {
    console.log("Get!!");
    if(!e){
      $ = cheerio.load(b);
      var dailyEvent = {}
      for(let i=0;i<8;i++){
        var target = $(".cld_box01").eq(i);
        dailyEvent[i+1] = { allday:[],hours:[] }
        target.find('.red').each(function () {
          let text = $(this).text().trim().split("・")[1].split("（")[0];
          dailyEvent[i+1].allday.push({id:stageID(text),name:text});
        });
        let count = 0;
        target.find(".hour").each(function () {
          dailyEvent[i+1].hours[count] = []
          $(this).next().find("span").each(function () {
            let text = $(this).text().trim().split("・")[1].split("\n")[0];
            dailyEvent[i+1].hours[count].push({id:stageID(text),name:text});
          });
          count ++;
        });
      }
      // fs.writeFile('public/calendar.txt', JSON.stringify(dailyEvent), function (err) {
      //   if (err) throw err;
      //   console.log('Saved!');
      //   process.exit()
      // });
    } else {
      console.log(e);
    }
  });

}
function AddZero(n) {
  return n>99 ? n : (n>9 ? "0"+n : "00"+n)
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
//     // database.ref("/combodata/"+result[i].id).set(result[i]);
//   }
// });
