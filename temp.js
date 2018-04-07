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
//   for(let i in catdata){
//     if(catdata[i].condition.stage){
//       console.log(catdata[i].condition.stage);
//       // database.ref("/newCatData/"+i+"/id").set(i);
//     }
//   }
//   console.log("finish");
//   // process.exit();
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

geteventDay()

function geteventDay() {
  var t = new Date(),
      y = t.getFullYear(),
      m = t.getMonth()+1,
      d = t.getDate(),
      predic_url = 'https://forum.gamer.com.tw/B.php?bsn=23772&subbsn=7',
      root = 'https://forum.gamer.com.tw/';
  var start,end;
      console.log("get event day")
      console.log(y+AddZero(m)+AddZero(d));

  database.ref("/event_date").once('value',function (snapshot) {
    var eventdate = snapshot.val();
    //update prediction
    request({
      url: predic_url,
      method: "GET"
    },function (e,r,b) {
      if(!e){
        $ = cheerio.load(b);
        let title = $(".b-list__row");
        let today = y+AddZero(m)+AddZero(d);
        let arr = [];
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
              // console.log(a.text());
              start = b[0];end=b[1];
              // console.log(start,end);
              arr.push({url:root+a.attr("href"),start:start,end:end,name:a.text()});
            }
          }
        });
        // console.log(arr);
        for(i in arr){
          if (arr[i].url == eventdate.prediction.source||
              arr[i].url == eventdate.prediction_jp.source) continue
          console.log('update prediction');
          parsePrediction(arr[i],eventdate);
        }
      }
    });
  });
  setTimeout(function () { geteventDay() },12*3600*1000);
}
function parsePrediction(obj,eventdate) {
  console.log(obj.name);
  let path = "/event_date/prediction";
  if(obj.name.indexOf('日版')!=-1){
    // console.log(/snA=[0-9]+/.exec(eventdate.prediction_jp.source)[0].split('=')[1]);
    if (Number(/snA=[0-9]+/.exec(eventdate.prediction_jp.source)[0].split('=')[1])>
        Number(/snA=[0-9]+/.exec(obj.url)[0].split('=')[1])) {console.log("don't update");return}
    path += '_jp';
  } else {
    if (Number(/snA=[0-9]+/.exec(eventdate.prediction.source)[0].split('=')[1])>
        Number(/snA=[0-9]+/.exec(obj.url)[0].split('=')[1])) {console.log("don't update");return}
  }
  request({
    url:obj.url,
    method:"GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      var gachaP = $("section").eq(0).find(".c-article__content"),
          eventP = $("section").eq(1).find(".c-article__content");
      var gachaObj = [],eventObj = [],dateRe = /[0-9]+\/[0-9]+\~[0-9]+\/[0-9]+/ ;
      gachaP.children("div").each(function () {
        let content = $(this).text();
        console.log(content);
        if(content&&content.length<30){
          let arr = content.split(' ');
          let brr = arr[0].split("~");
          let cc = dateRe.test(arr[0]);
          if(cc){
            gachaObj.push({
              date:brr,name:arr[1],
              sure:arr[2]?arr[2].indexOf('必中')!=-1:false
            });
          }
        }
      });
      eventP.children("div").each(function () {
        let content = $(this).text();
        console.log(content);
        if( content.indexOf('課金')!=-1||
            content.indexOf('出售')!=-1||
            content.indexOf('來源')!=-1||!content) return
        arr = content.trim().split(' ');
        let brr = arr[0].split("~");
        let cc = dateRe.test(arr[0]);
        if(cc){
          eventObj.push({
            date:brr,
            name:arr[1]+(arr[2]?(" "+arr[2]):"")
          });
        }
      });
    }
    console.log(gachaObj);
    console.log(eventObj);
    // database.ref(path).set({
    //   start:obj.start,
    //   end:obj.end,
    //   source:obj.url,
    //   eventP:eventObj,
    //   gachaP:gachaObj
    // });
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
