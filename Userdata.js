var database = require("firebase").database();
var admin = require("firebase-admin");
var Util = require("./Utility");
var UserData = {};
var ModifiedTable = {};
const HistoryLimit = 50;

exports.load = function () {
  console.log("Module start load user data.");
  return new Promise(function(resolve, reject) {
    database.ref("/user").once("value",(snapshot)=>{
      temp = snapshot.val();
      // for(let i in temp) UserData[i] = temp[i];
      console.log("Module load user data complete!");
      // arrangeUserData(userdata);
      arrangeUserData(temp);
      resolve(true);
    });
  });

}

exports.updateLastLogin = function (uid,time) {
  // console.log(`${uid} last login ${time}`);
  return new Promise(function(resolve, reject) {
    try {
      if(UserData[uid]){
        console.log("cache hit");
        UserData[uid].last_login = time;
        ModifiedTable[uid] = true;
        resolve(UserData[uid]);
      } else {
        console.log("cache miss");
        database.ref("/user/"+uid).once("value",(snapshot)=>{
          console.log("data fetch complete");
          var temp = snapshot.val();
          if(temp != null){
            UserData[uid] = temp;
            UserData[uid].last_login = time;
            ModifiedTable[uid] = true;
            resolve(UserData[uid]);
          } else {
            reject("user not found!");
          }
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}
function userPromise(uid) {
  return new Promise(function(resolve, reject) {
    try {
      if(UserData[uid]){
        console.log("cache hit");
        resolve(UserData[uid]);
      } else {
        console.log("cache miss");
        database.ref("/user/"+uid).once("value",(snapshot)=>{
          console.log("data fetch complete");
          var temp = snapshot.val();
          if(temp != null){
            UserData[uid] = temp;
            resolve(UserData[uid]);
          } else {
            reject("user not found!");
          }
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

exports.writeBack = function (uid) {
  if(!uid) for(let i in ModifiedTable) writeBackUser(i);
  else writeBackUser(uid);
}
function writeBackUser(uid) {
  if(!uid) return;
  if(ModifiedTable[uid]){
    database.ref("/user/"+uid).update(UserData[uid]);
    ModifiedTable[uid] = false;
  }
}
exports.getSetting = function (uid,subtype=null) {
  if(!UserData[uid]) return null
  if(!subtype) return UserData[uid].setting
  else return UserData[uid].setting[subtype]
}
exports.setSetting = function (uid,attr,data) {
  if(!UserData[uid]) return null
  UserData[uid].setting[attr] = data;
  ModifiedTable[uid] = true;
  // database.ref("/user/"+uid+"/setting/"+attr).set(data);
}
exports.getVariable = function (uid, arg_0 = null, arg_1 = null, arg_2 = null) {
  if(!uid) return {};
  var response;
  if(arg_0){
    if(UserData[uid].variable[arg_0]==''||!UserData[uid].variable[arg_0])
    UserData[uid].variable[arg_0] = {};
    if(arg_1){
      if(arg_2) response = UserData[uid].variable[arg_0][arg_1][arg_2];
      else response = UserData[uid].variable[arg_0][arg_1];
    } else response = UserData[uid].variable[arg_0];
  } else response = UserData[uid].variable;
  return response;
}
exports.getCompare = function (uid,type) {
  if(!UserData[uid]) return null
  return UserData[uid].compare[type+"2"+type];
}
exports.setCompare = function (uid,type,array) {
  if(!UserData[uid]) return null
  UserData[uid].compare[type+"2"+type] = array;
  ModifiedTable[uid] = true;
  // database.ref('/user/'+uid+"/compare/"+type+"2"+type).set(array);
}
exports.getFolder = function (uid) {
  if(!UserData[uid]) return null
  if(!UserData[uid].folder){
    UserData[uid].folder = {owned:""};
    ModifiedTable[uid] = true;
  }
  return UserData[uid].folder;
}
exports.setFolder = function (uid,folder,data) {
  if(!UserData[uid]) return null
  UserData[uid].folder[folder] = data ;
  ModifiedTable[uid] = true;
  // database.ref("/user/"+data.uid+"/folder/"+folder).set(data);
}
exports.getAttr = function (uid,attr) {
  if(UserData[uid]) return UserData[uid][attr];
  else return null;
}
exports.getList = function (uid) {
  if(!UserData[uid]) return null
  return UserData[uid].list
}
exports.getHistory = function (uid,type=null) {
  if(!UserData[uid]) return null
  if(!type) return UserData[uid].history;
  if(UserData[uid].history[type] == "" ) UserData[uid].history[type] = {};
  return UserData[uid].history[type];
}
exports.setHistory = function (uid,type,id,opt={}){
  try{
    userPromise(uid).then(user => {
      // Check if it is last search
      if(user.history['last_'+type] == id) return;
      var user_history = user.history[type],
          user_variable = user.variable[type],
          current = type == 'cat'?id.toString().substring(0,3):id,
          history_count = 0;

      if(typeof(user_history) !== "object" || user_history === null ) user_history = {};

      // Find same unit and clear it
      for(let i in user_history){
        var exist = type == 'cat'?user_history[i].id.toString().substring(0,3):user_history[i].id;
        if(exist == current) delete user_history[i];
        else history_count ++ ;
      }
      // trim all kind of user history to at most 40
      for(let i in user_history){
        if(history_count < HistoryLimit) break;
        history_count -- ;
        delete user_history[i];
      }
      var key = database.ref().push().key; // Generate hash key
      // Update history and write to firebase
      user_history[key] = {type : type,id : id,time:new Date().getTime()};
      for(let i in opt){ user_history[key][i] = opt[i]; }
      user.history[type] = user_history;
      user.history["last_"+type] = id;
      ModifiedTable[uid] = true;

      if(type != 'cat' &&type != 'enemy' &&type != 'stage' ) return;
      if(user_variable == "" || !user_variable ) user_variable = {};
      if(!user_variable[id]) user_variable[id] = {count:0};
      user_variable[id].count = user_variable[id].count?(user_variable[id].count+1):1;
    });
  } catch(err){
    Util.__handalError(err);
  }
}
exports.SearchHistory = function (uid,type,data) {
  if(!UserData[uid]) return null
  // database.ref("/user/"+uid+"/history/last_"+type+"_search").set(data);
  ModifiedTable[uid] = true;
  UserData[uid].history["last_"+type+"_search"] = data;
}

exports.StoreLevel = function(uid,id,type,lv){
  // console.log(uid+" change his/her "+type,id+"'s level to "+lv);
  try{
    userPromise(uid).then((rs,rj)=>{
      id = id.toString().substring(0,3);
      // target cat or enemy
      var buffer = UserData[uid].variable[type][id] ;
      buffer = buffer?buffer:{lv:1,count:0}; // handal of not exist data
      // set level and store to firebase
      buffer.lv = lv;
      // database.ref("/user/"+uid+"/variable/"+type+"/"+id).update({lv:lv});
      ModifiedTable[uid] = true;
    });
  }catch(e){
    Util.__handalError(e);
  }
}
exports.StoreStage = function(uid,id,stage){
  stage = Number(stage)+1;
  // console.log(uid+" change his/her cat"+id+"'s stage to "+stage);
  try{
    id = id.toString().substring(0,3);
    // target cat or enemy
    var buffer = UserData[uid].variable['cat'][id] ;
    buffer = buffer?buffer:{lv:1,count:0,stage:1}; // handal of not exist data
    // set level and store to firebase
    buffer.stage = stage;
    // database.ref("/user/"+uid+"/variable/cat/"+id).update({stage:stage});
    ModifiedTable[uid] = true;
  }catch(e){
    Util.__handalError(e);
  }
}

exports.Login = function (user) {
  try{
    var timer = new Date().getTime();
    var data;
    console.log('login time : '+timer);

    return new Promise(function(resolve, reject) {
      if(user.uid in ModifiedTable){
        console.log("user exist");
        if(UserData[user.uid]){
          UserData[user.uid].last_login = timer;
          ModifiedTable[user.uid] = true;
          resolve({user,nickname:UserData[user.uid].nickname,photo:UserData[user.uid].photo});
        } else {
          database.ref("/user/"+User.uid).once("value",(snapshot)=>{
            UserData[user.uid] = snapshot.val();
            UserData[user.uid].last_login = timer;
            ModifiedTable[uid] = true;
            resolve({user,nickname:UserData[user.uid].nickname,photo:UserData[user.uid].photo});
          });
        }
      } else {
        console.log('new user');
        data = Util.GenerateUser(user,UserData);
        resolve({user,nickname:UserData[user.uid].nickname});
      }
    });
  }
  catch(e){
    Util.__handalError(e);
  }
}
exports.Rename = function (uid,name) {
  try{
    UserData[uid].nickname = name;
    // database.ref("/user/"+uid+"/nickname").set(name);
    ModifiedTable[uid] = true;
  }catch(e){
    Util.__handalError(e);
  }
}

function arrangeUserData(userdata) {
  console.log('arrange user data');
  let count = 0,
      timer = new Date().getTime();
  for(let i in userdata){
    var uptodate = false;
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
      Util.GenerateUser(user,UserData);
    }
    count ++ ;
    if(!userdata[i].variable) {
      console.log("user "+i+" no variable");
      database.ref('/user/'+i+"/variable").set({cat:"",enemy:"",stage:""});
      // userdata[i].variable = {cat:"",enemy:"",stage:""};
    }
    if(ModifiedTable[i]){ database.ref("/user/"+i).update(UserData[i]); uptodate = true;}
    ModifiedTable[i] = false;
    if((timer - userdata[i].last_login) < 86400000 && !uptodate) UserData[i] = userdata[i];
  }
  console.log("there are "+count+" users!!");
}
