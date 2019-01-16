var database = require("firebase").database();
var admin = require("firebase-admin");
var Util = require("./Utility");
var UserData = {};

exports.load = function () {
  console.log("Module start load user data.");

  database.ref("/user").once("value",(snapshot)=>{
    temp = snapshot.val();
    for(let i in temp) UserData[i] = temp[i];
    console.log("Module load user data complete!");
    // arrangeUserData(userdata);
    arrangeUserData(UserData);
  });
}

exports.getSetting = function (uid,subtype=null) {
  if(!UserData[uid]) return null
  if(!subtype) return UserData[uid].setting
  else return UserData[uid].setting[subtype]
}
exports.setSetting = function (uid,attr,data) {
  if(!UserData[uid]) return null
  UserData[uid].setting[attr] = data;
  database.ref("/user/"+uid+"/setting/"+attr).set(data);
}
exports.getVariable = function (uid, arg_0 = null, arg_1 = null, arg_2 = null) {
  if(!UserData[uid]) return null
  var response;
  if(arg_0){
    if(UserData[uid].variable[arg_0]=='') UserData[uid].variable[arg_0]={};
    if(arg_1){
      if(arg_2) response = UserData[uid].variable[arg_0][arg_1][arg_2];
      else response = UserData[uid].variable[arg_0][arg_1];
    } else response = UserData[uid].variable[arg_0];
  } else response = UserData[uid].variable;
  return response;
}
exports.getHistory = function (uid,type=null) {
  if(!UserData[uid]) return null
  if(!type) return UserData[uid].history;
  if(UserData[uid].history[type] == "" ) UserData[uid].history[type] = {};
  return UserData[uid].history[type];
}
exports.getCompare = function (uid,type) {
  if(!UserData[uid]) return null
  return UserData[uid].compare[type+"2"+type];
}
exports.setCompare = function (uid,type,array) {
  if(!UserData[uid]) return null
  UserData[uid].compare[type+"2"+type] = array;
  database.ref('/user/'+uid+"/compare/"+type+"2"+type).set(array);
}
exports.getFolder = function (uid) {
  if(!UserData[uid]) return null
  if(!UserData[uid].folder){
    UserData[uid].folder = {};
    database.ref('/user/'+uid+"/folder").set({own:""});
  }
  return UserData[uid].folder
}
exports.setFolder = function (uid,folder,data) {
  if(!UserData[uid]) return null
  UserData[uid].folder[folder] = data ;
  database.ref("/user/"+data.uid+"/folder/"+folder).set(data);
}
exports.getAttr = function (uid,attr) {
  if(!UserData[uid]) return null
  return UserData[uid][attr]
}
exports.getList = function (uid) {
  if(!UserData[uid]) return null
  return UserData[uid].list
}
exports.setHistory = function (uid,type,id){
  try{
    // Check if it is last search
    if(UserData[uid].history['last_'+type] == id) return

    var user_history = UserData[uid].history[type],
        user_variable = UserData[uid].variable[type];

    if(user_history == "" || !user_history ) user_history = {};
    if(user_variable == "" || !user_variable ) user_variable = {};
    // Find same unit and clear it
    for(let i in user_history){
      var exist = type == 'cat'?user_history[i].id.toString().substring(0,3):user_history[i].id,
          current = type == 'cat'?id.toString().substring(0,3):id;
      if(exist == current) delete user_history[i]
    }
    var key = database.ref().push().key; // Generate hash key
    // Update history and write to firebase
    user_history[key] = {type : type,id : id,time:new Date().getTime()};
    database.ref("/user/"+uid+"/history/"+type).set(user_history);
    UserData[uid].history["last_"+type] = id;
    database.ref("/user/"+uid+"/history/last_"+type).set(id);

    if(type != 'cat' &&type != 'enemy' &&type != 'stage' ) return
    if(!user_variable[id]) user_variable[id] = {count:0};
    user_variable[id].count = user_variable[id].count?(user_variable[id].count+1):1;
    database.ref("/user/"+uid+"/variable/"+type+"/"+id+"/count").set(user_variable[id].count);
  } catch(err){
    Util.__handalError(err);
  }
}
exports.SearchHistory = function (uid,type,data) {
  if(!UserData[uid]) return null
  database.ref("/user/"+uid+"/history/last_"+type+"_search").set(data);
  UserData[uid].history["last_"+type+"_search"] = data;
}

