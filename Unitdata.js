var database = require("firebase").database();
var Util = require("./Utility");
var Parser = require("./Parser");
var request = require("request");
var cheerio = require("cheerio");
var fs = require("fs");
var __numberOfCat = 0;
var __numberOfCatSearch = 0;
var catNameMap = {};
var enemyNameMap = {};
var rarityMap = {};
var AbilityMap;
var CatData = {};
var EnemyData = {};
// Get cat data,comment and enemy data from firebase.
exports.load = function (mostSearchCat) {
  console.log("Module start loading data and comment.");
  __numberOfCatSearch = 0;
  __numberOfCat = 0;
  AbilityMap = {
    cat:{all:[]},
    enemy:{all:[]}
  }

  var exist=null,buffer=[],localCount=0 ;
  database.ref("/CatData").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      CatData[i] = temp[i];
      AbilityMap.cat.all.push(i);
      catNameMap[i] = [];
      if(rarityMap[temp[i].rarity]) rarityMap[temp[i].rarity].push(i);
      else rarityMap[temp[i].rarity] = [i];
      for(let j in temp[i].data){
        catNameMap[i].push(temp[i].data[j].name?temp[i].data[j].name:temp[i].data[j].jp_name);
        var tag = temp[i].data[j].tag;
        for(let k in tag){
          if(AbilityMap.cat[tag[k]])
            {if(AbilityMap.cat[tag[k]].indexOf(i)==-1) AbilityMap.cat[tag[k]].push(i);}
          else AbilityMap.cat[tag[k]] = [i];
        }
      }
      __numberOfCat ++ ;
      __numberOfCatSearch += Number(temp[i].count)?Number(temp[i].count):0;
      buffer.push({id:i,count:temp[i].count});
    }
    buffer = Util.Sort(buffer,'count',true);
    for(let i=0; i<3; i++){
      let id = buffer[i].id;
      mostSearchCat.push({
        name:CatData[id].data[1].name,
        count:buffer[i].count,
        id:id,
        hp:Util.levelToValue(CatData[id].data[1].hp,CatData[id].rarity,30).toFixed(0),
        atk:Util.levelToValue(CatData[id].data[1].atk,CatData[id].rarity,30).toFixed(0),
      });
    }
    buffer = [];
    temp = [];
    console.log("Module load cat data complete!");
    console.log("most Search Cat : ",mostSearchCat);
    console.log("Number of cat search : ",__numberOfCatSearch);
    // for(let i in AbilityMap.cat) console.log(i,AbilityMap.cat[i].length);
    // fs.appendFile('abilityMap.txt', JSON.stringify(AbilityMap),(err) =>{
    //   if (err) throw err;
    //   console.log('Is saved!');
    //   // process.exit();
    // });
  });
  database.ref("/enemydata").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      EnemyData[i] = temp[i];
      AbilityMap.enemy.all.push(i);
      var tag = temp[i].tag,color = temp[i].color;
      for(let j in tag){
        if(AbilityMap.enemy[tag[j]]) AbilityMap.enemy[tag[j]].push(i);
        else AbilityMap.enemy[tag[j]] = [i];
      }
      for(let j in color){
        if(AbilityMap.enemy[color[j]]) AbilityMap.enemy[color[j]].push(i);
        else AbilityMap.enemy[color[j]] = [i];
      }
      enemyNameMap[i] = temp[i].name?temp[i].name:temp[i].jp_name;
    }
    console.log("Module load enemy data complete!");
    // for(let i in AbilityMap.enemy) console.log(i,AbilityMap.enemy[i].length);
  });
}

exports.getData = function (type,id) {
    var load_data;
    id = id.toString().substring(0,3);
    if(type == "cat") load_data = CatData;
    else if(type == "enemy") load_data = EnemyData;
    else return {};

    if(load_data[id]) return load_data[id];
    else return {};
}

