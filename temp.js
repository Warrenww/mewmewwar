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
  for(let i in catdata){
    if(i!=catdata[i].id){
      console.log(i);
      // database.ref("/newCatData/"+i+"/id").set(i);
    }
  }
  console.log("finish");
  // process.exit();
});

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