exports.StoreLevel = function(uid,id,type,lv){
  console.log(uid+" change his/her "+type,id+"'s level to "+lv);
  try{
    id = id.toString().substring(0,3);
    // target cat or enemy
    var buffer = UserData[uid].variable[type][id] ;
    buffer = buffer?buffer:{lv:1,count:0}; // handal of not exist data
    // set level and store to firebase
    buffer.lv = lv;
    database.ref("/user/"+uid+"/variable/"+type+"/"+id).update({lv:lv});
  }catch(e){
    Util.__handalError(e);
  }
}
exports.StoreStage = function(uid,id,stage){
  stage = Number(stage)+1;
  console.log(uid+" change his/her cat"+id+"'s stage to "+stage);
  try{
    id = id.toString().substring(0,3);
    // target cat or enemy
    var buffer = UserData[uid].variable['cat'][id] ;
    buffer = buffer?buffer:{lv:1,count:0,stage:1}; // handal of not exist data
    // set level and store to firebase
    buffer.stage = stage;
    database.ref("/user/"+uid+"/variable/cat/"+id).update({stage:stage});
  }catch(e){
    Util.__handalError(e);
  }
}

exports.Login = function (user) {
  try{
    var exist = false;
    var timer = new Date().getTime();
    var data;
    console.log('login time : '+timer);

    if(UserData[user.uid]){
      console.log("find same user");
      exist = true;
      data = UserData[user.uid];
      database.ref('/user/'+user.uid).update({"last_login" : timer});
    } else {
      console.log('new user');
      data = Util.GenerateUser(user,UserData);
    }
    return {user,"nickname":data.nickname}
  }
  catch(e){
    Util.__handalError(e);
  }
}
exports.Rename = function (uid,name) {
  try{
    UserData[uid].nickname = name;
    database.ref("/user/"+uid+"/nickname").set(name);
  }catch(e){
    Util.__handalError(e);
  }
}

function arrangeUserData(userdata) {
  console.log('arrange user data');
  let count = 0,
      timer = new Date().getTime();
  for(let i in userdata){
    if(i == undefined|| i == "undefined"){
      console.log("remove "+i);
      database.ref('/user/'+i).remove();
      delete userdata[i];
      continue
    }
    if(userdata[i].Anonymous){
      if((timer - userdata[i].last_login)>5*86400000) {
        console.log("remove "+i+" since didn't login for 5 days");
        database.ref('/user/'+i).remove();
        admin.auth().deleteUser(i)
        .then(function() { console.log("Successfully deleted user"); })
        .catch(function(error) { console.log("Error deleting user:", error); });
        delete userdata[i];
        continue
      }
    }
    if(userdata[i].first_login == undefined){
      console.log(i+" unknown first login");
      var user = {uid:i,isAnonymous:true};
      Util.GenerateUser(user,userdata);
      continue
    }
    count ++ ;
    var arr=[],edit = ['cat','enemy','combo','stage','gacha'];
    for(let j in edit){
      for(let k in userdata[i].history[edit[j]]) arr.push(k);
      if (arr.length > 40){
        console.log(i+" too many "+edit[j]);
        arr = arr.slice(0,arr.length-40);
        for(let k in arr) delete userdata[i].history[edit[j]][arr[k]];
      }
      arr = [];
    }
    database.ref('/user/'+i+"/history").set(userdata[i].history);
    if(!userdata[i].variable) {
      console.log("user "+i+" no variable");
      database.ref('/user/'+i+"/variable").set({cat:"",enemy:"",stage:""});
      userdata[i].variable = {cat:"",enemy:"",stage:""};
    }
  }
  console.log("there are "+count+" users!!");
}
