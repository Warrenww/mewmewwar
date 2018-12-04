var database = require("firebase").database();
var Util = require("./Utility");
var Parser = require("./Parser");
var request = require("request");
var cheerio = require("cheerio");
var __numberOfCat = 0;
var __numberOfCatSearch = 0;
var catNameMap = {};
var catAbilityMap = {All:[]};
var enemyAbilityMap = {All:[]};
var CatData = {};
// Get cat data,comment and enemy data from firebase.
exports.load = function (catdata,catComment,enemydata,mostSearchCat) {
  console.log("Module start loading data and comment.");
  __numberOfCatSearch = 0;
  __numberOfCat = 0;

  var exist=null,buffer=[],localCount=0 ;
  database.ref("/newCatData").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      catdata[i] = temp[i];
      catNameMap[i] = temp[i].name?temp[i].name:temp[i].jp_name;

      catAbilityMap.All.push(i);
      var tag = temp[i].tag, rarity = temp[i].rarity;
      for(let j in tag){
        if(catAbilityMap[tag[j]]) catAbilityMap[tag[j]].push(i);
        else catAbilityMap[tag[j]] = [i];
      }

      current = i.substring(0,3);
      if (current == exist){
        localCount += catdata[i].count?catdata[i].count:0;
      } else {
        __numberOfCat ++ ;
        __numberOfCatSearch += localCount;
        if(catdata[exist+'-1'])
          buffer.push({id:catdata[exist+'-1'].id,count:localCount});
        exist = current;
        localCount = catdata[i].count?catdata[i].count:0;
      }
    }

    buffer = Util.Sort(buffer,'count',true);
    for(let i=0; i<3; i++){
      let id = buffer[i].id;
      mostSearchCat.push({
        name:catdata[id].name,
        count:buffer[i].count,
        id:id,
        hp:Util.levelToValue(catdata[id].hp,catdata[id].rarity,30).toFixed(0),
        atk:Util.levelToValue(catdata[id].atk,catdata[id].rarity,30).toFixed(0),
      });
    }
    buffer = [];
    temp = [];
    console.log("Module load cat data complete!");
    // console.log("most Search Cat : ",mostSearchCat);
    console.log("Number of cat search : ",__numberOfCatSearch);
  });
  database.ref("/catComment").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      catComment[i] = temp[i];
    }
    console.log("Module load cat comment complete!");
  });

  database.ref("/enemydata").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      enemydata[i] = temp[i];

      enemyAbilityMap.All.push(i);
      var tag = temp[i].tag,color = temp[i].color;
      for(let j in tag){
        if(enemyAbilityMap[tag[j]]) enemyAbilityMap[tag[j]].push(i);
        else enemyAbilityMap[tag[j]] = [i];
      }
      for(let j in color){
        if(enemyAbilityMap[color[j]]) enemyAbilityMap[color[j]].push(i);
        else enemyAbilityMap[color[j]] = [i];
      }
    }
    console.log("Module load enemy data complete!");
  });
}

exports.__numberOfCat = function () {
  return __numberOfCat
}

exports.catName = function (id = null) {
  if(id) return catNameMap[id]
  else {
    var CatCount=0,
        Random = Math.floor((Math.random()*__numberOfCat));
    for(let i in catNameMap){
      if (CatCount == Random){
        return catNameMap[i]
      }
      CatCount++;
    }
  }
}

exports.GetAbilityList = function (type,ability) {
  var Obj;
  if(!type||!ability) return

  if(type == 'cat') Obj = catAbilityMap;
  else Obj = enemyAbilityMap;

  return Obj[ability]
}

exports.SearchCount = function (type,add = 0) {
  if(type != 'cat') return
  if(!add) return __numberOfCatSearch;
  else __numberOfCatSearch += add;
}

exports.fetch = function (type,arr) {
  console.log(type,arr);
  for(let i in arr){
    var exist = false;
    if(type == 'cat' && catNameMap[Util.AddZero(arr[i],2)+"-1"]) exist = true;
    getData(type,arr[i],1,exist);
  }
}

