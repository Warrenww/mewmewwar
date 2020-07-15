var medalData;
var CurrentUserID;
var xmlhttp = new XMLHttpRequest() ;

xmlhttp.open("GET", "./data/medal.json", true);
xmlhttp.send();
xmlhttp.onreadystatechange = function(){
  if (this.readyState == 4 && this.status == 200){
    medalData = JSON.parse(this.responseText) ;
    // console.log(medalData);
    $("table tbody").empty();
    medalData.map((temp,index) => {
      let tbContent =
        ` <tr grade=${temp.grade}>
            <td class='img'><div style='background-image:url("css/footage/medal/medal_${index}.png")'> </div></td>
            <th>${temp.name}</th>
            <td><div>${temp.condition}</div></td>
          </tr>`
      $("table tbody").append(tbContent);
    });
    // if(location.search){ search(decodeURI(location.search.substring(1))); }
  }
}


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

$(".displayControl .position span").click((e) => {
  $(e.target).attr("active",Number(!Number($(e.target).attr("active"))));
  $("table tr").each(function(){
    if($(`.displayControl .position span[data-grade="${$(this).attr("grade")}"]`).attr("active") == 1) $(this).show();
    else $(this).hide();
  })

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
