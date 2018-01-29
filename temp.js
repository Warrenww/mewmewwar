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

let uid = 'DkKutbEzyWbeO1A074Kcinygxgs2';
database.ref("/user/"+uid).set(null);

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
//
// database.ref("/stagedata/crazy").once('value',function (snapshot) {
//   let data = snapshot.val();
//     for(let i in data){
//       for(let j in data[i] ){
//         if(j == 'name') continue
//         let reward = data[i][j].reward[0];
//         console.log(reward);
//         database.ref("/stagedata/crazy/"+i+"/"+j+"/reward")
//         .update({'0':{chance:"",limit:"",prize:reward}});
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

// request({
//   url: "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/rank/tw/index.html",
//   method: "GET"
// },function (e,r,b) {
//   if(!e){
//     $ = cheerio.load(b);
//     // console.log($("tbody").html());
//     $("tr").each(function () {
//       let rank = $(this).children("td").eq(0).text();
//       let name = $(this).children("td").eq(1).text().split("\n");
//       let www = '';
//       for(let i in name){
//         www += name[i].trim();
//       }
//       console.log(rank,www);
//       database.ref("/rankdata/"+rank).set(www);
//       // console.log("/stagedata/story/s000"+(AddZero(stage[0])-1)+"/"+stage[1]);
//     });
//   }
// });

function AddZero(n) {
  return n<10 ? "0"+n : n
}
function listAllUsers(nextPageToken) {
    let timer = new Date().getTime();
  // List batch of users, 1000 at a time.
  admin.auth().listUsers(1, nextPageToken)
    .then(function(listUsersResult) {
      listUsersResult.users.forEach(function(data) {
        // console.log(data.providerData[0].providerId);
        console.log(data.uid, Date.parse(data.metadata.lastSignInTime));

      });
      // if (listUsersResult.pageToken) {
      //   // List next batch of users.
      //   listAllUsers(listUsersResult.pageToken)
      // }
    })
    .catch(function(error) {
      console.log("Error listing users:", error);
    });
}
// Start listing users from the beginning, 1000 at a time.
// listAllUsers();
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
