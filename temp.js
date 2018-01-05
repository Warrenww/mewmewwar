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


database.ref("/enemydata").once("value",function (snapshot) {
  let catdata = snapshot.val();
  for(let i in catdata){
    let obj = {
      name : catdata[i].全名,

    }
    database.ref("/enemydata/"+i).update(obj);
    // database.ref("/catdata/"+i+"/攻撃力").remove();
    // database.ref("/catdata/"+i+"/體力").remove();

  }
});
// process.stdout.write("www");
// process.stdin.setEncoding('utf8');
database.ref("/user").once("value",function (snapshot) {
  console.log('get user data');
  userdata = snapshot.val();
  // let count = 0 ;
  // for(let i in userdata){
  //   console.log(count,i);
  //   database.ref("/user/"+i+"/folder").set('0');
  //   count++;
  // }
});

database.ref("/stagedata/story").once('value',function (snapshot) {
  let data = snapshot.val() ;
  for (let i in data){
    for(let j in data[i]){
      if(j == 'name') continue
      // database.ref("/stagedata/story/"+i+"/"+j+"/continue").set(true);

    }
  }
});
var t = new Date(),
    y = t.getFullYear(),
    m = AddZero(t.getMonth()+1),
    d = AddZero(t.getDate()),
    url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
    // console.log(url+y+m+d+".html");

// request({
//   url: "https://m.gamer.com.tw/forum/C.php?bsn=23772&snA=10129&bpage=1&top=0&ltype=",
//   method: "GET"
// },function (e,r,b) {
//   if(!e){
//     $ = cheerio.load(b);
//     // console.log($("tbody").html());
//     $("tr").each(function () {
//       let stage = $(this).children("td").eq(0).text().split("-");
//       let name = $(this).children("td").eq(2).text();
//       // console.log(stage+":"+name);
//       if(stage[1] != '0'){
//         database.ref("/stagedata/story/s000"+(AddZero(stage[0]-1))+"/"+stage[1]+"/name").set(name)
//       }
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
