var database = require("firebase").database();
var admin = require("firebase-admin");
var Util = require("./Utility");

exports.load = function (userdata) {
  console.log("Module start user data.");

  database.ref("/user").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      userdata[i] = temp[i];
    }
    console.log("Module load cat data complete!");
    arrangeUserData(userdata);
  });
}

function arrangeUserData(userdata) {
  console.log('arrange user data');
  let count = 0,
      timer = new Date().getTime();
  for(let i in userdata){
    if(i == undefined|| i == "undefined"){
      console.log("remove "+i);
      database.ref('/user/'+i).remove();
      continue
    }
    if(userdata[i].Anonymous){
      if((timer - userdata[i].last_login)>5*86400000) {
        console.log("remove "+i+" since didn't login for 5 days");
        database.ref('/user/'+i).remove();
        admin.auth().deleteUser(i)
        .then(function() { console.log("Successfully deleted user"); })
        .catch(function(error) { console.log("Error deleting user:", error); });
        continue
      }
    }
    if(userdata[i].first_login == undefined){
      console.log(i+" unknown first login");
      var user = {uid:i,isAnonymous:true};
      Util.GenerateUser(user,userdata);
      continue
    }
    count ++ ;
    var arr=[],edit = ['cat','enemy','combo','stage','gacha'];
    for(let j in edit){
      for(let k in userdata[i].history[edit[j]]) arr.push(k);
      if (arr.length > 40){
        console.log(i+" too many "+edit[j]);
        arr = arr.slice(0,arr.length-40);
        for(let k in arr) database.ref('/user/'+i+"/history/"+edit[j]+"/"+arr[k]).remove();
      }
      arr = [];
    }
    if(!userdata[i].variable) {
      console.log("user "+i+" no variable");
      database.ref('/user/'+i+"/variable").set({cat:"",enemy:"",stage:""});
    }
  }
  console.log("there are "+count+" users!!");
}
