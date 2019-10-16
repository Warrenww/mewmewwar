var fs = require('fs');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var path = require('path');
var firebase = require("firebase");
var config = {
  apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
  authDomain: "battlecat-smart.firebaseapp.com",
  databaseURL: "https://battlecat-smart.firebaseio.com",
  projectId: "battlecat-smart",
  storageBucket: "battlecat-smart.appspot.com",
  messagingSenderId: "268279710428"
};
firebase.initializeApp(config);
// var admin = require("firebase-admin");
// var serviceAccount = require("battlecat-smart-firebase-adminsdk-nqwty-40041e7014.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://BattleCat-Smart.firebaseio.com"
// });
var Util = require("./Utility");
var Unitdata = require("./Unitdata");
var Stagedata = require("./Stagedata");
var Activity = require("./UpdateEvent");
var Users = require("./Userdata");
var Combodata = require("./Combodata");
var Commentdata = require("./Commentdata");
var updateMutex = true;

var dashboardID;
var editingTable = {}; // for rename stage
var Apiai = require("apiai");
var Ai = Apiai("03cfa1877067410c82e545e9883f5d48");

function aibot(text) {
  var request = app.textRequest(text, {
    sessionId: '35f29ddd-bf05-45b4-bb45-c0d840f72b47',
  });
  request.on('response', function(response) {
    console.log(response);
  });
  request.on('error', function(error) {
    console.log(error);
  });
  request.end();
}

var database = firebase.database();
var quickSort = Util.Sort;
var levelToValue = Util.levelToValue;

var combodata = {},
    gachadata = {},
    legenddata,
    VERSION ;
var mostSearchCat = [],
    mostSearchStage = [];
var reloadTimeOut,firstReload=true;
ReloadAllData();
async function ReloadAllData(m=0) {
  updateMutex = true;
  clearTimeout(reloadTimeOut);
  database.ref("/version").once("value",(snapshot)=>{
    VERSION = snapshot.val() || VERSION;
    if(dashboardID) io.to(dashboardID).emit("console",`VERSION : ${VERSION}`);
    console.log("VERSION : ",VERSION);
  });
  mostSearchCat = [];
  mostSearchStage = [];
  Activity.UpdateEvent();
  Unitdata.load(mostSearchCat);
  Stagedata.load(mostSearchStage);
  Combodata.load(combodata);
  Commentdata.load();
  database.ref("/gachadata").once("value",(snapshot)=>{gachadata = snapshot.val();});
  if(!m && app.settings.env != 'development') await Users.load();
  if(firstReload){
    database.ref("/legend").once("value",(snapshot)=>{ legenddata = snapshot.val(); Stagelegend();});
  } else {
    database.ref("/legend/stage/thisWeek").update(legenddata.stage.thisWeek);
    var today = new Date();
    // replace lastweek data with thisweek and empty thisWeek data.
    var tempD = Math.floor(today.getTime()/86400000)*86400000;
    for(let i in legenddata){
      if(tempD - Number(legenddata[i].thisWeek.date) > 0){
        database.ref("/legend/"+i+"/lastWeek").set(legenddata[i].thisWeek);
        legenddata[i].thisWeek = {date:tempD + 86400000*6};
        database.ref("/legend/"+i+"/thisWeek").set(legenddata[i].thisWeek);
      }
    }
    Stagelegend();
    Users.writeBack();
  }
  function Stagelegend(){
    mostSearchStage = [];
    let buffer=[],counter = 0;
    for(let i in legenddata.stage.lastWeek){
      let temp = i.split("-"),
          x = legenddata.stage.lastWeek[i],
          y = legenddata.stage.thisWeek[i];
          // console.log(temp,Number(x));
      if(y == null || Number.isNaN(Number(y)) || !Number.isFinite(y)) y = 0;
      x = (x+y)/Stagedata.GetNameArr(temp[0],temp[1]).length;
      if(i == "date" || Number.isNaN(Number(x)) || !Number.isFinite(x)) continue;
      buffer.push({id:i,count:x});
     }
    buffer = Util.Sort(buffer,"count",true);
    // console.log(buffer);
    for(let i in buffer){
      if(counter >= 3) break;
      let temp = buffer[i].id.split("-");
      // console.log(temp);
      mostSearchStage.push({
        id:buffer[i].id,
        name: Stagedata.GetNameArr(temp[0]),
        data: Stagedata.GetNameArr(temp[0],temp[1]),
        count:buffer[i].count
      });
      counter ++;
    }
  }

  reloadTimeOut = setTimeout(ReloadAllData,6*3600*1000);
  firstReload = false;
  updateMutex = false;
}

