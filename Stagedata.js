var database = require("firebase").database();
var Util = require("./Utility");
var StageData;
exports.load = function (stagedata,mostSearchStage) {
  console.log("Module start loading stage data.");

  database.ref("/stagedata").once("value",(snapshot)=>{
    StageData = snapshot.val();
    mostSearchStage = [];
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
