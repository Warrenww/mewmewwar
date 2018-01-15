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

  var i=6,j=1;
  getData(i,j);
  function getData(i,j) {
    // console.log("https://battlecats-db.com/stage/s070"+"00-"+AddZero(j)+".html");
    request({
      url: "https://battlecats-db.com/stage/s0300"+i+"-"+AddZero(j)+".html",
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
        final : "",
        "continue" : "",
        id:"universe-s0300"+i+"-"+j
      };
      if(!e){
        // console.log("get data");
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(obj.id+"---");
        process.stdout.write((j/48*100).toFixed(1).toString()+"%");
        $ = cheerio.load(b);
        let content = $(".maincontents table"),
        final = content.children().length == 6 ? true : false,
        thead = content.children("thead").eq(0).children("tr"),
        tbody_1 = content.children("tbody").eq(final?1:0).children("tr"),
        tbody_2 = content.children("tbody").eq(final?2:1).children("tr");
        // console.log(final);
        obj.final = final;
        obj.name = thead.eq(0).children("td").eq(2).text().split(" ")[0];
        obj.continue = thead.eq(0).children("td").eq(2).find("font").text()=="コンテニュー不可"?false:true;
        obj.integral = thead.eq(0).children("td").eq(2).find("font").text()=="採点報酬"?true:false;
        obj.constrain = thead.eq(0).children("td").eq(2).find("font").text().indexOf("制限")!=-1?parseConstrain(thead.eq(0).children("td").eq(2).find("font").text()):null;
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
          // process.stdout.write(" "+JSON.stringify(obj.reward[k].prize)+"\n");
        }
        for(let k=0;k<tbody_2.length;k++){
          // console.log("enemy "+k);
          let ene = tbody_2.eq(k).children("td")
          obj.enemy.push({
            Boss : ene.eq(0).text() == "BOSS" ? true : false,
            id : ene.eq(1).children("a").attr("href").split("/")[2].split(".html")[0],
            multiple : ene.eq(3).text(),
            amount : ene.eq(4).text(),
            castle : ene.eq(5).text(),
            first_show : (Number(ene.eq(6).text())/30).toFixed(1),
            next_time : FtoS(ene.eq(7).text())
          });
        }
        // console.log(obj);
        database.ref("/stagedata/universe/s0300"+i+"/"+j).set(obj);
        j++;
        // if(final){j=1;i++}
        // if(!final) getData(i,j);
        if(j<49) getData(i,j);
        // else {i++;j=1;if(i<3)getData(i,j);}
      }
      else {
        // console.log("error s070"+AddZero(i)+"-0"+j);
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
    } else if(s.indexOf("個")!=-1||s.indexOf("枚")!=-1){
      if(s.split(" ")[0].indexOf('マタタビ')!=-1){
        let arr = s.split(" ")[0].split("マタタビ") ;
        switch (arr[0]) {
          case '青':
            arr[0] = '藍色'
            break;
          case '赤':
            arr[0] = '紅色'
            break;
          case '緑':
            arr[0] = '綠色'
            break;
          case '虹':
            arr[0] = '彩虹'
            break;
          default:
            arr[0] = arr[0]+"色"
        }
        arr[1] = arr[1] ? "種子" : "";
        obj.name = arr.join("貓薄荷");
      }
      else if(s.split(" ")[0].indexOf('キャッツアイ')!=-1){
        let arr = s.split(" ")[0].split("キャッツアイ") ;
        arr[1] = (arr[1].split("レア")).join("稀有");
        obj.name = "貓眼石"+arr[1];
      }
      else {
        switch (s.split(" ")[0]) {
          case "謎の骨":
          obj.name = "神秘骨頭";
          break;
          case "鋼の歯車":
          obj.name = "鋼製齒輪";
          break;
          case "羽根":
          obj.name = "羽毛";
          break;
          case "レンガ":
          obj.name = "紅磚";
          break;
          case "トレジャーレーダー":
          obj.name = "寶物雷達";
          break;
          case "ネコビタンＣ":
          obj.name = "喵力達C";
          break;
          case "ネコビタンＢ":
          obj.name = "喵力達B";
          break;
          case "ネコビタンＡ":
          obj.name = "喵力達A";
          break;
          case "にゃんこチケット":
          obj.name = "貓咪卷";
          break;
          case "レアチケット":
          obj.name = "稀有卷";
          break;
          case "スピードアップ":
          obj.name = "加速";
          break;
          case "おかめはちもく":
          obj.name = "洞悉先機";
          break;
          case "ニャンピュータ":
          obj.name = "貓型電腦";
          break;
          case "ネコボン":
          obj.name = "土豪貓";
          break;
          case "スニャイパー":
          obj.name = "狙擊手";
          break;
          default:
          obj.name = s.split(" ")[0];
        }
      }
      obj.amount = s.split(" ")[1];
    } else if(p.children("img").attr("src")) {
      obj.name = "u" + p.children("img").attr("src").split("/")[3].split(".png")[0]
    } else {
      obj.name = s;
    }
    // console.log(obj);
    return obj
  }
  function parseConstrain(c) {
    // process.stdout.write("\n");
    c = c.split(" ")[1];
    // console.log(c);
    if(c.indexOf("コスト")!=-1){
      c = "生產成本:"+c.split("コスト")[1].split("円").join("元");
    }
    else if(c.indexOf("最大キャラ数")!=-1){
      c = "最大出擊數量:"+c.split("最大キャラ数")[1].split("体")[0];
    }
    else if(c.indexOf("スロット1ページ目のみ")!=-1){
      c = "出陣列表:僅限第一頁";
    }
    else {
      c = c.split("レア").join("稀有");
    }
    // console.log(c);
    return c
  }
  function FtoS(s) {
    if(s == "-") return "-"
    let arr = s.indexOf("~") != -1 ? s.split("~") : s.split("～");
    for(let i in arr) arr[i] = (Number(arr[i])/30).toFixed(1);
    return arr.join("~")
  }
  function AddZero(n) {
    return n<10 ? "0"+n : n
  }
