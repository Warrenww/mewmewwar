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

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that
    // with toString() and then trim()
    console.log("you entered: [" +
        d.toString().trim() + "]");
  });
database.ref("/newCatData").once("value",function (snapshot) {
  console.log('load complete');
  catdata = snapshot.val();
  for(let i in catdata){
    // console.log(catdata[i].speed);
    if(catdata[i].speed == '0'){
      console.log(i,catdata[i].name);
    }
  }
  let id = "186" ;
  let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/gacha/rare/tw/R"+id+".html"
  // request({
  //   url:url,
  //   method: "GET"
  // },function (e,r,b) {
  //   if(!e){
  //     $ = cheerio.load(b);
  //     // let name = $(".mb10").text().split("「")[1].split("」")[0]+" 稀有轉蛋";
  //     let name = "蛋黃哥 合作活動 稀有轉蛋";
  //     let obj = {ssr:[],sr:[],r:[]};
  //     console.log(name);
  //     let count = 0;
  //     $(".block").children(".chara_block01").each(function () {
  //       count++;
  //       let a = $(this).find(" table tr").eq(1).children("td").eq(0),
  //       c = a.children(".name").children(".t02").text();
  //       for(let i in catdata){
  //         if(catdata[i].name == c){
  //           console.log(i,c);
  //           database.ref("/catdata/"+i+"/get_method").set(name);
  //           obj.ssr.push(i);
  //         }
  //       }
  //     });
  //     let w = "sr"
  //     $(".block").children(".apc_chara01").each(function () {
  //       let d = $(this).children(".apc_name").text().trim().split(", ");
  //       console.log(d);
  //       console.log(w);
  //       for(let i in catdata){
  //         if(d.indexOf(catdata[i].name)!=-1){
  //            console.log(i,catdata[i].name);
  //            database.ref("/catdata/"+i+"/get_method").set(name);
  //            obj[w].push(i);
  //          }
  //       }
  //       w = 'r';
  //     });
  //     database.ref("/gachadata/R"+id).set({name:name,content:obj});
  //     console.log("count:",count);
  //     setTimeout(function () {
  //       process.exit();
  //     },2000);
  //   }else{console.log(e);}
  // });

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
