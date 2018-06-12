var fs = require('fs');
var app = require('express')();
var request = require("request");
var cheerio = require("cheerio");
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var path = require('path');
var sheet_ID = '1lGJC6mfH9E0D2bYNKVBz78He1QhLMUYNFSfASzaZE9A' ;
var gsjson = require('google-spreadsheet-to-json');
var firebase = require("firebase");
var config = {
    apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
    authDomain: "battlecat-smart.firebaseapp.com",
    databaseURL: "https://battlecat-smart.firebaseio.com",
    projectId: "battlecat-smart",
    storageBucket: "battlecat-smart.appspot.com",
    messagingSenderId: "268279710428"
  };
var d_31 = [1,3,5,7,8,10,12];
var admin = require("firebase-admin");
var CoinhiveAPI = require('coinhiveapi');
var coinhive = new CoinhiveAPI('kyoXowX7ige3k8BcMVZcnhOwaZi3lEIv');
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

var serviceAccount = require("battlecat-smart-firebase-adminsdk-nqwty-40041e7014.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://BattleCat-Smart.firebaseio.com"
});

firebase.initializeApp(config);
var database = firebase.database();

var catdata,
    combodata,
    enemydata,
    userdata,
    stagedata,
    gachadata,
    rankdata,
    catComment ;
var __numberOfCat = 0,
    mostSearchCat = {name:"",count:-999,id:'',hp:0,atk:0},
    secondMostSearchCat = {name:"",count:-999,id:'',hp:0,atk:0},
    thirdMostSearchCat = {name:"",count:-999,id:'',hp:0,atk:0};
ReloadAllData();
function ReloadAllData() {
  database.ref("/").once("value",function (snapshot) {
    catdata = snapshot.val().newCatData ;
    combodata = snapshot.val().combodata ;
    enemydata = snapshot.val().enemydata ;
    stagedata = snapshot.val().stagedata ;
    gachadata = snapshot.val().gachadata ;
    rankdata = snapshot.val().rankdata ;
    userdata = snapshot.val().user ;
    eventdata = snapshot.val().event_date ;
    catComment = snapshot.val().catComment ;
    console.log('\x1b[33m','All data load complete!!',"\x1b[37m") ;
    var exist ;
    for(let i in catdata){
      __numberOfCat ++ ;
      if(catdata[i].count>mostSearchCat.count && i.substring(0,3) != exist){
        if(mostSearchCat.count>secondMostSearchCat.count){
          if(secondMostSearchCat.count>thirdMostSearchCat.count){
            thirdMostSearchCat = Object.assign({},secondMostSearchCat);
          }
          secondMostSearchCat = Object.assign({},mostSearchCat);
        }
        mostSearchCat = {
          name:catdata[i].name,
          count:catdata[i].count,
          id:i,
          hp:levelToValue(catdata[i].hp,catdata[i].rarity,30),
          atk:levelToValue(catdata[i].atk,catdata[i].rarity,30),
        };
        exist = i.substring(0,3);
      }
    }
    console.log("most Search Cat : ",mostSearchCat);
    console.log("second most Search Cat : ",secondMostSearchCat);
    console.log("third most Search Cat : ",thirdMostSearchCat);
    arrangeUserData();
    geteventDay();
  });
  setTimeout(ReloadAllData,6*3600*1000);
}
class UserCatVariable {
  constructor(obj) {
    this.count = obj.count?obj.count:0,
    this.lv = obj.lv?obj.lv:30,
    this.own = obj.own?obj.own:false,
    this.survey = obj.survey?obj.survey:null
  }
}

