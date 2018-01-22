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
var event_url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
var d_31 = [1,3,5,7,8,10,12];
var admin = require("firebase-admin");

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
    catname = {TW:{R:[],SR:[],SSR:[]},JP:{R:[],SR:[],SSR:[]}},
    most_search_cat ='' ;
database.ref("/").once("value",function (snapshot) {
  catdata = snapshot.val().newCatData ;
  combodata = snapshot.val().combodata ;
  enemydata = snapshot.val().enemydata ;
  stagedata = snapshot.val().stagedata ;
  gachadata = snapshot.val().gachadata ;
  rankdata = snapshot.val().rankdata ;
  console.log('all data load complete!!') ;

  var exist='000',current='',count=0;
  for(let i in catdata) {
    if(catdata[i].count > count){
      most_search_cat = i;
      count = catdata[i].count
    }

    let current = i.substring(0,3),rarity = catdata[i].rarity;
    if(current == exist) continue
    exist = current;
    if(rarity=="SSR"||catdata[i].get_method.indexOf("稀有轉蛋")!=-1){
      let name = catdata[i].name?catdata[i].name:catdata[i].jp_name,
          region = catdata[i].region.indexOf('[TW]')!=-1?'TW':'JP';
      catname[region][rarity].push({id:i,name:name})
    }
  }
  console.log('most search',catdata[most_search_cat].name,count);
  // console.log(catname.R.length,catname.SR.length,catname.SSR.length);

});
arrangeUserData();
geteventDay();

