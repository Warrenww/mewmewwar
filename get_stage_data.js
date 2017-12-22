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

  var i=0,j=1;
  getData(i,j);

  function getData(i,j) {
    console.log("https://battlecats-db.com/stage/s000"+AddZero(i)+"-0"+j+".html");
    request({
      url: "https://battlecats-db.com/stage/s000"+AddZero(i)+"-0"+j+".html",
      method: "GET"
    }, function(e,r,b) {
      let obj = {
        name : "",
        energy : "",
        exp : "",
        castle : "",
        length : "",
        limit_no : "",
        reward : [],
        enemy : [],
        final : ""
      };
      if(!e){
        console.log("get s000"+AddZero(i)+"-0"+j);
        $ = cheerio.load(b);
        let content = $(".maincontents table"),
        final = content.children().length == 6 ? true : false,
        thead = content.children("thead").eq(0).children("tr"),
        tbody_1 = content.children("tbody").eq(final?1:0).children("tr"),
        tbody_2 = content.children("tbody").eq(final?2:1).children("tr");
        console.log(final);
        obj.final = final;
        obj.name = thead.eq(0).children("td").eq(2).text().split(" ")[0];
        obj.energy = thead.eq(0).children("td").eq(4).text();
        obj.exp = thead.eq(1).children("td").eq(1).text().split("XP+")[1];
        obj.castle = thead.eq(2).children("td").eq(2).text();
        obj.length = thead.eq(3).children("td").eq(2).text();
        obj.limit_no = thead.eq(4).children("td").eq(2).text();
        for(let k = 0;k<tbody_1.length;k++){
          process.stdout.write("reward "+k);
          obj.reward.push({
            prize : parsePrize(tbody_1.eq(k).children("td").eq(1)),
            chance : tbody_1.eq(k).children("td").eq(3).text(),
            limit : tbody_1.eq(k).children("td").eq(4).text() == '無制限' ? "無限" : tbody_1.eq(k).children("td").eq(4).text()
          });
          process.stdout.write(" "+JSON.stringify(obj.reward[k].prize)+"\n");
        }
        for(let k=0;k<tbody_2.length;k++){
          console.log("enemy "+k);
          let ene = tbody_2.eq(k).children("td")
          obj.enemy.push({
            Boss : ene.eq(0) == "Boss" ? true : false,
            id : ene.eq(1).children("a").attr("href").split("/")[2].split(".html")[0],
            multiple : ene.eq(3).text(),
            amount : ene.eq(4).text(),
            castle : ene.eq(5).text(),
            first_show : Number(ene.eq(6).text())/30,
            next_time : FtoS(ene.eq(7).text())
          });
        }
        // console.log(obj);
        // console.log("next?");
        database.ref("/stagedata/s000"+AddZero(i)+"/"+j).set(obj);
        j++;
        if(final){j=1;i++}
        getData(i,j);
      }
      else {
        console.log("error s000"+AddZero(i)+"-0"+j);
        console.log(e);
      }
    });

  }
  function parsePrize(p) {
    let obj ={name:"",amount:""},
    s = p.text();
    if(s.indexOf("XP+")!=-1){
      obj.name = "經驗值";
      obj.amount = s.substring(3);
    } else if(s.indexOf("個")!=-1){
      switch (s.split(" ")[0]) {
        case "スピードアップ":
          obj.name = "加速";
          obj.amount = s.split(" ")[1];
          break;
        case "おかめはちもく":
          obj.name = "洞悉先機";
          obj.amount = s.split(" ")[1];
          break;
        case "ニャンピュータ":
          obj.name = "貓型電腦";
          obj.amount = s.split(" ")[1];
          break;
        case "ネコボン":
          obj.name = "土豪貓";
          obj.amount = s.split(" ")[1];
          break;
        case "スニャイパー":
          obj.name = "狙擊手";
          obj.amount = s.split(" ")[1];
          break;
        default:
        obj.name = "noname";
        obj.amount = 1;
      }
    } else {
      obj.name = "u" + p.children("a").attr("href").split("/")[2].split(".html")[0]
    }
    // console.log(obj);
    return obj
  }
  function FtoS(s) {
    if(s == "-") return "-"
    let arr = s.indexOf("~") != -1 ? s.split("~") : s.split("～");
    for(let i in arr) arr[i] = Number(arr[i])/30;
    return arr.join("~")
  }
  function AddZero(n) {
    return n<10 ? "0"+n : n
  }
