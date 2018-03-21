var request = require("request");
var cheerio = require("cheerio");
var firebase = require("firebase");
var apiai = require("apiai");
var app = apiai("03cfa1877067410c82e545e9883f5d48");
var config = {
    apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
    authDomain: "battlecat-smart.firebaseapp.com",
    databaseURL: "https://battlecat-smart.firebaseio.com",
    projectId: "battlecat-smart",
    storageBucket: "battlecat-smart.appspot.com",
    messagingSenderId: "268279710428"
  };
  firebase.initializeApp(config);
  var database = firebase.database();

  var t = new Date(),
      y = t.getFullYear(),
      m = AddZero(t.getMonth()+1),
      d = AddZero(t.getDate()),
      url = 'https://forum.gamer.com.tw/B.php?bsn=23772&subbsn=7',
      root = 'https://forum.gamer.com.tw/';
  // aibot("你好")


  request({
    url: url,
    method: "GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      // console.log($("tbody").html());
      let title = $(".b-list__row");
      let today = y+m+d;
      let arr = [];
      console.log(today);
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
            console.log(a.text());
            console.log(b);
            arr.push(root+a.attr("href"));
          }
        }
      });
      console.log(arr[0]);
      parsePrediction(arr[0]);
    }
  });
  function parsePrediction(url) {
    request({
      url:url,
      method:"GET"
    },function (e,r,b) {
      let obj = {
        source_1 : url
      }
      if(!e){
        $ = cheerio.load(b);
        let gachaP = $("section").eq(0).find(".c-article__content"),
            eventP = $("section").eq(1).find(".c-article__content");
        // console.log(gachaP.text());
        // console.log(eventP.text());
        console.log(gachaP.find('a').attr("href"));
        gachaP.children("div").each(function () {
          let content = $(this).text();
          if(content&&content.length<30){
            // console.log(content);
            let arr = content.split(' ');
            // console.log(arr);
            let brr = arr[0].split("~");
            console.log(brr,arr[1],arr[2]);
          }
        });
      }
    });
  }
