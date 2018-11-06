var database = require("firebase").database();
var Util = require("./Utility");
var Parser = require("./Parser");
var StageData,stageMap={};
exports.load = function (stagedata,mostSearchStage) {
  console.log("Module start loading stage data.");

  database.ref("/stagedata").once("value",(snapshot)=>{
    StageData = snapshot.val();
    var buffer = [];
    for(let i in StageData){
      stagedata[i] = StageData[i];
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

exports.fetch = function (chapter,id) {
  id = id.split("-");
  getData(chapter,id[0],id[1]?id[1]:0);
}
function getData(chapter,i,j) {
  // console.log("https://battlecats-db.com/stage/s070"+"00-"+AddZero(j)+".html");
  var url = "https://battlecats-db.com/stage/s"+i+(j?("-"+Util.AddZero(j)):"")+".html";
  request({
    url: url,
    method: "GET"
  }, function(e,r,b) {
    if(!Number(j) && !e){
      $ = cheerio.load(b);
      var StageName = $("h2").text();
      NumberOfLevel = ($("td[rowspan='2']").length)/2;
      database.ref("/stagedata/"+chapter+"/s"+i+"/name").set(StageName);
      j++;
      getData(i,j);
      return
    }

    var obj = {
      name : "",
      energy : "",
      exp : "",
      castle : "",
      length : "",
      count : 0,
      limit_no : "",
      reward : [],
      enemy : [],
      final : "",
      "continue" : "",
      id:[chapter,"s"+i,j].join("-"),
    };
    if(!e){
      // console.log("get data");
      $ = cheerio.load(b);
      var content = $(".maincontents table"),
          final = Number(j) == NumberOfLevel?true:false,
          thead = content.children("thead").eq(0).children("tr"),
          tbody_1 = content.children("tbody").eq(final?1:0).children("tr"),
          tbody_2 = content.children("tbody").eq(final?2:1).children("tr");
      obj.final = final;
      obj.name = thead.eq(0).children("td").eq(2).text().split(" ")[0];
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
        // console.log(ene.eq(1).text());s
        obj.enemy.push({
          Boss : ene.eq(0).text() == "BOSS" ? true : false,
          id : ene.eq(2).children("a").attr("href").split("/")[2].split(".html")[0],
          multiple : ene.eq(3).text(),
          amount : ene.eq(4).text(),
          castle : ene.eq(5).text(),
          first_show : (Number(ene.eq(6).text())/30).toFixed(1),
          next_time : FtoS(ene.eq(7).text())
        });
      }
      console.log(obj);
      database.ref("/stagedata/"+chapter+"/s"+i+"/"+j).update(obj);
      j++;
      if(!final) getData(chapter,i,j);
    }
    else {
      // console.log("error s070"+AddZero(i)+"-0"+j);
      console.log(e);
    }
  });

}
