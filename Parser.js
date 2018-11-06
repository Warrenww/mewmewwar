var cheerio = require("cheerio");
var Stage = require("./Stagedata");
var Unit = require("./Unitdata")
var database = require("firebase").database();
var gachadata;
database.ref("/gachadata").once("value",(snapshot)=>{gachadata = snapshot.val();});

exports.parseRarity = function(r) {
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
exports.parseChar = function(c,obj) {
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
      else if(c[i].indexOf("使徒キラー")!=-1){
        obj.tag.push("使徒殺手");
        obj.char.push({
          against:["使徒"],
          type:"使徒殺手 (攻擊力x5 受到傷害x0.2)",
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
      else if(c[i].indexOf("クリティカル")!=-1){
        let aa = c[i].split("％")[0];
        obj.tag.push("爆擊");
        obj.tag.push("對鋼鐵");
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
      else if(c[i].indexOf("波動打ち消し")!=-1){
        obj.tag.push("免疫波動");
        obj.tag.push("抵銷波動");
        obj.char.push({
          type:"抵銷波動"
        });
      }
      else if(c[i].indexOf("倒した時、貰えるお金x2")!=-1){
        obj.tag.push("2倍金錢");
        obj.char.push({
          type:"擊倒敵人時，獲得2倍金錢"
        });
      }
      else if(c[i].indexOf("敵城")!=-1){
        obj.tag.push("攻城");
        obj.char.push({
          type:"對敵城傷害x4"
        });
      }
      else if(c[i].indexOf("1回攻撃")!=-1){
        obj.tag.push("1次攻擊");
        obj.char.push({
          type:"一次攻擊(攻擊後碎裂)"
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
    case "古代の呪い":
      s = "古代詛咒";
      break;
    case "バリアブレイカー":
      s = "破盾";
      break;
    case "バリアブレイク":
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
    default:
      c = c
  }
  return c
}
exports.parseCondition = function(row_7,row_8,obj) {
  if(row_7.children().eq(0).text()=="開放条件"){
    c = row_7.children().eq(1).html();
  } else if(row_8.children().eq(0).text()=="開放条件"){
    c = row_8.children().eq(1).html();
  } else {
    obj.condition = '-';
    return
  }
  var condition ={};
  c = c.split("<br>");
  for(i in c){
    c[i] = $("<div/>").html(c[i]);
    s = c[i].text();
    console.log(s);
    if(s.indexOf("マタタビ") != -1){
      let g = s.indexOf("緑"),p = s.indexOf("紫"),
      r = s.indexOf("赤"),b = s.indexOf("青"),
      y = s.indexOf("黄"),ra = s.indexOf("虹"),
      se = s.indexOf("種"),an = s.indexOf("古");
      condition.fruit = {};
      // console.log(g+","+p+","+r+","+b+","+y+","+ra+","+se);
      let arr = [r,b,p,g,y,ra,an],brr = ['綠色','紫色','紅色','藍色','黃色','彩虹','古代'];
      // console.log(arr);
      for (let i in arr){
        if(arr[i] != -1){
          condition.fruit[i] = {
            seed:se == -1 ? false : (arr[i]>se ? true : false ),
            number:Number(s.substring(arr[i]+1,arr[i]+2))
          }
        }
      }
    }
    else if(s.indexOf("各種ガチャ")!=-1){ condition.gacha = 'any'; }
    else if(s.indexOf("初期キャラクター")!=-1){ condition.other = '遊戲初期即可取得'; }
    else if(s.indexOf("ログイン30日間")!=-1){ condition.other = '登入遊戲30日即可取得'; }
    else if(s.indexOf("特典 ※現在、入力不可")!=-1){ condition.other = '特典限定，無法取得'; }
    else if(s.indexOf("Lv")!=-1){
      n = /[0-9]+/.exec(s)[0];
      condition.lv = n;
    }
    else if(c[i].find("a").attr("href")){
      a = c[i].find('a').attr("href");
      if(a.indexOf("stage")!=-1){
        b = c[i].find("a").text();
        a = /s[0-9]+\-*[0-9]+/.exec(a)[0];
        if (a.indexOf("-")!=-1) n = Stage.stageMap()[a.split("-")[0]]?Stage.stageMap()[a.split("-")[0]][Number(a.split("-")[1])].name:"-";
        else n = Stage.stageMap()[a]?Stage.stageMap()[a].name:b;
        condition.stage = {id:a.split("-")[0]+"-"+Number(a.split("-")[1]),name:n};
        if(s.indexOf("XP")!=-1){
          b = /XP[0-9]+/.exec(s)[0].split("XP")[1];
          condition.xp = Number(b);
        }
        else if (s.indexOf('ネコカン')!=-1){
          b = /[0-9]+個/.exec(s)[0].split("個")[0];
          condition.can = Number(b);
        }
      }
      else if(a.indexOf("lot")!=-1){
        id = parseGacha(s.split('ガチャ')[0]);
        var temp =  {
          id:id!="no_this_gacha"?id:"",
          name:id!="no_this_gacha"?gachadata[id].name:s.split('ガチャ')[0]
        };
        if(condition.gacha) condition.gacha.push(temp);
        else condition.gacha = [temp];
      }
    }
    else if(s.indexOf("にゃんこガチャ")!=-1||
            s.indexOf("エアバスターズガチャ")!=-1||
            s.indexOf("ミラクルセレクション")!=-1){}
    else{ if(s && s != '') condition.other = s; }
  }
  obj.condition = condition;
  return
}
function parseGacha (n) {
  switch (n) {
    case '伝説のネコルガ族':
      return 'unknown'
    case '2017新年':
      return '2017_year_start'
    case '極ネコ祭':
      return 'special_cat'
    case '超ネコ祭':
      return 'super_cat'
    case '超激レア限定プラチナ':
      return 'platinum'
    case '超激ダイナマイツ':
      return 'explosion'
    case 'レッドバスターズ':
      return 'red_destroy'
    case '2016忘年会':
      return '2016_year_end'
    case '超選抜祭':
      return 'super_select'
    case '2018新年':
      return '2018_year_start'
    case 'メタルバスターズ':
      return 'metal_destroy'
    case 'エアバスターズ':
      return 'float_destroy'
    case '戦国武神バサラーズ':
      return 'basalasu'
    case '電脳学園ギャラクシーギャルズ':
      return 'galaxy_girl'
    case '超破壊大帝ドラゴンエンペラーズ':
      return 'dragon'
    case 'メルクストーリア':
      return 'maylook'
    case '超古代勇者ウルトラソウルズ':
      return 'ancient_hero'
    case '逆襲の英雄ダークヒーローズ':
      return 'dark_hero'
    case 'メタルスラッグディフェンス':
      return 'metal_slug_defense'
    case 'ハロウィン':
      return 'halloween'
    case 'クリスマスギャルズ':
      return 'christmas'
    case '究極降臨ギガントゼウス':
      return 'god'
    case '消滅都市2':
      return 'destroy_city'
    case 'サマーガールズ':
      return 'summer'
    case '革命軍隊アイアンウォーズ':
      return 'revolution'
    case 'イースターカーニバル':
      return 'easter'
    case '絶命美少女ギャルズモンスターズ':
      return 'monster_girl'
    case 'ぐでたまコラボ':
      return 'egg'
    case '大精霊エレメンタルピクシーズ':
      return 'elf'
    case '2017忘年会':
      return '2017_year_end'
    case '実況パワフルプロ野球コラボ':
      return 'baseball'
    case 'エヴァンゲリオンコラボ':
      return 'eva'
    case 'にゃんこ':
      return 'cat'
    default:
        return "no_this_gacha"
  }
}
exports.ToOriginal = function(n,r,lv) {
  var limit;
  switch (r) {
    case 'R':
    limit = 70 ;
    break;
    case 'SR_alt':
    limit = 20 ;
    break;
    default:
    limit = 60 ;
  }
  if(r == 'B') return n/16.8;
  if(lv < limit) n /= (0.8+0.2*lv);
  else if(lv < limit+20) n /= (0.8+0.1*lv+0.1*limit);
  else n /= (0.8+0.05*lv+0.15*limit+1);
  return n
}
exports.parsePrize = function(p,img) {
  let obj ={name:"",amount:""},
  s = p.text();
  // console.log(s);
  if(s.indexOf("XP+")!=-1){
    obj.name = "經驗值";
    obj.amount = s.substring(3);
  }
  else if(s.indexOf("個")!=-1||s.indexOf("枚")!=-1){
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
        case "ネコカン":
        obj.name = "貓罐頭";
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
        case "福引チケット":
        obj.name = "招福轉蛋券";
        break;
        case "福引チケットG":
        obj.name = "招福轉蛋G券";
        break;
        default:
        obj.name = s.split(" ")[0];
      }
    }
    obj.amount = s.split(" ")[1];
  }
  else if(p.children("a").attr("href")) {
    obj.name = img.children("img").attr("src").split("/")[3].split(".png")[0];
    obj.amount = Unit.CatName[obj.name.substring(1)];
  } else {
    obj.name = s;
  }
  // console.log(obj);
  return obj
}
exports.parseConstrain = function(c) {
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
  else if(c.indexOf("一回クリアのみ")!=-1){
    c = "僅限通關一次";
  }
  else {
    c = c.split("レア").join("稀有");
  }
  // console.log(c);
  return c
}
exports.FtoS = function(s) {
  if(s == "-") return "-"
  let arr = s.indexOf("~") != -1 ? s.split("~") : s.split("～");
  for(let i in arr) arr[i] = (Number(arr[i])/30).toFixed(1);
  return arr.join("~")
}
