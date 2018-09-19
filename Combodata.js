var database = require("firebase").database();
var Util = require("./Utility");
var ComboData;

exports.load = function (combodata) {
  console.log("Module start load combo data.");

  database.ref("/combodata").once("value",(snapshot)=>{
    ComboData = snapshot.val();
    for(let i in ComboData) combodata[i] = ComboData[i];

    console.log("Module load combo data complete!");
  });
};

// Find the combo which contained target cat
exports.FindCat = function (id) {
  var grossID = id.split("-")[0], // Remove state info
      response = [];              // Response array
  for(let i in ComboData){        // Go through combo data
    for(let j=0; j<4; j++){       // Check any cat state
      var temp = grossID+"-"+j;
      if(ComboData[i].cat.indexOf(temp) != -1){
        response.push(ComboData[i]);
        break
      }
    } // state loop close
  } // combo loop close
  return response
};
