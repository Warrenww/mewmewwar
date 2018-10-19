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
var database = firebase.database();

var ID = '1lGJC6mfH9E0D2bYNKVBz78He1QhLMUYNFSfASzaZE9A' ;
gsjson({
    spreadsheetId: ID,
    // hash : 'id' ,
    //propertyMode: 'pascal'
    worksheet: 1
    // other options...
})
.then(function (result) {
  // console.log(result);
  for(let i in result){
    console.log(result[i].id);
    result[i] = {
      id : result[i].id,
      catagory : result[i].catagory,
      name : result[i].name,
      effect : result[i].effect,
      amount : result[i].amount,
      cat : [result[i].cat_1,result[i].cat_2,result[i].cat_3,result[i].cat_4,result[i].cat_5]
    }
    database.ref("/combodata/"+result[i].id).update(result[i]);
    setTimeout(function () {
      process.exit();
    },2000);
  }
});
