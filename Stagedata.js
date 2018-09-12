var database = require("firebase").database();
var Util = require("./Utility");

exports.load = function (stagedata,mostSearchStage) {
  console.log("Module start loading stage data.");

  database.ref("/stagedata").once("value",(snapshot)=>{
    var temp = snapshot.val();
    var buffer = [];
    for(let i in temp){
      stagedata[i] = temp[i];
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
    temp = [];
    console.log("Module load stage data complete!");
    console.log("most Search Stage : ",mostSearchStage);
  });

}
