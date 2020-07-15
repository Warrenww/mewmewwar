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
    type = Util.CapitalChar(type,0,1);
    if(type === 'Stage'){
      id = id.split("-");
      id = [id[1],id[2]].join("-");
    }
    if(!CommentData[type]) return false;

    var temp = CommentData[type][id];
    if(!temp || temp === '-') return false;

    for(let i in temp){
        let uid = temp[i].owner;
        temp[i].userInfo = {photo:Users.getSetting(uid,'photo'),name:Users.getAttr(uid,'nickname')};
    }

    return temp;
  } catch (e) {
    console.log(e);;
  }
}

exports.updateComment = function (data,action) {
  try{
    var {key,owner,id,type,uid} = data,
        obj;

    type = Util.CapitalChar(type,0,1);
    if(!CommentData[type]) return false;

    if(action === 'push'){
      key = database.ref().push().key

      console.log(`${owner} comment on ${type} ${id} with key ${key}`);
      if(Users.getAttr(data.owner,"Anonymous")) return "Anonymous";

      if(!CommentData[type]) CommentData[type] = {};
      if(!CommentData[type][id]||CommentData[type][id] === "-") CommentData[type][id] = {};
      obj = {
        owner:owner,
        comment:data.comment,
        time:data.time
      };
      CommentData[type][id][key] = obj
      database.ref("/Comment/"+type+"/"+id+"/"+key).set(obj);
      return {
        key:key,
        photo:Users.getSetting(owner,'photo'),
        name:Users.getAttr(owner,'nickname'),
        ...obj
      };
    }
    else if(action === 'like'){
      var inverse = data.inverse;
      console.log(`${uid} ${inverse?'dislike':'like'} ${type} ${id}'s' comment ${key}`);

      if(inverse){
        delete CommentData[type][id][key].like[uid];
        database.ref("/Comment/"+type+"/"+id+"/"+key+"/like/"+uid).set(null);
      } else {
        CommentData[type][id][key].like = CommentData[type][id][key].like || {};
        CommentData[type][id][key].like[uid] = 1;
        database.ref("/Comment/"+type+'/'+id+'/'+key+"/like/"+uid).set(1);
      }
    }
    else if(action === 'del'){
      console.log(`${uid} delete ${type} ${id}'s' comment ${key}`);

      if(uid !== CommentData[type][id][key].owner) return false;
      delete CommentData[type][id][key] ;
      database.ref("/Comment/"+type+'/'+id+'/'+key).set(null);
    }
    else if(action === 'edit'){
      console.log(`${uid} edit ${type} ${id}'s' comment ${key}`);

      if(uid !== CommentData[type][id][key].owner) return false;
      CommentData[type][id][key].comment = data.val ;
      database.ref("/Comment/"+type+'/'+id+'/'+key+'/comment').set(data.val);
    }
    else if(action === 'report'){
      CommentData[type][id][key].report = CommentData[type][id][key].report || {count:0};
      CommentData[type][id][key].report[uid] = 1;
      CommentData[type][id][key].report.count += 1;
      database.ref("/Comment/"+type+'/'+id+'/'+key+"/report").set(CommentData[type][id][key].report);
      if(CommentData[type][id][key].report.count > 3){
        database.ref("/Report/Comment").push({type:type,id:id,key:key});
      }
    }
  }
  catch(e){
    Util.__handalError(e);
  }
}