exports.Search = function (data,level,showJP,variable={}) {
  var rFilter = data.query.rFilter?data.query.rFilter:[],
      cFilter = data.query.cFilter?data.query.cFilter:[],
      aFilter = data.query.aFilter?data.query.aFilter:[],
      filterObj = data.filterObj?data.filterObj:[],
      colorAnd = Number(data.colorAnd)?"and":"or",
      abilityAnd = Number(data.abilityAnd)?"and":"or",
      instinct = Number(data.instinct),
      type = data.type,
      buffer = [],
      nameMap = type == 'cat'?catNameMap:enemyNameMap;
      counter = 0;
      // buffer initialy are empty.
      // To prevent MargeArray(buffer,arr,"and") become empty,
      // use this bit to determind first operation.
  var abilityMap = AbilityMap[type];

  // First, if one of basic filter exist, extract unit; else extract all unit
  if(rFilter.length||cFilter.length||aFilter.length){
    // Filte the ability First, since its procedure is independent from type
    counter = 0;
    for(let i in aFilter){
      var temp = abilityMap[aFilter[i]];
      buffer = Util.MergeArray(buffer,temp,counter?abilityAnd:"or");
      counter++;
    }

    if(type == 'cat'){
      var temp = [];
      for(let i in rFilter){
        var temp_1 = rarityMap[rFilter[i]];
        temp = Util.MergeArray(temp,temp_1);
      }
      if(aFilter.length && rFilter.length) buffer = Util.MergeArray(buffer,temp,"and");
      else buffer = Util.MergeArray(buffer,temp);

      temp = [];
      counter = 0;
      var forAllInclude = false; // To determind whether "對全部" is already include.
      for(let i in cFilter){
        var temp_1 = abilityMap[cFilter[i]];
        temp = Util.MergeArray(temp,temp_1,counter?colorAnd:"or");
        if(cFilter[i] != "對白色" && cFilter[i] != "對鋼鐵" && !forAllInclude){
          temp_1 = abilityMap["對全部"];
          temp = Util.MergeArray(temp,temp_1);
          forAllInclude = true;
        }
        counter++;
      }
      if((aFilter.length||rFilter.length) && cFilter.length) buffer = Util.MergeArray(buffer,temp,"and");
      else buffer = Util.MergeArray(buffer,temp);
    } else {
      var temp = [];
      counter = 0;
      for(let i in cFilter){
        var temp_1 = abilityMap[cFilter[i]];
        temp = Util.MergeArray(temp,temp_1,counter?colorAnd:"or");
        counter++;
      }
      if(aFilter.length && cFilter.length) buffer = Util.MergeArray(buffer,temp,"and");
      else buffer = Util.MergeArray(buffer,temp);
    }
  } else { buffer = Util.MergeArray(buffer,abilityMap.all); }

  // Next, filte the FilterObj
  var flag = true,temp = [];
  for(let i in filterObj){
    if (!filterObj[i].active) continue
    flag = false;
    var fieldName = i,
        filterType = filterObj[i].type ,
        limit = filterObj[i].value ,
        level_bind = filterObj[i].lv_bind;
    // console.log(fieldName,filterType,limit,level_bind);
    for(let j in buffer){
      var value = 0,id = buffer[j];
      if(temp.indexOf(id) != -1) continue;

      if(type == 'enemy') value = EnemyData[id][fieldName];
      else {
        var catlv = variable[id]?(variable[id].lv?variable[id].lv:level):level,
            catstage = variable[id]?(variable[id].stage?variable[id].stage:1):1;
        value = CatData[id].data[catstage][fieldName];
        if(level_bind) value = Util.levelToValue(value,CatData[id].rarity,catlv);
        // console.log(j,catlv,catstage,value)
      }

      if(filterType == 0  && value > limit) temp.push(buffer[j]);
      else if (filterType == 1 && value < limit) temp.push(buffer[j]);
      else if (filterType == 2 && value>limit[0] && value<limit[1]) temp.push(buffer[j]);
    }
  }
  buffer = flag?buffer:temp;
  // console.log(buffer);

  if(type == 'cat' && !showJP){
    for(let i=buffer.length-1;i>=0;i--){
      if(!CatData[buffer[i]]) continue;
      if(CatData[buffer[i]].region.indexOf("[TW]") == -1) buffer.splice(i,1);
    }
  }

  for(let i in buffer){
    var id = buffer[i];
    buffer[i] = {
      id:id,
      name:nameMap[id],
    }
  }

  console.log("Result length:",buffer.length);
  buffer = Util.Sort(buffer,'id')
  return buffer
}
exports.TextSearch = function (type,keyword) {
  keyword = keyword.indexOf(":")==-1?[null,keyword]:keyword.split(":");
  var func = keyword[0],load_data,nameMap,buffer = [];
  keyword = keyword[1];
  load_data = type == 'cat'? CatData : EnemyData;
  nameMap = type == 'cat'?catNameMap:enemyNameMap;
  console.log(func,keyword);
  if(func == 'id') {
    keyword = keyword.split(",");
    keyword.forEach(function (element,index,array) {
      if(Number(element)) buffer.push(Number(Util.AddZero(element,2)));
    });
  } else {
    if(type == 'cat'){
      for(let i in nameMap)
        for (var j in nameMap[i])
          if(nameMap[i][j].indexOf(keyword)!=-1) {buffer.push(i);break;}
    }
    else
      for(let i in nameMap)
        if(nameMap[i].indexOf(keyword)!=-1) {buffer.push(i);}
  }
  console.log(buffer.length);
  buffer.forEach(function (id,i,arr) {
    arr[i] = {id:id,name:nameMap[id]};
  });

  return buffer;
}
exports.CreateResultQueue = function (type,array) {
  var load_data,buffer = [];
  if(type == 'cat')load_data = CatData;
  else if(type == "enemy") load_data = EnemyData;
  else return;

  for(let i in array){
    if(!array[i]) continue;
    let id = array[i].toString().substring(0,3);
    if(!load_data[id]) continue;
    buffer.push({
      id:id,
      name:type=="cat"?catNameMap[id]:EnemyData[id].name
    });
  }
  return buffer
}
exports.__numberOfCat = function () {
  return __numberOfCat
}
exports.randomCat = function (cc = null) {
  var CatCount = 0,
      Random = Math.floor((Math.random()*__numberOfCat));
  for(let i in catNameMap){
    if (CatCount == Random){
      var rand = Math.ceil((Math.random()*catNameMap[i].length));
      return i+"-"+rand;
    }
    CatCount ++;
  }
}

