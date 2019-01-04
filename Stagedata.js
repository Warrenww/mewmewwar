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
    if (i == 'name') continue
    response.push({id:i,name:target[i].name});
  }
  return response
}

exports.stageMap = function () {
  return stageMap
}

exports.fetch = function (chapter,id,correction) {
  var exist = false;
  id = id.split("-");
  console.log(chapter,id);
  if(!chapter||!id) return;
  getData(chapter,"s"+id[0],id[1]?id[1]:0,correction,id[1]?true:false);

}
var NumberOfLevel;
function getData(chapter,i,j,correction=false,single=false) {
  var url = "https://battlecats-db.com/stage/"+i+(j?"-"+(Number(j)?Util.AddZero(j):j):"")+".html";
  console.log(url);
  request({
    url: url,
    method: "GET"
  }, function(e,r,b) {
    if(Number(j) == 0 && !e){
      $ = cheerio.load(b);
      if(!StageData[chapter][i]){
        var StageName = $("h2").text();
        database.ref("/stagedata/"+chapter+"/"+i+"/name").set(StageName);
      }
      NumberOfLevel = ($("td[rowspan='2']").length)/2;
      j++;
      getData(chapter,i,j,correction,false);
      return
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
      "continue" : "",
      id:[chapter,i,j].join("-"),
    };
    if(!StageData[chapter]) obj.count = 0;
    else if(!StageData[chapter][i]) obj.count = 0;
    else if(!StageData[chapter][i][j]) obj.count = 0;
    if(!e){
      // console.log("get data");
      $ = cheerio.load(b);
      var content = $(".maincontents table"),
          final = Number(j) == NumberOfLevel?true:false,
          thead = content.children("thead").eq(0).children("tr"),
          tbody_1 = content.children("tbody").eq((final?1:0)+(correction?1:0)).children("tr"),
          tbody_2 = content.children("tbody").eq((final?2:1)+(correction?1:0)).children("tr");
      obj.final = final;
      obj.jp_name = thead.eq(0).children("td").eq(2).text().split(" ")[0];
      obj.name = StageData[chapter][i][j]?StageData[chapter][i][j].name:obj.jp_name;
      obj.continue = thead.eq(0).children("td").eq(2).find("font").text()=="コンテニュー不可"?false:true;
      obj.integral = thead.eq(0).children("td").eq(2).find("font").text()=="採点報酬"?true:false;
      obj.constrain = thead.eq(0).children("td").eq(2).find("font").text().indexOf("制限")!=-1?Parser.parseConstrain(thead.eq(0).children("td").eq(2).find("font").text()):null;
      obj.energy = thead.eq(0).children("td").eq(4).text();
      obj.exp = thead.eq(1).children("td").eq(1).text().split("XP+")[1];
      obj.castle = thead.eq(2).children("td").eq(2).text();
      obj.length = thead.eq(3).children("td").eq(2).text();
      obj.limit_no = thead.eq(4).children("td").eq(2).text();
      for(let k = 0;k<tbody_1.length;k++){
        obj.reward.push({
          prize : Parser.parsePrize(tbody_1.eq(k).children("td").eq(2),tbody_1.eq(k).children("td").eq(1)),
          chance : tbody_1.eq(k).children("td").eq(3).text(),
          limit : tbody_1.eq(k).children("td").eq(4).text() == '無制限' ? "無限" : tbody_1.eq(k).children("td").eq(4).text()
        });
        // process.stdout.write(" "+JSON.stringify(obj.reward[k].prize)+"\n");
      }
      for(let k=0;k<tbody_2.length;k++){
        // console.log("enemy "+k);
        let ene = tbody_2.eq(k).children("td");
        // console.log(ene.eq(1).text());
        obj.enemy.push({
          Boss : ene.eq(0).text() == "BOSS" ? true : false,
          id : ene.eq(2).children("a").attr("href").split("/")[2].split(".html")[0],
          multiple : ene.eq(3).text(),
          amount : ene.eq(4).text(),
          castle : ene.eq(5).text(),
          first_show : (Number(ene.eq(6).text())/30).toFixed(1),
          next_time : Parser.FtoS(ene.eq(7).text())
        });
      }
      console.log(obj);
      database.ref("/stagedata/"+chapter+"/"+i+"/"+j).update(obj);
      j++;
      if(!final && !single) getData(chapter,i,j,correction,false);
    }
    else {
      // console.log("error s070"+AddZero(i)+"-0"+j);
      console.log(e);
    }
  });

}
