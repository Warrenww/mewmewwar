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
var db = admin.firestore();
console.log('start');

// db.collection('users').doc('alovelace').collection('www').doc('wwww').set({w:true});;
db.collection('users').get()
    .then((snapshot) => {
      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    })
    .catch((err) => {
      console.log('Error getting documents', err);
    });
database.ref("/newCatData/001-1").once("value",function (snapshot) {
  catdata = snapshot.val();
  console.log("cat data load complete");
  let statistic,
      exist = '000';
  // let data = catdata["001-1"];
  console.log(catdata);
  db.collection("catdata").doc('001').set({"001-1":catdata})





  console.log("finish");
  // process.exit();
  // console.log("finish");
  // process.exit();
});


// var gachadata = {};
// database.ref("/gachadata").once("value",function (snapshot) {
//   data = snapshot.val();
//   for(let i in data){
//     gachadata[data[i].name] = i;
//   }
//   console.log('gacha map complete');
// });
// database.ref("/user").once("value",function (snapshot) {
//   console.log('get user data');
//   userdata = snapshot.val();
//   for(let i in userdata){
//     let history = userdata[i].history.gacha;
//     for (let j in history) {
//       let key = gachadata[history[j].name];
//       if(key) database.ref("/user/"+i+"/history/gacha/"+j+"/name").set(key);
//     }
//   }
//   console.log('finfish');
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

// database.ref("/stagedata").once('value',function (snapshot) {
//   let data = snapshot.val();
//     for(let i in data){
//       for(let j in data[i] ){
//         if(j == 'name') continue
//         console.log( data[i][j].name);
//         for(let k in data[i][j]){
//           if(k == 'name') continue
//           // if (!data[i][j][k].count) database.ref("/stagedata/"+i+"/"+j+"/"+k+"/count").set(0)
//         }
//       }
//     }
//
//
// });
// database.ref("/user").once('value',function (snapshot) {
//   let userdata = snapshot.val(),survey;
//
// });

// geteventDay()

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
