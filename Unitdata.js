var database = require("firebase").database();
var Util = require("./Utility");
var __numberOfCat = 0;
var __numberOfCatSearch = 0;
var catNameMap = {};

// Get cat data,comment and enemy data from firebase.
exports.load = function (catdata,catComment,enemydata,mostSearchCat) {
  console.log("Module start loading data and comment.");

  var exist=null,buffer=[],localCount=0 ;
  database.ref("/newCatData").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      catdata[i] = temp[i];
      __numberOfCat ++ ;
      catNameMap[i] = temp[i].name?temp[i].name:temp[i].jp_name;
      current = i.substring(0,3);
      if (current == exist){
        localCount += catdata[i].count?catdata[i].count:0;
      } else {
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
        count:catdata[id].count,
        id:id,
        hp:Util.levelToValue(catdata[id].hp,catdata[id].rarity,30).toFixed(0),
        atk:Util.levelToValue(catdata[id].atk,catdata[id].rarity,30).toFixed(0),
      });
    }
    buffer = [];
    temp = [];
    console.log("Module load cat data complete!");
    console.log("most Search Cat : ",mostSearchCat);
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
