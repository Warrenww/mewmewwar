var request = require("request");
var cheerio = require("cheerio");
var firebase = require("firebase");
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
  var map = {};
  var i = 171,exist = [];

  database.ref("/newCatData").once('value',function (snapshot) {
    console.log('loading cat data');
    let catdata = snapshot.val();
    for(let i in catdata){
      map[catdata[i].name] = i;
    }
    console.log('load complete');
    getData(i);
  });

  function getData(id) {
    // console.log("https://battlecats-db.com/stage/s070"+"00-"+AddZero(j)+".html");
    let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/gacha/rare/tw/R"+AddZero(id)+".html";
    request({
      url: url,
      method: "GET"
    }, function(e,r,b) {
      let obj = {
        id : "R"+AddZero(id),
        name : "",
        ssr : [],
        sr : [],
        r : []
      };
      if(!e){
        $ = cheerio.load(b);
        let name = $("h2").text();
        name = parseName(name);

        if(exist.indexOf(name)==-1) {
          exist.push(name);
          console.log(id,name);
          obj.name = name ;
          let block = $(".block"),
              ssr_holder = $(".chara_block01"),
              sr_holder = $(".chara_ttl02").next().children(".apc_name").text().trim(),
              r_holder = $(".chara_ttl03").next().children(".apc_name").text().trim(),
              arr;

          ssr_holder.each(function () {
            let ssr = $(this).find(".txt02").eq(0).find(".t02").text();
            // console.log(ssr);
            obj.ssr.push(map[ssr]);
          });
          $(".mt10").each(function () {
            let ssr = $(this).next().find(".apc_name").text().trim().split(", ");
            console.log(ssr);
            for(let j in ssr) obj.ssr.push(map[ssr[j]]);
          })
          arr = sr_holder.split(", ")
          console.log(arr);
          for(let j in arr){
            if(arr[j]) obj.sr.push(map[arr[j]]);
          }

          arr = r_holder.split(", ")
          // console.log(arr);
          for(let j in arr){
            if(arr[j]) obj.r.push(map[arr[j]]);
          }

          console.log(obj);
          database.ref("/gachadata/"+obj.id).update(obj);
        }

        // id--;
        // if(id<10) process.exit();
        // getData(id);
        setTimeout(function () {process.exit();},1000)
      }
      else {
        // console.log("error s070"+AddZero(i)+"-0"+j);
        console.log(e);
      }
    });

  }
function parseName(n) {
  if(n.indexOf("「")!=-1){
    n = n.split("「")[1].split("」")[0];
  } else if(n.indexOf("稀有轉蛋活動")!=-1) {
    n = n.split("稀有轉蛋活動")[0]
  }
  return n
}
function AddZero(n) {
    return n<100 ? "0"+n : n
  }
