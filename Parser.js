var cheerio = require("cheerio");
var Stage = require("./Stagedata");
var Unit = require("./Unitdata")
var database = require("firebase").database();
var gachadata;
database.ref("/gachadata").once("value",(snapshot)=>{gachadata = snapshot.val();});

exports.parseRarity = function(r) {
  console.log(r);
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
    case "伝説レア":
      r = "SSSR";
      break;
    default:
      r = r
  }
  return r
}
exports.parseChar = function(c,obj,type) {
  c.find(".hide").remove();
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
      else if(c[i].indexOf("バリア")!=-1 && type == 'enemy'){
        let aa = c[i].split("（")[1].split('）')[0].split(",").join("");
        obj.tag.push("護盾");
        obj.char.push({
          type:"護盾",
          hard:Number(aa),
        });
      }
      else if(c[i].indexOf("使徒キラー")!=-1){
        obj.tag.push("使徒殺手");
        obj.char.push({
          against:["使徒"],
          type:"使徒殺手 (攻擊力x5 受到傷害x0.2)",
        });
      }
      else if(c[i].indexOf("無効")!=-1){
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
        if(type == 'cat') obj.tag.push("對鋼鐵");
        obj.char.push({
          type:"會心一擊",
          chance:aa
        });
      }
      else if(c[i].indexOf("連続攻撃")!=-1){
        let aa = c[i].split("連続攻撃"),
        bb = aa[1].split("（")[0].trim().split(" "),
        sum = 0;
        console.log(bb);
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
        if(type == 'enemy'){
          let aa = c[i].split("％"),
              times = c[i].split("（")[1].split("）")[0];
          obj.tag.push("復活");
          obj.char.push({
            type:"重生",
            hp:Number(aa[0].split("力")[1]),
            delay:Number(c[i].split("F")[0].split("た")[1])/30,
            times:times == '無制限'?'無限': Number(times.split("回")[0])
          });
        } else if(type == 'cat'){
          obj.tag.push("不死剋星");
          obj.tag.push("對不死");
          obj.char.push({
            type:"不死剋星",
            against:['不死敵人'],
          });
        }
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
      else if(c[i].indexOf("へワープさせる")!=-1){
        let aa = c[i].split("％"),
            bb = Number(aa[1].split('後方')[0].split('で')[1]);
        if(Number.isNaN(bb)) bb = Number(aa[1].split('前方')[0].split('で')[1])*(-1);
        obj.tag.push("傳送");
        obj.char.push({
          type:"傳送",
          chance:Number(aa[0]),
          dist:bb,
          time:Number(aa[1].split('（')[1].split('F）')[0])
        });
      }
      else if(c[i].indexOf("古代の呪い")!=-1){
        let aa = c[i].split("％");
        obj.tag.push("古代詛咒");
        obj.char.push({
          type:"特殊能力封印",
          chance:/[0-9]+％/.exec(c[i])[0].split("％")[0],
          time:/[0-9]+F/.exec(c[i])[0].split("F")[0]/30
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
      else if(c[i].indexOf("メタル")!=-1 && c[i].indexOf("な敵 ")==-1){
        obj.tag.push("鋼鐵");
        obj.char.push({type:"鋼鐵 (受到會心一擊以外傷害值為1)"});
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
exports.parseEnemy = function (s) {
  return parseEnemy(s)
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
  temp = {
    "のみに攻撃": "只能攻擊",
    "1度だけ生き残る": "復活",
    "生き残る": "復活",
    "ワープ": "傳送",
    "ゾンビキラー": "不死剋星",
    "ふっとばす": "擊退",
    "ふっとばし": "擊退",
    "止める": "暫停",
    "動きを止める": "暫停",
    "遅くする": "緩速",
    "動きを遅くする": "緩速",
    "攻撃力低下": "降攻"+(ww?" "+ww+"%":""),
    "攻撃力上昇": "增攻",
    "打たれ強い": "很耐打 (受到傷害x0.25)",
    "超ダメージ": "超大傷害 (攻擊力x3)",
    "めっぽう強い": "善於攻擊 (攻擊力x1.5 受到傷害x0.5)",
    "古代の呪い": "古代詛咒",
    "古代の呪い無効": "古代詛咒無效",
    "バリアブレイカー": "破盾",
    "バリアブレイク": "破盾",
    "クリティカル": "會心一擊",
    "超打たれ強い": "超級耐打",
    "極ダメージ": "極度傷害",
    "撃破時お金x2": "2倍金錢",
    "魔女キラー": "魔女殺手",
    "使徒キラー": "使徒殺手",
  }[s];
  s = temp?temp:s;
  return s
}
function parseEnemy(c) {
  if(!c) return ""
  c = c.split("（")[0]
  temp = {
    "メタルな敵": "鋼鐵敵人",
    "白い敵": "白色敵人",
    "エイリアン": "外星敵人",
    "赤い敵": "紅色敵人",
    "天使": "天使敵人",
    "全ての敵": "全部敵人",
    "ゾンビ": "不死敵人",
    "黒い敵": "黑色敵人",
    "浮いてる敵": "漂浮敵人",
  }[c]
  temp = temp?temp:c;
  return temp
}
exports.parseCondition = function(row_7,obj) {
  c = row_7.children().eq(1).html();
  var condition ={},c_text=[];
  c = c.split("<br>");
  for(let i in c){
    c[i] = $("<div>").html(c[i]);
    c_text.push(c[i].text());
  }
  for(let i in c){
    s = c_text[i];
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
      for (let j in arr){
        if(arr[j] != -1){
          condition.fruit[j] = {
            seed:se == -1 ? false : (arr[j]>se ? true : false ),
            number:Number(s.substring(arr[j]+1,arr[j]+2))
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
        c = a.indexOf("-")!=-1;
        if (c) n = Stage.stageMap()[a.split("-")[0]]?Stage.stageMap()[a.split("-")[0]][Number(a.split("-")[1])].name:"-";
        else n = Stage.stageMap()[a]?Stage.stageMap()[a].name:b;
        condition.stage = {id:(a.split("-")[0]+(c?("-"+a.split("-")[1]):"")),name:n};
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
  temp = {
    '伝説のネコルガ族':'unknown',
    '2017新年':'2017_year_start',
    '極ネコ祭':'special_cat',
    '超ネコ祭':'super_cat',
    '超激レア限定プラチナ':'platinum',
    '超激ダイナマイツ':'explosion',
    'レッドバスターズ':'red_destroy',
    '2016忘年会':'2016_year_end',
    '超選抜祭':'super_select',
    '2018新年':'2018_year_start',
    'メタルバスターズ':'metal_destroy',
    'エアバスターズ':'float_destroy',
    '戦国武神バサラーズ':'basalasu',
    '電脳学園ギャラクシーギャルズ':'galaxy_girl',
    '超破壊大帝ドラゴンエンペラーズ':'dragon',
    'メルクストーリア':'maylook',
    '超古代勇者ウルトラソウルズ':'ancient_hero',
    '逆襲の英雄ダークヒーローズ':'dark_hero',
    'メタルスラッグディフェンス':'metal_slug_defense',
    'ハロウィン':'halloween',
    'クリスマスギャルズ':'christmas',
    '究極降臨ギガントゼウス':'god',
    '消滅都市2':'destroy_city',
    'サマーガールズ':'summer',
    '革命軍隊アイアンウォーズ':'revolution',
    'イースターカーニバル':'easter',
    '絶命美少女ギャルズモンスターズ':'monster_girl',
    'ぐでたまコラボ':'egg',
    '大精霊エレメンタルピクシーズ':'elf',
    '2017忘年会':'2017_year_end',
    '実況パワフルプロ野球コラボ':'baseball',
    'エヴァンゲリオンコラボ':'eva',
    '劇場版 Fate stay nightコラボ':'Fate',
    'にゃんこ':'cat',
  }[n];
  temp = temp?temp:"no_this_gacha";
  return temp;
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
        case "黄金":
        obj.name = "黃金";
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
    var catName = Unit.catName(obj.name.split("-")[0].split("u")[1]);
    obj.amount = catName?catName[Number(obj.name.split("-")[1])-1]:"";
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
exports.parseInstinct = function (c,obj) {
  obj.instinct = [];
  c = c.html().split("<hr class=\"line\">");
  obj.tag.push("本能");
  for(let i in c){
    c[i] = $("<div/>").html(c[i]).text();
    console.log(c[i]);
    if(c[i].indexOf("基本") != -1){
      let a = "基本"+(c[i].indexOf("体") != -1?"體":"攻擊")+"力上升";
      obj.instinct.push({
        ability:a,
        maxlv:10,
        range:[2,20],
        np:5
      });
      obj.tag.push(a);
    }
    else if(c[i].indexOf("強化") != -1){
      let a = parseAbility(c[i].split("」")[0].split("「")[1])+"強化",
          b = Number(c[i].split("MaxLv")[1].split(" ")[0]),
          d = c[i].split("）")[1].split("％")[0].split("～");

      d = d.map(x => x.indexOf("F")==-1?x:x.split("F")[0]);
      obj.instinct.push({
        ability: a,
        maxlv  : b,
        range  : d,
        np     : 5
      });
    }
    else if(c[i].indexOf("追加") != -1 && c[i].indexOf("MaxLv") != -1){
      let a = c[i].split("」")[0].split("「")[1],
          b = Number(c[i].split("MaxLv")[1].split(" ")[0]),f=true,
          d = c[i].split("）")[1];
      if(a.indexOf("耐性") != -1) a = parseAbility(a.split("耐性")[0])+"抗性";
      else {a = parseAbility(a)+"能力解放";f=false}

      if(a.indexOf("增攻")!=-1){
        d = d.substring(d.search(/\d+～\d+％/)).split("％")[0].split("～")
        d.push(c[i].split("％")[0].split("残り体力")[1]);
      }
      else if((a.indexOf("緩速")!=-1||a.indexOf("暫停")!=-1)&&!f){
        d = d.substring(d.search(/\d+～\d+F/)).split("F")[0].split("～")
        d.push(c[i].split("％")[0].split("）")[1]);
      }
      else if(a.indexOf("降攻")!=-1&&!f){
        d = d.substring(d.search(/\d+～\d+F/)).split("F")[0].split("～")
        d.push(c[i].split("％")[0].split("）")[1]);
        d.push(c[i].split("％")[1].split("攻撃力")[1]);
      }
      else d = d.split("％")[0].split("～");
      if(a.indexOf("波動")!=-1&&!f){ d.push(c[i].split("確率でLv")[1].split("波動")[0]); }
      // d = d.map(x => x.indexOf("F")==-1?x:x.split("F")[0]);
      obj.instinct.push({
        ability: a,
        maxlv  : b,
        range  : d,
        np     : f?5:25
      });
      obj.tag.push(a);
    }
    else if(c[i].indexOf("追加") != -1){
      let a = c[i].split("」")[0].split("「")[1],f=false;
      if(c[i].indexOf("特性") != -1) a = parseAbility(a)+"能力解放";
      else {a = "屬性新增"+parseEnemy(a);f=true;}

      let d = c[i].split("追加")[1].search(/\d+～\d+％/);
      d = d!=-1? c[i].substring(d).split('％')[0].split("～") : "";
      obj.instinct.push({
        ability: a,
        maxlv  : 1,
        range  : d,
        np     : 25
      });
      obj.tag.push(a);
    }
    else if(c[i].indexOf("生産") != -1){
      let a,b = Number(c[i].split("MaxLv")[1].split(" ")[0]),d = c[i].split(" ")[1];
      if(c[i].indexOf("時間") != -1){
        a = "生產時間減少";
        d = d.split("F")[0].split("～");
      } else {
        a = "生產金額減少";
        d = d.split("円")[0].split("～");
      }
      obj.instinct.push({
        ability: a,
        maxlv  : b,
        range  : d,
        np     : 5
      });
      obj.tag.push(a);
    }
    else if(c[i].indexOf("移動速度") != -1){
      let a = "移動加快",
          b = Number(c[i].split("MaxLv")[1].split(" ")[0]),
          d = c[i].split(" ")[1].split("上昇")[0].split("～");

      obj.instinct.push({
        ability: a,
        maxlv  : b,
        range  : d,
        np     : 5
      });
      obj.tag.push(a);
    }

  }
}
