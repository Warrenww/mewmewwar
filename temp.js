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
var catdata;
firebase.initializeApp(config);
var database = firebase.database();
database.ref("/catdata").once("value",function (snapshot) {
  catdata = snapshot.val();
});
database.ref("/user").once("value",function (snapshot) {
  console.log('loading') ;
  userdata = snapshot.val() ;
  // console.log(userdata);
  console.log('load complete') ;
  let buffer = {} ;
  let current = ''
  for(let i in userdata){
    database.ref('/user/'+i+'/setting/show_cat_count').set(0);

  }
});