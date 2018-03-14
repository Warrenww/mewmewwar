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
//   for(let i in catdata){
//     if(catdata[i].survey){
//       console.log(i,catdata[i].survey);
//       // let survey = catdata[i].survey;
//       // survey.rank = {atk:"",control:"",cost:"",hp:"",range:"",speed:"",total:""};
//       // for(let j in survey.rank){
//       //   survey.rank[j] = {1:0,2:0,3:0,4:0,5:0}
//       // }
//       // database.ref("/newCatData/"+i+"/statistic").set(survey);
//     }
//   }
// });

database.ref('/user').once("value",function (snapshot) {
  console.log('finish');
  userdata = snapshot.val();
  let buffer = []
  for(let i in userdata){
    let data = userdata[i];
    for(let j in data.variable.cat){
      let cat = data.variable.cat[j];
      if(cat.survey){
        for(let k in cat.survey){
          // console.log(i,k);
          // console.log(cat.survey[k]);
          let str = i+" "+k+"\n\n"+JSON.stringify(cat.survey[k])+"\n\n";
          fs.appendFile('survey.txt', str, function (err) {
            if (err) throw err;
            console.log('Updated!',i,k);
          });
          // database.ref("/newCatData/"+k+"/survey").set(obj);
          // database.ref("/user/"+i+"/variable/cat/"+j+"/survey/"+k).set(obj);


        }
      }
    }
  }
});

// function getthewww(i) {
//   // console.log(AddZero(i));
//   request({
//     url: "http://battlecats-db.com/unit/"+AddZero(i)+".html",
//     method: "GET"
//   },function (e,r,b) {
//     if(!e){
//       $ = cheerio.load(b);
//       let j = 1;
//       $("tr").each(function () {
//         let stage = $(this).children("td").eq(0).text();
//         let name = $(this).children("td").eq(1).text();
//         // console.log(stage+":"+name);
//         if(stage == '開放条件'){
//           let id = AddZero(i)+"-"+j;
//           process.stdout.clearLine();
//           process.stdout.cursorTo(0);
//           process.stdout.write("loading cat data "+id+"---");
//           process.stdout.write((Number(i)/384*100).toFixed(2).toString());
//           process.stdout.write("%");
//           // console.log(id,parseCondition(name,id));
//           database.ref("/catdata/"+id+"/get_method").set(parseCondition(name,id));
//           j++
//         }
//         // console.log("/stagedata/story/s000"+(AddZero(stage[0])-1)+"/"+stage[1]);
//       });
//       i++;
//       if(i<384) getthewww(i)
//
//     } else {console.log(e);}
//   });
//
// }
function AddZero(n) {
  return n>99 ? n : (n>9 ? "0"+n : "00"+n)
}
// function parseCondition(s,id) {
//   if(s.indexOf("マタタビ") != -1){
//     let g = s.indexOf("緑"),p = s.indexOf("紫"),
//         r = s.indexOf("赤"),b = s.indexOf("青"),
//         y = s.indexOf("黄"),ra = s.indexOf("虹"),
//         se = s.indexOf("種"),
//         html = '合併等級Lv 30以上 + ' ;
//     // console.log(g+","+p+","+r+","+b+","+y+","+ra+","+se);
//     let arr = [g,p,r,b,y,ra],brr = ['綠色','紫色','紅色','藍色','黃色','彩虹'];
//     // console.log(arr);
//     for (let i in arr){
//       if(arr[i] != -1){
//         html += brr[i]+"貓薄荷"+(se == -1 ? "" : (arr[i]>se ? "種子" : "" ))+s.substring(arr[i]+1,arr[i]+2)+"個,";
//       }
//     }
//     // console.log(html.length);
//     return html.substring(0,html.length-1)
//   } else if(s.indexOf(" ＆ ") != -1){
//     let ww = s.split(" ＆ ");
//     ww[1] = ww[1].split("にゃんこガチャ").join("").split("ネコカン").join("貓罐頭");
//     return ww.join(" + ")
//   }
//   else if(s.indexOf("開眼の")!=-1&&s.indexOf("襲来！")!=-1){
//     let ww = "開眼的"+catdata[id]["全名"]+"襲來! + 合併等級Lv20以上";
//     // console.log(ww);
//     return ww ;
//   }
//   else if(s.indexOf("Lv") != -1 && s.indexOf("SP") == -1){
//     return "合併等級Lv" + s.split("Lv")[1] +"以上"
//   }
//   else {
//     switch (s) {
//       case '各種ガチャ ':
//         s = '從稀有轉蛋中獲得'
//         break
//       default:
//         break
//     }
//     return s
//   }
//
// }
