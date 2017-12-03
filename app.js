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


io.on('connection', function(socket){
  // console.log('a user connected');
  // loadcatData() ;
  socket.emit("search enemy",function (data) {
    console.log("searching enemy....");
    console.log(data);
    let cFilter = data.cFilter,
        aFilter = data.aFilter,
        otherFilter = data.filterObj,
        buffer_1 = [],
        buffer_2 = [];
    if(cFilter.length != 0){
      for(let id in enemydata){
        for(let j in cFiliter){
          // console.log(enemydata[id].id)
          if(enemydata[id]['分類'] == '[無]') break;
          else if(enemydata[id]['分類'].indexOf(cFiliter[j]) != -1) {buffer_1.push(enemydata[id]);break;}
        }
      }
    }
    else buffer_1 = enemydata ;
    if(aFilter.length != 0){
      for(let id in buffer_1){
        for(let j in aFiliter){
          if(buffer_1[id].tag.indexOf(aFiliter[j]) != -1) {buffer_2.push(buffer_1[id]);break;}
        }
      }
    }
    else buffer_2 = buffer_1 ;
    buffer_1 = [] ;

  });

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
        console.log(buffer_1)
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
  socket.on("display cat",function (id) {
    let grossID = id.substring(0,3),
        result = {"this":"","bro":[],"combo":[]} ;
    console.log("client requir cat "+grossID+"'s data'");
    let combo = [] ;
    for(let i=1;i<4;i++){
      let a = grossID+"-"+i ;
      if(a == id) result.this = catdata[a] ;
      else if(catdata[a]) result.bro.push(catdata[a].id) ;
      for(let j in combodata) if(combodata[j].cat.indexOf(a) != -1) combo.push(combodata[j])
    }
    result.combo = combo ;
    console.log(result);
    socket.emit("display cat result",result);
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
          history : "",
          compare : {cat2cat:"",cat2enemy:"",enemy2enemy:""}
        }
        database.ref('/user/'+user.uid).set(data) ;
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
      for(let i in history){
        if(history[i].type == 'cat') last_cat = history[i].id ;
        if(history[i].type == 'combo') last_combo = history[i].id ;
        if(history[i].type == 'enemy') last_enemy = history[i].id ;
      }
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
        compare_c2c: arr
      });
    });

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

  socket.on("user Search",function (obj) {
    console.log("recording user history");
    console.log(obj);
    database.ref("/user/"+obj.uid+"/history")
          .push({type : obj.type,id : obj.id});
  });
  socket.on("history",function (uid) {
    console.log(uid+"'s history");
    database.ref("/user/"+uid+"/history").once("value",function (snapshot) {
      let data = snapshot.val() ;
      // console.log(data);
      let buffer = [];
      for (let i in data) {
        if(data[i].type == 'cat') buffer.push({name:catdata[data[i].id].全名,color:"#851b1b"});
        if(data[i].type == 'enemy') buffer.push({name:enemydata[data[i].id].全名,color:"#01295d"});
      }
      // console.log(buffer);
      socket.emit("return history",buffer);
    });
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


});

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
  // gsjson({
  //   spreadsheetId: sheet_ID,
  //   hash : 'id' ,
  //   worksheet: ['聯組']
  // })
  // .then(function(result) {
  //   // console.log(result)
  //   socket.emit('push cat data',JSON.stringify(result));
  //   fs.writeFile('public/js/Combo.txt', JSON.stringify(result), (err) => {
  //     if (err) throw err;
  //     console.log('Combo is saved!');
  //   });
  // })
  // .catch(function(err) {
  //   console.log(err.message);
  //   console.log(err.stack);
  // });
  // gsjson({
  //   spreadsheetId: sheet_ID,
  //   hash : 'id' ,
  //   worksheet: ['敵人資料']
  // })
  // .then(function(result) {
  //   // console.log(result)
  //   socket.emit('push cat data',JSON.stringify(result));
  //   fs.writeFile('public/js/Enemydata.txt', JSON.stringify(result), (err) => {
  //     if (err) throw err;
  //     console.log('Enemydata is saved!');
  //   });
  // })
  // .catch(function(err) {
  //   console.log(err.message);
  //   console.log(err.stack);
  // });
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
res.sendFile(__dirname + '/index.html');
});
app.use(express.static(path.join(__dirname, '/')));// to import css and javascript
