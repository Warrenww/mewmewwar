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
    enemydata ;
database.ref("/").once("value",function (snapshot) {
  catdata = snapshot.val().catdata ;
  combodata = snapshot.val().combodata ;
  enemydata = snapshot.val().enemydata ;
  console.log('all data load complete!!') ;
});


io.on('connection', function(socket){
  console.log('a user connected');
  // loadcatData() ;

  socket.on("search cat",function (data) {
        console.log("searching cat....");
        console.log(data);
        let rFilter = data.rFilter,
            cFilter = data.cFilter,
            aFilter = data.aFilter,
            otherFilter = data.filterObj,
            buffer_1 = [],
            buffer_2 = [];

        if(cFilter.length != 0){
          for(let i in catdata){
            for(let j in cFilter){
              if(catdata[i].tag == '[無]') break;
              else if(catdata[i].tag.indexOf(cFilter[j]) != -1) {
                buffer_1.push(catdata[i]);
                break;
              }
            }
          }
        }
        else buffer_1 = catdata ;
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
  socket.on("display cat",function (id) {
    let grossID = id.substring(0,3),
        result = {"this":"","bro":[],"combo":[]} ;
    console.log("client requir "+grossID+"'s data'");
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
  socket.on("text search cat",function (key) {
    console.log("Text Search : "+key);
    let buffer = [] ;
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
    // console.log(buffer);
    socket.emit("search result",buffer);
  });
  socket.on("user login",function (user) {
    console.log(user.uid+" user login");
    let exist = false;
    var timer = new Date().getTime();
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
          first_login: timer
        }
        database.ref('/user/'+user.uid).set(data) ;
      }
    });

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
      console.log(data);
      let buffer = [];
      for (let i in data) buffer.push(catdata[data[i].id].全名);
      console.log(buffer);
      socket.emit("return history",buffer);
    });
  });

  socket.on('connet', (data,callback) => {
    console.log('connnnnnnet '+data);
    socket.emit('connet');
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
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
    database.ref("/catdata").set(result[0]) ;
    database.ref("/combodata").set(obj) ;
    database.ref("/enemydata").set(result[2]) ;
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
