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

  var i=379,j=1;
  getData(i,j);
  function getData(i,j) {
    // console.log("https://battlecats-db.com/stage/s070"+"00-"+AddZero(j)+".html");
    let url = "https://battlecats-db.com/unit/"+AddZero(i)+".html";
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
        let content = $(".maincontents table"),
        bro = content.find("tr[class='bgc12']").length-1,
        row_1 = content.find("tr[class='bgc12']").eq(j).next().next(),
        row_2 = row_1.next(),
        row_3 = row_2.next(),
        row_4 = row_3.next(),
        row_5 = row_4.next();

        obj.jp_name = content.find("tr[class='bgc12']").eq(j).children().eq(1).text();
        obj.rarity = parseRarity(row_1.children().eq(0).eq(0).text());
        obj.hp = Number(row_1.children().eq(3).children().eq(0).text().split(",").join(""));
        obj.hp = ToOriginal(obj.hp,obj.rarity);
        obj.kb = Number(row_1.children().eq(5).text());
        obj.hardness = obj.hp/obj.kb ;
        obj.freq = Number(row_1.children().eq(7).children().eq(0).text()/30);
        obj.atk = Number(row_2.children().eq(1).children().eq(0).text().split(",").join(""));
        obj.atk = ToOriginal(obj.atk,obj.rarity);
        obj.speed = Number(row_2.children().eq(3).children().eq(0).text().split(",").join(""));
        obj.atk_speed = Number(row_2.children().eq(5).children().eq(0).text())/30;
        obj.dps = obj.atk/obj.freq ;
        obj.range = Number(row_3.children().eq(5).text().split(",").join(""));
        obj.atk_period = Number(row_3.children().eq(7).children().eq(0).text())/30;
        obj.aoe = row_4.children().eq(3).children().eq(0).text() == "単体" ? false : true;
        parseChar(row_5.children().eq(1),obj);


        console.log(AddZero(i)+"-"+j);
        console.log(obj);
        if(j<bro) j++;
        else{j=1;i++}
        getData(i,j)
      }
      else {
        // console.log("error s070"+AddZero(i)+"-0"+j);
        console.log(e);
      }
    });

  }
  function parseRarity(r) {
    switch (r) {
      case "基本":
        r = "B";
        break;
      case "レア":
        r = "R";
        break;
      case "激レア":
        r = "SR";
        break;
      case "超激レア":
        r = "SSR";
        break;
      case "激レア狂乱":
        r = "SR_alt";
        break;
      default:
        r = r
    }
    return r
  }
  function ToOriginal(n,r) {
    switch (r) {
      case "B":
        n /= 16.8 ;
        break;
      case "SR_alt":
        n /= 5.8 ;
        break;
      default:
        n /= 6.8 ;
    }
    return n
  }
  function parseChar(c,obj) {
    c = c.html().split("<font class=\"at1")[0].split("<br>");
    for(let i in c){
      c[i] = $("<div/>").html(c[i]).text();
    }
    console.log(c);
    // console.log(trash);
    // c = c.text().split(trash)[0] ;

    if(c == '-'){
      obj.char = "無" ;
      return
    }
    else {
      for(let i in c){
        let type = ""
        if(c[i].indexOf("遠方")!=-1){
          obj.tag.push("遠方攻擊");
          obj.char.push({
            type:"遠方攻擊",
            range:c[i].split("（")[1].split("）")[0].split("～")
          });
        }
        else if(c[i].indexOf("無効")!=-1){
          let aa = c[i].split("（")[1].split("）")[0].split(" ");
          console.log(aa);
          for(let i in aa){
            obj.tag.push("免疫"+parseAbility(aa[i]));
            obj.char.push({type:"免疫"+parseAbility(aa[i])});
          }
        }
        else if(c[i].indexOf("クリティカル")!=-1){
          let aa = c[i].split("％")[0];
          obj.tag.push("爆擊");
          obj.char.push({
            type:"會心一擊",
            chance:aa
          });

        }
      }
      return
    }

  }
  function parseAbility(s) {
    switch (s) {
      case "ふっとばす":
        s = "擊退";
        break;
      case "止める":
        s = "暫停";
        break;
      case "遅くする":
        s = "緩速";
        break;
      case "動きを遅くする":
        s = "緩速";
        break;
      case "攻撃力低下":
        s = "降攻";
        break;
      default:
        s = s ;
    }
    return s
  }
  function AddZero(n) {
    return n>99 ? n : (n>9 ? "0"+n : "00"+n)
  }
