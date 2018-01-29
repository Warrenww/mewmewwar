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

  function aibot(text) {
    var request = app.textRequest(text, {
      sessionId: '35f29ddd-bf05-45b4-bb45-c0d840f72b47',
    });
    request.on('response', function(response) {
      console.log(response);
    });
    request.on('error', function(error) {
      console.log(error);
    });
    request.end();
  }
  // aibot("你好")

  var i=100,j=1;
  getData();
  function getData() {
    // console.log("https://battlecats-db.com/stage/s070"+"00-"+AddZero(j)+".html");
    let url = "https://forum.gamer.com.tw/B.php?bsn=23772&subbsn=7";
    // console.log(url);
    request({
      url: url,
      method: "GET"
    }, function(e,r,b) {
      let obj = {tag:[],char:[]};
      if(!e){
        console.log("get data");
        // process.stdout.clearLine();
        // process.stdout.cursorTo(0);
        // process.stdout.write(obj.id+"---");
        // process.stdout.write((j/48*100).toFixed(1).toString()+"%");
        $ = cheerio.load(b);
        let table = $("table[class='b-list']");
        table.find(".b-list__row").each(function () {
          let title = $(this).children(".b-list__main").find("a"),
              text = title.text().trim(),
              link = title.attr("href"),
              edit_time = $(this).find('.b-list__time__edittime').text().split(" ")[0].trim(),
              today = new Date().getDay();
          if(text.indexOf("活動資訊")!=-1){
            // console.log(edit_time);
            if( edit_time == '今日' || edit_time == '昨日'){
              console.log(text,link);
              goToPage(link);
            }
          }
        });
      }
      else {
        // console.log("error s070"+AddZero(i)+"-0"+j);
        console.log(e);
      }
    });
  }

  function goToPage(link) {
    let url = 'https://forum.gamer.com.tw/'+link;
    request({
      url: url,
      method: "GET"
    }, function(e,r,b) {
      if(!e){
        $ = cheerio.load(b);

      } else {console.log(e);}
    });
  }
