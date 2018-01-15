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
  var database = firebase.database();

console.log("download data from google sheet!!");
gsjson({
  spreadsheetId: sheet_ID,
  hash : 'id',
  worksheet: ['聯組']
})
.then(function(result) {
  console.log("download complete!!");
  var obj = {} ;
  for(let i in result[0]){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(result[0][i].id);
    var bufferobj = {
      id : result[0][i].id,
      catagory : result[0][i].catagory,
      name : result[0][i].name,
      effect : result[0][i].effect,
      amount : result[0][i].amount,
      cat : [result[0][i].cat_1,result[0][i].cat_2,result[0][i].cat_3,result[0][i].cat_4,result[0][i].cat_5]
    } ;
    obj[i] = bufferobj;
  }
  database.ref("/combodata").update(obj) ;

  console.log("\nall data save to firebase");
  setTimeout(function () {
        process.exit()
  },2000);
})
.catch(function(err) {
  console.log(err.message);
  console.log(err.stack);
});