exports.catName = function (id = null) {
  if(id){
    id = id.toString().substring(0,3);
    return catNameMap[id]
  }
  else {
    var CatCount=0,
        Random = Math.floor((Math.random()*__numberOfCat));
    for(let i in catNameMap){
      if (CatCount == Random){
        return catNameMap[i][1]
      }
      CatCount++;
    }
  }
}
exports.enemyName = function (id) {
  return enemyNameMap[id]
}
exports.GetAbilityList = function (type,ability) {
  var Obj;
  if(!type||!ability) return

  if(type == 'cat') Obj = AbilityMap.cat;
  else Obj = AbilityMap.enemy;

  return Obj[ability]
}

exports.setHistory = function (type,id) {
  var load_data
  id = id.substring(0,3);
  if(type == 'cat'){ __numberOfCatSearch ++;load_data=CatData;}
  else if(type == "enemy") load_data = EnemyData;
  else return;

  load_data[id].count = load_data[id].count?load_data[id].count+1:1;
  database.ref("/"+(type=='cat'?'CatData/':"enemydata/")+id+"/count").set(load_data[id].count);
}

exports.updateStatistic = function (id,type,newData) {
  try{
    var data = CatData[id].statistic;
    if(!data) data = {};
    data[type] = newData;
    database.ref("/CatData/"+id+"/statistic/"+type).set(newData);
  }catch(e){
    Util.__handalError(e);
  }
}

exports.updateComment = function (data,type) {
  try{
    if(type == 'push'){
      var key = database.ref().push().key,
      cat = data.cat;
      console.log(data.owner,'comment on',data.cat,'with key',key);
      if(!CatData[cat].comment||CatData[cat].comment == "-") CatData[cat].comment = {};
      CatData[cat].comment[key] = {
        owner:data.owner,
        comment:data.comment,
        time:data.time
      };
      database.ref("/CatData/"+cat+"/comment/"+key).set({
        owner:data.owner,
        comment:data.comment,
        time:data.time
      });
      return key;
    } else if(type == 'change'){
      console.log(data.uid,data.type,'comment in',data.cat);
      if(data.type == 'like'){
        if(data.inverse){
          delete CatData[data.cat].comment[data.key].like[data.uid];
          database.ref("/CatData/"+data.cat+"/comment/"+data.key+"/like/"+data.uid).set(null);
        } else {
          CatData[data.cat].comment[data.key].like = CatData[data.cat].comment[data.key].like ?
          CatData[data.cat].comment[data.key].like:{};
          CatData[data.cat].comment[data.key].like[data.uid] = 1;
          database.ref("/CatData/"+data.cat+"/comment/"+data.key+"/like/"+data.uid).set(1);
        }
      }else if(data.type == 'del'){
        delete CatData[data.cat].comment[data.key] ;
        database.ref("/CatData/"+data.cat+"/comment/"+data.key).set(null);
      }else if(data.type == 'edit'){
        CatData[data.cat].comment[data.key].comment = data.val;
        database.ref("/CatData/"+data.cat+"/comment/"+data.key+"/comment").set(data.val);
      }
    }
  }
  catch(e){
    Util.__handalError(e);
  }
}

exports.fetch = function (type,arr) {
  console.log(type,arr);
  for(let i in arr){
    var exist = false;
    if(type == 'cat' && catNameMap[Util.AddZero(arr[i],2)]) exist = true;
    getData(type,arr[i],exist);
  }
}

