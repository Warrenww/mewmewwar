var request = require("request");
var cheerio = require("cheerio");
var fs = require('fs');
var firebase = require("firebase");
var config = {
    apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
    authDomain: "battlecat-smart.firebaseapp.com",
    databaseURL: "https://battlecat-smart.firebaseio.com",
    projectId: "battlecat-smart",
    storageBucket: "battlecat-smart.appspot.com",
    messagingSenderId: "268279710428"
  };
var gsjson = require('google-spreadsheet-to-json');
var userdata;
var catdata;
firebase.initializeApp(config);
var database = firebase.database();
console.log('start');
var stdin = process.openStdin();


// database.ref("/newCatData").once("value",function (snapshot) {
//   console.log('load complete');
//   catdata = snapshot.val();
//   let exist = '000',current,data='';
//   for(let i in catdata){
//     console.log(i);
//     current = i.substring(0,3);
//     if(current == exist){
//       if(catdata[i].name) data += ',"'+catdata[i].name+'"'
//       if(catdata[i].statistic)
//         for(let j in catdata[i].statistic.nickname){
//           data += ',"'+catdata[i].statistic.nickname[j].nickname+'"'
//         }
//     }
//     else {
//       exist = current;
//       data += '\r\n"'+current+'","'+current+'","'+catdata[i].jp_name+'"'
//       if(catdata[i].name) data += ',"'+catdata[i].name+'"';
//       if(catdata[i].statistic)
//         for(let j in catdata[i].statistic.nickname){
//           data += ',"'+catdata[i].statistic.nickname[j].nickname+'"'
//         }
//     }
//   }
//   fs.appendFile('cat.txt', data,(err) =>{
//     if (err) throw err;
//     console.log('Is saved!');
//     process.exit();
//   });
// });

// database.ref('/user').once("value",function (snapshot) {
//   console.log('finish');
// });

// function getthewww(i) {
//   // console.log(AddZero(i));
//   request({
//     url: "http://battlecats-db.com/unit/"+AddZero(i)+".html",
//     method: "GET"
//   },function (e,r,b) {
//     if(!e){
//       $ = cheerio.load(b);
//       let j = 1;
//       $("tr").each(function () {
//         let stage = $(this).children("td").eq(0).text();
//         let name = $(this).children("td").eq(1).text();
//         // console.log(stage+":"+name);
//         if(stage == '開放条件'){
//           let id = AddZero(i)+"-"+j;
//           process.stdout.clearLine();
//           process.stdout.cursorTo(0);
//           process.stdout.write("loading cat data "+id+"---");
//           process.stdout.write((Number(i)/384*100).toFixed(2).toString());
//           process.stdout.write("%");
//           // console.log(id,parseCondition(name,id));
//           database.ref("/catdata/"+id+"/get_method").set(parseCondition(name,id));
//           j++
//         }
//         // console.log("/stagedata/story/s000"+(AddZero(stage[0])-1)+"/"+stage[1]);
//       });
//       i++;
//       if(i<384) getthewww(i)
//
//     } else {console.log(e);}
//   });
//
// }
function AddZero(n) {
  return n>99 ? n : (n>9 ? "0"+n : "00"+n)
}


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
    database.ref("/combodata/"+result[i].id).set(result[i]);
  }
});
