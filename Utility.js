var Unitdata = require("./Unitdata");
var database = require("firebase").database();

exports.Sort = function (list,target=null,reverse=false) {
  return quickSort(list,target,reverse)
}

exports.AddZero = function (n,e=1) {
  var s = Number(n).toString();
  if(s == "NaN") return s
  if(n == 0) e--;
  for(let i = e; i >= 0; i--){
    if (n < 10**(i)) s = "0"+s;
    else return s
  }
  return s
}

exports.levelToValue = function (origin,rarity,lv) {
  var result,limit ;
  switch (rarity) {
    case 'R':
    limit = 70 ;
    break;
    case 'SR_alt':
    limit = 20 ;
    break;
    default:
    limit = 60 ;
  }
  result = (0.8+0.2*lv)*origin;
  if(lv>limit) result = result - 0.1*(lv-limit)*origin;
  if(lv>limit+20) result = result - 0.05*(lv-limit-20)*origin;
  return result
}

exports.GenerateUser = function (user,userdata) {
  let timer = new Date().getTime();
  let data = {
    name : user?user.displayName:"",
    nickname :user?user.displayName:"",
    first_login : timer,
    last_login : timer,
    history : {cat:"",enemy:"",combo:"",stage:""},
    compare : {cat2cat:"",cat2enemy:"",enemy2enemy:""},
    setting : {default_cat_lv:30},
    variable : {cat:"",enemy:"",stage:""},
    folder : {owned:""},
    Anonymous : user?user.isAnonymous:true
  }
  if(user.isAnonymous){
    var anonymous = Unitdata.catName();
    data.name = "匿名"+anonymous;
    data.nickname = "匿名"+anonymous;
  }
  userdata[user.uid] = data;
  database.ref('/user/'+user.uid).set(data) ;
  return data
}

exports.__handalError = function (e) {
  console.log(e);
  var time = new Date().getTime();
  database.ref("/error_log").push({
    time:time,
    message:e.message?e.message:"undefine",
    stack:e.stack?e.stack:"undefine"
  });
}

function quickSort(list,target=null,reverse=false) {
    var length = list.length;
    if (length <= 1) return list

    var pivot_index = Math.ceil(length/2),
        pivot = list[pivot_index],
        pivot_value = target?pivot[target]:pivot,
        smaller=[],
        bigger=[];

    for (let i = 0; i < length; i++){
      if (i == pivot_index) continue
      var compare_value = target?list[i][target]:list[i];
      if (compare_value > pivot_value) bigger.push(list[i]);
      else smaller.push(list[i]);
    }
    smaller = quickSort(smaller,target,reverse);
    bigger = quickSort(bigger,target,reverse);

    if(reverse) return bigger.concat([list[pivot_index]]).concat(smaller)
    else return smaller.concat([list[pivot_index]]).concat(bigger)
};