function getData(type,id,exist) {
  id = Util.AddZero(id,2);
  var url = "https://battlecats-db.com/"+(type == 'cat'?"unit":'enemy')+"/"+id+".html";
  console.log(url);
  request({
    url: url,
    method: "GET"
  }, function(e,r,b) {
    var obj = type == "cat"?
        {
          comment:CatData[id]?(CatData[id].comment?CatData[id].comment:"-"):"-",
          count:CatData[id]?(CatData[id].count?CatData[id].count:0):0,
          statistic:CatData[id]?(CatData[id].statistic?CatData[id].statistic:"-"):"-",
          region:CatData[id]?(CatData[id].region?CatData[id].region:"[TW][JP]"):"[TW][JP]",
          data:{}, id:id, rarity:"",
        } : {tag:[],char:[],id:id,color:[]};
    if(!e){
      console.log("get data");
      $ = cheerio.load(b);
      var Bgc12 = 0; // cat stage
      if($(".maincontents table").find("tr[class='bgc12']").length == 1) Bgc12 = 1;
      $(".maincontents table").find("tr[class='bgc12']").each(function () {
        if(!Bgc12){Bgc12 ++;return;}  // ignore first bgc 12
        var data = type == 'cat'?(obj.data[Bgc12]={tag:[],char:[]}):obj; // point to data to write
        data.id = id+(type == 'cat'?("-"+Bgc12):"");
        data.jp_name = $(this).children().eq(1).text();
        if(type == 'cat')
          data.name = catNameMap[id]?(catNameMap[id][Number(Bgc12)-1]?catNameMap[id][Number(Bgc12)-1]:""):"";
        else
          data.name = enemyNameMap[id]?enemyNameMap[id]:"";
        var row_1 = $(this).next().next(),
            row_2 = row_1.next(),
            row_3 = row_2.next(),
            row_4 = row_3.next(),
            row_5 = row_4.next(),
            row_6 = row_5.next(),
            row_7 = row_6.next(),
            row_8 = row_7.next();

        var level = 0;
        row_3.children().eq(1).find(".finger").each(function () {
          level += Number($(this).text());
        });
        if(type == "enemy")
          row_1.children().eq(0).find('a').each(function () {
            data.color.push(Parser.parseEnemy($(this).text()));
          });
        else obj.rarity = Parser.parseRarity(row_1.children().eq(0).find("a").text());

        data.hp = Number(row_1.children().eq(3).children().eq(0).text().split(",").join(""));
        data.kb = Number(row_1.children().eq(5).text().split(",").join(""));
        data.hardness = data.hardness!=Infinity?data.hardness:'Infinity';
        data.freq = Number(row_1.children().eq(7).children().eq(0).text())?Number(row_1.children().eq(7).children().eq(0).text())/30:"-";
        data.atk = Number(row_2.children().eq(1).children().eq(0).text().split(",").join(""));
        data.speed = Number(row_2.children().eq(3).text());
        data.atk_speed = Number(row_2.children().eq(5).children().eq(0).text())/30;
        data.range = Number(row_3.children().eq(5).text().split(",").join(""));
        data.atk_period = Number(row_3.children().eq(7).children().eq(0).text())?Number(row_3.children().eq(7).children().eq(0).text())/30:"-";
        data.aoe = (type == 'cat'?row_4:row_3).children().eq(3).children().eq(0).text() == "単体" ? false : true;
        if(type == 'cat'){
          data.cost = Number(row_4.children().eq(5).children().eq(0).text().split(",").join(""));
          data.cd = Number(row_3.children().eq(7).children().eq(0).text())/30;
          data.hp = Parser.ToOriginal(data.hp,data.rarity,level);
          data.atk = Parser.ToOriginal(data.atk,data.rarity,level);
        } else{
          data.reward = Number(row_3.children().eq(7).text().split(",").join(""));
        }
        data.dps = data.freq!="-"?data.atk/data.freq:"-" ;
        data.hardness = data.hp/data.kb ;
        Parser.parseChar(row_5.children().eq(1),data,type);
        if (type == 'cat'){
          if(row_6.children().eq(0).text() == "本能") Parser.parseInstinct(row_6,data);
          if(row_7.children().eq(0).text() != "開放条件") row_7 = row_7.next();
          Parser.parseCondition(row_7,data);
        }
        Bgc12++;
        // console.log(data.char);
        // console.log(data);
      });
      console.log(obj);
      database.ref("/"+(type == 'cat'?"CatData":"enemydata")+"/"+id).update(obj);
      if(type == 'cat') CatData[id] = obj;
      else EnemyData[id] = obj;
    }
    else { console.log(e); }
  });

}
