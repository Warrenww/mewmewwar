var treasureData;
var CurrentUserID;
var xmlhttp = new XMLHttpRequest() ;

xmlhttp.open("GET", "./data/treasure.json", true);
xmlhttp.send();
xmlhttp.onreadystatechange = function(){
  if (this.readyState == 4 && this.status == 200){
    treasureData = JSON.parse(this.responseText) ;
    // console.log(treasureData);
    for(let stage in treasureData){
      let array = treasureData[stage],tbContent = "<tr>";
      for(let j in array){
        let temp = array[j],
            treasure = "";
        for(let k=0;k<8;k++){
          if(temp.treasure[k])
            treasure +=
              ` <div stage='${temp.treasure[k].stage}' type='2'><span></span>
                <span class='toggle_next'offsetY='24'>${temp.treasure[k].name}</span><div class='panel'></div></div>`
          else
            treasure += `<div type='3'><span></span><span></span></div>`
        }

        tbContent +=
          ` <td class='img' rowspan='2'><div style='background-image:url("css/footage/treasure/${stage}_${j}.png")'>
            </div></td><th colspan='1'>${temp.name}</th><td class='level'>100% 發動</td></tr><tr><td colspan='2'>
            <div>${temp.text}</div><div org='${JSON.stringify(temp.effect).split(">").join("")}'>${temp.effect.join("")}</div></td></tr><tr><td colspan='3'>
            <div class='treasure' total='${temp.treasure.length*3}' current='${temp.treasure.length*3}'>${treasure}</div></td></tr>`
      }
      $("#"+stage).empty();
      $("#"+stage).append(tbContent);
    }
    if(location.search){ search(decodeURI(location.search.substring(1))); }
  }
}

$(document).on("click",".treasure div span:first-of-type",function () {
  var temp = $(this).parent().attr("type"),
      delta = Number(temp),
      total = Number($(this).parents(".treasure").attr('total')),
      current = Number($(this).parents(".treasure").attr('current')),
      effect = $(this).parents("tr").prev().find("div[org]").eq(0);
  if(temp == 3) return;
  temp = (temp+1)%3;
  current += (temp - delta);
  $(this).parent().attr("type",temp);
  $(this).parents(".treasure").attr('current',current);
  current /= total;
  var org = JSON.parse(effect.attr("org"));
  org = org.map(x => {return Number.isNaN(Number(x))?x:(Number(x)*current).toFixed(0)});
  effect.text(org.join(""));
  current *= 100;
  $(this).parents("tr").prev().prev().find(".level").text(current.toFixed(0)+"% 發動");
});
$(document).ready(function () {
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",(data)=>{
    console.log(data);
    CurrentUserID = data.uid;
    var map = data.data,list = ['world','future','universe'];
    for(let chapter in map){
      var target = $("#"+chapter),
          array = map[chapter];
      for(let j in array){
        let temp = array[j];
        target.find("div[stage='"+temp.id+"'] .panel").empty().append(
          ` <div class='card' name='${temp.name}' style="background-image:url('${image_url_stage+temp.bg}.png')"></div>
            <div url='s0300${list.indexOf(chapter)*3+0}-${temp.id}'>第一章</div>
            <div url='s0300${list.indexOf(chapter)*3+1}-${temp.id}'>第二章</div>
            <div url='s0300${list.indexOf(chapter)*3+2}-${temp.id}'>第三章</div>`
        );
      }
    }
  });
  $(document).on("click",".toggle_next",function (e) {
    var pos = $(this).offset().top,
        bodyPos = document.body.scrollTop;
    $(this).next().bind("wheel",noWheel);
    console.log(pos,bodyPos)
    if(pos - bodyPos > 500) $(this).next().css('top','-=210')
  });
  var noWheel = function (e) { return false; }
  $(document).on("click",".panel div:not(:first-of-type)",function () {
    var url = $(this).attr("url");
    socket.emit("cat to stage",{
      uid : CurrentUserID,
      stage : url
    });
    $("#panelBG").click();
  });
  socket.on("cat to stage",function (data) {
    // console.log(data);
    if(data.find) switchIframe("stage");
    else window.open('https://battlecats-db.com/stage/'+data.stage+'.html',"_blank");
  });
  $("#search").click(search);
  $(".displayControl input").keypress(function (e) {
    if(e.keyCode === 13 || e.key == "Enter") search();
  });
  $(".displayControl input").focus(searchClose);
});
var searchResultPtr = 0;
function search(key = null) {
  if(key == null) key = $(".displayControl input").val();
  if(key.trim() == "" || key == undefined || key == null) return;
  $(".displayControl input").val(key);
  var count = 0;
  $("th,td").each(function () {
    if($(this).text().indexOf(key)!=-1){
      $(this).addClass("found");
        count ++;
      }
  });
  if($(".found").length == 0) return;
  $('html,body').animate(
    {scrollTop: $('.found').eq(0).offset().top-window.innerHeight/2},
  400,'easeInOutCubic');
  $(".search .nav").attr('active',1);
  searchResultPtr = 0;
}
function searchNext(n=1) {
   searchResultPtr += n;
   if(searchResultPtr < 0) searchResultPtr = 0;
   if(searchResultPtr >= $(".found").length) searchResultPtr = $(".found").length-1;
   $('html,body').animate(
     {scrollTop: $('.found').eq(searchResultPtr).offset().top-window.innerHeight/2},
   400,'easeInOutCubic');
}
function searchClose() {
  $(".found").removeClass("found");
  $(".displayControl input").val("");
  $(".search .nav").attr('active',0);
}