var onLineUser = {};
io.on('connection', function(socket){
  if(updateMutex) {
    socket.emit("cloud message","伺服器更新資料中，請稍後在試><")
    return false;
  }

  socket.on("public data",(dataArr)=>{
    var response = {};
    for(let i in dataArr) response[dataArr[i]] = getData(dataArr[i]);
    socket.emit("public data",response);

    function getData(filed){
      if(filed === "index"){
        return {
          legend: {mostSearchCat,mostSearchStage},
          event: Activity.getData()
        }
      }
    }
  });
  // Client require data with structure like
  // {
  //   type:type of need data(cat,enemy...etc),
  //   target:string or array,
  //   record:whether to record search history,
  //   [uid:user id],
  //   [lv: assign lv]
  // }
  // return an array of data

  // It can be independent from the user id,
  // so anyone could access this.
  socket.on("required data",function (data) {
    console.log("required data");
    console.log(data);
    try {
      // return if user not exist
      var default_lv = {cat:30,enemy:1},
          type = data.type,
          target = data.target,
          buffer = [],
          uid = null,
          user_variable = null;
      if(data.uid) {
        uid = data.uid;
        var default_cat_lv = Users.getSetting(uid,"default_cat_lv");
        default_lv.cat = default_cat_lv;
        uid = data.uid;
        user_variable = Users.getVariable(uid,type);
        if(!user_variable) user_variable = {};
      }

      // Extract data and record history
      for (let i in target) {
        var id = Number.isNaN(Number(target[i].id))?target[i].id.substring(0,3):Util.AddZero(target[i].id,2),
            stage = Number.isNaN(Number(target[i].id))?target[i].id.split("-")[1]:null,
            lv = target[i].lv;
        // record history
        if(uid){
          if(!user_variable[id]) user_variable[id] = {own:false,stage:1,lv:default_lv[type],survey:{}};
          if (data.record) SetHistory({uid:uid,type:type,target:id});
        }
        if(lv === 'user'){
          if(user_variable){
            if(user_variable[id]) lv = user_variable[id].lv;
            else lv = default_lv[type];
          }
          else lv = default_lv[type];
        }
        else if (lv === 'default' || !lv) lv = default_lv[type];

        //Extract data
        var result = {
          data:Unitdata.getData(type,id),
          lv:lv,
          combo:type=="cat"?Combodata.FindCat(id):null,
          currentStage:1
        };
        if(type == 'cat'){
          var stageMap = Stagedata.stageMap();
          for(let j in result.data.data){
            if(result.data.data[j].condition){
              if(result.data.data[j].condition.stage){
                let stageID = result.data.data[j].condition.stage.id,
                    stageName = Stagedata.GetNameArr(stageMap[stageID]).find(x => x.id === stageID);
                if(stageName) result.data.data[j].condition.stage.name = stageName.name ;
              }
            }
          }
          if(user_variable){
            result.currentStage = user_variable[id].stage || 1;
            result.own = user_variable[id].own || false;
            result.survey = user_variable[id].survey;
          }
        }
        buffer.push(result);
      }
      console.log("sending data!!");
      socket.emit("required data",{buffer,type});
    } catch (e) {
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  // Store cat level or enemy multiple
  // {
  //   uid:user id,
  //   type:cat or enemy,
  //   id:id of cat or enemy,
  //   lv:target level
  // }
  socket.on("store level",function (data) {
    if(!data.uid||!data.id) return // undefine user or id
    var uid = data.uid, id = data.id, type = data.type, lv = data.lv;
    Users.StoreLevel(uid,id,type,lv);
  });
  socket.on("store stage",function (data) {
    if(!data.uid||!data.id) return // undefine user or id
    var uid = data.uid, id = data.id, stage = data.stage;
    Users.StoreStage(uid,id,stage);
  });
  // Set the last cat/enemy/stage/gacha
  // {
  //   type: cat/enemy/stage,
  //   target:id,
  //   uid: user id
  // }
  socket.on("set history",function (data) { SetHistory(data); });
  function SetHistory(data) {
    try {
      var uid = data.uid,
          type = data.type,
          id = data.target,
          opt = data.option;
      console.log("record data");
      console.log(data);

      Users.setHistory(uid,type,id,opt);
      if(type=='cat'||type=='enemy'){
        Unitdata.setHistory(type,id);
      }
    } catch (e) {
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  }

  socket.on("gacha search",function (data) {
    console.log(data);
    console.log("recording last search quene");
    try{
      Users.SearchHistory(data.uid,data.type,data)
      var gFilter = data.query ,buffer=[],buffer_1=[],
          variable = Users.getVariable(data.uid,'cat');
      for(let i in gFilter){
        if(!gachadata[gFilter[i]]) continue
        // console.log(gachadata[gFilter[i]].ssr);
        let include = gachadata[gFilter[i]].include?gachadata[gFilter[i]].include:[]
        buffer = buffer.concat(gachadata[gFilter[i]].ssr).concat(gachadata[gFilter[i]].sssr).concat(include)
      }
      buffer = Unitdata.CreateResultQueue("cat",buffer);
      for(let i in buffer)
        buffer[i].stage = variable[buffer[i].id]?variable[buffer[i].id].stage:null;

      socket.emit("search result",{result:buffer,query:data.query,query_type:data.query_type,type:'cat'});
    }catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on("normal search",function (data) {
        console.log("searching "+data.type+"....");
        console.log(data);
        if(!data.uid) return;

        var level  = data.uid ? Users.getSetting(data.uid,'default_cat_lv'):30,
            showJP = data.uid ? Users.getSetting(data.uid,'show_jp_cat'):false,
            variable = Users.getVariable(data.uid,'cat');
        console.log("recording last search quene");
        Users.SearchHistory(data.uid,data.type,data);

        var buffer = Unitdata.Search(data,level,showJP,variable);
        if(data.type == 'cat')
          for(let i in buffer)
            buffer[i].stage = variable[buffer[i].id]?variable[buffer[i].id].stage:null;

        socket.emit("search result",{result:buffer,filterObj:data.filterObj,query:data.query,type:data.type,query_type:data.query_type});
  });
  socket.on("text search",function (data) {
    try{
      console.log(data);
      var variable = Users.getVariable(data.uid,'cat');
      var buffer = Unitdata.TextSearch(data.type,data.key,data.option);
      if(data.type == 'cat')
        for(let i in buffer)
          buffer[i].stage = variable[buffer[i].id]?variable[buffer[i].id].stage:null;
      socket.emit("search result",{result:buffer,query:data.query,query_type:'text',type:data.type});
    } catch(e) {
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on('text search stage',(text) => {socket.emit('text search stage',Stagedata.Search('text',text));});
  socket.on("search stage",(list) => {socket.emit("search stage",Stagedata.Search('reward',list));});

  socket.on("user login",function (user) {
     console.log(user.uid+" user login");
     Users.Login(user).then((data)=>{
       socket.emit("login complete",{user:data.user,name:data.nickname,photo:data.photo});
     });
   });
  socket.on("user connect",function (data){
    try{
      var timer = new Date().getTime(),
          user = data.user,
          CurrentUserData = {uid : user.uid},
          page = data.page.split("/")[1];
      console.log("user ",user.uid," connect ","\x1b[32m",page,"\x1b[37m");
      Users.updateLastLogin(user.uid,timer).then((userdata)=>{
        var history = Users.getHistory(user.uid),
            setting = Users.getSetting(user.uid),
            variable = Users.getVariable(user.uid);
        var compareCat = Users.getCompare(user.uid,'cat'),
            compareEnemy = Users.getCompare(user.uid,'enemy');
        let obj , arr = [] , brr = [];
        for(let i in compareCat){
          obj = {};
          var catname = Unitdata.catName(compareCat[i]),
          catid = compareCat[i].toString().substring(0,3);
          if(!catname) continue
          var stage = variable.cat[catid];
          stage = Number(stage?(stage.stage?stage.stage:1):1);
          obj = {id:catid,name:catname[stage-1],stage:stage};
          arr.push(obj);
        }
        for(let i in compareEnemy){
          obj = {};
          var enemyname = Unitdata.enemyName(compareEnemy[i]);
          if(!enemyname) continue
          obj = {id:compareEnemy[i],name:enemyname};
          brr.push(obj);
        }
        if(page == 'book'){
          CurrentUserData.folder = {owned:Users.getFolder(user.uid).owned};
          CurrentUserData.setting = {show_more_option:setting.show_more_option}
        }
        else if(page == 'cat'){
          CurrentUserData.last_cat = history.last_cat;
          CurrentUserData.compare_c2c = arr;
          CurrentUserData.last_cat_search = history.last_cat_search;
          CurrentUserData.setting = {
            resultDataPreview:setting.resultDataPreview,
            show_ability_text:setting.show_ability_text,
            default_cat_lv:setting.default_cat_lv,
            show_cat_id:setting.show_cat_id,
            show_cat_count:setting.show_cat_count
          }
        }
        else if(page == 'enemy'){
          CurrentUserData.last_enemy = history.last_enemy;
          CurrentUserData.compare_e2e = brr;
          CurrentUserData.last_enemy_search = history.last_enemy_search;
          CurrentUserData.setting = {
            resultDataPreview:setting.resultDataPreview,
            show_enemy_id:setting.show_enemy_id,
            show_enemy_count:setting.show_enemy_count
          }
        }
        else if(page == 'combo'){CurrentUserData.last_combo = history.last_combo;}
        else if(page == 'compare'){ CurrentUserData.compare = {cat:arr,enemy:brr}; }
        else if(page == 'history'){
          obj = {cat:{},enemy:{},stage:{},gacha:{}};
          for(i in history.cat){
            var id = history.cat[i].id.toString().substring(0,3),
            name = Unitdata.catName(id),
            lv = variable.cat[id].lv,
            stage = variable.cat[id].stage;
            if(!name || name.length == 0) continue;
            obj.cat[i] = {id:id,time:history.cat[i].time,name:name,lv:lv,stage:stage?stage:1}
          }
          for(i in history.enemy){
            var id = history.enemy[i].id,
            name = Unitdata.enemyName(id),
            lv = variable.enemy[id]?variable.enemy[id].lv:null;
            if(!name) continue;
            obj.enemy[i] = {id:id,time:history.enemy[i].time,name:name,lv:lv?lv:1}
          }
          for(i in history.stage){
            let id = history.stage[i].id.split("-"),
            chapter = id[0],stage,level
            stageArr = Stagedata.GetNameArr(chapter),
            levelArr = Stagedata.GetNameArr(chapter,id[1]);
            for (var j in stageArr)
            if (stageArr[j].id == id[1])
            stage = stageArr[j].name;
            for (var j in levelArr)
            if (levelArr[j].id == id[2])
            level = levelArr[j].name;
            obj.stage[i] = {
              id:id.join("-"),
              time:history.stage[i].time,
              stage:chapter,name:[level,stage]
            }
          }
          for(i in history.gacha){
            var id = history.gacha[i].id,
            name = gachadata[id].name;
            if(!gachadata[id]) continue;
            obj.gacha[i] = {
              id:id,
              time:history.gacha[i].time,
              name:name,
              stage:[history.gacha[i].r,history.gacha[i].sr,history.gacha[i].ssr,history.gacha[i].sssr]
            }
          }
          CurrentUserData.history = obj;
        }
        else if(page == 'stage'){
          CurrentUserData.last_stage = history.last_stage;
          CurrentUserData.setting = {
            show_more_option:setting.show_more_option,
            MoreDataField : setting.MoreDataField
          };
        }
        else if(page == 'setting'){
          CurrentUserData.setting = setting;
          CurrentUserData.name = Users.getAttr(user.uid,'nickname');
          CurrentUserData.setting = {show_more_option:setting.show_more_option}
        }
        else if(page == 'gacha'){CurrentUserData.last_gacha = history.last_gacha;}
        else if (page == 'list'){
          CurrentUserData.last_cat_search = history.last_cat_search;
          CurrentUserData.list = Users.getList(user.uid);
        }
        else if (page == 'treasure'){
          CurrentUserData.data = {
            world : Stagedata.GetNameArr('world','s03000'),
            future : Stagedata.GetNameArr('future','s03003'),
            universe : Stagedata.GetNameArr('universe','s03006'),
          };
        }
        else {
          CurrentUserData.name = Users.getAttr(user.uid,'nickname');
          CurrentUserData.photo = setting.photo;
        }
        countOnlineUser(socket.id,user.uid,true);
        socket.emit("current_user_data",CurrentUserData);
        console.log('user data send');
      }).catch((e)=>{
        if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
        else Util.__handalError(e);
      });
    }catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on('disconnect', function () {
    countOnlineUser(socket.id,null,false);
  });
  function countOnlineUser(sid,uid,connect) {
    var count = 0;
    if(connect){
      if(onLineUser[uid]){
        if(onLineUser[uid].indexOf(sid) == -1) onLineUser[uid].push(sid);
      }
      else onLineUser[uid] = [sid];
    }
    for(let i in onLineUser) {
      if(!connect && onLineUser[i].indexOf(sid)!=-1){
        onLineUser[i].splice(onLineUser[i].indexOf(sid),1);
        if(onLineUser[i].length == 0){
          delete onLineUser[i];
          Users.writeBack(i);
          continue
        }
      }
      count ++;
    }
    io.emit("online user change",count);
  }

  socket.on("combo search",function (data) {
    console.log("searching combo......") ;
    console.log(data);
    try{
      var buffer = [] ,
          arr = data.id,
          uid = data.uid,
          owned = Users.getFolder(uid,"owned");
      for(let i in combodata){
        for(let j in arr){
          if(arr[j] == (i.substring(0,4))) buffer.push(combodata[i]) ;
        }
      }
      socket.emit("combo result",{result:buffer,owned:owned}) ;
      if(uid) SetHistory({uid:uid,type:'combo',target:arr});
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  }) ;
  socket.on("more combo",function (arr) {
    try{
      let length = arr.length, buffer = [[],[],[],[],[]];
      if(length != 5) {
        for(let i in combodata){
          var cat = combodata[i].cat,
              com_length = combodata[i].amount,
              flag = 0;
          for(let j in arr) if(checkList(cat,arr[j])) flag ++;
          if (flag == length&&com_length==length) continue
          if(com_length+length-flag<6) {
            buffer[flag].push(combodata[i]);
          }
        }
      }
      buffer.push(arr);
      socket.emit("more combo",buffer);
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });

  socket.on("Set Compare",function (data) {
    console.log("compare "+data.type+"!!");
    console.log(data);
    try{
      Users.setCompare(data.id,data.type,data.target);
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });

  socket.on("rename",function (data) {
    Users.Rename(data.uid,data.name);
  });
  socket.on("mark own",function (data) {
    try{
      let folder = Users.getFolder(data.uid),
          variable = Users.getVariable(data.uid,'cat'),
          arr = ( folder.owned && folder.owned != "" )? folder.owned : [];
      if(data.arr){
        let brr = data.arr ;
        console.log("batch add",brr.length);
        for(let i in brr){
          if (!variable[brr[i]]) variable[brr[i]] = {};
          variable[brr[i]].own = true;
          if(arr.indexOf(brr[i])==-1) arr.push(brr[i]);
        }
        Users.setFolder(data.uid,'owned',arr);
        return
      }
      console.log(data.uid+" claim he/she "+
      (data.mark?"does":"doesn't")+" own "+data.cat);
      if(!variable[data.cat]) variable[data.cat]={};
      variable[data.cat].own = Boolean(data.mark);
      if(data.mark&&arr.indexOf(data.cat)==-1) arr.push(data.cat);
      else if(!data.mark&&arr.indexOf(data.cat)!=-1) arr.splice(arr.indexOf(data.cat),1);
      arr = arr.length ? arr : "" ;
      Users.setFolder(data.uid,'owned',arr);
    }catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });

  socket.on("require setting",function (id) {
    console.log("require "+id+"'s setting");
    socket.emit("user setting",Users.getSetting(id));
  });
  socket.on("Set Setting",function (data) {
    console.log("set "+data.uid+"'s "+data.target+" "+data.value);
    Users.setSetting(data.uid,data.target,data.value);
  });
  socket.on("reset cat level",function (uid) {
    console.log("reset all "+id+"'s cat lv to default");
    try{
      var data = Users.getVariable(uid,'cat'),
          default_lv = Users.getSetting(uid,'default_cat_lv');
      for(let i in data){
        data[i].lv = default_lv;
      }
      database.ref("/user/"+uid+"/variable/cat").update(data);
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on("cat list",(uid) => {
    try {
      if(!uid) return;
      var owned = Users.getFolder(uid).owned;
      if(owned === "") owned = [];
      socket.emit("cat list",{map:Unitdata.getRarityMap(),owned:owned});
    } catch (e) {
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on("reset owned cat",(req) => {
    var uid = req.uid, arr = req.arr;
    try{
      console.log("reset all "+uid+"'s cat owned state");
      var user_variable = Users.getVariable(uid,'cat');
      arr.map(x => {
        if(!user_variable[x]) user_variable[x] = {};
        user_variable[x].own = true;
      })
      for(let i in user_variable){
        user_variable[i].own = (arr.indexOf(i) !== -1);
      }
      Users.setFolder(uid,'owned',arr);
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on("change setting",function (data) {
    console.log(data.uid+" want to "+
        (data.state?"show":"hide")+" it's "+data.type);
    try{
      Users.setSetting(data.uid,"show_"+data.type,data.state);
      if(data.type == 'miner'){
        Users.setSetting(data.uid,"mine_alert",{
          time:new Date().getTime(),
          accept:data.state,
          state:true
        });
      }
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on("user photo",function (data) {
    console.log('user',data.uid,"change it's photo");
    try{
      var photo;
      if(data.type !='account'){
        photo = "./css/footage/cat/u"+Unitdata.randomCat()+".png";
        socket.emit("random cat photo",photo);
      } else photo = data.photo;
      Users.setSetting(data.uid,'photo',photo);
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });

  socket.on("required stage name",chapter => {
    if(chapter === 'legendquest')
      socket.emit("stage name",[{id:"s16000",name:"傳奇尋寶記"}]);
    else
      socket.emit("stage name",Stagedata.GetNameArr(chapter));
  });
  socket.on("required level name",ref => {
    if(ref.chapter === 'legendquest'){
      let response = [];
      for(let i=1;i<48;i++) response.push({id:i,name:"Level "+i,bg:"bg"+Util.AddZero(Math.ceil(Math.random()*108),2)});
      response.push({id:i,name:"Level Final",bg:"bg"+Util.AddZero(Math.ceil(Math.random()*108),2)});
      socket.emit("level name",response);
    }
    else
      socket.emit("level name",Stagedata.GetNameArr(ref.chapter,ref.stage));
  });
  socket.on("required level data",function (data) {
    console.log("load level data");
    console.log(data);
    try{
      var chapter = data.chapter,
          stage = data.stage,
          level = data.level,
          id = [chapter,stage,level].join("-"),
          uid = data.uid,
          parent = Stagedata.getData(chapter,stage),
          prev=null,next=null,flag=false;
      if(chapter === 'legendquest'){
        var response = [], storyName = Stagedata.GetNameArr('story');
        level -= 1;
        response.push({name:storyName[level],stage:Stagedata.GetNameArr('story','s000'+Util.AddZero(level),true)});
        response.push({name:storyName[level+1],stage:Stagedata.GetNameArr('story','s000'+Util.AddZero(level+1),true)});
        socket.emit("legendquest",{response,level});
        if(uid){
          SetHistory({uid:uid,type:'stage',target:id});
        }
        return;
      }
      for(let i in parent){
        if(flag) {next = i;break}
        if(i != level) prev = i ;
        else flag = true ;
      }
      var tempID = [chapter,stage].join("-"),
          levelData = Stagedata.getData(chapter,stage,level);
      if(legenddata.stage.thisWeek[tempID]) legenddata.stage.thisWeek[tempID] ++;
      else legenddata.stage.thisWeek[tempID] = 1;
      if(levelData.reward){
        levelData.reward.map((x,i)=>{
          if(x.prize.name.indexOf("u") === 0){
            let twName = Unitdata.catName(x.prize.name.slice(1))[x.prize.name.split("-")[1]];
            x.prize.amount = twName?twName:x.prize.amount;
          }
        })
      }
      socket.emit("level data",{
        data: levelData,
        parent:parent.name,
        chapter:chapter,
        stage:stage,
        prev:prev,
        next:next
      });
      if(uid){
        SetHistory({uid:uid,type:'stage',target:id});
      }
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });

  socket.on("check version",()=>{socket.emit("check version",VERSION);});

  socket.on("record gacha",function (data) {
    try{
      var uid = data.uid,
          gacha = data.gacha,
          result = JSON.parse(JSON.stringify(gachadata[gacha]));
      console.log("user",uid,"select gacha",gacha);
      if(!uid||!gacha) return
      result.key = gacha;
      for(let i in result){
        if (i=='id'||i=='name'||i=='key') continue
        for(let j in result[i]){
          let id = result[i][j];
          result[i][j] = {
            id : id.toString().indexOf("-")==-1?(id+"-1"):id,
            name : Unitdata.catName(id)[0]
          }
        }
      }
      socket.emit("gacha result",{ result:result});
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });

  socket.on("required owned",function (data) {
    console.log(data.uid,"owned",data.owned.length,"cat");
    try{
      var arr = [],
          variable = Users.getVariable(data.uid,'cat'),
          setting = Users.getSetting(data.uid);
      if (data.owned == "0") return
      for(let i in data.owned){
        var cat = Unitdata.getData('cat',data.owned[i]),tag=[],obj;
        for(let j in cat.data) tag = Util.MergeArray(tag,cat.data[j].tag);
        obj = {
          id:cat.id,
          name:Unitdata.catName(cat.id),
          tag:tag,
          rarity:cat.rarity,
          stage:variable[cat.id]?(variable[cat.id].stage?variable[cat.id].stage:1):1,
          lv:variable[cat.id]?(variable[cat.id].lv?variable[cat.id].lv:setting.default_cat_lv):setting.default_cat_lv
        };
        arr.push(obj);
      }
      socket.emit("owned data",arr);
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });

  socket.on("cat survey",function (data) {
    try{
      // console.log(data);
      var uid = data.uid,
          cat = data.cat,
          type = data.type,
          val = data.add;
      if(!data.cat) return
      var setting = Users.getSetting(uid),
          target = Users.getVariable(uid,'cat')[cat];
      target = target?target:{}
      var exist = target.survey?(target.survey[type]?target.survey[type]:false):false,
          count = setting.cat_survey_count?setting.cat_survey_count:0;
      if(!exist) count += 0.25;
      console.log(uid,"update",cat,"statistic",type);
      Users.setSetting(uid,'cat_survey_count',count);
      if(type == 'nickname'){
        exist = exist?exist:[];
        exist.push(val);
        var survey = target.survey;
        survey = survey?survey:{};
        survey[type] = exist;
      }
      else {
        if(!target.survey) target.survey = {};
        target.survey[type] = val;
        database.ref("/user/"+uid+"/variable/cat/"+cat+"/survey/"+type).set(val);
      }
      Unitdata.updateStatistic(cat,type,data.all);
    }
    catch(e){
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on("required comment",(req) => {
    var type = req.type,
        id = req.id,
        response;
    console.log(`require ${type} ${id} comments `);
    response = Commentdata.getComment(type,id);
    // console.log(response);
    socket.emit("required comment",response);
  });
  socket.on('submit comment',function (data) {
    var obj = Commentdata.updateComment(data,'push');
    socket.emit('comment push',obj);
  });
  socket.on('comment function',function (data) {
    var {func, ...rest} = data;
    Commentdata.updateComment(rest, func);
  });

  socket.on("cat to stage",function (data) {
    console.log("cat to stage");
    console.log(data);
    try{
      var uid = data.uid, stage = data.stage,find = false,location,data = Stagedata.getData();
      for(let i in data){
        if(find) break
        for(let j in data[i]){
          if(find) break
          if(j == stage){
            find = true;
            location = i+"-"+j+"-1";
          }
          for(let k in data[i][j]){
            if(find) break
            if((j+"-"+k) == stage){
              find = true;
              location = i+"-"+j+"-"+k;
            }
          }
        }
      }
        if(find) SetHistory({uid:uid,type:'stage',target:location});
        socket.emit('cat to stage',{find,stage});
      }catch(e){
        if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
        else Util.__handalError(e);
      }
    });

  // socket.on("save list",function (data) {
  //     let uid = data.uid,
  //     name = data.name,
  //     list = data.list,
  //     note = data.note,
  //     stageBind = data.stageBind,
  //     key = data.key?data.key:database.ref().push().key,
  //     combo = [];
  //
  //     console.log(uid,data.key?'update':'create','a list with key',key);
  //     console.log(data);
  //     if(!uid) return
  //     var default_lv = userdata[uid].setting.default_cat_lv,
  //     variable = userdata[uid].variable.cat,
  //     exist_combo = [];
  //     for(let i in combodata){
  //       let flag = true ;
  //       for(let j in combodata[i].cat) {
  //         if(combodata[i].cat[j] == '-') continue
  //         if(!checkList(list.upper,combodata[i].cat[j])) flag = false;
  //       }
  //       if(!flag||exist_combo.indexOf(combodata[i].id)!=-1) continue
  //       exist_combo.push(combodata[i].id);
  //       combo.push(combodata[i]);
  //     }
  //     for(let i in list){
  //       for(let j in list[i]){
  //         let id = list[i][j],cost = catdata[id].cost,bro = 0,grossID = id.substring(0,3),
  //         lv = variable[grossID]?(variable[grossID].lv?variable[grossID].lv:default_lv):default_lv;
  //         for(let k=1;k<4;k++) if(catdata[grossID+"-"+k]) bro ++;
  //         list[i][j] = { id:id,cost:cost,lv:"Lv."+lv,bro:bro }
  //       }
  //     }
  //     socket.emit("list save complete",{ key,list,combo,stageBind,note,name,'public':data.public });
  //     if(!userdata[uid].list) userdata[uid].list = {};
  //
  //     userdata[uid].list[key] = {name,list,combo,stageBind,note,'public':data.public};
  //     database.ref("/user/"+uid+"/list/"+key).set({name,list,combo,stageBind,note,'public':data.public});
  //     for(let i in stageBind){
  //       let id = stageBind[i].id.split("-"),
  //       target = stagedata[id[0]][id[1]][id[2]];
  //       if(!target.list) target.list = {};
  //       target.list[key] = {name,list,combo,stageBind,note,owner:uid,public:data.public};
  //       database.ref("/stagedata/"+id[0]+"/"+id[1]+"/"+id[2]+"/list/"+key)
  //       .set({name,list,combo,stageBind,note,owner:uid,public:data.public});
  //     }
  //     for(let i in data.removeStageBind){
  //       if(!data.removeStageBind[i]) continue
  //       let id = data.removeStageBind[i].split("-"),
  //       target = stagedata[id[0]][id[1]][id[2]];
  //       delete target.list[key];
  //       database.ref("/stagedata/"+id[0]+"/"+id[1]+"/"+id[2]+"/list/"+key).set(null);
  //     }
  // });
  //
  function checkList(list,id) {
    for(let i in list) if(list[i].substring(0,3) == id.substring(0,3)) return Number(i)+1
    return false
  }

  // socket.on("delete list",function (data) {
  //   console.log(data.uid,'delete list',data.key);
  //   try{
  //     delete userdata[data.uid].list[data.key];
  //     database.ref("/user/"+data.uid+"/list/"+data.key).set(null);
  //     for(let i in data.stageBind){
  //       let id = data.stageBind[i].id.split("-"),
  //       target = stagedata[id[0]][id[1]][id[2]];
  //       delete target.list[data.key];
  //       database.ref("/stagedata/"+id[0]+"/"+id[1]+"/"+id[2]+"/list/"+data.key).set(null);
  //     }
  //   }
  //   catch(e){
  //     if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
  //   }
  // });
  socket.on("Game Picture",function () {
    var buffer = [];
    while(buffer.length < 18){
      var cat = Unitdata.randomCat(true),
          data = Unitdata.getData('cat',cat),
          rand = Math.random();
      if(buffer.indexOf(cat) == -1 &&( data.count/3000 > rand)) buffer.push(cat);
    }
    buffer.forEach(function (catid,i,arr) {
      arr[i] = Unitdata.getData('cat',catid);
    });
    socket.emit("Game Picture",buffer);
  });
  socket.on("dashboard",()=>{
    // console.log(socket.id);
    dashboardID = socket.id;
    if(dashboardID) io.to(dashboardID).emit("console","connect to dashboard console");
    else Util.__handalError(e);
  });
  socket.on("fetch data",(data)=>{
    try {
      if(dashboardID) io.to(dashboardID).emit("console",`fatch ${data.type} : ${data.arr}`);
      if(data.type == "cat") Unitdata.fetch('cat',data.arr);
      if(data.type == "enemy") Unitdata.fetch('enemy',data.arr);
      if(data.type == "stage") Stagedata.fetch(data.chapter,data.id,data.correction);
    } catch (e) {
      if(dashboardID) io.to(dashboardID).emit("console",Util.__handalError(e));
      else Util.__handalError(e);
    }
  });
  socket.on("dashboard load",(data)=>{
    var type = data.type;
    if(dashboardID) io.to(dashboardID).emit("console",`loading ${type} ...`);
    var obj = {};
    if(type == 'stage'){
      database.ref("/stagedata").once('value',(snapshot)=>{
        var temp = snapshot.val();
        for(let i in temp){
          obj[i] = {};
          for (let j in temp[i]){
            obj[i][j]={};
            for(let k in temp[i][j]){
              obj[i][j][k] =
                typeof(temp[i][j][k]) == "object"?
                  {name:temp[i][j][k].name,reward:temp[i][j][k].reward}:
                    {name:temp[i][j][k]};
            }
          }
        }
        if(dashboardID) io.to(dashboardID).emit("console",`${type} data load complete`);
        socket.emit("dashboard load",{type,obj});
      });
    }
    else if(type == 'cat'){
      database.ref("/CatData").once('value',(snapshot)=>{
        var temp = snapshot.val();
        for(let i in temp){
          for(let j in temp[i].data){
            if(!obj[i]) obj[i] = {};
            obj[i][j] = {
              name : temp[i].data[j].name,
              jp_name : temp[i].data[j].jp_name,
              region : temp[i].region,
              rarity : temp[i].rarity
            };
          }
        }
        if(dashboardID) io.to(dashboardID).emit("console",`${type} data load complete`);
        else Util.__handalError(e);
        socket.emit("dashboard load",{type,obj});
      });
    }
    else if(type == 'enemy'){
      database.ref("/enemydata").once('value',(snapshot)=>{
        var temp = snapshot.val();
        for(let i in temp){
          obj[i] = {
            name : temp[i].name,
            jp_name : temp[i].jp_name
          };
        }
        if(dashboardID) io.to(dashboardID).emit("console",`${type} data load complete`);
        else Util.__handalError(e);
        socket.emit("dashboard load",{type,obj});
      });
    }
  })
  socket.on("fetch variable",(data)=>{
    if(data.type == 'onLineUser') io.to(dashboardID).emit("console",JSON.stringify(onLineUser));
  })
  socket.on("DashboardUpdateData",(data)=>{
    console.log('update',data);
    if(dashboardID) io.to(dashboardID).emit("console",`update : ${data.path}->${data.type} <= ${data.val}`);
    else Util.__handalError(e);
    var path = data.path.split(",");
    var obj = {},target;
    obj[data.type] = data.val;
    database.ref("/"+path.join("/")).update(obj);
  });
  socket.on("reloadAllData",()=>{ReloadAllData(1);});
  socket.on("update prepare",()=>{
    io.emit("cloud message","伺服器即將更新，這段時間內所作的更改有可能不會更新到伺服器中，建議先關閉頁面，10分鐘之後再回來");
    Users.writeBack();
  });

  socket.on("user rename stage",(data)=>{
    console.log("rename stage",data);
    switch (data.status) {
      case "edit":
        if(editingTable[data.id]) socket.emit("user rename stage",{status:"fail",reason:"其他使用者編輯中"});
        else {
          socket.broadcast.emit("user rename stage",{status:"editing",id:data.id});
          editingTable[data.id] = true;
        }
        break;
      case "commit":
        if(Stagedata.Rename(data.id,data.name)){
          io.emit("user rename stage",{status:"finish",id:data.id,name:data.name})
        } else {
          socket.emit("user rename stage",{status:"fail",reason:"寫入失敗"});
          io.emit("user rename stage",{status:"release",id:data.id})
        }
        editingTable[data.id] = false;
        break;
      case "abort":
        io.emit("user rename stage",{status:"release",id:data.id})
        editingTable[data.id] = false;
        break;
      default:
        socket.emit("user rename stage",{status:"fail",reason:"未知原因"});
        io.emit("user rename stage",{status:"release",id:data.id})
        editingTable[data.id] = false;
    }
  });

});

const port = 8000 ;
http.listen(process.env.PORT || port, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

app.use('/static', express.static(__dirname + '/onepageapp/build/static'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/view/index.html');
});
app.get('/beta',function (req,res) {
  res.sendFile(__dirname + '/onepageapp/build/index.html');
});
app.get("/dashboard/:uid",function (req,res) {
  if(req.params.uid == "zB56cQVSuOdBEdCZmn6bl4AA8wx1"){
    res.sendFile(__dirname + "/view/dashboard.html")
  } else {
    res.send("<Error>Invalid Auth</Error>");
  }
});
app.get('/:page',function (req,res) {
  if(req.params.page == "dashboard"){
    res.send("<Error>Invalid Auth</Error>");
  }
  else if(fs.existsSync(__dirname + "/view/"+req.params.page+".html")){
    res.sendFile(__dirname + "/view/"+req.params.page+".html");
  }
  else {
    // res.sendFile(__dirname + '/view/index.html');
    res.send("<script>window.parent.location.assign('/');</script>");
  }
});
app.use(express.static(path.join(__dirname, '/public')));// to import css and javascript

// var bodyParser = require('body-parser'),
//       crypto = require('crypto');
//
// app.use(bodyParser.json({ verify: verifyRequestSignature }));
//
//
// // App Secret can be retrieved from the App Dashboard
// const APP_SECRET = '93dea74c38a913b9851c93f347209c29'
// // Arbitrary value used to validate a webhook
// const  PAGE_ACCESS_TOKEN = 'EAACSfPzGRVMBAEXi5fAGulyDjMMQlCImepPNhMdwthn2nZCkRjfty46ky7SSMOlnX7ATI0hBFuTjQdKbvqXVJi6JlyNg049vBV1E8vzWH9YpjUW3divcPrQRwzjkrmTt3qkZBYCZAk3jC5y1ZCiDe4qXFJAVztP6JgMO43RaJXZBiV8ArjSZCE'
// // Generate a page access token for your page from the App Dashboard
// const  VALIDATION_TOKEN = 'mewmewwar'
// // URL where the app is running (include protocol). Used to point to scripts and
// // assets located at this address.
// const SERVER_URL = 'https://dbec4e37.ngrok.io'
//
// if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
//   console.error("Missing config values");
//   process.exit(1);
// }
// function verifyRequestSignature(req, res, buf) {
//   var signature = req.headers["x-hub-signature"];
//
//   if (!signature) {
//     // For testing, let's log an error. In production, you should throw an
//     // error.
//     console.error("Couldn't validate the signature.");
//   } else {
//     var elements = signature.split('=');
//     var method = elements[0];
//     var signatureHash = elements[1];
//
//     var expectedHash = crypto.createHmac('sha1', APP_SECRET)
//                         .update(buf)
//                         .digest('hex');
//
//     if (signatureHash != expectedHash) {
//       throw new Error("Couldn't validate the request signature.");
//     }
//   }
// }
// app.get('/webhook', function(req, res) {
//   if (req.query['hub.mode'] === 'subscribe' &&
//       req.query['hub.verify_token'] === VALIDATION_TOKEN) {
//     console.log("Validating webhook");
//     res.status(200).send(req.query['hub.challenge']);
//   } else {
//     console.error("Failed validation. Make sure the validation tokens match.");
//     res.sendStatus(403);
//   }
// });
// app.post('/webhook', function (req, res) {
//   var data = req.body;
//
//   // Make sure this is a page subscription
//   if (data.object == 'page') {
//     // Iterate over each entry
//     // There may be multiple if batched
//     data.entry.forEach(function(pageEntry) {
//       var pageID = pageEntry.id;
//       var timeOfEvent = pageEntry.time;
//
//       // Iterate over each messaging event
//       pageEntry.messaging.forEach(function(messagingEvent) {
//         if (messagingEvent.optin) {
//           receivedAuthentication(messagingEvent);
//         } else if (messagingEvent.message) {
//           receivedMessage(messagingEvent);
//         } else if (messagingEvent.delivery) {
//           receivedDeliveryConfirmation(messagingEvent);
//         } else if (messagingEvent.postback) {
//           receivedPostback(messagingEvent);
//         } else if (messagingEvent.read) {
//           receivedMessageRead(messagingEvent);
//         } else if (messagingEvent.account_linking) {
//           receivedAccountLink(messagingEvent);
//         } else {
//           console.log("Webhook received unknown messagingEvent: ", messagingEvent);
//         }
//       });
//     });
//
//     // Assume all went well.
//     //
//     // You must send back a 200, within 20 seconds, to let us know you've
//     // successfully received the callback. Otherwise, the request will time out.
//     res.sendStatus(200);
//   }
// });
//
// function receivedMessage(event) {
//   var senderID = event.sender.id;
//   var recipientID = event.recipient.id;
//   var timeOfMessage = event.timestamp;
//   var message = event.message;
//
//   // console.log("Received message for user %d and page %d at %d with message:",
//     // senderID, recipientID, timeOfMessage);
//   console.log(JSON.stringify(message));
//
//   var isEcho = message.is_echo;
//   var messageId = message.mid;
//   var appId = message.app_id;
//   var metadata = message.metadata;
//
//   // You may get a text or attachment but not both
//   var messageText = message.text;
//   var messageAttachments = message.attachments;
//   var quickReply = message.quick_reply;
//
//   if (messageText) {
//     console.log(messageText);
//     // apiai(event);
//   }
//   else if (messageAttachments) {
//     sendTextMessage(senderID, "Message with attachment received");
//   }
// }