function getData(type,grossID,stage,exist) {
  var url = "https://battlecats-db.com/"+(type == 'cat'?"unit":'enemy')+"/"+Util.AddZero(grossID,2)+".html";
  console.log(url);
  request({
    url: url,
    method: "GET"
  }, function(e,r,b) {
    var obj ;
    if(type == 'cat') obj= exist?{tag:[],char:[]}:{tag:[],char:[],count:0};
    else obj = {tag:[],char:[],id:grossID,color:[]};
    if(!e){
      console.log("get data");
      $ = cheerio.load(b);
      var content = $(".maincontents table").find("tr[class='bgc12']"),
          bro = content.length-1,
          row_1 = content.eq(stage).next().next();
      if(type == 'enemy') row_1 = content.eq(0).next().next();
      var row_2 = row_1.next(),
          row_3 = row_2.next(),
          row_4 = row_3.next(),
          row_5 = row_4.next(),
          row_7 = row_5.next().next(),
          row_8 = row_7.next();
      var level = 0;
      row_3.children().eq(1).find(".finger").each(function () {
        level += Number($(this).text());
      });
      console.log(level);
      if(type == 'cat') obj.jp_name = content.eq(stage).children().eq(1).text();
      else obj.jp_name = content.eq(0).children().eq(1).text();

      if(type == "enemy")
        row_1.children().eq(0).find('a').each(function () {
          obj.color.push(Parser.parseEnemy($(this).text()));
        });
      else obj.rarity = Parser.parseRarity(row_1.children().eq(0).eq(0).text());

      obj.hp = Number(row_1.children().eq(3).children().eq(0).text().split(",").join(""));
      obj.kb = Number(row_1.children().eq(5).text().split(",").join(""));
      obj.hardness = obj.hp/obj.kb ;
      obj.hardness = obj.hardness!=Infinity?obj.hardness:'Infinity';
      obj.freq = Number(row_1.children().eq(7).children().eq(0).text())?Number(row_1.children().eq(7).children().eq(0).text())/30:"-";
      obj.atk = Number(row_2.children().eq(1).children().eq(0).text().split(",").join(""));
      obj.speed = Number(row_2.children().eq(3).text());
      obj.atk_speed = Number(row_2.children().eq(5).children().eq(0).text())/30;
      obj.range = Number(row_3.children().eq(5).text().split(",").join(""));
      obj.atk_period = Number(row_3.children().eq(7).children().eq(0).text())?Number(row_3.children().eq(7).children().eq(0).text())/30:"-";
      obj.aoe = type == ('cat'?row_4:row_3).children().eq(3).children().eq(0).text() == "単体" ? false : true;
      if(type == 'cat'){
        obj.cost = Number(row_4.children().eq(5).children().eq(0).text().split(",").join(""));
        obj.cd = Number(row_3.children().eq(7).children().eq(0).text())/30;
        obj.hp = Parser.ToOriginal(obj.hp,obj.rarity,level);
        obj.atk = Parser.ToOriginal(obj.atk,obj.rarity,level);
        if(!exist) obj.region = '[TW][JP]';
        obj.id = Util.AddZero(grossID,2)+"-"+stage;
      } else{
        obj.reward = Number(row_3.children().eq(7).text().split(",").join(""));
      }
      obj.dps = obj.freq!="-"?obj.atk/obj.freq:"-" ;
      Parser.parseChar(row_5.children().eq(1),obj,type);
      if (type == 'cat'){
        Parser.parseCondition(row_7,row_8,obj);
      }
      console.log(obj.condition);
      console.log(obj);
      if(type == 'cat'){
        database.ref("/newCatData/"+Util.AddZero(grossID,2)+"-"+stage).update(obj);
      } else {
        database.ref("/enemydata/"+Util.AddZero(grossID,2)).update(obj);
        return;
      }
      if(stage<bro) {stage++;getData(type,grossID,stage,exist);}
    }
    else { console.log(e); }
  });

}
