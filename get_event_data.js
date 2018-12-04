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

var start,end;
  request({
    url: url,
    method: "GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
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
            start = b[0];end=b[1];
            console.log(start,end);
            arr.push({url:root+a.attr("href"),start:start,end:end,name:a.text()});
          }
        }
      });
      console.log(arr);
      for(i in arr){
        parsePrediction(arr[i]);
      }
    }
  });
  function parsePrediction(obj) {
    request({
      url:obj.url,
      method:"GET"
    },function (e,r,b) {
      if(!e){
        $ = cheerio.load(b);
        var gachaP = $("section").eq(0).find(".c-article__content"),
            eventP = $("section").eq(1).find(".c-article__content");
        var gachaObj = [],eventObj = [],dateRe = /[0-9]+\/[0-9]+\~[0-9]+\/[0-9]+/ ;
        gachaP.find("div").each(function () {
          var content = $(this).text();
          if(content&&content.length<30){
            let arr = content.split(' ');
            let brr = arr[0].split("~");
            let cc = dateRe.test(arr[0]);
            if(cc){
              gachaObj.push({
                date:brr,name:arr[1],
                sure:arr[2].indexOf('必中')!=-1
              });
            }
          }
        });
        eventP.children("div").each(function () {
          let content = $(this).text();
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
      let path = "/event_date/prediction"+(obj.name.indexOf('日版')!=-1?"_jp":"")
      database.ref(path).set({
        start:obj.start,
        end:obj.end,
        source:obj.url,
        eventP:eventObj,
        gachaP:gachaObj
      });
      // process.exit()
    });
  }
function AddZero(n) {
  return n>9?n:'0'+n
}
