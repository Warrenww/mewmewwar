var firebase = require("firebase");
var config = {
    apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
    authDomain: "battlecat-smart.firebaseapp.com",
    databaseURL: "https://battlecat-smart.firebaseio.com",
    projectId: "battlecat-smart",
    storageBucket: "battlecat-smart.appspot.com",
    messagingSenderId: "268279710428"
  };
var userdata;
  firebase.initializeApp(config);
  var database = firebase.database();
  database.ref("/user").once("value",function (snapshot) {
    console.log('loading') ;
    userdata = snapshot.val() ;
    // console.log(userdata);
    console.log('load complete') ;
    let buffer = {} ;

    for(let i in userdata){
      // console.log(userdata[i]);
      let obj = {
        name : userdata[i].name,
        last_login : userdata[i].last_login,
        first_login : userdata[i].first_login,
        compare : userdata[i].compare,
        history : {cat:{},enemy:{},combo:{}}
      } ;

      let history = userdata[i].history;
      // console.log(history);
      for(let j in history){
        // console.log(history[j].type);
        // console.log(history[j]);
        if(history[j].type == 'cat') obj.history.cat[j]=history[j];
        if(history[j].type == 'enemy') obj.history.enemy[j]=history[j];
        if(history[j].type == 'combo') obj.history.combo[j]=history[j];
      }
      buffer[i] = obj ;
      console.log(obj);
    }
    database.ref('/user').set(buffer);
  });
