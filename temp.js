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
  var admin = require("firebase-admin");

  var serviceAccount = require("battlecat-smart-firebase-adminsdk-nqwty-40041e7014.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://BattleCat-Smart.firebaseio.com"
  });


var userdata;
var catdata;
firebase.initializeApp(config);
var database = firebase.database();
console.log('start');

// database.ref("/newCatData").once("value",function (snapshot) {
//   catdata = snapshot.val();
//   console.log("cat data load complete");
//   // for(let i in catdata){
//   //   process.stdout.clearLine();
//   //   process.stdout.cursorTo(0);
//   //   process.stdout.write(i);
//   //   database.ref("/newCatData/"+i+"/count").set(catdata[i].count)
//   // }
//   console.log("finish");
// });

// database.ref("/gachadata").once("value",function (snapshot) {
//   for(let i in snapshot.val()){
//     console.log(i,snapshot.val()[i].name);
//   }
// });

// database.ref("/enemydata").once("value",function (snapshot) {
//   let enemydata = snapshot.val();
//   let count = 0;
//     for(let i in enemydata){
//       count ++;
//       // process.stdout.clearLine();
//       // process.stdout.cursorTo(0);
//       // process.stdout.write("update enemy "+i+"---");
//       // process.stdout.write((count/382*100).toFixed(2).toString());
//       // process.stdout.write("%");
//
//       // if(enemydata[i].全名) {
//         // console.log(enemydata[i].全名,enemydata[i].name);
//         // database.ref("/enemydata/"+i).update({multi:null});
//       // }
//       // database.ref("/catdata/"+i+"/攻撃力").remove();
//       // database.ref("/catdata/"+i+"/體力").remove();
//     }
//     setTimeout(function () {
//       process.exit()
//     },2000)
// });

// database.ref("/user").once("value",function (snapshot) {
//   console.log('get user data');
//   userdata = snapshot.val();
//   let count = 0 ;
//   for(let i in userdata){
//     process.stdout.clearLine();
//     process.stdout.cursorTo(0);
//     process.stdout.write("loading user data "+i);
//     process.stdout.write((Number(count)/811*100).toFixed(2).toString());
//     process.stdout.write("%");
//     let owned = userdata[i].folder!='0'&&userdata[i].folder?
//         (userdata[i].folder.owned!="0"&&userdata[i].folder.owned?userdata[i].folder.owned:[]):[];
//     let arr = [];
//     for(let j in owned){
//       if(arr.indexOf(owned[j])==-1)arr.push(owned[j])
//     }
//     database.ref("/user/"+i+"/folder/owned").set(arr)
//     count++;
//   }
//   console.log('finfish');
// });

// database.ref("/stagedata/smallCat").once('value',function (snapshot) {
//   let data = snapshot.val();
//     for(let i in data){
//       for(let j in data[i] ){
//         if(j == 'name') continue
//         //
//         database.ref("/stagedata/smallCat/"+i+"/"+j+"/constrain")
//         .set("EX・稀有");
//       }
//       // database.ref("/stagedata/world/s03001z/"+j+"/reward/0").update({prize:target.reward[0].prize});
//       // database.ref("/stagedata/world/s03002z/"+j+"/reward/0").update({prize:target.reward[0].prize});
//       // arr = arr.concat(target.reward);
//       // for(let i in target.reward){
//       //   if(target.reward[i].prize.name.indexOf("u")!=-1)
//       //   console.log(target.name,target.reward[i].prize.amount);
//       // }
//     }
//
//
// });

var t = new Date(),
    y = t.getFullYear(),
    m = AddZero(t.getMonth()+1),
    d = AddZero(t.getDate()),
    url = 'https://forum.gamer.com.tw/B.php?bsn=23772&subbsn=7',
    root = 'https://forum.gamer.com.tw/';

      // console.log(url+y+m+d+".html");

request({
  url: url,
  method: "GET"
},function (e,r,b) {
  if(!e){
    $ = cheerio.load(b);
    // console.log($("tbody").html());
    let title = $(".b-list__row");
    let today = y+m+d;
    let arr = [];
    console.log(today);
    title.each(function () {
      let a = $(this).children(".b-list__main").find("a");
      if(a.text().indexOf("活動資訊")!=-1){
        let b = a.text().split("資訊")[1].split("(")[0].trim().split("~");
        for(let i in b){
          b[i] = b[i].split("/");
          for(let j in b[i]) b[i][j] = AddZero(b[i][j]);
          b[i] = ((Number(b[i][0])>Number(m)+1?y-1:y)+b[i].join(""));
        }
        if(b[1]>today){
          console.log(a.text());
          console.log(b);
          arr.push(root+a.attr("href"));
        }
      }
    });
    console.log(arr[0]);
    parsePrediction(arr[0]);
  }
});
function parsePrediction(url) {
  request({
    url:url,
    method:"GET"
  },function (e,r,b) {
    let obj = {
      source_1 : url
    }
    if(!e){
      $ = cheerio.load(b);
      let gachaP = $("section").eq(0).find(".c-article__content"),
          eventP = $("section").eq(1).find(".c-article__content");
      // console.log(gachaP.text());
      // console.log(eventP.text());
      console.log(gachaP.find('a').attr("href"));
      gachaP.children("div").each(function () {
        let content = $(this).text();
        if(content&&content.length<30){
          // console.log(content);
          let arr = content.split(' ');
          // console.log(arr);
          let brr = arr[0].split("~");
          console.log(brr,arr[1],arr[2]);
        }
      });
    }
  });
}

function AddZero(n) {
  return n<10 ? "0"+n : n
}
var target = '41xMMgmvgqSFlGbH7oKgF97490w2';
// listAllUsers();
function listAllUsers(nextPageToken) {
    let timer = new Date().getTime();
  // List batch of users, 1000 at a time.
  admin.auth().listUsers(100, nextPageToken)
    .then(function(listUsersResult) {
      listUsersResult.users.forEach(function(data) {
        // console.log(data.providerData[0].providerId);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(data.uid);

        if(data.uid == target){
          process.stdout.write('\n');
          console.log(data);
          return
        }

      });
      if (listUsersResult.pageToken) {
        // List next batch of users.
        listAllUsers(listUsersResult.pageToken)
      }
    })
    .catch(function(error) {
      console.log("Error listing users:", error);
    });
}

// Start listing users from the beginning, 1000 at a time.
// listAllUsers();
//
