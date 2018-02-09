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

database.ref("/newCatData").once("value",function (snapshot) {
  catdata = snapshot.val();
  console.log("cat data load complete");
  // for(let i in catdata){
  //   process.stdout.clearLine();
  //   process.stdout.cursorTo(0);
  //   process.stdout.write(i);
  //   database.ref("/newCatData/"+i+"/count").set(catdata[i].count)
  // }
  console.log("finish");
});
test()
function test() {
  try{
    if(catdata) console.log('ok');
    else throw 'novalue'
  }
  catch(err){
    if(err == 'novalue') {
      console.log('novalue');
      setTimeout(test,100)
    }
  }
}

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
//       if(enemydata[i].全名) {
//         console.log(enemydata[i].全名,enemydata[i].name);
//         // database.ref("/enemydata/"+i).update({全名:null});
//       }
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
//     // let stage = userdata[i].history.stage;
//     // for(let j in stage){
//     //   process.stdout.clearLine();
//     //   process.stdout.cursorTo(0);
//     //   process.stdout.write("loading user data "+i+" history "+j);
//     //   process.stdout.write((Number(count)/688*100).toFixed(2).toString());
//     //   process.stdout.write("%");
//     //   // let arr = stage != "0" ? (stage[j].id).split("-") : [];
//     //   if (j=="0") {
//     //     // database.ref("/user/"+i+"/history/stage").set("0");
//     //   }
//     // }
//     count++;
//   }
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
    url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
    // console.log(url+y+m+d+".html");

request({
  url: "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/rank/tw/index.html",
  method: "GET"
},function (e,r,b) {
  if(!e){
    $ = cheerio.load(b);
    // console.log($("tbody").html());
    $("tr").each(function () {
      let rank = $(this).children("td").eq(0).text();
      let name = $(this).children("td").eq(1).text().split("\n");
      let www = '';
      for(let i in name){
        www += name[i].trim();
      }
      console.log(rank,www);
      database.ref("/rankdata/"+rank).set(www);
      // console.log("/stagedata/story/s000"+(AddZero(stage[0])-1)+"/"+stage[1]);
    });
  }
});

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
