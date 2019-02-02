var database = require("firebase").database();
var Util = require("./Utility");
var Parser = require("./Parser");
var request = require("request");
var cheerio = require("cheerio");
var StageData={},stageMap={};
exports.load = function (stagedata,mostSearchStage) {
  console.log("Module start loading stage data.");

  database.ref("/stagedata").once("value",(snapshot)=>{
    temp = snapshot.val();
    var buffer = [];
    for(let i in temp){
      stagedata[i] = temp[i];
      StageData[i] = temp[i];
      for(let j in stagedata[i]){
        for(let k in stagedata[i][j]){
          if(k == 'name') continue
          buffer.push({
            id:stagedata[i][j][k].id,
            count:stagedata[i][j][k].count,
            energy:stagedata[i][j][k].energy,
            name:stagedata[i][j][k].name,
            enemy:stagedata[i][j][k].enemy
          });
        }
        stageMap[j] = stagedata[i][j];
      }
    }
    buffer = Util.Sort(buffer,'count',true);
    for(let i=0; i<3; i++){
      mostSearchStage.push(buffer[i]);
    }
    buffer = [];
    console.log("Module load stage data complete!");
    // console.log("most Search Stage : ",mostSearchStage);
  });
}

exports.GetNameArr = function (chapter,level=null) {
  var target = StageData[chapter],
      response = [];
  if(level) target = target[level];
  for(let i in target) {
    if (i == 'name') continue;
    var temp = {id:i,name:target[i].name};
    if(level) temp.bg = target[i].bg_img;
    response.push(temp);
  }
  return response
}

exports.setHistory = function (id) {
  id = id.split("-");
  StageData[id[0]][id[1]][id[2]].count =
    StageData[id[0]][id[1]][id[2]].count?StageData[id[0]][id[1]][id[2]].count+1:1;
  database.ref("/stagedata/"+id.join("/")+"/count").set(StageData[id[0]][id[1]][id[2]].count);
}

exports.Search = function (type,query) {
  console.log(type,'search stage with query : ');
  console.log(query);
  var buffer;
  if(type == 'text'){
    buffer = [];
    for(let i in StageData){
      for(let j in StageData[i]){
        if(StageData[i][j].name.indexOf(query)!=-1)
        buffer.push({id:i+"-"+j,name:StageData[i][j].name});
        for(let k in StageData[i][j]){
          if (k=='name') continue
          if(StageData[i][j][k].name.indexOf(query)!=-1)
          buffer.push({
            id:i+"-"+j+"-"+k,
            name:StageData[i][j].name+"/"+StageData[i][j][k].name
          });
        }
      }
    }
  }
  else if(type == 'reward'){
    buffer = {};
    // Go through all stage data to find reward
    for(let i in StageData){
      for(let j in StageData[i]){
        for(let k in StageData[i][j]){
          if('name' == k) continue  // Bypass it's name
          var reward = StageData[i][j][k].reward,
              id = StageData[i][j][k].id,
              name = StageData[i][j].name+"-"+StageData[i][j][k].name;
          for(let l in reward){
            // Get the reward position in target list, if not exist return -1
            var pos = query.indexOf(reward[l].prize.name);
            // If this reward is contained in target reward list
            if( pos != -1){
              // If this stage does not exist in buffer, create it
              if(!buffer[id]) buffer[id] = {name:name};
              // Store chance into it, if reward exist and chance is bigger pass this
              if(buffer[id][query[pos]])
                if(Number(reward[l].chance.split("％")[0]) < Number(buffer[id][query[pos]].split("％")[0]))
                    continue
              buffer[id][query[pos]] = reward[l].chance;
            }
          }
        }
      }
    }
  }
  return buffer
}

exports.stageMap = function () {
  return stageMap
}

