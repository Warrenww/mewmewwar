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


firebase.initializeApp(config);
var provider = new firebase.auth.FacebookAuthProvider();
firebase.auth().useDeviceLanguage();
firebase.auth().getRedirectResult().then(function(result) {
  if (result.credential) {
    // This gives you a Facebook Access Token. You can use it to access the Facebook API.
    var token = result.credential.accessToken;
    // ...
  }
  // The signed-in user info.
  var user = result.user;
})
.catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
});

var database = firebase.database();

var catdata,
    combodata,
    enemydata,
    userdata,
    stagedata ;
database.ref("/").once("value",function (snapshot) {
  catdata = snapshot.val().catdata ;
  combodata = snapshot.val().combodata ;
  enemydata = snapshot.val().enemydata ;
  stagedata = snapshot.val().stagedata ;
  console.log('all data load complete!!') ;
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
            otherFilter = data.filterObj,
            type = data.type,
            buffer_1 = [],
            buffer_2 = [],
            load_data = {},
            user = data.uid;
        switch (type) {
          case 'cat':
            load_data = catdata ;
            break;
          case 'enemy':
            load_data = enemydata ;
            break;
          default:

        } ;
        database.ref("/user/"+user+"/setting").once("value",function (snapshot) {
          let level = snapshot.val().default_cat_lv,
              showJP = snapshot.val().show_jp_cat;

          if(!showJP || type == 'cat'){
            for(let i in load_data){
              let region = load_data[i].region;
              if(region.indexOf("[TW]") == -1) delete load_data[i]
            }
          }

          if(cFilter.length != 0){
            for(let i in load_data){
              for(let j in cFilter){
                if(type == 'cat' && load_data[i].tag == '[無]') break;
                if(type == 'enemy' && load_data[i]['分類'] == '[無]') break;

                if(type == 'cat' && load_data[i].tag.indexOf(cFilter[j]) != -1 ) {
                  buffer_1.push(load_data[i]);
                  break;
                }
                if(type == 'enemy' && load_data[i]['分類'].indexOf(cFilter[j]) != -1 ) {
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
                if(buffer_1[i].tag == '[無]') break;
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
            for(let i in buffer_2) if(rFilter.indexOf(buffer_2[i].稀有度) != -1) buffer_1.push(buffer_2[i]) ;
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
                let value = level_bind ? levelToValue(buffer_1[j][name],buffer_1[j].稀有度,level) : buffer_1[j][name];
                if(value > limit && !reverse) buffer_2.push(buffer_1[j]);
                else if (value < limit && reverse) buffer_2.push(buffer_1[j]);
              }
            }
          } else buffer_2 = buffer_1 ;
          buffer_1 = [] ;

          // for(let i in buffer_2) console.log(buffer_2[i].全名) ;
          for(let i in buffer_2) {
            let obj = {
              id : buffer_2[i].id,
              name : buffer_2[i].全名
            }
            buffer_1.push(obj) ;
          }

          socket.emit("search result",buffer_1);
        });

  });
  socket.on("text search",function (obj) {
    console.log("Text Search : "+obj.type+"_"+obj.key);
    let key = obj.key ,
    buffer = [],
    data = {} ;
    if(obj.type == 'cat'){
      for(let id in catdata){
        if(catdata[id].全名.indexOf(key) != -1) {
          let simple = id.substring(0,3);
          for(let j=1;j<4;j++){
            let x = simple + '-' + j  ;
            if(catdata[x]) {
              let obj = {
                name : catdata[x].全名,
                id : catdata[x].id
              };
              buffer.push(obj) ;
            }
          }
        }
      }
    }
    else if (obj.type == 'enemy'){
      for(let i in enemydata){
        if(enemydata[i].全名.indexOf(key) != -1){
          let obj = {
            name : enemydata[i].全名,
            id : enemydata[i].id
          };
          buffer.push(obj) ;
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
    if(!uid){
      socket.emit("display cat result",result);
    } else {
      database.ref("/user/"+uid).once("value",function (snapshot) {
        let default_lv = snapshot.val().setting.default_cat_lv;
        let storge_lv = snapshot.val().variable.cat[grossID] ? snapshot.val().variable.cat[grossID].lv : default_lv,
            storge_count = snapshot.val().variable.cat[grossID] ? snapshot.val().variable.cat[grossID].count : 0;
        result.lv = storge_lv  ;
        result.count = storge_count ;
        socket.emit("display cat result",result);
      });
    }
    // console.log(result);

  });
  socket.on("display enemy",function (id) {
    console.log("client requir enemy "+id+"'s data'");
    socket.emit('display enemy result',enemydata[id]);
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
          Anonymous : user.isAnonymous
        }
        if(user.isAnonymous){
          let name_arr = [] ;
          for(let i in catdata) name_arr.push(catdata[i].全名);
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
  socket.on("user connet",function (user){
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
          Anonymous : true
        }
        database.ref('/user/'+user.uid).set(data) ;
        return
      }
      let history = snapshot.val().history ;
      for(let i in history.cat) last_cat = history.cat[i].id ;
      for(let i in history.combo) last_combo = history.combo[i].id ;
      for(let i in history.enemy) last_enemy = history.enemy[i].id ;
      for(let i in history.stage) last_stage = history.stage[i].id ;

      let compareCat = snapshot.val().compare.cat2cat  ;
      let obj , arr = [] ;
      for(let i in compareCat){
        obj = {};
        if(!catdata[compareCat[i]]) continue
        obj = {id:compareCat[i],name:catdata[compareCat[i]].全名};
        arr.push(obj);
      }
      socket.emit("current_user_data",{
        name : snapshot.val().nickname,
        uid : user.uid,
        last_cat : last_cat,
        last_combo : last_combo,
        last_enemy : last_enemy,
        last_stage : last_stage,
        compare_c2c: arr,
        setting : snapshot.val().setting
      });
    });
    console.log('user data send');
  });
  socket.on("search combo",function (arr) {
    console.log("searching combo......") ;
    let buffer = [] ;
    for(let i in combodata){
      for(let j in arr){
        if(arr[j] == (i.substring(0,4))) buffer.push(combodata[i]) ;
      }
    }
    socket.emit("combo result",buffer) ;
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
          catArr = snapshot.val().variable.cat ? snapshot.val().variable.cat : [];
      for(let i in data.target) {
        let id = data.target[i].substring(0,3),
            lv = catArr[id] ? (catArr[id].lv == 'default' ? def : catArr[id].lv) : def;
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


  socket.on("user Search",function (obj) {
    console.log("recording user history");
    console.log(obj);
    database.ref("/user/"+obj.uid+"/history/"+obj.type)
          .push({type : obj.type,id : obj.id});
    if(obj.type == 'cat'){
      let id = obj.id,
          gross = id.substring(0,3);

      console.log("count cat search time(user)");
      database.ref("/user/"+obj.uid+"/variable/cat/"+gross+"/count").once('value',function (snapshot) {
        let count = (snapshot.val()?snapshot.val():0) + 1;
        database.ref("/user/"+obj.uid+"/variable/cat/"+gross+"/count").set(count);
      });
      console.log("count cat search time(global)");
      database.ref("/catdata/"+id+"/count").once("value",function (snapshot) {
        let count = snapshot.val() + 1;
        database.ref("/catdata/"+id+"/count").set(count);
      });
    }
  });
  socket.on("history",function (uid) {
    console.log(uid+"'s history");
    database.ref("/user/"+uid+"/history").once("value",function (snapshot) {
      let data = snapshot.val() ;
      // console.log(data);
      let buffer = {cat:[],enemy:[]};
      for (let i in data.cat) buffer.cat.push({name:catdata[data.cat[i].id].全名,id :data.cat[i].id});
      for (let i in data.enemy) buffer.enemy.push({name:enemydata[data.enemy[i].id].全名,id :data.enemy[i].id});

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
  socket.on("show hide cat id",function (data) {
    console.log(data.uid+" want to "+(data.state?"show":"hide")+" it's cat id");
    database.ref("/user/"+data.uid+"/setting/show_cat_id").set(data.state);
  });
  socket.on("show hide cat count",function (data) {
    console.log(data.uid+" want to "+(data.state?"show":"hide")+" it's cat count");
    database.ref("/user/"+data.uid+"/setting/show_cat_count").set(data.state);
  });
  socket.on("show hide jp cat",function (data) {
    console.log(data.uid+" want to "+(data.state?"show":"hide")+" it's jp cat");
    database.ref("/user/"+data.uid+"/setting/show_jp_cat").set(data.state);
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
        socket.emit("level name",buffer);
  });
  socket.on("required level data",function (data) {
    console.log("load level name");
    console.log(data);
    let parent = stagedata[data.chapter][data.stage].name;
    socket.emit("level data",{
      data:stagedata[data.chapter][data.stage][data.level],
      parent:parent
    });
  });



  socket.on('get event date',function () {
    database.ref('/event_date').once('value',function (snapshot) {
      socket.emit('true event date',snapshot.val());
    });
  });
  socket.on("test",function () {
    console.log("This is a test string")
  });

  socket.on('disconnect', function(){
    // console.log('user disconnected');
  });
  socket.on("lucky",function(data){
    console.log("lucky ");
    console.log(data);
    database.ref("/user/"+data.uid+"/setting/show_jp_cat").once("value",function (snapshot) {
      let jp = snapshot.val(),senddata=[];
      for(let i in data.result){
        let rarity='';
        if(data.result[i] == 'SSR') rarity = "超激稀有" ;
        if(data.result[i] == 'SR') rarity = "激稀有" ;
        if(data.result[i] == 'R') rarity = "稀有" ;
        let buffer = [];
        let exist = '000' ;
        if(!jp){
          for(let i in catdata) {
            if(catdata[i].稀有度 == rarity && catdata[i].region == '[TW][JP]') {
              let current = i.substring(0,3);
              if(current == exist) continue
              buffer.push(current);
              exist = current;
            }
          }
        } else {
          for(let i in catdata) {
            if(catdata[i].稀有度 == rarity) {
              let current = i.substring(0,3);
              if(current == exist) continue
              buffer.push(current);
              exist = current;
            }
          }
        }
        let choose = buffer[Math.floor((Math.random()*buffer.length))],
        choooose = choose+"-1" ;
        senddata.push({
          id:choooose,
          name:catdata[choooose].全名,
          rarity:data.result[i]
        });
      }
      // console.log(choooose);
      socket.emit("choose",senddata);

    });
  });


});
var timeout ;
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
            continue
          }
          if(userdata[i].last_login == undefined){
            console.log("remove "+i+" since unknown last login");
            database.ref('/user/'+i).remove();
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
        NextEventDay(y,m,d);
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
      }
      else {
        console.log("next day");
        NextEventDay(y,m,d)
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
    case '稀有':
    limit = 70 ;
    break;
    case '激稀有狂亂':
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
