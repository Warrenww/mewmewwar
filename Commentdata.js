var database = require("firebase").database();
var Util = require("./Utility");
var Users = require("./Userdata.js");
var fs = require("fs");
var CommentData = {};

exports.load = function () {
  console.log("Module start loading comment.");
  database.ref("/Comment").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let type in temp){
      CommentData[type] = {};
      for(let i in temp[type]){
        CommentData[type][i] = temp[type][i];
      }
    }
  });
  console.log("Module load comments complete");
}

exports.getComment = function (type,id) {
  try {
    if(type === 'cat') type = 'Cat';
    else if(type === 'enemy') type = 'Enemy';
    else if(type === 'stage') type = 'Stage';
    else return null;

    var temp = CommentData[type][id];
    if(!temp || temp === '-') return null;

    for(let i in temp){
        let uid = temp[i].owner;
        temp[i].userInfo = {photo:Users.getSetting(uid,'photo'),name:Users.getAttr(uid,'nickname')};
    }

    return temp;
  } catch (e) {
    console.log(e);;
  }
}
