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
// var admin = require("firebase-admin");
//
// var serviceAccount = require("battlecat-smart-firebase-adminsdk-nqwty-40041e7014.json");
//
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://BattleCat-Smart.firebaseio.com"
// });


// var userdata;
// var catdata;
// firebase.initializeApp(config);
// var database = firebase.database();
// var db = admin.firestore();
console.log('start');

// var list = fs.readFileSync("./public/text.txt",'utf-8').split("\n");
// console.log(list.length);
// var ptr = 0;
// (function load() {
//   console.log(ptr);
//   var url = list[ptr];
//   request.get(url).pipe(fs.createWriteStream(`./public/pic/picture_${ptr>100?ptr:(ptr>10?"0"+ptr:"00"+ptr)}.png`));
//   ptr++;
//   setTimeout(load,1000);
// })(0)

// database.ref("/error_log").set(null);

// db.collection('users').doc('alovelace').collection('www').doc('wwww').set({w:true});;
// db.collection('users').get()
//     .then((snapshot) => {
//       snapshot.forEach(doc => {
//         console.log(doc.id, '=>', doc.data());
//       });
//     })
//     .catch((err) => {
//       console.log('Error getting documents', err);
//     });
// database.ref("/newCatData/001-1").once("value",function (snapshot) {
//   catdata = snapshot.val();
//   console.log("cat data load complete");
//   let statistic,
//       exist = '000';
//   // let data = catdata["001-1"];
//   console.log(catdata);
//   db.collection("catdata").doc('001').set({"001-1":catdata})
//
// console.log("finish");
// // process.exit();
// // console.log("finish");
// // process.exit();
// });
// database.ref("/CatData").once("value",(snapshot)=>{
//   var data = snapshot.val();
//   for(let i in data){
//   let count = 0;
//   for(let j in data[i].comment) count ++;
//     console.log(i,count);
//     database.ref("/Comment/Cat/"+i).set(data[i].comment);
//   }
// })
// var mutex = new Promise(function(resolve, reject) {
//     database.ref("/catComment").once("value",(snapshot)=>{
//           resolve(snapshot.val())
//     });
// });
// mutex.then(function (comment) {
//   database.ref("/newCatData").once("value",(snapshot)=>{
//     var data = snapshot.val();
//     var exist = "000",
//         StageCount = 0,
//         SearchCount = 0;
//     for(let i in data){
//       if(i.substring(0,3) != exist){
//         if(exist!="000"){
//           console.log(exist,SearchCount);
//           database.ref("/CatData/"+exist+"/").update({
//             comment:comment[exist]?(comment[exist].comment?comment[exist].comment:"-"):"-",
//             statistic:comment[exist]?(comment[exist].statistic?comment[exist].statistic:"-"):"-",
//             count:SearchCount
//           });
//         }
//
//         exist = i.substring(0,3);
//         // StageCount = 1;
//         SearchCount = data[i].count?data[i].count:0;
//         // database.ref("/CatData/"+exist+"/data/"+StageCount).update(data[i]);
//       } else {
//         // StageCount ++;
//         SearchCount += data[i].count?data[i].count:0;
//         // database.ref("/CatData/"+exist+"/data/"+StageCount).update(data[i]);
//       }
//     }
//   });
//
// });

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

// var stagedata;
// // var url = "https://battlecats-db.com/stage/treasure_space01.html";
// database.ref("/stagedata/universe/s03006").once("value",(snapshot)=>{
//   stagedata = snapshot.val();
//   for (var i in stagedata) {
//     console.log(i,stagedata[i].name,stagedata[i].reward);
//     database.ref("/stagedata/universe/s03008/"+i).update({
//       name:stagedata[i].name,
//       reward:stagedata[i].reward
//     })
//   }

  // request({
    // url: url,
  //   method: "GET"
  // }, function(e,r,b) {
  //   if(!e){
  //     console.log("HTML loaded!");
  //     $ = cheerio.load(b);
  //     var counter = -1;
  //     var result = {};
  //     var table = $(".maincontents").find("tbody tr");
  //     table.each(function () {
  //       // console.log($(this).children('td').length);
  //       if($(this).children('td').length != 4){
  //         counter ++ ;
  //         var stage = Number($(this).children('td').eq(3).text());
  //         result[counter] = {
  //           name:$(this).children('td').eq(0).text(),
  //           effect:$(this).children('td').eq(2).text(),
  //           treasure:[{
  //             stage:stage,
  //             name:stagedata[stage].reward[0].prize.amount
  //           }]
  //         }
  //       } else {
  //         var stage = Number($(this).children('td').eq(0).text());
  //         result[counter].treasure.push({
  //           stage:stage,
  //           name:stagedata[stage].reward[0].prize.amount
  //         })
  //       }
  //     });
  //     console.log(result);
  //     fs.appendFile('treasure2.txt', JSON.stringify(result),(err) =>{
  //         if (err) throw err;
  //         console.log('Is saved!');
  //         process.exit();
  //       });
  //   }
  // });
