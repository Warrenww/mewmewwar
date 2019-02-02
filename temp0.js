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

var NumberOfLevel,fetch_Url,starVar,LevelArr,finalLevelPos,modify = 0;
LevelArr = [0];
getData('world','s03002z',0)
function getData(chapter,i,j,correction=false) {
  fetch_Url = "https://battlecats-db.com/stage/"+i+
    (LevelArr[j]?"-"+(Number(LevelArr[j])?AddZero(LevelArr[j]):LevelArr[j]):"")+".html";
  console.log(fetch_Url);
  request({
    url: fetch_Url,
    method: "GET"
  }, function(e,r,b) {
    if(Number(j) == 0 && !e){
      $ = cheerio.load(b);
      NumberOfLevel = ($("td[rowspan='2']").length)/2;
      $("td[rowspan='2']").each(function () {
        let x = $(this).find("a").eq(0).attr('href');
        if (!x) return;
        x = x.split(".")[0].split("-")[1];
        x = Number.isNaN(Number(x))?x:Number(x);
        LevelArr.push(x);
      });
      console.log(LevelArr);
      for(let j=0;j<LevelArr.length;j++){
        let k = j+1;
        if(k==LevelArr.length||LevelArr[k].toString().indexOf('ex')!=-1){
          finalLevelPos = j;
          break;
        }
      }
      j++;
      getData(chapter,i,j,correction,false);
      return;
    }

    var obj = {};
    if(!e){
      // console.log("get data");
      $ = cheerio.load(b);
      var content = $(".maincontents table"),
          final = Number(j) == finalLevelPos,
          thead = content.children("thead").eq(0).children("tr"),
          tbody_1 = content.children("tbody").eq((final?1:0)+modify).children("tr"),
          tbody_2 = content.children("tbody").eq((final?2:1)+modify).children("tr"),
          tbody_3 = content.children("tbody").eq((final?3:2)+modify).children("tr"),
          star_len = $("#List").find("td").eq(0).find("a").length+1;
          modify = 0;
      if (tbody_3.length) correction = true;
      else correction = false;
      try {
        obj.bg_img = thead.eq(2).children("td").eq(1).find('.bg').attr("src").split("/")[3].split(".")[0];
        obj.castle_img = thead.eq(2).children("td").eq(1).find('.castle').attr("src").split("/")[3].split(".")[0];
      } catch (e) {
        obj.bg_img = thead.eq(3).children("td").eq(1).find('.bg').attr("src").split("/")[3].split(".")[0];
        obj.castle_img = thead.eq(3).children("td").eq(1).find('.castle').attr("src").split("/")[3].split(".")[0];
      }

      console.log(obj);

      database.ref("/stagedata/"+chapter+"/"+i+"/"+LevelArr[j]).update(obj);
      j++;
      if(j<LevelArr.length) getData(chapter,i,j,correction);
      else setTimeout(()=>{process.exit()},500);
    }
    else {
      console.log(e);
    }
  });
}



// database.ref('/vote').once("value",function (snapshot) {
//   var data = snapshot.val();
//   var result = {
//     0:{
//       "移除功能":0,
//       "留下功能":0
//     },
//     1:{
//       "移除功能":0,
//       "留下功能":0
//     },
//     2:{
//       "不要改變":0,
//       "純嵌入式":0,
//       "純新視窗":0
//     }},count = 0,
//     block = "------------------\n";
//
//   for(let i in data){
//     if(data[i].length!=4){
//       console.log(data[i]);
//       continue;
//     }
//     count ++;
//     if(data[i][3]&&data[i][3]!=""&&data[i][3]!=" "){
//       fs.appendFile("comment.txt",(data[i][3])+block,(e)=>{
//         if(e) console.log(e);
//       })
//       // console.log(data[i][3]);
//     }
//     for(let j in data[i]) {
//       if(j==3)continue
//       result[j][data[i][j]] ++;
//     }
//   }
//   console.log(result);
//   // console.log('finish');
//   // process.exit();
// });

// var stagedata
// database.ref("/stagedata").once("value",function (snapshot){
//   console.log('finish');
//   stagedata = snapshot.val();
//   var exist = [];
//   for(let i in stagedata){
//     for(let j in stagedata[i]){
//       if(j == 'name') continue
//       for(let k in stagedata[i][j]){
//         if(k == 'name') continue
//         var reward = stagedata[i][j][k].reward;
//         for(let l in reward){
//           var name = reward[l].prize.name;
//           if(exist.indexOf(name) == -1){
//             console.log(name);
//             exist.push(name);
//           }
//         }
//       }
//     }
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
  return n>9 ? n : "0"+n
}
