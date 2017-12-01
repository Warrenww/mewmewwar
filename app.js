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

var catdata ;
database.ref("/catdata").once("value",function (snapshot) {
  catdata = snapshot.val() ;
  // console.log(catdata);
});


io.on('connection', function(socket){
  console.log('a user connected');
  fs.stat('public/js/Catdata.txt', function(err,stats){
    var mtime = Date.parse(stats.mtime),
        today = Date.now();
    timepass = today - mtime ;
    console.log(timepass);
    if(timepass > 86400000) loadcatData()
  });

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
        for(let i in buffer_2) console.log(buffer_2[i].全名) ;
        for(let i in buffer_2) {
          let obj = {
              id : buffer_2[i].id,
              name : buffer_2[i].全名
              }
          buffer_1.push(obj) ;
        }

        socket.emit("search result",buffer_1);

  });

  socket.on('force_update_cat_data', (data,callback) =>{
    console.log('Someone force me to load cat data ...QAQ') ;
    loadcatData() ;
  });
  socket.on('connet', (data,callback) => {
    console.log('connnnnnnet '+data);
    socket.emit('connet');
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  firebase.auth().onAuthStateChanged(function(user) {
    var currentUser = firebase.auth().currentUser;
    console.log(user);

  });



});

function loadcatData(data) {

  let cat = [] ;
  gsjson({
    spreadsheetId: sheet_ID,
    // worksheet: ['貓咪資料']
    hash : 'id'
  })
  .then(function(result) {
    // console.log(result)
    socket.emit('push cat data',JSON.stringify(result));
    fs.writeFile('public/js/Catdata.txt', JSON.stringify(result), (err) => {
      if (err) throw err;
      console.log('Catdata is saved!');
    });
  })
  .catch(function(err) {
    console.log(err.message);
    console.log(err.stack);
  });
  gsjson({
    spreadsheetId: sheet_ID,
    hash : 'id' ,
    worksheet: ['聯組']
  })
  .then(function(result) {
    // console.log(result)
    socket.emit('push cat data',JSON.stringify(result));
    fs.writeFile('public/js/Combo.txt', JSON.stringify(result), (err) => {
      if (err) throw err;
      console.log('Combo is saved!');
    });
  })
  .catch(function(err) {
    console.log(err.message);
    console.log(err.stack);
  });
  gsjson({
    spreadsheetId: sheet_ID,
    hash : 'id' ,
    worksheet: ['敵人資料']
  })
  .then(function(result) {
    // console.log(result)
    socket.emit('push cat data',JSON.stringify(result));
    fs.writeFile('public/js/Enemydata.txt', JSON.stringify(result), (err) => {
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
res.sendFile(__dirname + '/index.html');
});
app.use(express.static(path.join(__dirname, '/')));// to import css and javascript