// });

// var url = 'https://battlecats-db.com/unit/lot028.html'
// request({
//   url:url,
//   method:'GET'
// },function (e,r,b) {
//   $ = cheerio.load(b);
//   var a = {'超激レア':'ssr','激レア':'sr','レア':'r'},id = 'R323',name = "『劇場版 魔法少女☆小圓［新編］叛逆的物語』 稀有轉蛋活動",
//   obj = {
//       id:id,name:name,ssr:[],sr:[],r:[]
//     },count = 0;
//     $('.maincontents tbody').each(function () {
//         $(this).find('tr').each(function () {
//             obj[a[$(this).children().eq(1).text()]].push($(this).children().eq(0).text())
//           });
//         });
//         console.log(obj);
//         database.ref("/gachadata/mahoshojo").update(obj);
//         fs.appendFile('gacha.json', JSON.stringify(obj),(err) =>{
//           if (err) throw err;
//           console.log('Is saved!');
//         });
//   });

// var gen = (function* () {
//   for(let i=300;i<450;i++){
//     var url = `https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/gacha/rare/tw/R${AddZero(i)}.html`
//     showgachaName(url,i);
//     yield;
//   }
// })();
// gen.next();
// function showgachaName(url,i) {
//   request({
//     url:url,
//     method:'GET'
//   },function (e,r,b) {
//     $ = cheerio.load(b);
//     if($("h2").length){
//       console.log(AddZero(i),$("h2").eq(0).text());
//     }
//     gen.next();
//   });
// }

// database.ref("/user").once('value',function (snapshot) {
//   let userdata = snapshot.val(),survey;
//
// });

// geteventDay()

function AddZero(n) {
  return n<100 ? (n<10 ? "00"+n : "0"+n ): n
}

// listAllUsers();
function listAllUsers(nextPageToken) {
    let timer = new Date().getTime();
    // console.log(nextPageToken);
  // List batch of users, 1000 at a time.
  admin.auth().listUsers(100, nextPageToken)
    .then(function(listUsersResult) {
      listUsersResult.users.forEach(function(data) {
        // console.log(data.uid,data.providerData.length,data.metadata.lastSignInTime);
        // process.stdout.clearLine();
        // process.stdout.cursorTo(0);
        // process.stdout.write(data.uid,data.metadata.creationTime);

        if(data.providerData.length == 0){
          if(timer - Date.parse(data.metadata.lastSignInTime)>5*86400000){
            console.log(data.uid);
            admin.auth().deleteUser(data.uid)
            database.ref("/user/"+data.uid).set(null);
          }
          // console.log(data);
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

// request("https://battlecats-db.com/unit/188.html",(e,r,b) => {
//   let $ = cheerio.load(b);
//   var Bgc12 = 0; // cat stage
//   $(".maincontents table").find("tr[class='bgc12']").each(function(){
//     if(!Bgc12){Bgc12 ++;return;}  // ignore first bgc 12
//     let data = {};
//     data.id = 188 + '-' + Bgc12;
//     data.jp_name = $(this).children().eq(1).text();
//     var row_1 = $(this).next().next();
//     let imgURL = row_1.children().eq(1).children().attr("src");
//     console.log(imgURL);
//   })
// })
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless:false,slowMo : 100});
  const page = await browser.newPage();
  // await page.goto('https://battlecats-db.com/unit/188.html');
  // const imgElement = await page.$('img.char');
  // await imgElement.screenshot({path: 'example.png'});
  await page.goto('https://battlecats-db.imgs-server.com/u188-1.png');
  // await page.screenshot({path: 'example.png'});

  // await browser.close();
})();
