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

var i=150;
getthewww(i)
function getthewww(i) {
  // console.log(AddZero(i));
  request({
    url: "http://battlecats-db.com/unit/"+AddZero(i)+".html",
    method: "GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      let j = 1;
      $("tr").each(function () {
        let stage = $(this).children("td").eq(0).text();
        let name = $(this).children("td").eq(1).text();
        // console.log(stage+":"+name);
        if(stage == '開放条件'){
          console.log(AddZero(i)+"-"+j+":"+parseCondition(name));
          j++
        }
        // console.log("/stagedata/story/s000"+(AddZero(stage[0])-1)+"/"+stage[1]);
      });
      i++;
      if(i<200) getthewww(i)

    } else {console.log(e);}
  });

}
function AddZero(n) {
  return n>99 ? n : (n>9 ? "0"+n : "00"+n)
}
function parseCondition(s) {
  if(s.indexOf("マタタビ") != -1){
    let g = s.indexOf("緑"),p = s.indexOf("紫"),
        r = s.indexOf("赤"),b = s.indexOf("青"),
        y = s.indexOf("黄"),ra = s.indexOf("虹"),
        se = s.indexOf("種"),
        html = '合併等級Lv 30以上 + ' ;
    // console.log(g+","+p+","+r+","+b+","+y+","+ra+","+se);
    let arr = [g,p,r,b,y,ra],brr = ['綠色','紫色','紅色','藍色','黃色','彩虹'];
    // console.log(arr);
    for (let i in arr){
      if(arr[i] != -1){
        html += brr[i]+"貓薄荷"+(se == -1 ? "" : (arr[i]>se ? "種子" : "" ))+s.substring(arr[i]+1,arr[i]+2)+"個,";
      }
    }
    // console.log(html.length);
    return html.substring(0,html.length-1)
  } else if(s.indexOf(" ＆ ") != -1){
    let ww = s.split(" ＆ ");
    ww[1] = ww[1].split("にゃんこガチャ").join("").split("ネコカン").join("貓罐頭");
    return ww.join(" + ")
  } else if(s.indexOf("Lv") != -1 && s.indexOf("SP") == -1){
    return "合併等級Lv" + s.split("Lv")[1] +"以上"
  } else {
    switch (s) {
      case '各種ガチャ ':
        s = '從稀有轉蛋中獲得'
        break
      default:
        break
    }
    return s
  }

}
