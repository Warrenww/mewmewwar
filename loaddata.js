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
  worksheet: ['貓咪資料','聯組','敵人資料']
})
.then(function(result) {
  console.log("download complete!!");
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
  var count = 0;
  for(let i in result[0]){
    process.stdout.clearLine();  // clear current text
    process.stdout.cursorTo(0);  // move cursor to beginning of line
    process.stdout.write("loading cat data "+i);  // write text
    database.ref("/catdata/"+i).update(result[0][i]) ;
  }
  database.ref("/combodata").update(obj) ;
  database.ref("/enemydata").update(result[2]) ;
  // fs.writeFile('public/js/Catdata.txt', JSON.stringify(result[0]), (err) => {
  //   if (err) throw err;
  //   console.log('Catdata is saved!');
  // });
  // fs.writeFile('public/js/Combodata.txt', JSON.stringify(obj), (err) => {
  //   if (err) throw err;
  //   console.log('Combodata is saved!');
  // });
  // fs.writeFile('public/js/Enemydata.txt', JSON.stringify(result[2]), (err) => {
  //   if (err) throw err;
  //   console.log('Enemydata is saved!');
  // });
  console.log("all data save to firebase");
})
.catch(function(err) {
  console.log(err.message);
  console.log(err.stack);
});