io.on('connection', function(socket){
  // Client require data with structure like
  // {
  //   type:type of need data(cat,enemy...etc),
  //   target:string or array
  // }
  // return an array of data

  // It can be independent from the user id,
  // so anyone could access this.
  socket.on("required data",function (data) {
    console.log("required data");
    console.log(data);
    try {
      var type = data.type,
          target = data.target,
          uid = data.uid,
          load_data,buffer,combo
          default_cat_lv=30,
          user_variable;
      // Make sure the target's type is array
      target = typeof(target) == 'object'?target:[target];
      // Identify what kind of data is required
      if (type == 'cat') load_data = catdata;
      else if (type == 'enemy') load_data = enemydata;
      else if (type == 'stage') load_data = stagedata;
      // Load user data if uid exist
      if(uid){
        default_cat_lv = userdata[uid].setting.default_cat_lv;
        user_variable = userdata[uid].variable[type];
      }
      // Extract data
      for (let i in target) {
        var id = data.target[i].substring(0,3),
        lv = catArr[id] ? (catArr[id].lv == 'default' || !catArr[id].lv ? def : catArr[id].lv) : def,
        bro = [];
        for(let j=1;j<4;j++){
          let a = id+"-"+j ;
          if(a != data.target[i]) if(catdata[a]) bro.push(a) ;
        }
        buffer.push(load_data[i]);
      }
      socket.emit("required data",buffer);
    } catch (e) {
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString(),data:data
      });
    }
  });

  socket.on("gacha search",function (data) {
    console.log(data);
    console.log("recording last search quene");
    try{
      database.ref("/user/"+data.uid+"/history/last_"+data.type+"_search").set(data);
      userdata[data.uid].history["last_"+data.type+"_search"] = data;
      let gFilter = data.query ,buffer=[],buffer_1=[];
      for(let i in gFilter){
        // console.log(gachadata[gFilter[i]].ssr);
        if(!gachadata[gFilter[i]]) continue
        let include = gachadata[gFilter[i]].include?gachadata[gFilter[i]].include:[]
        buffer = buffer.concat(gachadata[gFilter[i]].ssr).concat(include)
      }
      // console.log(buffer);
      for(let i in buffer) {
        let gross = buffer[i].substring(0,3);
        for(let j=1;j<4;j++){
          let id = gross+"-"+j;
          if(catdata[id]){
            let obj = {
              id : id,
              name : catdata[id].name?catdata[id].name:catdata[id].jp_name,
              cost : catdata[id].cost
            }
            buffer_1.push(obj);
          }
        }
      }
      // console.log(buffer_1);
      socket.emit("search result",{result:buffer_1,query:data.query,type:data.query_type});
    }catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("normal search",function (data) {
        console.log("searching "+data.type+"....");
        console.log(data);
        try{
          let rFilter = data.query.rFilter?data.query.rFilter:[],
          cFilter = data.query.cFilter?data.query.cFilter:[],
          aFilter = data.query.aFilter?data.query.aFilter:[],
          filterObj = data.filterObj?data.filterObj:[],
          type = data.type,
          buffer_1 = [],
          buffer_2 = [],
          load_data = {},
          user = data.uid,
          flag = true;
          console.log("recording last search quene");
          if(user)
          database.ref("/user/"+user+"/history/last_"+type+"_search").set(data)
          .then(userdata[user].history["last_"+data.type+"_search"] = data);
          switch (type) {
            case 'cat':
            load_data = catdata ;
            break;
            case 'enemy':
            load_data = enemydata ;
            break;
            default:
          } ;

          let level = user?userdata[user].setting.default_cat_lv:30,
          showJP = user?userdata[user].setting.show_jp_cat:false;
          if(cFilter.length != 0){
            for(let i in load_data){
              for(let j in cFilter){
                if(type == 'cat' && !load_data[i].tag) break;
                if(type == 'enemy' && !load_data[i].color) break;

                if( type == 'cat' &&
                (load_data[i].tag.indexOf(cFilter[j]) != -1 ||
                ((cFilter[j] != "對白色" && cFilter[j] != "對鋼鐵") &&
                load_data[i].tag.indexOf("對全部") != -1))
              ) {
                buffer_1.push(load_data[i]);
                break;
              }
              if(type == 'enemy' && load_data[i].color.indexOf(cFilter[j]) != -1 ) {
                buffer_1.push(load_data[i]);
                break;
              }
            }
          }
        }
        else buffer_1 = load_data ;
        if(aFilter.length != 0){
          for(let i in buffer_1){
            for(let j in aFilter){
              if(buffer_1[i].tag == '[無]' || !buffer_1[i].tag) break;
              else if(buffer_1[i].tag.indexOf(aFilter[j]) != -1) {
                buffer_2.push(buffer_1[i]);
                break;
              }
            }
          }
        }
        else buffer_2 = buffer_1 ;
        buffer_1 = [] ;
        if(rFilter.length != 0) {
          for(let i in buffer_2) if(rFilter.indexOf(buffer_2[i].rarity) != -1) buffer_1.push(buffer_2[i]) ;
        }
        else buffer_1 = buffer_2 ;
        buffer_2 = [] ;
        for(let i in filterObj){
          if (!filterObj[i].active) continue
          flag = false;
          let name = i,
          type = filterObj[i].type ,
          limit = filterObj[i].value ,
          level_bind = filterObj[i].lv_bind;

          for(let j in buffer_1){
            let value = level_bind ? levelToValue(buffer_1[j][name],buffer_1[j].rarity,level) : buffer_1[j][name];
            if(type == 0  && value>limit) buffer_2.push(buffer_1[j]);
            else if (type == 1 && value<limit) buffer_2.push(buffer_1[j]);
            else if (type == 2 && value>limit[0] && value<limit[1]) buffer_2.push(buffer_1[j]);
          }
        }
        if(flag) buffer_2 = buffer_1 ;
        buffer_1 = [] ;
        if(type == 'cat' && !showJP){
          for(let i in buffer_2) {
            let obj = {
              id : buffer_2[i].id,
              name : buffer_2[i].name?buffer_2[i].name:buffer_2[i].jp_name,
              cost : buffer_2[i].cost?buffer_2[i].cost:0
            }
            if(buffer_2[i].region.indexOf("[TW]")==-1) continue
            else buffer_1.push(obj) ;
          }
        }
        else {
          for(let i in buffer_2) {
            let obj = {
              id : buffer_2[i].id,
              name : buffer_2[i].name?buffer_2[i].name:buffer_2[i].jp_name,
              cost : buffer_2[i].cost?buffer_2[i].cost:0
            }
            buffer_1.push(obj);
          }
        }
        console.log("Result length:",buffer_1.length);
        if(type == 'enemy') socket.emit("search result enemy",{result:buffer_1,query:data.query,type:data.query_type});
        else  socket.emit("search result",{result:buffer_1,query:data.query,type:data.query_type});
        }
        catch(e){
          console.log(e);
          let time = new Date().getTime();
          database.ref("/error_log").push({
            time:time,error:e.toString()
          })
        }
  });
  socket.on("text search",function (obj) {
    console.log("Text Search : "+obj.type+"_"+obj.key);
    try{
      let key = obj.key ,
      buffer = [],
      data = {} ;
      switch (obj.type) {
        case 'cat':
        load_data = catdata ;
        break;
        case 'enemy':
        load_data = enemydata ;
        break;
        default:
      } ;
      if(Number(obj.key)){
        for (var i in load_data) {
          if (i.indexOf(obj.key)!=-1) {
            buffer.push({
              name : load_data[i].name?load_data[i].name:load_data[i].jp_name,
              id : load_data[i].id,
              cost : load_data[i].cost?load_data[i].cost:0
            });
          }
        }
      }
      for(let id in load_data){
        let name = load_data[id].name?load_data[id].name:load_data[id].jp_name;
        if(name.indexOf(key) != -1) {
          let simple = id.substring(0,3);
          for(let j=1;j<4;j++){
            let x = obj.type == 'cat'?(simple+'-'+j):simple ;
            if(load_data[x]) {
              let obj = {
                name : load_data[x].name,
                id : load_data[x].id,
                cost : load_data[x].cost?load_data[x].cost:0
              };
              buffer.push(obj) ;
              if(obj.type == 'enemy') break
            }
          }
        }
      }
      // console.log(buffer);
      socket.emit("search result",{result:buffer,query:data.query,type:data.query_type});
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on('text search stage',function (text) {
    console.log('text search stage: ',text);
    try{
      let buffer = [];
      for(let i in stagedata){
        for(let j in stagedata[i]){
          if(stagedata[i][j].name.indexOf(text)!=-1)
          buffer.push({id:i+"-"+j,name:stagedata[i][j].name});
          for(let k in stagedata[i][j]){
            if (k=='name') continue
            if(stagedata[i][j][k].name.indexOf(text)!=-1)
            buffer.push({
              id:i+"-"+j+"-"+k,
              name:stagedata[i][j].name+"/"+stagedata[i][j][k].name
            });
          }
        }
      }
      socket.emit('text search stage',buffer);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("display cat",function (data) {
    console.log("display cat");
    console.log(data);
    try{
      let uid = data.uid,
      id = data.cat;
      if(!id) return
      let record = data.history,
      grossID = id.substring(0,3),
      result = {"this":"","bro":[],"combo":[]},
      level ;
      console.log("client requir cat "+grossID+"'s data'");
      let combo = [] ;
      for(let i=1;i<4;i++){
        let a = grossID+"-"+i ;
        if(a == id) result.this = catdata[a] ;
        else if(catdata[a]) result.bro.push(catdata[a].id) ;
        for(let j in combodata) if(combodata[j].cat.indexOf(a) != -1) combo.push(combodata[j]);
      }
      result.combo = combo ;
      if(!uid) return
      else {
        let default_lv = userdata[uid].setting.default_cat_lv,
        variable = userdata[uid].variable.cat[grossID],
        storge_lv = variable ? variable.lv : default_lv,
        storge_count = variable?(variable.count?variable.count+1:1):1,
        own = variable ? variable.own : false;
        if(userdata[uid].variable.cat == "") userdata[uid].variable.cat = {};
        if(!userdata[uid].variable.cat[grossID]) userdata[uid].variable.cat[grossID] = {};
        result.lv = storge_lv?storge_lv:default_lv;
        result.count = storge_count;
        result.own = own;
        result.survey = variable ? (variable.survey?variable.survey:false):false;
        result.this.statistic = catComment[grossID]?catComment[grossID].statistic:{};
        socket.emit("display cat result",result);
        let history = userdata[uid].history.cat,
        last = userdata[uid].history.last_cat;
        if(id != last && record) {
          console.log("recording user history");
          for(let i in history){
            if(history[i].id == id) delete history[i]
          }
          var key = database.ref().push().key;
          if(history == "") userdata[uid].history.cat = {};
          history[key] = {type : "cat",id : id,time:new Date().getTime()};
          database.ref("/user/"+uid+"/history/cat").set(history);
          userdata[uid].history.last_cat = id;
          database.ref("/user/"+uid+"/history/last_cat").set(id);
          console.log("count cat search time(user)");
          userdata[uid].variable.cat[grossID].count = storge_count;
          database.ref("/user/"+uid+"/variable/cat/"+grossID+"/count").set(storge_count);
          console.log("count cat search time(global)");
          if(!catdata[id].count) catdata[id].count = 0;
          catdata[id].count ++;
          database.ref("/newCatData/"+id+"/count").set(catdata[id].count);
        }
        else console.log(record?"same as last cat":"do not record");
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("display enemy",function (data) {
    try{
      let uid = data.uid,id = data.id,record = data.history;
      console.log("client requir enemy "+id+"'s data");
      console.log(data);
      let buffer = enemydata[id];

      if(uid&&id){
        if(userdata[uid].variable.enemy=="") userdata[uid].variable.enemy={};
        let data = userdata[uid].variable.enemy[id];
        data = data?data:{};
        data.count = data.count?(data.count+1):1
        buffer.count = data.count;
        buffer.lv = data.lv?data.lv:1;
        socket.emit('display enemy result',buffer);

        let last = userdata[uid].history.last_enemy,
        history = userdata[uid].history.enemy,
        count = buffer.count;
        if(id != last && record) {
          console.log("recording user history");
          for(let i in history){
            if(history[i].id == id) delete history[i]
          }
          var key = database.ref().push().key;
          if(history == "" ) userdata[uid].history.enemy = {};
          history[key] = {type : "enemy",id : id,time:new Date().getTime()};
          database.ref("/user/"+uid+"/history/enemy").set(history);
          userdata[uid].history.last_enemy = id;
          database.ref("/user/"+uid+"/history/last_enemy").set(id);
          console.log("count enemy search time(user)");
          if(!userdata[uid].variable.enemy[id]) userdata[uid].variable.enemy[id]={};
          userdata[uid].variable.enemy[id].count = count;
          database.ref("/user/"+uid+"/variable/enemy/"+id+"/count").set(count);
          console.log("count enemy search time(global)");
          enemydata[id].count ++ ;
          database.ref("/enemydata/"+id+"/count").set(enemydata[id].count);
        }
        else console.log(record?"same as last enemy":"do not record");
      } else socket.emit('display enemy result',buffer);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("user login",function (user) {
    console.log(user.uid+" user login");
    try{
      let exist = false;
      let timer = new Date().getTime();
      console.log('login time : '+timer);
      for(let uid in userdata){
        if(uid == user.uid){
          console.log("find same user");
          exist = true;
          socket.emit("login complete",userdata[uid].nickname);
          break;
        }
      }
      if(exist){
        console.log('user exist');
        database.ref('/user/'+user.uid).update({"last_login" : timer});
      } else {
        console.log('new user');
        let data = {
          name : user.displayName,
          nickname :user.displayName,
          first_login : timer,
          last_login : timer,
          history : {cat:"",enemy:"",combo:"",stage:""},
          compare : {cat2cat:"",cat2enemy:"",enemy2enemy:""},
          setting : {default_cat_lv:30},
          variable : {cat:"",enemy:"",stage:""},
          folder : {owned:""},
          Anonymous : user.isAnonymous
        }
        if(user.isAnonymous){
          let anonymous = "";
          var CatCount=0,Random = Math.floor((Math.random()*__numberOfCat));
          for(let i in catdata){
            if (CatCount == Random){
              anonymous = catdata[i].name?catdata[i].name:catdata[i].jp_name;
              break
            }
            CatCount++;
          }
          data.name = "匿名"+anonymous;
          data.nickname = "匿名"+anonymous;
        }
        // console.log(data);
        userdata[user.uid] = data;
        database.ref('/user/'+user.uid).set(data) ;
        socket.emit("login complete",data.nickname);
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("user connect",function (data){
    console.log(data);
    try{
      let timer = new Date().getTime(),
      last_cat = '',
      last_combo = [],
      last_enemy = '',
      last_stage = '',
      user = data.user,
      CurrentUserData = {uid : user.uid},
      page = data.page=='/'?'index':data.page.split("/")[2].split(".")[0];
      console.log("user ",user.uid," connect ","\x1b[32m",page,"\x1b[37m");
      database.ref('/user/'+user.uid).update({"last_login" : timer});
      let history = userdata[user.uid].history,
      setting = userdata[user.uid].setting,
      variable = userdata[user.uid].variable;
      last_cat = history.last_cat;
      last_enemy = history.last_enemy;
      last_combo = history.last_combo;
      last_stage = history.last_stage;
      last_gacha = history.last_gacha;
      last_cat_search = history.last_cat_search;
      last_enemy_search = history.last_enemy_search;
      let compareCat = userdata[user.uid].compare.cat2cat,
      fight_cat = userdata[user.uid].compare.cat2enemy.cat?userdata[user.uid].compare.cat2enemy.cat:null,
      fight_ene = userdata[user.uid].compare.cat2enemy.enemy?userdata[user.uid].compare.cat2enemy.enemy:null,
      fight = {
        cat : fight_cat?{id:fight_cat.id,name:catdata[fight_cat.id].name}:null,
        enemy : fight_ene?{id:fight_ene.id,name:enemydata[fight_ene.id].name,lv:fight_ene.lv}:null
      },
      compareEnemy = userdata[user.uid].compare.enemy2enemy;
      let obj , arr = [] , brr = [];
      for(let i in compareCat){
        obj = {};
        if(!catdata[compareCat[i]]) continue
        obj = {id:compareCat[i],name:catdata[compareCat[i]].name};
        arr.push(obj);
      }
      for(let i in compareEnemy){
        obj = {};
        if(!enemydata[compareEnemy[i]]) continue
        obj = {id:compareEnemy[i],name:enemydata[compareEnemy[i]].name};
        brr.push(obj);
      }
      if(page == 'index'){
        CurrentUserData.name = userdata[user.uid].nickname;
        CurrentUserData.first_login = userdata[user.uid].first_login;
        CurrentUserData.setting = {show_miner:setting.show_miner,mine_alert:setting.mine_alert};
        CurrentUserData.legend = [mostSearchCat, secondMostSearchCat, thirdMostSearchCat];
      }
      else if(page == 'book'){
        CurrentUserData.folder = {owned:userdata[user.uid].folder.owned};
        CurrentUserData.setting = {show_more_option:setting.show_more_option}
      }
      else if(page == 'cat'){
        CurrentUserData.last_cat = last_cat;
        CurrentUserData.compare_c2c = arr;
        CurrentUserData.last_cat_search = last_cat_search;
        CurrentUserData.setting = {
          show_more_option:setting.show_more_option,
          show_ability_text:setting.show_ability_text,
          default_cat_lv:setting.default_cat_lv,
          show_cat_id:setting.show_cat_id,
          show_cat_count:setting.show_cat_count
        }
      }
      else if(page == 'enemy'){
        CurrentUserData.last_enemy = last_enemy;
        CurrentUserData.compare_e2e = brr;
        CurrentUserData.last_enemy_search = last_enemy_search;
        CurrentUserData.setting = {
          show_more_option:setting.show_more_option,
          show_enemy_id:setting.show_enemy_id,
          show_enemy_count:setting.show_enemy_count
        }
      }
      else if(page == 'combo'){CurrentUserData.last_combo = last_combo;}
      else if(page == 'compareCat'){CurrentUserData.compare_c2c = arr;}
      else if(page == 'compareEnemy'){CurrentUserData.compare_e2e = brr;}
      else if(page == 'fight'){CurrentUserData.fight = fight;}
      else if(page == 'history'){
        obj = {cat:{},enemy:{},stage:{},gacha:{}};
        for(i in history.cat){
          let id = history.cat[i].id,
          name = catdata[id].name?catdata[id].name:catdata[id].jp_name,
          lv = variable.cat[id.substring(0,3)].lv;
          obj.cat[i] = {id:id,time:history.cat[i].time,name:name,lv:lv}
        }
        for(i in history.enemy){
          let id = history.enemy[i].id,
          name = enemydata[id].name?enemydata[id].name:enemydata[id].jp_name,
          lv = variable.enemy[id].lv;
          obj.enemy[i] = {id:id,time:history.enemy[i].time,name:name,lv:lv?lv:1}
        }
        for(i in history.stage){
          let id = history.stage[i].id.split("-"),
          chapter = id[0],stage=stagedata[id[0]][id[1]].name,
          level=stagedata[id[0]][id[1]][id[2]].name;
          obj.stage[i] = {
            id:id.join("-"),
            time:history.stage[i].time,
            chapter:chapter,level:level,stage:stage
          }
        }
        for(i in history.gacha){
          let id = history.gacha[i].name,
          name = gachadata[id].name;
          obj.gacha[i] = {
            id:id,
            time:history.gacha[i].time,
            name:name,
            ssr : history.gacha[i].ssr,
            sr : history.gacha[i].sr,
            r : history.gacha[i].r,
          }
        }
        CurrentUserData.history = obj;
      }
      else if(page == 'stage'){
        CurrentUserData.last_stage = last_stage;
        CurrentUserData.setting = {show_more_option:setting.show_more_option};
      }
      else if(page == 'setting'){
        CurrentUserData.setting = setting;
        CurrentUserData.name = userdata[user.uid].nickname;
        CurrentUserData.setting = {show_more_option:setting.show_more_option}
      }
      else if(page == 'event'){ CurrentUserData.setting = {show_jp_cat:setting.show_jp_cat} }
      else if(page == 'gacha'){ CurrentUserData.last_gacha = last_gacha }
      else if (page == 'list') {
        CurrentUserData.last_cat_search = last_cat_search;
        CurrentUserData.list = userdata[user.uid].list;
      }
      socket.emit("current_user_data",CurrentUserData);
      console.log('user data send');
    }catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("combo search",function (data) {
    console.log("searching combo......") ;
    try{
      let buffer = [] ;
      let arr = data.id,uid = data.uid;
      for(let i in combodata){
        for(let j in arr){
          if(arr[j] == (i.substring(0,4))) buffer.push(combodata[i]) ;
        }
      }
      socket.emit("combo result",buffer) ;
      if(!uid) return
      console.log("recording user history");
      var key = database.ref().push().key;
      userdata[uid].history.combo[key] = {type : "combo",id : arr,time:new Date().getTime()};
      database.ref("/user/"+uid+"/history/combo/"+key).set({type : "combo",id : arr,time:new Date().getTime()});
      userdata[uid].history.last_combo = arr;
      database.ref("/user/"+uid+"/history/last_combo").set(arr);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  }) ;
  socket.on("more combo",function (arr) {
    try{
      let length = arr.length, buffer = [];
      if(length == 5) {}
      else
      for(let i in combodata){
        let cat = combodata[i].cat,flag = 0;
        for(let j in arr) if(checkList(cat,arr[j])) flag ++;
        if(!flag) continue
        else if (flag == length&&combodata[i].amount==length) continue
        if(combodata[i].amount+length-flag<6) {
          if(flag>1) buffer.splice(0,0,combodata[i]);
          else buffer.push(combodata[i]);
        }
      }
      buffer.push(arr);
      socket.emit("more combo",buffer);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("compare cat",function (data) {
    console.log("compare cat!!");
    console.log(data);
    try{
      userdata[data.id].compare.cat2cat = data.target;
      database.ref('/user/'+data.id+"/compare/cat2cat").set(data.target);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("compare enemy",function (data) {
    console.log("compare enemy!!");
    console.log(data);
    try{
      userdata[data.id].compare.enemy2enemy = data.target;
      database.ref('/user/'+data.id+"/compare/enemy2enemy").set(data.target);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("start compare c2c",function (data) {
    console.log('start compare c2c');
    try{
      let compare = [],
      def = userdata[data.id].setting.default_cat_lv,
      catArr = userdata[data.id].variable.cat;
      for(let i in data.target) {
        let id = data.target[i].substring(0,3),
        lv = catArr[id] ? (catArr[id].lv == 'default' || !catArr[id].lv ? def : catArr[id].lv) : def,
        bro = [];
        for(let j=1;j<4;j++){
          let a = id+"-"+j ;
          if(a != data.target[i]) if(catdata[a]) bro.push(a) ;
        }
        compare.push({data:catdata[data.target[i]],lv:lv,bro:bro});
      }
      socket.emit("c2c compare",compare);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      });
    }
  });
  socket.on("start compare e2e",function (data) {
    console.log('start compare e2e');
    let compare = [],
    eneArr = userdata[data.id].variable.enemy;
    for(let i in data.target) {
      let id = data.target[i],
      lv = eneArr[id] ? (!eneArr[id].lv ? 1 : eneArr[id].lv) : 1;
      compare.push({data:enemydata[data.target[i]],lv:lv});
    }
    socket.emit("e2e compare",compare);
  });

  socket.on("rename",function (data) {
    try{
      userdata[data.uid].nickname = data.name;
      database.ref("/user/"+data.uid+"/nickname").set(data.name);
    }catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      });
    }
  });
  socket.on("history",function (uid) {
    console.log(uid+"'s history");
    try{
      let data = userdata[uid].history;
      if(!userdata[uid].folder)userdata[uid].folder = {};
      let owned = userdata[uid].folder.owned;
      owned = owned != "0" ? owned : [];
      let buffer = {cat:[],enemy:[],owned:[]};
      for (let i in data.cat) buffer.cat.push({name:catdata[data.cat[i].id].name,id :data.cat[i].id});
      for (let i in data.enemy) buffer.enemy.push({name:enemydata[data.enemy[i].id].name,id :data.enemy[i].id});
      for (let i in owned) buffer.owned.push({name:catdata[owned[i]+"-1"].name,id :owned[i]+"-1"})
      socket.emit("return history",buffer);
    }catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e
      })
    }
  });
  socket.on("store level",function (data) {
    try{
      console.log(data.uid+" change his/her "+data.type,data.id+"'s level to "+data.lv);
      if(!data.uid||!data.id) return
      let id = data.id,
      gross = data.type == 'cat'? id.substring(0,3):id;
      var buffer = userdata[data.uid].variable[data.type][gross] ;
      buffer = buffer?buffer:{};
      buffer.lv = data.lv;
      database.ref("/user/"+data.uid+"/variable/"+data.type+"/"+gross).update({lv:data.lv});
    }catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("mark own",function (data) {
    try{
      let folder = userdata[data.uid].folder,
      arr =( folder.owned && folder.owned != "0" )? folder.owned : [];
      if(data.arr){
        let brr = data.arr ;
        console.log("batch add",brr.length);
        for(let i in brr){
          if (!userdata[data.uid].variable.cat[brr[i]]) userdata[data.uid].variable.cat[brr[i]] = {};
          userdata[data.uid].variable.cat[brr[i]].own = true;
          database.ref("/user/"+data.uid+"/variable/cat/"+brr[i]).update({own:true});
          if(arr.indexOf(brr[i])==-1) arr.push(brr[i]);
        }
        userdata[data.uid].folder.owned = arr ;
        database.ref("/user/"+data.uid+"/folder").update({owned:arr});
        return
      }
      console.log(data.uid+" claim he/she "+
      (data.mark?"does":"doesn't")+" own "+data.cat);
      if(!userdata[data.uid].variable.cat[data.cat]) userdata[data.uid].variable.cat[data.cat]={};
      userdata[data.uid].variable.cat[data.cat].own = data.mark ? true : false;
      database.ref("/user/"+data.uid+"/variable/cat/"+data.cat).update({own:data.mark ? true : false});
      if(data.mark&&arr.indexOf(data.cat)==-1) arr.push(data.cat);
      else if(!data.mark&&arr.indexOf(data.cat)!=-1) arr.splice(arr.indexOf(data.cat),1);
      arr = arr.length ? arr : 0 ;
      userdata[data.uid].folder.owned = arr ;
      database.ref("/user/"+data.uid+"/folder").update({owned:arr});
    }catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      });
    }
  });

  socket.on("require setting",function (id) {
    console.log("require "+id+"'s setting");
    try{
      coinhive.balance(id,res => {
        console.log(res);
        res = JSON.parse(res);
        if(res.success){
          console.log(id,res.total,'hash');
          let hash = res.total;
          database.ref('/user/'+id+"/setting/mine_alert/count").set(hash);
        }
        console.log("hash count complete");
        socket.emit("user setting",userdata[id].setting);
      });
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("set default cat level",function (data) {
    console.log("set "+data.uid+"'s default_cat_lv to "+data.lv);
    try{
      userdata[data.uid].setting.default_cat_lv = data.lv;
      database.ref("/user/"+data.uid+"/setting/default_cat_lv").set(data.lv);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("reset cat level",function (id) {
    console.log("reset all "+id+"'s cat lv to default");
    try{
      var data = userdata[id].variable.cat,
      default_lv = userdata[id].setting.default_cat_lv;
      for(let i in data){
        data[i].lv = default_lv;
        database.ref("/user/"+id+"/variable/cat/"+i+"/lv").set(default_lv);
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("reset owned cat",function (id) {
    console.log("reset all "+id+"'s cat owned state");
    try{
      var data = userdata[id].variable.cat;
      for(let i in data){
        data[i].own = false;
        database.ref("/user/"+id+"/variable/cat/"+i+"/own").set(false);
      }
      userdata[id].folder.owned = "0";
      database.ref("/user/"+id+"/folder/owned").set("0");
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("change setting",function (data) {
    console.log(data.uid+" want to "+
        (data.state?"show":"hide")+" it's "+data.type);
    try{
      userdata[data.uid].setting["show_"+data.type] = data.state;
      database.ref("/user/"+data.uid+"/setting/show_"+data.type).set(data.state);
      if(data.type == 'miner'){
        userdata[data.uid].setting.mine_alert = {
          time:new Date().getTime(),
          accept:data.state,
          state:true
        };
        database.ref("/user/"+data.uid+"/setting/mine_alert")
        .update({time:new Date().getTime(),accept:data.state,state:true});
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("user photo",function (data) {
    console.log('user',data.uid,"change it's photo");
    try{
      if(data.type !='fb'){
        let CatCount = 0,
        Random = Math.floor((Math.random()*__numberOfCat)),
        photo ;
        for(let i in catdata){
          if (CatCount == Random){
            photo = "/public/css/footage/cat/u"+i+".png";
            break
          }
          CatCount ++;
        }
        userdata[data.uid].setting.photo = photo;
        database.ref("/user/"+data.uid+"/setting/photo").set(photo);
        socket.emit("random cat photo",photo);
      } else {
        userdata[data.uid].setting.photo = data.photo;
        database.ref("/user/"+data.uid+"/setting/photo").set(data.photo);
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("required users photo",function (arr) {
    var obj = {};
    for(let i in arr){
      let id = arr[i];
      obj[id] = userdata[id]?{photo:userdata[id].setting.photo,name:userdata[id].nickname}:null;
    }
    socket.emit('return users photo',obj);
  });

  socket.on("required stage name",function (chapter) {
    console.log("load stage name");
    let buffer = [],
        data = stagedata[chapter];
    for(let i in data) buffer.push({id:i,name:data[i].name})
    // console.log(buffer);
    socket.emit("stage name",buffer);
  });
  socket.on("required level name",function (pos) {
    console.log("load level name");
    console.log(pos);
    let data = stagedata[pos.chapter][pos.stage],
        buffer = [];
        for(let i in data) {
          if (i == 'name') continue
          buffer.push({id:i,name:data[i].name});
        }
        // console.log(buffer);
        socket.emit("level name",{name:buffer,stage:pos.stage});
  });
  socket.on("required level data",function (data) {
    console.log("load level data");
    console.log(data);
    try{
      let chapter = data.chapter,
      stage = data.stage,
      level = data.level,
      id = chapter+"-"+stage+"-"+level,
      uid = data.uid,
      parent = stagedata[chapter][stage],
      prev=null,next=null,flag=false;
      for(let i in parent){
        if(flag) {next = i;break}
        if(i != level) prev = i ;
        else flag = true ;
      }
      socket.emit("level data",{
        data:stagedata[chapter][stage][level],
        parent:parent.name,
        chapter:chapter,
        stage:stage,
        prev:prev,
        next:next
      });
      if(uid){
        let last = userdata[uid].history.last_stage,
        history = userdata[uid].history.stage,
        Stage = userdata[uid].variable.stage[id],
        count = (Stage?(Stage.count?Stage.count:0):0) + 1;
        if(id != last) {
          console.log("recording user history");
          for(let i in history){
            if(history[i].id == id) delete history[i]
          }
          var key = database.ref().push().key;
          history = history != "" ? history : {};
          history[key] = { type : "stage", id : id, time:new Date().getTime() };
          database.ref("/user/"+uid+"/history/stage").set(history);
          userdata[uid].history.last_stage = id ;
          database.ref("/user/"+uid+"/history/last_stage").set(id);
          console.log("count stage search time(user)");
          Stage = Stage?Stage:{};
          Stage.count = count ;
          database.ref("/user/"+uid+"/variable/stage/"+id+"/count").set(count);
          console.log("count stage search time(global)");
          globalCount = stagedata[chapter][stage][level].count;
          stagedata[chapter][stage][level].count = globalCount?(globalCount+1):1 ;
          database.ref("/stagedata/"+chapter+"/"+stage+"/"+level+"/count").set(globalCount);
        }
        else console.log("same as last stage");
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on('get event date',function () { socket.emit('true event date',eventdata); });
  socket.on("rankdata",function () { socket.emit("recive rank data",rankdata); });

  socket.on("record gacha",function (data) {
    try{
      var uid = data.uid,
      gacha = data.gacha,
      result = JSON.parse(JSON.stringify(gachadata[gacha]));
      if(!uid||!gacha) return
      console.log("user",uid,"select gacha",gacha);
      result.key = gacha;
      userdata[uid].history.last_gacha = gacha;
      database.ref("/user/"+uid+"/history/last_gacha").set(gacha);
      for(let i in result){
        if (i=='id'||i=='name'||i=='key') continue
        for(let j in result[i]){
          let id = result[i][j];
          result[i][j] = {
            id : id,
            name : catdata[id].name?catdata[id].name:catdata[id].jp_name
          }
        }
      }
      socket.emit("gacha result",{ result:result});
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on("gacha history",function (data) {
    try{
      let uid = data.uid,
      gacha = data.gacha;
      if(!uid||!gacha) return
      let key = database.ref().push().key;
      if(!userdata[uid].history.gacha) userdata[uid].history.gacha = {}
      var last={key:"",name:""}
      for(let i in userdata[uid].history.gacha){
        last.key = i ;
        last.name = userdata[uid].history.gacha[i].name;
      }
      if(last.name == gacha) key = last.key;
      userdata[uid].history.gacha[key] = {
        name:gacha,ssr:data.ssr,sr:data.sr,r:data.r,
        time:new Date().getTime()
      }
      database.ref("/user/"+uid+"/history/gacha/"+key).set(userdata[uid].history.gacha[key]);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("compare C2E",function (data) {
    console.log("compare C2E");
    console.log(data);
    try{
      userdata[data.uid].compare.cat2enemy = data.target
      database.ref("/user/"+data.uid+"/compare/cat2enemy").update(data.target)
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("notice mine",function (data) {
    let timer = new Date().getTime();
    try{
      userdata[data.uid].setting.mine_alert = {
        time : timer,
        state : true,
        accept : data.accept
      };
      database.ref("/user/"+data.uid+"/setting/mine_alert").set({
        time : timer,
        state : true,
        accept : data.accept
      });
      userdata[data.uid].setting.show_miner = true ;
      database.ref("/user/"+data.uid+"/setting/show_miner").set(true);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("required owned",function (data) {
    console.log(data.uid,"owned",data.owned.length,"cat");
    try{
      let arr = [];
      if (data.owned == "0") return
      for(let i in data.owned){
        let own = catdata[data.owned[i]+"-1"],
        own2 = catdata[data.owned[i]+"-2"],
        own3 = catdata[data.owned[i]+"-3"];
        let tag = own.tag?own.tag:[];
        if(own2) tag = tag.concat(own2.tag);
        if(own3) tag = tag.concat(own3.tag);
        let obj = {
          id:own.id,
          name:own.name?own.name:own.jp_name,
          tag:tag,
          rarity:own.rarity
        };
        arr.push(obj);
      }
      socket.emit("owned data",arr);
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("cat survey",function (data) {
    try{
      let uid = data.uid,
      cat = data.cat,
      type = data.type,
      val = data.add;
      if(!data.cat) return
      let user = userdata[uid],
      setting = user.setting,
      target = user.variable.cat[cat];
      target = target?target:{}
      var exist = target.survey?(target.survey[type]?target.survey[type]:false):false,
      count = setting.cat_survey_count?setting.cat_survey_count:0;
      if(!exist) count += 0.25;
      console.log(uid,"update",cat,"statistic",type);
      userdata[uid].setting.cat_survey_count = count;
      database.ref("/user/"+uid+"/setting/cat_survey_count").set(count);
      if(type == 'nickname'){
        exist = exist?exist:[];
        exist.push(val);
        var survey = userdata[uid].variable.cat[cat].survey;
        survey = survey?survey:{};
        survey[type] = exist;
        database.ref("/user/"+uid+"/variable/cat/"+cat+"/survey/"+type).set(exist);
        catComment[cat].statistic = catComment[cat].statistic?catComment[cat].statistic:{};
        catComment[cat].statistic[type] = data.all;
        database.ref("/catComment/"+cat+"/statistic/"+type).set(data.all);
      }
      else {
        catComment[cat].statistic = catComment[cat].statistic?catComment[cat].statistic:{};
        catComment[cat].statistic[type] = data.all;
        database.ref("/catComment/"+cat+"/statistic/"+type).set(data.all);
        var survey = userdata[uid].variable.cat[cat].survey;
        survey = survey?survey:{};
        survey[type] = val;
        database.ref("/user/"+uid+"/variable/cat/"+cat+"/survey/"+type).set(val);
      }

    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on('comment cat',function (data) {
    try{
      var key = database.ref().push().key;
      console.log(data.owner,'comment on',data.cat,'with key',key);
      if(!catComment[data.cat]) catComment[data.cat] = {comment:{}}
      if(!catComment[data.cat].comment) catComment[data.cat].comment = {};
      catComment[data.cat].comment[key] = {
        owner:data.owner,
        comment:data.comment,
        time:data.time
      };
      database.ref("/catComment/"+data.cat+"/comment/"+key).set({
        owner:data.owner,
        comment:data.comment,
        time:data.time
      });
      socket.emit('cat comment push',{
        key:key,
        owner:data.owner,
        comment:data.comment,
        time:data.time,
        photo:userdata[data.owner].setting.photo,
        name:userdata[data.owner].nickname
      });

    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
  socket.on('required cat comment',function (cat) {
    console.log('required cat comment',cat);
    socket.emit("comment",catComment[cat]?catComment[cat].comment:undefined);
  });
  socket.on('comment function',function (data) {
    try{
      console.log(data.uid,data.type,'comment in',data.cat);
      if(data.type == 'like'){
        if(data.inverse){
          catComment[data.cat].comment[data.key].like[data.uid] = null;
          database.ref("/catComment/"+data.cat+"/comment/"+data.key+"/like/"+data.uid).set(null);
        } else {
          catComment[data.cat].comment[data.key].like = catComment[data.cat].comment[data.key].like ?
          catComment[data.cat].comment[data.key].like:{};
          delete catComment[data.cat].comment[data.key].like[data.uid];
          database.ref("/catComment/"+data.cat+"/comment/"+data.key+"/like/"+data.uid).set(1);
        }
      }else if(data.type == 'del'){
        delete catComment[data.cat].comment[data.key] ;
        database.ref("/catComment/"+data.cat+"/comment/"+data.key).set(null);
      }else if(data.type == 'edit'){
        catComment[data.cat].comment[data.key].comment = data.val;
        database.ref("/catComment/"+data.cat+"/comment/"+data.key+"/comment").set(data.val);
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });

  socket.on("cat to stage",function (data) {
    console.log("cat to stage");
    console.log(data);
    try{
      var uid = data.uid, stage = data.stage,find = false,location;
      for(let i in stagedata){
        if(find) break
        for(let j in stagedata[i]){
          if(find) break
          if(j == stage){
            find = true;
            location = i+"-"+j+"-1";
          }
          for(let k in stagedata[i][j]){
            if(find) break
            if((j+"-"+k) == stage){
              find = true;
              location = i+"-"+j+"-"+k;
            }
          }
        }
      }
      if(find) {
        userdata[uid].history.last_stage = location;
        database.ref("/user/"+uid+"/history/last_stage").set(location);
      }
      socket.emit('cat to stage',{find,stage});
    }catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
    });

    socket.on("save list",function (data) {
      let uid = data.uid,
      name = data.name,
      list = data.list,
      note = data.note,
      stageBind = data.stageBind,
      key = data.key?data.key:database.ref().push().key,
      combo = [];

      console.log(uid,data.key?'update':'create','a list with key',key);
      console.log(data);
      if(!uid) return
      let default_lv = userdata[uid].setting.default_cat_lv,
      variable = userdata[uid].variable.cat,
      exist_combo = [];
      for(let i in combodata){
        let flag = true ;
        for(let j in combodata[i].cat) {
          if(combodata[i].cat[j] == '-') continue
          if(!checkList(list.upper,combodata[i].cat[j])) flag = false;
        }
        if(!flag||exist_combo.indexOf(combodata[i].id)!=-1) continue
        exist_combo.push(combodata[i].id);
        combo.push(combodata[i]);
      }
      for(let i in list){
        for(let j in list[i]){
          let id = list[i][j],cost = catdata[id].cost,bro = 0,grossID = id.substring(0,3),
          lv = variable[grossID]?(variable[grossID].lv?variable[grossID].lv:default_lv):default_lv;
          for(let k=1;k<4;k++) if(catdata[grossID+"-"+k]) bro ++;
          list[i][j] = { id:id,cost:cost,lv:"Lv."+lv,bro:bro }
        }
      }
      socket.emit("list save complete",{ key,list,combo,stageBind,note,name,'public':data.public });
      if(!userdata[uid].list) userdata[uid].list = {};

      userdata[uid].list[key] = {name,list,combo,stageBind,note,'public':data.public};
      database.ref("/user/"+uid+"/list/"+key).set({name,list,combo,stageBind,note,'public':data.public});
      for(let i in stageBind){
        let id = stageBind[i].id.split("-"),
        target = stagedata[id[0]][id[1]][id[2]];
        if(!target.list) target.list = {};
        target.list[key] = {name,list,combo,stageBind,note,owner:uid,public:data.public};
        database.ref("/stagedata/"+id[0]+"/"+id[1]+"/"+id[2]+"/list/"+key)
        .set({name,list,combo,stageBind,note,owner:uid,public:data.public});
      }
      for(let i in data.removeStageBind){
        if(!data.removeStageBind[i]) continue
        let id = data.removeStageBind[i].split("-"),
        target = stagedata[id[0]][id[1]][id[2]];
        delete target.list[key];
        database.ref("/stagedata/"+id[0]+"/"+id[1]+"/"+id[2]+"/list/"+key).set(null);
      }
  });

  function checkList(list,id) {
    for(let i in list) if(list[i].substring(0,3) == id.substring(0,3)) return Number(i)+1
    return false
  }

  socket.on("delete list",function (data) {
    console.log(data.uid,'delete list',data.key);
    try{
      delete userdata[data.uid].list[data.key];
      database.ref("/user/"+data.uid+"/list/"+data.key).set(null);
      for(let i in data.stageBind){
        let id = data.stageBind[i].id.split("-"),
        target = stagedata[id[0]][id[1]][id[2]];
        delete target.list[data.key];
        database.ref("/stagedata/"+id[0]+"/"+id[1]+"/"+id[2]+"/list/"+data.key).set(null);
      }
    }
    catch(e){
      console.log(e);
      let time = new Date().getTime();
      database.ref("/error_log").push({
        time:time,error:e.toString()
      })
    }
  });
});

function arrangeUserData() {
  console.log('arrange user data');
  let count = 0,
      timer = new Date().getTime();
  for(let i in userdata){
    // console.log(i);
    if(i == undefined|| i == "undefined"){
      console.log("remove "+i);
      database.ref('/user/'+i).remove();
      continue
    } else {
      if(userdata[i].Anonymous){
        if((timer - userdata[i].last_login)>5*86400000) {
          console.log("remove "+i+" since didn't login for 5 days");
          database.ref('/user/'+i).remove();
          admin.auth().deleteUser(i)
          .then(function() { console.log("Successfully deleted user"); })
          .catch(function(error) { console.log("Error deleting user:", error); });
          continue
        }
      }
      if(userdata[i].first_login == undefined){
        console.log("remove "+i+" since unknown first login");
        database.ref('/user/'+i).remove();
        admin.auth().deleteUser(i)
        .then(function() { console.log("Successfully deleted user"); })
        .catch(function(error) { console.log("Error deleting user:", error); });
        continue
      }
      let arr=[],edit = ['cat','enemy','combo','stage','gacha'];
      count ++ ;
      for(let j in edit){
        for(let k in userdata[i].history[edit[j]]) arr.push(userdata[i].history[edit[j]][k]);
        if (arr.length > 40){
          console.log(i+" too many "+edit[j]);
          let l=0 ;
          for(let k in userdata[i].history[edit[j]]){
            l++;
            if(l < (arr.length-39)) database.ref('/user/'+i+"/history/"+edit[j]+"/"+k).remove();
          }
        }
        arr = [];
      }
      if(!userdata[i].variable) {
        console.log("user "+i+" no variable");
        database.ref('/user/'+i+"/variable").set({cat:"",enemy:"",stage:""});
      }
      if(userdata[i].setting.mine_alert){
        let mine = userdata[i].setting.mine_alert;
        if(!mine.accept&&((timer - mine.time)>4*86400000)&&Math.random()>0.2){
          database.ref('/user/'+i+"/setting/mine_alert/state").set(false);
        }
      }
    }
  }
  console.log("there are "+count+" users!!");
}
function geteventDay() {
  var t = new Date(),
      y = t.getFullYear(),
      m = t.getMonth()+1,
      d = t.getDate(),
      predic_url = 'https://forum.gamer.com.tw/B.php?bsn=23772&subbsn=7',
      root = 'https://forum.gamer.com.tw/',
      event_url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
  var start,end;
      console.log("get event day ",y+AddZero(m)+AddZero(d));

      //update new event
      if(eventdata[(y+AddZero(m)+AddZero(d))]==undefined){
        request({
          url: event_url+y+AddZero(m)+AddZero(d)+".html",
          method: "GET"
        },function (e,r,b) {
          if(!e){
            $ = cheerio.load(b);
            let body = $("body").html(),
            cc = body.indexOf("<error>") == -1;
            console.log("event page load complete,update = ",cc);
            eventdata[(y+AddZero(m)+AddZero(d))] = cc;
            database.ref("/event_date/"+(y+AddZero(m)+AddZero(d))).set(cc);
            if(cc){
              for(let i in eventdata){
                if(Number(i.substring(0,4))<y||Number(i.substring(4,6))<m) delete eventdata[i]
              }
              database.ref("/event_date").set(eventdata);
            }
          } else {console.log(e);}
        });
      } else console.log(y+AddZero(m)+AddZero(d),"exist");
      //update prediction
      request({
        url: predic_url,
        method: "GET"
      },function (e,r,b) {
        if(!e){
          $ = cheerio.load(b);
          let title = $(".b-list__row");
          let today = y+AddZero(m)+AddZero(d);
          let arr = [];
          title.each(function () {
            let a = $(this).children(".b-list__main").find("a");
            if(a.text().indexOf("活動資訊")!=-1){
              // console.log(a.text());
              let b = a.text().split("資訊")[1].split("(")[0].trim().split("~");
              for(let i in b){
                b[i] = b[i].split("/");
                for(let j in b[i]) b[i][j] = AddZero(b[i][j]);
                b[i] = ((Number(b[i][0])>Number(m)+1?y-1:y)+b[i].join(""));
              }
              if(b[1]>today){
                // console.log(a.text());
                start = b[0];end=b[1];
                // console.log(start,end);
                arr.push({url:root+a.attr("href"),start:start,end:end,name:a.text()});
              }
            }
          });
          // console.log(arr);
          for(i in arr){
            if (arr[i].url == eventdata.prediction.source||
              arr[i].url == eventdata.prediction_jp.source) continue
              console.log('update prediction');
              parsePrediction(arr[i],eventdata);
          }
        }
      });
}
function parsePrediction(obj,eventdate) {
  console.log(obj.name);
  let path = "/event_date/prediction";
  if(obj.name.indexOf('日版')!=-1){
    // console.log(/snA=[0-9]+/.exec(eventdate.prediction_jp.source)[0].split('=')[1]);
    if (Number(/snA=[0-9]+/.exec(eventdate.prediction_jp.source)[0].split('=')[1])>
        Number(/snA=[0-9]+/.exec(obj.url)[0].split('=')[1])) {console.log("don't update");return}
    path += '_jp';
  } else {
    if (Number(/snA=[0-9]+/.exec(eventdate.prediction.source)[0].split('=')[1])>
        Number(/snA=[0-9]+/.exec(obj.url)[0].split('=')[1])) {console.log("don't update");return}
  }
  request({
    url:obj.url,
    method:"GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      var gachaP = $("section").eq(0).find(".c-article__content"),
          eventP = $("section").eq(1).find(".c-article__content");
      var gachaObj = [],eventObj = [],dateRe = /[0-9]+\/[0-9]+\~[0-9]+\/[0-9]+/ ;
      gachaP.children("div").each(function () {
        let content = $(this).text();
        if(content&&content.length<30){
          let arr = content.split(' ');
          let brr = arr[0].split("~");
          let cc = dateRe.test(arr[0]);
          if(cc&&arr[1]){
            gachaObj.push({
              date:brr,name:arr[1],
              sure:arr[2]?arr[2].indexOf('必中')!=-1:false
            });
          }
        }
      });
      eventP.children("div").each(function () {
        let content = $(this).text();
        if( content.indexOf('課金')!=-1||
            content.indexOf('出售')!=-1||
            content.indexOf('來源')!=-1||!content) return
        arr = content.trim().split(' ');
        let brr = arr[0].split("~");
        let cc = dateRe.test(arr[0]);
        if(cc){
          eventObj.push({
            date:brr,
            name:arr[1]+(arr[2]?(" "+arr[2]):"")
          });
        }
      });
    }
    // console.log(gachaObj);
    // console.log(eventObj);
    database.ref(path).set({
      start:obj.start,
      end:obj.end,
      source:obj.url,
      eventP:eventObj,
      gachaP:gachaObj
    });
  });
}
function levelToValue(origin,rarity,lv) {
  let limit ;
  switch (rarity) {
    case 'R':
    limit = 70 ;
    break;
    case 'SR_alt':
    limit = 20 ;
    break;
    default:
    limit = 60 ;
  }
  return lv<limit ? (0.8+0.2*lv)*origin : origin*(0.8+0.2*limit)+origin*0.1*(lv-limit) ;
}
function AddZero(n) {
  return n<10 ? "0"+n : n
}

const port = 8000 ;
http.listen(process.env.PORT || port, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

app.get('/', function(req, res){
res.sendFile(__dirname + '/view/index.html');
});
app.use(express.static(path.join(__dirname, '/')));// to import css and javascript


//
//
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
