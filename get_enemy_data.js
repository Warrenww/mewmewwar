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

  var i=390;
  getData(i);
  function getData(i) {
    // console.log("https://battlecats-db.com/stage/s070"+"00-"+AddZero(j)+".html");
    let url = "https://battlecats-db.com/enemy/"+AddZero(i)+".html";
    // console.log(url);
    request({
      url: url,
      method: "GET"
    }, function(e,r,b) {
      let obj = {tag:[],char:[],id:i,color:[]};
      if(!e){
        console.log("get data");
        // process.stdout.clearLine();
        // process.stdout.cursorTo(0);
        // process.stdout.write(obj.id+"---");
        // process.stdout.write((j/48*100).toFixed(1).toString()+"%");
        $ = cheerio.load(b);

        let content = $(".maincontents table").find("tr[class='bgc12']"),
          row_1 = (content.length=='2'?content.eq(1):content.eq(0)).next().next(),
          row_2 = row_1.next(),
          row_3 = row_2.next(),
          row_4 = row_3.next(),
          row_5 = row_4.next(),
          row_7 = row_5.next().next(),
          row_8 = row_7.next();

        obj.jp_name = content.find("tr[class='bgc12']").eq(0).children().eq(1).text();
        row_1.children().eq(0).find('a').each(function () {
          obj.color.push(parseEnemy($(this).text()));
        });
        obj.hp = Number(row_1.children().eq(3).children().eq(0).text().split(",").join(""));
        obj.kb = Number(row_1.children().eq(5).text().split(",").join(""));
        obj.hardness = obj.hp/obj.kb ;
        obj.hardness = obj.hardness!=Infinity?obj.hardness:'Infinity';
        obj.atk_speed = Number(row_1.children().eq(7).text())/30;
        obj.atk = Number(row_2.children().eq(1).children().eq(0).text().split(",").join(""));
        obj.speed = Number(row_2.children().eq(3).text());
        obj.freq = Number(row_2.children().eq(5).children().eq(0).text()/30);
        obj.dps = obj.atk/(obj.freq?obj.freq:obj.atk_speed) ;
        obj.range = Number(row_3.children().eq(5).text().split(",").join(""));
        obj.aoe = row_3.children().eq(3).children().eq(0).text() == "単体" ? false : true;
        obj.reward = Number(row_3.children().eq(7).text().split(",").join(""));
        parseChar(row_4.children().eq(1),obj);
        // parseCondition(row_7,row_8,obj);

        console.log(obj);
        database.ref("/enemydata/"+AddZero(i)).update(obj);

        i++;
        if(i<394)
          getData(i);
        else
          setTimeout(function () {
            process.exit()
          },1000);

      }
      else {
        // console.log("error s070"+AddZero(i)+"-0"+j);
        console.log(e);
      }
    });

  }
  function parseChar(c,obj) {
    c = c.html().split("<font class=\"at1 hide")[0].split("<br>");
    for(let i in c){
      c[i] = $("<div/>").html(c[i]).text();
    }
    console.log(c);

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
        else if(c[i].indexOf("バリア")!=-1){
          let aa = c[i].split("（")[1].split('）')[0].split(",").join("");
          obj.tag.push("護盾");
          obj.char.push({
            type:"護盾",
            hard:Number(aa),
          });
        }
        else if(c[i].indexOf("無効（")!=-1){
          let aa = c[i].split("（")[1].split("）")[0].split(" ");
          console.log(aa);
          for(let i in aa){
            obj.tag.push("免疫"+parseAbility(aa[i]).trim());
            obj.char.push({type:"免疫"+parseAbility(aa[i])});
          }
        }
        else if(c[i].indexOf("メタル")!=-1){

          obj.tag.push("鋼鐵");
          obj.char.push({type:"鋼鐵 (受到會心一擊以外傷害值為1)"});

        }
        else if(c[i].indexOf("クリティカル")!=-1){
          let aa = c[i].split("％")[0];
          obj.tag.push("爆擊");
          obj.char.push({
            type:"會心一擊",
            chance:aa
          });
        }
        else if(c[i].indexOf("連続攻撃")!=-1){
          let aa = c[i].split("連続攻撃"),
          bb = aa[1].split("（")[1].split("）")[0].split(" "),
          sum = 0;
          for(let i in bb){
            bb[i] = Number(bb[i].split(",").join(""));
            sum += bb[i];
          }
          for(let i in bb) bb[i] /= sum;
          console.log(bb);
          obj.tag.push("連續攻擊");
          obj.char.push({
            type:aa[0]+"段連續攻擊",
            arr:bb
          })
        }
        else if(c[i].indexOf("お城")!=-1){
          obj.tag.push("攻城");
          obj.char.push({
            type:"對貓咪城傷害x4"
          });
        }
        else if(c[i].indexOf("蘇生")!=-1){
          let aa = c[i].split("％"),
          times = c[i].split("（")[1].split("）")[0];
          obj.tag.push("復活");
          obj.char.push({
            type:"重生",
            hp:Number(aa[0].split("力")[1]),
            delay:Number(c[i].split("F")[0].split("た")[1])/30,
            times:times == '無制限'?'無限': Number(times.split("回")[0])
          });
        }
        else if(c[i].indexOf("地中移動")!=-1){
          let aa = c[i].split("％"),
          times = c[i].split("（")[1].split("）")[0];
          obj.tag.push("潛地");
          obj.char.push({
            type:"地中移動",
            delay:Number(c[i].split("F")[0].split("と")[1])/30,
            times:times == '無制限'?'無限': Number(times.split("回")[0])
          });
        }
        else if(c[i].indexOf("残り体力")!=-1){
          let aa = c[i].split("％"),
          low = Number(aa[0].split("力")[1]),
          per = Number(aa[1].split("力")[1]);
          obj.tag.push("增攻");
          obj.char.push({
            type:"增攻",
            lower:low,
            percent:per
          });
        }
        else if(c[i].indexOf("へワープさせる")!=-1){
          let aa = c[i].split("％");
          obj.tag.push("傳送");
          obj.char.push({
            type:"傳送",
            chance:Number(aa[0]),
            dist:Number(aa[1].split('後方')[0].split('で')[1]),
            time:Number(aa[1].split('（')[1].split('F）')[0])
          });
        }
        else if (c[i].indexOf("の確率で")!=-1) {
          c[i] = c[i].split(" ※")[0];
          let aa = c[i].split("％の確率で")[0].split(" "),
          ene = aa[1]?(aa.length<4||aa.indexOf("除く）")!=-1 ?[parseEnemy(aa[1])]:[parseEnemy(aa[1]),parseEnemy(aa[2])]):"",
          cha = Number(aa[aa.length-1]),
          bb = c[i].split("の確率で")[1].indexOf("F")!=-1?c[i].split("の確率で")[1].split("F"):c[i].split("の確率で"),
          tim = Number(bb[0].split("～")[0])/30,abi = parseAbility(bb[1]);
          for(let j in ene){
            if(obj.tag.indexOf("對"+ene[j].substring(0,2))==-1&&ene!="")
            obj.tag.push("對"+ene[j].substring(0,2));
            if(aa.indexOf("除く）")!=-1&&aa.indexOf(" 全ての敵（白")==-1) obj.tag.push("對白色")
          }
            obj.tag.push(abi.split(" ")[0]);
            if(aa.indexOf("除く）")!=-1&&aa.indexOf(" 全ての敵（白")==-1) ene = ene.concat(["白色敵人"]);
            console.log(ene);
            obj.char.push({
              type:abi.split(" ")[0],
              period:tim?tim:null,
              chance:cha,
              against:ene,
              percent:abi.split(" ")[1]?abi.split(" ")[1].split("%")[0]:null
            });
        }
        else {
          c[i] = c[i].split(" ※")[0];
          let bb = c[i].split("（"),
          aa = bb.length<3&&c[i].indexOf("除く）")==-1 ? bb[0].split(" "):["",bb[0].split(" ")[1],bb[1].split(" ")[4]],
          ene = aa.length == 3 ? [parseEnemy(aa[1])]:[parseEnemy(aa[1]),parseEnemy(aa[2])],
          abi = parseAbility(aa[aa.length-1]);
          for(let j in ene){
            if(obj.tag.indexOf("對"+ene[j].substring(0,2))==-1)
              obj.tag.push("對"+ene[j].substring(0,2));
          }
          obj.tag.push(abi.split(" ")[0]);
          obj.char.push({
            type:abi,
            against:ene
          });
        }

      }
    }

  }
  function parseAbility(s) {
    if(!s) return ""
    let ww = 0;
    if(s.indexOf("％")!=-1){
      ww = Number(s.split("攻撃力")[1].split("％に")[0]);
      s = "攻撃力"+s.split("％に")[1];
    }
    if(s.indexOf("波動")!=-1){
      ww = s.split("波動")[0].split("Lv")[1]
      return "波動 "+(ww?ww:"")
    }
    switch (s) {
      case "のみに攻撃":
        s = "只能攻擊";
        break;
      case "1度だけ生き残る":
        s = "復活";
        break;
      case "ワープ":
        s = "傳送";
        break;
      case "ゾンビキラー":
        s = "不死剋星";
        break;
      case "ふっとばす":
        s = "擊退";
        break;
      case "止める":
        s = "暫停";
        break;
      case "動きを止める":
        s = "暫停";
        break;
      case "遅くする":
        s = "緩速";
        break;
      case "動きを遅くする":
        s = "緩速";
        break;
      case "攻撃力低下":
        s = "降攻"+(ww?" "+ww+"%":"");
        break;
      case "打たれ強い":
        s = "很耐打 (受到傷害x0.25)";
        break;
      case "超ダメージ":
        s = "超大傷害 (攻擊力x3)";
        break;
      case "めっぽう強い":
        s = "善於攻擊 (攻擊力x1.5 受到傷害x0.5)";
        break;
      case "バリアブレイカー":
        s = "破盾";
        break;
      default:
        s = s ;
    }
    return s
  }
  function parseEnemy(c) {
    if(!c) return ""
    c = c.split("（")[0]
    switch (c) {
      case "メタルな敵":
        c = "鋼鐵敵人"
        break;
      case "白い敵":
        c = "白色敵人"
        break;
      case "エイリアン":
        c = "外星敵人"
        break;
      case "赤い敵":
        c = "紅色敵人"
        break;
      case "天使":
        c = "天使敵人"
        break;
      case "全ての敵":
        c = "全部敵人"
        break;
      case "ゾンビ":
        c = "不死敵人"
        break;
      case "黒い敵":
        c = "黑色敵人"
        break;
      case "浮いてる敵":
        c = "漂浮敵人"
        break;
      case "無属性な敵":
        c = "無屬性敵"
        break;
      case "スター":
        c = "外星敵人(星)"
        break;
      default:
        c = c
    }
    return c
  }
  function AddZero(n) {
    return n>99 ? n : (n>9 ? "0"+n : "00"+n)
  }
  function parseCondition(row_7,row_8,obj) {
    if(row_7.children().eq(0).text()=="開放条件"){
      s = row_7.children().eq(1).text();
    } else if(row_8.children().eq(0).text()=="開放条件"){
      s = row_8.children().eq(1).text();
    } else {
      obj.get_method = '-';
      return
    }
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
      obj.get_method = html.substring(0,html.length-1)
    } else if(s.indexOf(" ＆ ") != -1){
      let ww = s.split(" ＆ ");
      ww[1] = ww[1].split("にゃんこガチャ").join("").split("ネコカン").join("貓罐頭");
      obj.get_method = ww.join(" + ")
    }
    else if(s.indexOf("開眼の")!=-1&&s.indexOf("襲来！")!=-1){
      let ww = "開眼的"+(obj.name?obj.name:obj.jp_name)+"襲來! + 合併等級Lv20以上";
      // console.log(ww);
      obj.get_method = ww ;
    }
    else if(s.indexOf("Lv") != -1 && s.indexOf("SP") == -1){
      obj.get_method = "合併等級Lv" + s.split("Lv")[1] +"以上"
    }
    else {
      switch (s) {
        case '各種ガチャ ':
          s = '從稀有轉蛋中獲得'
          break
        default:
          s = s
          break
      }
      obj.get_method = s;
    }
    return
  }