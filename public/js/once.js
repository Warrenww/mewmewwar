$(document).ready(function () {
  var socket = io.connect();
  var search = location.search.split("?q=")[1].split("&");
  var login = false ;
  console.log(search);
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user name",user.uid);
      console.log('user login');
      login = true ;
    } else {
      console.log('did not sign in');
    }
  });
  $("nav,.m_nav_panel").remove();
  if(search[0] == 'cat'){
    socket.emit("display cat",{
      uid : "",
      cat : search[1]
    });
  } else if(search[0] == 'enemy'){
    socket.emit("display enemy",search[1]);
  } else {
    location.assign("/");
  }
  socket.on("display cat result",function (result) {
    console.log("recive cat data,starting display") ;
    console.log(result) ;
    let data = result.this,
        arr = result.bro,
        brr = result.combo;
    if (!data || search[2]>100 || search[2]<1) {
      alert("錯誤值");
      location.assign("/");
    }
    displayCatData(data,arr,brr,search[2],result.count) ;
  });
  function displayCatData(data,arr,brr,lv,count) {
    let html = "",
        id = data.id,
        grossID = id.substring(0,3);
    // "<tr><th>Id</th><td id='id'>"+data.id+"</td></tr>"

    html += "<tr><td colspan = 4 style='background-color:transparent'></td>"+
            "<td colspan=2 id='link'><a target='blank' href='http://battlecats-db.com/unit/"+
            grossID+".html'>在超絕攻略網打開<i class='material-icons'>insert_link</i></a></td></tr>";
    html += displayCatHtml(data,arr,brr,lv,count);

    $(".dataTable").empty();
    $(".dataTable").attr('id',data.id).append(html);
    $(".dataTable .level").remove();
    $(".dataTable #level_num").text(lv).parent().attr("colspan",'5').bind('click',function () {
      return false
    });
    $('.card,td[id!=link]').bind("click",function () {
      return false
    });
  }
  socket.on('display enemy result',function (data) {
    data.lv = search[2]/100 ;
    displayEnemyData(data) ;
  });
  function displayEnemyData(data) {
    let html = "" ;
    html += displayenemyHtml(data)
    $(".dataTable").empty();
    $(".dataTable").append(html);
    scroll_to_class("display",0) ;
    $(".dataTable #level_num button").remove();
    $('.card,td[id!=link]').bind("click",function () {
      return false
    });
  }
  scroll_to_class("display",0) ;


});
function decode(str) {
  let code = [];
  for (let i in str){
    code.push(str.charCodeAt(i))
  }
  // console.log(code);
  let output=[]
  for(let i in code){
    code[i] -= 8;
    output.push(String.fromCharCode(code[i]));
  }
  return (output.join(''));
}