io.on('connection', function(socket){
  socket.on("search",function (data) {
        console.log("searching "+data.type+"....");
        console.log(data);
        let rFilter = data.rFilter,
            cFilter = data.cFilter,
            aFilter = data.aFilter,
            gFilter = data.gFilter,
            otherFilter = data.filterObj,
            type = data.type,
            buffer_1 = [],
            buffer_2 = [],
            load_data = {},
            user = data.uid;
        console.log("recording last search quene");
        database.ref("/user/"+user+"/history/last_"+type+"_search").update({
          rFilter,cFilter,aFilter,gFilter,otherFilter
        })
        switch (type) {
          case 'cat':
            load_data = catdata ;
            break;
          case 'enemy':
            load_data = enemydata ;
            break;
          default:
        } ;
        if(gFilter.length != 0){
          let transG = [];
          for(let i in gachadata){
            if(gFilter.indexOf(i) != -1) transG.push(gachadata[i].name);
          }
          for(let i in catdata){
            if(!catdata[i].get_method) continue
            for(let j in transG){
              if(catdata[i].get_method.indexOf(transG[j]) != -1){
                let grossID = i.substring(0,3);
                for(let k=1;k<4;k++){
                  let id = grossID+"-"+k;
                  if(catdata[id])
                    buffer_1.push({id:id,name:catdata[id].name?catdata[id].name:catdata[id].jp_name});
                }
              }
            }
          }
          socket.emit("search result",buffer_1);
          return
        }
        database.ref("/user/"+user+"/setting").once("value",function (snapshot) {
          let level = snapshot.val().default_cat_lv,
              showJP = snapshot.val().show_jp_cat;

          if(cFilter.length != 0){
            for(let i in load_data){
              for(let j in cFilter){
                if(type == 'cat' && !load_data[i].tag) break;
                if(type == 'enemy' && load_data[i]['color'] == '[無]') break;

                if( type == 'cat' &&
                    (load_data[i].tag.indexOf(cFilter[j]) != -1 ||
                    ((cFilter[j] != "對白色" || cFilter[j] != "對鋼鐵") &&
                    load_data[i].tag.indexOf("對全部") != -1))
                ) {
                  buffer_1.push(load_data[i]);
                  break;
                }
                if(type == 'enemy' && load_data[i]['color'].indexOf(cFilter[j]) != -1 ) {
                  buffer_1.push(load_data[i]);
                  break;
                }
              }
            }
          }
          else buffer_1 = load_data ;
          // console.log(buffer_1)
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
          if(otherFilter.length != 0){
            for(let i in otherFilter){
              let name = otherFilter[i].name,
              reverse = otherFilter[i].reverse ,
              limit = otherFilter[i].limit ,
              level_bind = otherFilter[i].level_bind;

              for(let j in buffer_1){
                let value = level_bind ? levelToValue(buffer_1[j][name],buffer_1[j].rarity,level) : buffer_1[j][name];
                if(value > limit && !reverse) buffer_2.push(buffer_1[j]);
                else if (value < limit && reverse) buffer_2.push(buffer_1[j]);
              }
            }
          } else buffer_2 = buffer_1 ;
          buffer_1 = [] ;
          for(let i in buffer_2) {
            let obj = {
              id : buffer_2[i].id,
              name : buffer_2[i].name?buffer_2[i].name:buffer_2[i].jp_name
            }
            if(type == 'cat' && (!showJP&&buffer_2[i].region.indexOf("[JP]")==-1)) continue
            else buffer_1.push(obj) ;
          }
          console.log("Result length:",buffer_1.length);
          socket.emit("search result",buffer_1);

        });

  });
  socket.on("text search",function (obj) {
    console.log("Text Search : "+obj.type+"_"+obj.key);
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
    for(let id in load_data){
      let name = load_data[id].name?load_data[id].name:load_data[id].jp_name;
      if(name.indexOf(key) != -1) {
        let simple = id.substring(0,3);
        for(let j=1;j<4;j++){
          let x = obj.type == 'cat'?(simple+'-'+j):simple ;
          if(load_data[x]) {
            let obj = {
              name : load_data[x].name,
              id : load_data[x].id
            };
            buffer.push(obj) ;
            if(obj.type == 'enemy') break
          }
        }
      }
    }
    // console.log(buffer);
    socket.emit("search result",buffer);
  });
  socket.on("display cat",function (data) {
    console.log("display cat");
    console.log(data);
    let uid = data.uid,
        id = data.cat,
        record = data.history,
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
    if(!uid) socket.emit("display cat result",result);
    else {
      database.ref("/user/"+uid).once("value",function (snapshot) {
        let default_lv = snapshot.val().setting.default_cat_lv;
        let storge_lv = snapshot.val().variable.cat[grossID] ? snapshot.val().variable.cat[grossID].lv : default_lv,
            storge_count = snapshot.val().variable.cat[grossID] ? snapshot.val().variable.cat[grossID].count : 1,
            own = snapshot.val().variable.cat[grossID] ? snapshot.val().variable.cat[grossID].own : false;
        result.lv = storge_lv ? storge_lv : default_lv  ;
        result.count = storge_count ? storge_count : 1;
        result.own = own;
        socket.emit("display cat result",result);

        database.ref("/user/"+uid).once('value',function (snapshot) {
          let data = snapshot.val(),
          history = data.history.cat,
          last = data.history.last_cat?data.history.last_cat.substring(0,3):"",
          cat = data.variable.cat[grossID],
          count = (cat?(cat.count?cat.count:0):0) + 1;
          if(grossID != last && record) {
            console.log("recording user history");
            for(let i in history){
              if(history[i].id == id) delete history[i]
            }
            database.ref("/user/"+uid+"/history/cat").set(history);
            database.ref("/user/"+uid+"/history/cat").push({type : "cat",id : id});
            database.ref("/user/"+uid+"/history/last_cat").set(id);
            console.log("count cat search time(user)");
            database.ref("/user/"+uid+"/variable/cat/"+grossID+"/count").set(count);
            console.log("count cat search time(global)");
            database.ref("/catdata/"+id+"/count").once("value",function (snapshot) {
              let count = snapshot.val() + 1;
              database.ref("/catdata/"+id+"/count").set(count);
              database.ref("/newCatData/"+id+"/count").set(count);
            });
          }
          else console.log(record?"same as last cat":"do not record");
        });
      });
    }
  });
  socket.on("display enemy",function (data) {
    let uid = data.uid,id = data.id,record = data.history;
    console.log(data);
    console.log("client requir enemy "+id+"'s data");
    let buffer = enemydata[id];

    if(uid){
      database.ref("/user/"+uid+"/variable/").once("value",function (snapshot) {
        let data = snapshot.val();
        buffer.count = data.enemy?(data.enemy[id]?data.enemy[id].count:0):0;
        socket.emit('display enemy result',buffer);
      });
      database.ref("/user/"+uid).once('value',function (snapshot) {
        let data = snapshot.val(),
        last = data.history.last_enemy,
        history = data.history.enemy,
        enemy = data.variable.enemy?data.variable.enemy[id]:null,
        count = (enemy?(enemy.count?enemy.count:0):0) + 1;
        if(id != last && record) {
          console.log("recording user history");
          for(let i in history){
            if(history[i].id == id) delete history[i]
          }
          database.ref("/user/"+uid+"/history/enemy").set(history);
          database.ref("/user/"+uid+"/history/enemy").push({type : "enemy",id : id});
          database.ref("/user/"+uid+"/history/last_enemy").set(id);
          console.log("count enemy search time(user)");
          database.ref("/user/"+uid+"/variable/enemy/"+id+"/count").set(count);
          console.log("count enemy search time(global)");
          database.ref("/enemydata/"+id+"/count").once("value",function (snapshot) {
            let count = snapshot.val() + 1;
            database.ref("/enemydata/"+id+"/count").set(count);
          });
        }
        else console.log(record?"same as last enemy":"do not record");
      });
    } else socket.emit('display enemy result',buffer);
  });

  socket.on("user login",function (user) {
    console.log(user.uid+" user login");
    let exist = false;
    let timer = new Date().getTime();
    console.log('login time : '+timer);
    database.ref('/user').once('value',function (data) {
      for(let uid in data.val()){
        if(uid == user.uid){
          console.log("find same user");
          exist = true;
          break;
        }
      }
    }).then(function () {
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
          variable : {cat:""},
          folder : {owned:""},
          Anonymous : user.isAnonymous
        }
        if(user.isAnonymous){
          let name_arr = [] ;
          for(let i in catdata) name_arr.push(catdata[i].name);
          let anonymous = name_arr[Math.floor((Math.random()*name_arr.length))];
          data.name = "匿名"+anonymous;
          data.nickname = "匿名"+anonymous;
          console.log("匿名"+anonymous);
        }
        console.log(data);
        database.ref('/user/'+user.uid).set(data) ;
      }
    }).then(function () {
      clearTimeout(timeout);
      arrangeUserData();
    });

  });
  socket.on("user connect",function (user){
    let timer = new Date().getTime(),
        last_cat = '',
        last_combo = [],
        last_enemy = '',
        last_stage = '';
    console.log("user "+user.uid+" connect");
    database.ref('/user/'+user.uid).update({"last_login" : timer});
    database.ref('/user/'+user.uid).once("value",function (snapshot) {
      if(snapshot.val().first_login == null){
        console.log('null user');
        let data = {
          name : "匿名貓咪",
          nickname : "匿名貓咪",
          first_login : timer,
          last_login : timer,
          history : {cat:"",enemy:"",combo:"",stage:""},
          compare : {cat2cat:"",cat2enemy:"",enemy2enemy:""},
          setting : {default_cat_lv:30},
          variable : {cat:{}},
          folder : {owned:""},
          Anonymous : true
        }
        database.ref('/user/'+user.uid).set(data) ;
        return
      }
      let history = snapshot.val().history ;
      last_cat = history.last_cat;
      last_enemy = history.last_enemy;
      last_combo = history.last_combo;
      last_stage = history.last_stage;
      last_cat_search = history.last_cat_search;
      last_enemy_search = history.last_enemy_search;
      let compareCat = snapshot.val().compare.cat2cat,
          fight_cat = snapshot.val().compare.cat2enemy.cat?snapshot.val().compare.cat2enemy.cat:null,
          fight_ene = snapshot.val().compare.cat2enemy.enemy?snapshot.val().compare.cat2enemy.enemy:null,
          fight = {
            cat : fight_cat?{id:fight_cat.id,name:catdata[fight_cat.id].name}:null,
            enemy : fight_ene?{id:fight_ene.id,name:enemydata[fight_ene.id].name,lv:fight_ene.lv}:null
          };
      let obj , arr = [] ;
      for(let i in compareCat){
        obj = {};
        if(!catdata[compareCat[i]]) continue
        obj = {id:compareCat[i],name:catdata[compareCat[i]].name};
        arr.push(obj);
      }
      socket.emit("current_user_data",{
        name : snapshot.val().nickname,
        uid : user.uid,
        last_cat : last_cat,
        last_combo : last_combo,
        last_enemy : last_enemy,
        last_stage : last_stage,
        last_cat_search : last_cat_search,
        last_enemy_search : last_enemy_search,
        compare_c2c: arr,
        setting : snapshot.val().setting,
        fight : fight
      });
    });
    console.log('user data send');
  });
  socket.on("search combo",function (data) {
    console.log("searching combo......") ;
    let buffer = [] ;
    let arr = data.id,uid = data.uid;
    for(let i in combodata){
      for(let j in arr){
        if(arr[j] == (i.substring(0,4))) buffer.push(combodata[i]) ;
      }
    }
    socket.emit("combo result",buffer) ;
    console.log("recording user history");
    database.ref("/user/"+uid+"/history/combo").push({type : "combo",id : arr});
    database.ref("/user/"+uid+"/history/last_combo").set(arr);
  }) ;
  socket.on("compare cat",function (data) {
    console.log("compare cat!!");
    console.log(data);
    database.ref('/user/'+data.id+"/compare/cat2cat").set(data.target);
  });
  socket.on("start compare c2c",function (data) {
    console.log('start compare c2c');
    let compare = [];
    database.ref("/user/"+data.id).once("value",function (snapshot) {
      let def = snapshot.val().setting.default_cat_lv,
          catArr = snapshot.val().variable ? snapshot.val().variable.cat : [];
      for(let i in data.target) {
        let id = data.target[i].substring(0,3),
            lv = catArr[id] ? (catArr[id].lv == 'default' || !catArr[id].lv ? def : catArr[id].lv) : def;
        compare.push({data:catdata[data.target[i]],lv:lv});
      }
      socket.emit("c2c compare",compare);

    });
  });
  socket.on("user name",function (id) {
    database.ref("/user/"+id+"/nickname").once("value",function (snapshot) {
      socket.emit("user name",snapshot.val());
    });
  });
  socket.on("rename",function (data) {
    database.ref("/user/"+data.uid+"/nickname").set(data.name);
  });

  socket.on("history",function (uid) {
    console.log(uid+"'s history");
    database.ref("/user/"+uid).once("value",function (snapshot) {
      let data = snapshot.val().history,
          owned = snapshot.val().folder.owned;
      // console.log(data);
      let buffer = {cat:[],enemy:[],owned:[]};
      for (let i in data.cat) buffer.cat.push({name:catdata[data.cat[i].id].name,id :data.cat[i].id});
      for (let i in data.enemy) buffer.enemy.push({name:enemydata[data.enemy[i].id].name,id :data.enemy[i].id});
      for (let i in owned) buffer.owned.push({name:catdata[owned[i]+"-1"].name,id :owned[i]+"-1"})
      // console.log(buffer);
      socket.emit("return history",buffer);
    });
  });
  socket.on("store cat level",function (data) {
    console.log(data.uid+" change his/her "+data.id+"'s level to "+data.lv);
    let id = data.id,
        gross = id.substring(0,3);
    database.ref("/user/"+data.uid+"/variable/cat/"+gross).update({lv:data.lv});
  });
  socket.on("mark own",function (data) {
    console.log(data.uid+" claim he/she "+
        (data.mark?"does":"doesn't")+" own "+data.cat);
    database.ref("/user/"+data.uid+"/variable/cat/"+data.cat)
      .update({own:data.mark ? true : false});
    database.ref("/user/"+data.uid+"/folder").once("value",function (snapshot) {
      let folder = snapshot.val(),
          arr =( folder.owned && folder.owned != "0" )? folder.owned : [];
      if(data.mark) arr.push(data.cat);
      else arr.splice(arr.indexOf(data.cat),1);
      arr = arr.length ? arr : 0 ;
      database.ref("/user/"+data.uid+"/folder").update({owned:arr});
    });
  });

  socket.on("require setting",function (id) {
    console.log("require "+id+"'s setting");
    database.ref("/user/"+id+"/setting").once("value",function (snapshot) {
      socket.emit("user setting",snapshot.val());
    });
  });
  socket.on("set default cat level",function (data) {
    console.log("set "+data.uid+"'s default_cat_lv to "+data.lv);
    database.ref("/user/"+data.uid+"/setting/default_cat_lv").set(data.lv);

  });
  socket.on("reset cat level",function (id) {
    console.log("reset all "+id+"'s cat lv to default");
      database.ref("/user/"+id+"/variable/cat").once("value",function (snapshot) {
        for(let i in snapshot.val()){
          database.ref("/user/"+id+"/variable/cat/"+i+"/lv").set("default");
        }
      });
  });
  socket.on("reset owned cat",function (id) {
    console.log("reset all "+id+"'s cat owned state");
    database.ref("/user/"+id+"/variable/cat").once("value",function (snapshot) {
      for(let i in snapshot.val()){
        database.ref("/user/"+id+"/variable/cat/"+i+"/own").set(false);
      }
    });
    database.ref("/user/"+id+"/folder/owned").set("0");
  });

  socket.on("change setting",function (data) {
    console.log(data.uid+" want to "+
        (data.state?"show":"hide")+" it's "+data.type);
    database.ref("/user/"+data.uid+"/setting/show_"+data.type)
        .set(data.state);
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
    let parent = stagedata[data.chapter][data.stage].name;
    socket.emit("level data",{
      data:stagedata[data.chapter][data.stage][data.level],
      parent:parent
    });

    let chapter = data.chapter,
        stage = data.stage,
        level = data.level,
        id = chapter+"-"+stage+"-"+level,
        uid = data.uid;
    database.ref("/user/"+uid).once('value',function (snapshot) {
      let data = snapshot.val(),
          last = data.history.last_stage,
          history = data.history.stage,
          Stage = data.variable.stage?data.variable.stage[id]:null,
          count = (Stage?(Stage.count?Stage.count:0):0) + 1;
      if(id != last) {
        console.log("recording user history");
        for(let i in history){
          if(history[i] == id) delete history[i]
        }
        database.ref("/user/"+uid+"/history/stage").set(history)
        database.ref("/user/"+uid+"/history/stage").push({
          type : "stage",
          id : id
        });
        database.ref("/user/"+uid+"/history/last_stage").set(id);
        console.log("count stage search time(user)");
        database.ref("/user/"+uid+"/variable/stage/"+id+"/count").set(count);
        console.log("count stage search time(global)");
        database.ref("/stagedata/"+chapter+"/"+stage+"/"+level+"/count")
          .once("value",function (snapshot) {
            let count = snapshot.val() + 1;
            database.ref("/stagedata/"+chapter+"/"+stage+"/"+level+"/count")
              .set(count);
          });
      }
      else console.log("same as last stage");
    });
  });

  socket.on('get event date',function () {
    database.ref('/event_date').once('value',function (snapshot) {
      socket.emit('true event date',snapshot.val());
    });
  });
  socket.on("rankdata",function () {
    socket.emit("recive rank data",rankdata);
  });

  socket.on("gacha",function(data){
    console.log("gacha");
    console.log(data);
    database.ref("/user/"+data.uid+"/setting/show_jp_cat").once("value",function (snapshot) {
      let jp = snapshot.val(),senddata=[];

      for(let i in data.result){
        let rarity = data.result[i];
        let buffer = jp?catname.JP[rarity].concat(catname.TW[rarity]):catname.TW[rarity];

        let choose = buffer[Math.floor((Math.random()*buffer.length))];
        senddata.push({
          id:choose.id,
          name:choose.name,
          rarity:data.result[i]
        });
      }
      // console.log(choooose);
      socket.emit("choose",senddata);

    });
  });
  socket.on("require gachadata",function () {
    socket.emit("return gachadata",gachadata);
  });

  socket.on("compare C2E",function (data) {
    console.log("compare C2E");
    console.log(data);
    database.ref("/user/"+data.uid+"/compare/cat2enemy").update(data.target)
  });

  socket.on('disconnect', function(){
    // console.log('user disconnected');
  });

});
var timeout,event_get_count = 0 ;
function arrangeUserData() {
  timeout = setTimeout(function () {
    arrangeUserData();
  },3600000*3);
  console.log('arrange user data');
  let count = 0;
  database.ref('/user').once('value',function (snapshot) {
    let timer = new Date().getTime();
    userdata = snapshot.val();
    for(let i in userdata){
      // console.log(i);
      if(i == undefined|| i == "undefined"){
        console.log("remove "+i);
        database.ref('/user/'+i).remove();
        continue
      } else {
        if(userdata[i].Anonymous){
          if((timer - userdata[i].last_login)>3*86400000) {
            console.log("remove "+i+" since didn't login for 3 days");
            database.ref('/user/'+i).remove();
            admin.auth().deleteUser(i)
            .then(function() {
              console.log("Successfully deleted user");
            })
            .catch(function(error) {
              console.log("Error deleting user:", error);
            });
            continue
          }
          if(userdata[i].last_login == undefined){
            console.log("remove "+i+" since unknown last login");
            database.ref('/user/'+i).remove();
            admin.auth().deleteUser(i)
            .then(function() {
              console.log("Successfully deleted user");
            })
            .catch(function(error) {
              console.log("Error deleting user:", error);
            });
            continue
          }
        }
        let arr=[],edit = ['cat','enemy','combo','stage'];
        count ++ ;
        for(let j in edit){
          for(let k in userdata[i].history[edit[j]]) arr.push(userdata[i].history[edit[j]][k]);
          if (arr.length > 20){
            console.log(i+" too many "+edit[j]);
            let l=0 ;
            for(let k in userdata[i].history[edit[j]]){
              l++;
              if(l < (arr.length-19)) database.ref('/user/'+i+"/history/"+edit[j]+"/"+k).remove();
            }
          }
          arr = [];
        }
        if(!userdata[i].variable) {
          console.log("user "+i+" no variable");
          database.ref('/user/'+i+"/variable").set({cat:""});
        }
      }
    }
    console.log("there are "+count+" users!!");
  });
}
function geteventDay() {
  var t = new Date(),
      y = t.getFullYear(),
      m = t.getMonth()+1,
      d = t.getDate();
      console.log("get event day")
      console.log(y+AddZero(m)+AddZero(d));
  request({
    url: event_url+y+AddZero(m)+AddZero(d)+".html",
    method: "GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      let body = $("body").html();
      if(body.indexOf("<error>") == -1) {
        console.log("change event day");
        database.ref("/event_date/now").set(y+"/"+AddZero(m)+"/"+AddZero(d));
        // NextEventDay(y,m,d);
        PrevEventDay(y,m,d);
      }
      else {
        console.log("did not change event day");
      }
    }else{console.log(e);}
  });
  setTimeout(function () {
    geteventDay()
  },86400000);
}
function NextEventDay(y,m,d) {
  event_get_count ++ ;
  d ++ ;
  if(m == 2 && d>28){m++,d=1}
  else if (d_31.indexOf(m) != -1 && d>31) {m++,d=1}
  else if (d>30) {m++,d=1}
  if(m>12){y++;m=1}
  // console.log("next event day ?= "+y+AddZero(m)+AddZero(d));
  request({
    url: event_url+y+AddZero(m)+AddZero(d)+".html",
    method: "GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      let body = $("body").html();
      if(body.indexOf("<error>") == -1) {
        console.log("change next event day");
        database.ref("/event_date/next").set(y+"/"+AddZero(m)+"/"+AddZero(d));
        event_get_count = 0 ;
      }
      else {
        console.log("next day");
        if(event_get_count<10) NextEventDay(y,m,d);
        else console.log("There are no event update for later 10 days.");
      }
    } else {console.log(e);}
  });
}
function PrevEventDay(y,m,d) {
  d -- ;
  if(d==0){
    m--;
    if(m==0){y--;m=12}
    d = m==2 ? 28 : (d_31.indexOf(m) != -1 ? 31 : 30);
  }
  // console.log("prev event day ?= "+y+AddZero(m)+AddZero(d));
  request({
    url: event_url+y+AddZero(m)+AddZero(d)+".html",
    method: "GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      let body = $("body").html();
      if(body.indexOf("<error>") == -1) {
        console.log("change prev event day");
        database.ref("/event_date/prev").set(y+"/"+AddZero(m)+"/"+AddZero(d));
      }
      else {
        console.log("prev day");
        PrevEventDay(y,m,d)
      }
    } else {console.log(e);}
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
