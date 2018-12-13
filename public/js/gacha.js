var CurrentUserID;
if(Storage){
  if(localStorage.gachaScoreBoard == "true"){
    $("#toggleScore").attr('value',1);
    $("#scoreboard").show();
  } else {
    $("#toggleScore").attr('value',0);
    $("#scoreboard").hide();
  }
}
$(document).ready(function () {
  var gacha_url = 'https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/gacha/rare/tw/'
  var r = sr = ssr = 0 ;
  var current_gacha_data;


  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    // console.log(data);
    CurrentUserID = data.uid ;
    if(data.last_gacha)
      $(".tag[name='"+data.last_gacha+"']").click();
  });

  var nav_expand = 1 ;
  $(document).on('click','#nav_tag',showhideNav);

  var expand = 0 ;
  $(document).on("click",'.tag',function () {
    let name = $(this).attr("name"),
        target = name;
    $(".monitor .content img").attr('src','./css/footage/gacha/'+name+".png");
    $(this).attr("value",1).siblings(".tag").attr("value",0)
      .parent().siblings().find(".tag").attr("value",0);
    $("#result").empty();
    $("#scoreboard").children("h2").text($(this).text())
      .parent().find("td").empty();
    ssr = sr = r = 0 ;
    socket.emit("record gacha",{
      uid:CurrentUserID,
      gacha:name
    });
  });
  socket.on("gacha result",function (data) {
    data = data.result;
    current_gacha_data = data;
    $(".monitor").attr({'id':data.id,'key':data.key});
  });

  $(document).on("click",".title",function () {
    $(this).next().toggle(400);
    $(this).siblings('.title').next().hide(400);
  });

  $(document).on('click','#info,.monitor .content img',function () {
    let id = $(".monitor").attr("id");
    if(!id) {alert("尚未選擇轉蛋");showhideNav(null,0);}
    else $(".iframe_holder").fadeIn()
            .append("<iframe src='"+gacha_url+id+".html'>")
            .css("display",'flex');
  });
  $(".iframe_holder").click(function () { $(this).empty().fadeOut(); });

  $(document).on('click','#once',function () {gacha(1);});
  $(document).on('click','#elevent',function () {gacha(11);});

  $("#toggleScore").click(function () {
    $("#scoreboard").toggle(400);
    if(Storage){
      var temp = localStorage.gachaScoreBoard;
      temp = temp == "true"?false:true;
      localStorage.gachaScoreBoard = temp;
    } else {console.log("Browser don't support localStorage");}
  });

  function gacha(n) {
    let data=[],
        key = $(".monitor").attr('key'),
        c = [0.05,0.3];

    if(!key){alert("尚未選擇轉蛋");showhideNav(null,0);return}
    showhideNav(null,1);
    if(key == "special_cat" || key == "super_cat") c = [0.09,0.39] ;
    for(let i=0;i<n;i++){
      let result = Math.random();
      if(result<c[0]||key == "platinum") {data.push("ssr");ssr++;}
      else if(c[0]<result&&result<c[1]) {data.push("sr");sr++;}
      else if(c[1]<result) {data.push("r");r++;}
    }
    var color = { "ssr":"#f14747", "sr":"#e7b83f", "r":"#8bd61f" }
    for(let i in data){
      let rarity = data[i],
          buffer = current_gacha_data[rarity],
          choose = buffer[Math.floor((Math.random()*buffer.length))];
      $("#result").append('<span class="card cat" value="'+
      choose.id+'" rarity="'+rarity+'" '+
       'style="background-image:url('+
       image_url_cat+choose.id+'.png);'+
       "margin:5px;transform:scale(0);"+
       "border-color:"+color[rarity]+
       '" name="'+choose.name+'"></span>');
    }
    setTimeout(function () {
      $("#result").find("span").css("transform","scale(1)").fadeIn();
      $("#scoreboard tbody tr").attr("val",0);
    },100);
    $('.content').animate({
      scrollTop : $('.content')[0].scrollHeight
    },1000,"easeInOutCubic");
    let total = r+sr+ssr,africa = ssr/total;
    $("#scoreboard").find("#r").children(".number")
      .text(r).next().text((r/total*100).toFixed(0)+"%");
    $("#scoreboard").find("#sr").children(".number")
      .text(sr).next().text((sr/total*100).toFixed(0)+"%");
    $("#scoreboard").find("#ssr").children(".number")
      .text(ssr).next().text((ssr/total*100).toFixed(0)+"%");
    $("#scoreboard").find("#total").text(total).next().text("100%");

    if(africa <= 0.01) $("#www").text("非洲大酋長");
    else if(africa<0.04) $("#www").text("非洲土著");
    else if(africa>0.09) $("#www").text("歐皇");
    else if(africa>0.06) $("#www").text("歐洲人");
    else $("#www").text("普通人");

    socket.emit("gacha history",{
      uid:CurrentUserID,
      gacha:current_gacha_data.key,
      ssr,sr,r
    });
  }
  function showhideNav(e,n) {
    if(n == undefined)
      nav_expand = nav_expand?0:1;
    else nav_expand = n ;
    let dist = screen.width>768?350:250;
    $(".navigation").css("left",function () {
      if(nav_expand) return -dist
      else return 0
    });
    $("#nav_tag").css('left',function () {
      if(nav_expand) return 0
      else return dist
    }).children("i").css('transform',function(){
      if(nav_expand) return 'rotate(0deg)'
      else return 'rotate(-180deg)'
    });
  }
  $("#scoreboard tbody tr").click(function () {
    let id = $(this).attr("id"),val = Number($(this).attr("val"));
    if(!id) return
    $("#result").children().each(function () {
      $(this).fadeIn(100);
    });
    val = val?0:1;
    // console.log(id,val);
    if(val){
      $("#result").children("span[rarity!="+id+"]").each(function () {
        $(this).fadeOut(100);
      });
    }
    $(this).attr("val",val).siblings().attr("val",!val);
  });

  $(document).on('click','#nav_tag',showhideselectchap);
  function showhideselectchap() {
    let dist = screen.width>768?350:250;
    if(!nav_expand){
      $('.select_chapter_holder').css('left',0);
      $('#nav_tag').css('left',dist).children('i').css({"transform":"rotate(180deg)"});
    } else {
      $('.select_chapter_holder').css('left',-dist);
      $('#nav_tag').css('left',0).children('i').css({"transform":"rotate(0deg)"});
    }
  }

});
