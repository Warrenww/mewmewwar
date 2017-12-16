var fs = require('fs');
var app = require('express')();
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
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
});
//設定資料的程式如下：
// var db = firebase.database();
// var ref = db.ref("/www");
// var value = {
//  Test1: "t1",
//  Test2: "t2"
// }
// ref.set(value);
//取得的資料程式如下：
var database = firebase.database();

var catdata,
    combodata,
    enemydata,
    userdata ;
database.ref("/").once("value",function (snapshot) {
  catdata = snapshot.val().catdata ;
  combodata = snapshot.val().combodata ;
  enemydata = snapshot.val().enemydata ;
  console.log('all data load complete!!') ;
});
// arrangeUserData();

io.on('connection', function(socket){

  // loadcatData() ;

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
            load_data = {};
        switch (type) {
          case 'cat':
            load_data = catdata ;
            break;
          case 'enemy':
            load_data = enemydata ;
            break;
          default:

        } ;

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
            level_bind = otherFilter[i].level_bind ;

            for(let j in buffer_1){
              let value = level_bind ? levelToValue(buffer_1[j][name],buffer_1[j].稀有度,30) : buffer_1[j][name];
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
  socket.on("text search",function (obj) {
    console.log("Text Search : "+obj.type+obj.key);
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
    } else if (obj.type == 'enemy'){
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
    database.ref("/user/"+uid+"/variable/cat/"+grossID).once("value",function (snapshot) {
      result.lv = snapshot.val() ? snapshot.val().lv : 30 ;
      result.count = snapshot.val()  ? snapshot.val().count : 0 ;
      socket.emit("display cat result",result);
    });
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
          first_login: timer,
          history : {cat:"",enemy:"",combo:""},
          compare : {cat2cat:"",cat2enemy:"",enemy2enemy:""},
          setting : {default_cat_lv:30},
          variable: {cat:{}}
        }
        database.ref('/user/'+user.uid).set(data) ;
        let current = '',exist = '000';
        for(let i in catdata){
          current = i.substring(0,3) ;
          if (current == exist) continue ;
          else database.ref('/user/'+user.uid+'/variable/cat/'+current).set({count:0,lv:"default"});
        }
      }
    });

  });
  socket.on("user connet",function (user){
    let timer = new Date().getTime(),
        last_cat = '',
        last_combo = [],
        last_enemy = '';
    console.log("user "+user.uid+" connect");
    database.ref('/user/'+user.uid).update({"last_login" : timer});
    database.ref('/user/'+user.uid).once("value",function (snapshot) {
    let history = snapshot.val().history ;
    for(let i in history.cat) last_cat = history.cat[i].id ;
    for(let i in history.combo) last_combo = history.combo[i].id ;
    for(let i in history.enemy) last_enemy = history.enemy[i].id ;

      let compareCat = snapshot.val().compare.cat2cat  ;
      let obj , arr = [] ;
      for(let i in compareCat){
        obj = {};
        if(!catdata[compareCat[i]]) continue
        obj = {id:compareCat[i],name:catdata[compareCat[i]].全名};
        arr.push(obj);
      }
      socket.emit("current_user_data",{
        name : snapshot.val().name,
        uid : user.uid,
        last_cat : last_cat,
        last_combo : last_combo,
        last_enemy : last_enemy,
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
  socket.on("start compare c2c",function (arr) {
    console.log('start compare c2c');
    let compare = [];
    for(let i in arr) compare.push(catdata[arr[i]]);
    socket.emit("c2c compare",compare);
  });

  socket.on("user Search",function (obj) {
    console.log("recording user history");
    console.log(obj);
    database.ref("/user/"+obj.uid+"/history/"+obj.type)
          .push({type : obj.type,id : obj.id});
    console.log("count cat search time");
    if(obj.type == 'cat'){
      let id = obj.id,
          gross = id.substring(0,3);
      database.ref("/user/"+obj.uid+"/variable/cat/"+gross+"/count").once('value',function (snapshot) {
        let count = snapshot.val() + 1;
        database.ref("/user/"+obj.uid+"/variable/cat/"+gross+"/count").set(count);
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

  socket.on('get event date',function () {
    let dd = new Date().getDate(),
        mm = new Date().getMonth()+1,
        yy = new Date().getFullYear() ;
    let today = Date.parse(mm+" "+dd+","+yy);
    console.log(today);
    database.ref('/event_date').once('value',function (snapshot) {
      let last = snapshot.val().system
      console.log(last);
      let diff = today - last ;
      if(diff == 86400000*3) {
        socket.emit('true event date',today);
        database.ref('/event_date/system').set(today) ;
        database.ref('/event_date/correct').set('') ;
      } else if(diff > 86400000*3) {
        let corr = last + 86400000*3 ;
        socket.emit('true event date',corr);
        database.ref('/event_date/system').set(corr) ;
        database.ref('/event_date/correct').set('') ;
      } else {
        socket.emit('true event date',last);
      }
    });
  });
  socket.on("test",function () {
    console.log("This is a test string")
  });

  socket.on('disconnect', function(){
    // console.log('user disconnected');
  });
  socket.on("lucky",function(result){
    let rarity = "";
    if(result == 'SSR') rarity = "超激稀有" ;
    if(result == 'SR') rarity = "激稀有" ;
    if(result == 'R') rarity = "稀有" ;

    let buffer = [];
    let exist = '000' ;
    for(let i in catdata) {
      if(catdata[i].稀有度 == rarity) {
        let current = i.substring(0,3);
        if(current == exist) continue
        buffer.push(current);
        exist = current;
      }
    }
    let choose = buffer[Math.floor((Math.random()*buffer.length))],
        choooose = choose+"-1" ;
        // console.log(choooose);
    socket.emit("choose",{id:choooose,name:catdata[choooose].全名,rarity:result});
  });


});

function arrangeUserData() {
  console.log('arrange user data');
  let buffer = {};
  database.ref('/user').once('value',function (snapshot) {
    userdata = snapshot.val();
    for(let i in userdata){
      // console.log(i);
      if(i != "undefined") buffer[i] = userdata[i]
    }
    // console.log(buffer);
    for (let i in buffer){
      let arr=[],
          h_cat = {},
          h_ene = {},
          h_com = {};
      for(let j in buffer[i].history.cat) arr.push(buffer[i].history.cat[j]);
      if (arr.length > 20){
        console.log(i+" too many cat");
        let k=0 ;
        for(let j in buffer[i].history.cat){
          k++;
          if(k < (arr.length-19)) continue
          h_cat[j] = buffer[i].history.cat[j]
        }
      } else h_cat = buffer[i].history.cat;
      buffer[i].history.cat = h_cat ;
      arr = [];
      for(let j in buffer[i].history.enemy) arr.push(buffer[i].history.enemy[j]);
      if (arr.length > 20){
        console.log(i+" too many enemy");
        let k=0 ;
        for(let j in buffer[i].history.enemy){
          k++;
          if(k < (arr.length-19)) continue
          h_ene[j] = buffer[i].history.enemy[j]
        }
      } else h_ene = buffer[i].history.enemy;
      buffer[i].history.enemy = h_ene ;
      arr = [];
      for(let j in buffer[i].history.combo) arr.push(buffer[i].history.combo[j]);
      if (arr.length > 20){
        console.log(i+" too many enemy");
        let k=0 ;
        for(let j in buffer[i].history.combo){
          k++;
          if(k < (arr.length-19)) continue
          h_com[j] = buffer[i].history.combo[j]
        }
      } else h_com = buffer[i].history.combo;
      buffer[i].history.combo = h_com ;

    }
    database.ref('/user').set(buffer);
  });
}
function loadcatData() {
  console.log("staring load data from google sheet!!");
  gsjson({
    spreadsheetId: sheet_ID,
    hash : 'id',
    worksheet: ['貓咪資料','聯組','敵人資料']
  })
  .then(function(result) {
    var obj = {} ;
    for(let i in result[1]){
      var bufferobj = {
        id : result[1][i].id,
        catagory : result[1][i].catagory,
        name : result[1][i].name,
        effect : result[1][i].effect,
        amount : result[1][i].amount,
        cat : [result[1][i].cat_1,result[1][i].cat_2,result[1][i].cat_3,result[1][i].cat_4,result[1][i].cat_5]
      } ;
      obj[i] = bufferobj;
    }
    database.ref("/catdata").update(result[0]) ;
    database.ref("/combodata").update(obj) ;
    database.ref("/enemydata").update(result[2]) ;
    fs.writeFile('public/js/Catdata.txt', JSON.stringify(result[0]), (err) => {
      if (err) throw err;
      console.log('Catdata is saved!');
    });
    fs.writeFile('public/js/Combodata.txt', JSON.stringify(obj), (err) => {
      if (err) throw err;
      console.log('Combodata is saved!');
    });
    fs.writeFile('public/js/Enemydata.txt', JSON.stringify(result[2]), (err) => {
      if (err) throw err;
      console.log('Enemydata is saved!');
    });
  })
  .catch(function(err) {
    console.log(err.message);
    console.log(err.stack);
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



const port = 8000 ;
http.listen(process.env.PORT || port, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

app.get('/', function(req, res){
res.sendFile(__dirname + '/view/index.html');
});
app.use(express.static(path.join(__dirname, '/')));// to import css and javascript
