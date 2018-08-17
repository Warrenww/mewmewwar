$(document).ready(function () {
  var today = new Date();
  var dailyEvent ;
  var socket = io.connect();
  var current_user_id;
  var catArr = ['貓','坦克貓','戰鬥貓','噁心貓','牛貓','鳥貓','魚貓','蜥蜴貓','巨人貓'];
  var Excat = [ {id:49,name:'女王貓'},{id:51,name:'三角褲貓'},{id:46,name:'功夫貓'},
                {id:48,name:'緊縛貓'},{id:54,name:'殭屍貓'},{id:57,name:'狂歡貓'},
                {id:55,name:'武士貓'},{id:50,name:'箱貓'},{id:53,name:'忍者貓'},
                {id:47,name:'Mr.'},{id:52,name:'輪輪貓'},{id:58,name:'短裙貓'},
                {id:56,name:'相撲貓'},{id:45,name:'女優貓'}]
  var xmlhttp = new XMLHttpRequest() ;

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    // console.log(data);
    current_user_id = data.uid;
  });

  xmlhttp.open("GET", "../public/calendar.json", true);
  xmlhttp.send();
  xmlhttp.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200){
      dailyEvent = JSON.parse(this.responseText) ;
      // console.log(dailyEvent);
      updateEvent();
    }
  }
  $("#next").click(function () {
    today = new Date(today.getTime()+86400000);
    updateEvent(today);
  });
  $("#prev").click(function () {
    today = new Date(today.getTime()-86400000);
    updateEvent(today);
  });

  function updateEvent(today=new Date()) {
    console.log(today);
    var mm = today.getMonth()+1,
        dd = today.getDate(),
        ww = today.getDay(),
        hh = today.getHours();
    ww = ww?ww:7;
    console.log(ww,dd,hh);
    if(hh>6)
    $("#dataTable tr").eq(hh-6).addClass("border")
    .siblings().removeClass("border");
    $("#month").text(AddZero(mm));
    $("#day").text(AddZero(dd));
    $("#week").text(parseWeek(ww));
    $("#alldayevent ul").empty();
    $("#dataTable tbody").find("td").empty();
    for(let i in dailyEvent[ww].allday){
      $("#alldayevent ul").append(
        "<li id='"+dailyEvent[ww].allday[i].id+"'>"+
        dailyEvent[ww].allday[i].name+
        "</li>"
      );
    }
    for(let i in dailyEvent[ww].hours){
      let data = dailyEvent[ww].hours[i];
      if(data.length){
        for(let j in data){
          $("#dataTable tbody").find("td").eq(i)
            .append("<span id='"+data[j].id+"'>"+data[j].name+"</span><br>")
        }
      } else {
        $("#dataTable tbody").find("td").eq(i).text("-")
      }
    }
    if(dd%3 == 1){
      let hippo = [0,4,9,1,5,10,6,12,13,14,15],
          target = $("#dataTable tbody").find("td").eq(hippo[Math.floor(dd/3)]);
      if(target.text() == '-') target.html("<span id='ticket-s01007-1'>逆襲的河馬將</span><br>");
      else target.append("<span id='ticket-s01007-1'>逆襲的河馬將</span><br>");
      $("#faceState span").eq(2).css("border","3px solid #e09400")
      .siblings().css("border",0);
    } else if(dd%3 == 2){
      $("#faceState span").eq(dd%2).css("border","3px solid #e09400")
      .siblings().css("border",0);
      let pos = Math.floor(dd/3);
      if(pos<9)
      $("#alldayevent ul").append("<li id='smallCat-s011"+(30+pos)+"-1'>開眼小小"+catArr[pos]+"來襲</li>")
    } else {
      $("#faceState span").eq(2).css("border","3px solid #e09400")
      .siblings().css("border",0);
      let pos = Math.floor(dd/3)-1;
      if(pos<9) $("#alldayevent ul").append(
        "<li id='crazy-s010"+(17+pos)+"-1'>狂亂"+catArr[pos]+"</li>"+
        "<li id='crazy-s011"+AddZero(2+pos)+"-1'>大狂亂"+catArr[pos]+"</li>");
    }
    var exPos = Math.ceil(dd/2)-1;
    for(let i=(dd%2?0:10);i<(dd%2?7:17);i++){
      let target = $("#dataTable tbody").find("td").eq(i);
      if(target.text() == '-')
      target.html("<span id='openeye-s010"+Excat[exPos].id+"-1'>開眼"+Excat[exPos].name+"襲來!</span><br>");
      else
      target.append("<span id='openeye-s010"+Excat[exPos].id+"-1'>開眼"+Excat[exPos].name+"襲來!</span><br>");
    }
    if([1,2,15,16].indexOf(dd)!=-1) $("#alldayevent ul").append("<li id='hard-s01119-1'>女帝飛來</li>");
    if([3,4,17,18].indexOf(dd)!=-1) $("#alldayevent ul").append("<li id='hard-s01128-1'>亡者肥普降臨</li>");
    if([5,6,19,20].indexOf(dd)!=-1)
    $("#alldayevent ul").append(
      "<li id='hard-s01158-1'>吉娃娃伯爵降臨</li>"+
      "<li id='hard-s01111-1'>禍不單行</li>");
    if([7,8,21,22].indexOf(dd)!=-1) $("#alldayevent ul").append("<li id='hard-s01095-1'>斷罪天使海蝶降臨</li>");
    if([9,10,23,24].indexOf(dd)!=-1) $("#alldayevent ul").append("<li id='hard-s01114-1'>超尖端科技</li>");
    if([11,12,25,26].indexOf(dd)!=-1) $("#alldayevent ul").append("<li id='hard-s01117-1'>地獄門</li>");
    if([13,14,27,28].indexOf(dd)!=-1) $("#alldayevent ul").append("<li id='hard-s01112-1'>神判日</li>");
    if(dd==2||dd==22)
    $("#alldayevent ul").append("<li id='openeye-s01148-1' style='color:#d53f3f'>開眼的花盆貓襲来！(14:22~14:24開放)</li>");
  }
  $(document).on("click",'#alldayevent li,#ticket-s01078-1,#dataTable span,#nightEvent .stage',function () {
    var arr = $(this).attr('id').split("-");
    socket.emit("required level data",{
      uid:current_user_id,
      chapter:arr[0],
      stage:arr[1],
      level:arr[2]
    });
    window.parent.reloadIframe('stage');
    window.parent.changeIframe('stage');
  });
  $(".calendar").click(function () {
    updateEvent();
    today = new Date();
  });


});
function parseWeek(n) {
  var arr = ["Mon.","Tue.","Wed.","Thu.","Fri.","Sat.","Sun"];
  return arr[n-1]
}