var NumberOfLevel,fetch_Url,starVar,LevelArr,finalLevelPos,modify = 0;
exports.fetch = function (chapter,id,correction) {
  var exist = false;
  id = id.split("-");
  // console.log(chapter,id);
  if(!chapter||!id) return;
  LevelArr = [0];
  getData(chapter,("s"+id[0]).trim(),0,false);
}
function getData(chapter,i,j,correction=false) {
  fetch_Url = "https://battlecats-db.com/stage/"+i+
    (LevelArr[j]?"-"+(Number(LevelArr[j])?Util.AddZero(LevelArr[j]):LevelArr[j]):"")+".html";
  console.log(fetch_Url);
  request({
    url: fetch_Url,
    method: "GET"
  }, function(e,r,b) {
    if(Number(j) == 0 && !e){
      $ = cheerio.load(b);
      if(!StageData[chapter][i]){
        var StageName = $("h2").text();
        database.ref("/stagedata/"+chapter+"/"+i+"/name").set(StageName);
        StageData[chapter][i] = {name:StageName};
      }
      NumberOfLevel = ($("td[rowspan='2']").length)/2;
      $("td[rowspan='2']").each(function () {
        let x = $(this).find("a").eq(0).attr('href');
        if (!x) return;
        x = x.split(".")[0].split("-")[1];
        x = Number.isNaN(Number(x))?x:Number(x);
        LevelArr.push(x);
      });
      console.log(LevelArr);
      for(let j=0;j<LevelArr.length;j++){
        let k = j+1;
        if(k==LevelArr.length||LevelArr[k].toString().indexOf('ex')!=-1){
          finalLevelPos = j;
          break;
        }
      }
      j++;
      getData(chapter,i,j,correction,false);
      return;
    }

    var obj = {
      name : "",
      energy : "",
      exp : "",
      castle : "",
      length : "",
      limit_no : "",
      reward : [],
      enemy : [],
      final : "",
      star : [],
      "continue" : "",
      id:[chapter,i,LevelArr[j]].join("-"),
    };
    if(!StageData[chapter]) obj.count = 0;
    else if(!StageData[chapter][i]) obj.count = 0;
    else if(!StageData[chapter][i][LevelArr[j]]) obj.count = 0;
    else obj.count = StageData[chapter][i][LevelArr[j]].count;
    if(!e){
      // console.log("get data");
      $ = cheerio.load(b);
      var content = $(".maincontents table"),
          final = Number(j) == finalLevelPos,
          thead = content.children("thead").eq(0).children("tr"),
          tbody_1 = content.children("tbody").eq((final?1:0)+modify).children("tr"),
          tbody_2 = content.children("tbody").eq((final?2:1)+modify).children("tr"),
          tbody_3 = content.children("tbody").eq((final?3:2)+modify).children("tr"),
          star_len = $("#List").find("td").eq(0).find("a").length+1;
          modify = 0;
      if (tbody_3.length) correction = true;
      else correction = false;

      obj.final = final;
      obj.jp_name = thead.eq(0).children("td").eq(2).text().split(" ")[0];
      obj.name = StageData[chapter]?(StageData[chapter][i]?(StageData[chapter][i][LevelArr[j]]?StageData[chapter][i][LevelArr[j]].name:obj.jp_name):obj.jp_name):obj.jp_name;
      obj.continue = thead.eq(0).children("td").eq(2).find("font").text().indexOf("コンテニュー不可")!=-1?false:true;
      obj.integral = thead.eq(0).children("td").eq(2).find("font").text()=="採点報酬"?true:false;
      obj.constrain = thead.eq(0).children("td").eq(2).find("font").text().indexOf("制限")!=-1?Parser.parseConstrain(thead.eq(0).children("td").eq(2).find("font").text()):null;
      obj.energy = thead.eq(0).children("td").eq(4).text();
      obj.exp = thead.eq(1).children("td").eq(1).text().split("XP+")[1];
      obj.castle = thead.eq(2).children("td").eq(3).text();
      obj.length = thead.eq(3).children("td").eq(1).text();
      obj.limit_no = thead.eq(4).children("td").eq(1).text();
      obj.bg_img = thead.eq(2).children("td").eq(1).find('.bg').attr("src").split("/")[3].split(".")[0];
      obj.castle_img = thead.eq(2).children("td").eq(1).find('.castle').attr("src").split("/")[3].split(".")[0];

      for(let k = 0;k<tbody_1.length;k++){
        obj.reward.push({
          prize : Parser.parsePrize(tbody_1.eq(k).children("td").eq(2),tbody_1.eq(k).children("td").eq(1)),
          chance : tbody_1.eq(k).children("td").eq(3).text(),
          limit : tbody_1.eq(k).children("td").eq(4).text() == '無制限' ? "無限" : tbody_1.eq(k).children("td").eq(4).text()
        });
      }
      if(correction){
        for(let k = 0;k<tbody_2.length;k++){
          obj.reward.push({
            prize : Parser.parsePrize(tbody_2.eq(k).children("td").eq(2),tbody_2.eq(k).children("td").eq(1)),
            chance : tbody_2.eq(k).children("td").eq(3).text(),
            limit : tbody_2.eq(k).children("td").eq(4).text() == '無制限' ? "無限" : tbody_2.eq(k).children("td").eq(4).text()
          });
        }
        tbody_2 = tbody_3;
      }
      for(let k=0;k<tbody_2.length;k++){
        let ene = tbody_2.eq(k).children("td");
        obj.enemy.push({
          Boss : ene.eq(0).text() == "BOSS" ? true : false,
          id : ene.eq(2).children("a").attr("href").split("/")[2].split(".html")[0],
          multiple : ene.eq(3).text(),
          amount : ene.eq(4).text(),
          castle : ene.eq(5).text(),
          first_show : (Number(ene.eq(6).text())/30).toFixed(1),
          next_time : Parser.FtoS(ene.eq(7).text())
        });
        if(k==0){
          for(let l=0;l<star_len;l++) obj.star.push(Number(ene.eq(3).text().split('％')[0]));
        }
      }
      console.log(obj);

      if(star_len>1) updateStar(obj,star_len,final,correction);
      else StageData[chapter][i][LevelArr[j]] = obj;

      database.ref("/stagedata/"+chapter+"/"+i+"/"+LevelArr[j]).update(obj);
      j++;
      if(j<LevelArr.length) getData(chapter,i,j,correction);
    }
    else {
      console.log(e);
    }
  });
}
function updateStar(obj,n,final,correction) {
  var id = obj.id.split("-"),
      fetch_Url = "https://battlecats-db.com/stage/"+id[1]+"-"+Util.AddZero(id[2])+".html?s"+n;
  console.log(fetch_Url,final);
  request({
    url: fetch_Url,
    method: "GET"
  }, function(e,r,b) {
    $ = cheerio.load(b);
    var x = $(".maincontents table").children("tbody").eq((final?2:1)+(correction?1:0)).children("tr").eq(0).children("td").eq(3).text().split('％')[0];
    // console.log(x);
    x = Number(x);
    // console.log(x);
    n--;
    obj.star[n] = x/obj.star[n];

    if(n>1) updateStar(obj,n,final,correction);
    else{
      obj.star[0] = 1;
      StageData[id[0]][id[1]][id[2]] = obj;
      database.ref("/stagedata/"+id[0]+"/"+id[1]+"/"+id[2]).update(obj);
    }
  });
}
