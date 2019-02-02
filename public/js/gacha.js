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
  var r = sr = ssr = sssr = 0 ;
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
    sssr = ssr = sr = r = 0 ;
    socket.emit("record gacha",{
      uid:CurrentUserID,
      gacha:name
    });
  });

  $(document).on("click",".title",function () {
    $(this).next().toggle(400);
    $(this).siblings('.title').next().hide(400);
  });

  $(document).on('click','.monitor .content img',function () {
    let id = $(".monitor").attr("id");
    if(!id) {alert("尚未選擇轉蛋");showhideNav(null,0);}
    else $(".iframe_holder").fadeIn()
            .append("<iframe src='"+gacha_url+id+".html'>")
            .css("display",'flex');
  });
  $(".iframe_holder").click(function () { $(this).empty().fadeOut(); });

  $(document).on('click','#once',function () {gacha(1);});
  $(document).on('click','#elevent',function () {gacha(11);});

  $(".slider").slider({max:1,min:0,step:0.01});
  $(".slider").on("slide", function(e,ui) {
    $(this).next().text((ui.value*100).toFixed(0)+"%");
  });
  var originValue;
  $(".slider").on("slidestart", function(e,ui) {
    originValue = ui.value;
  });
  $(".slider").on("slidestop", function(e,ui) {
    originValue -= ui.value;
    let next = $(this).parent(),temp;
    while(originValue > 1e-6 || originValue < -1e-6){
      next = next.next("div:visible");
      if(next.length == 0) next = $("#probability div:first");
      temp = next.find(".slider").slider("value");
      if(temp+originValue > 0){
        next.find(".slider").slider("value",temp+originValue).next()
          .text(((temp+originValue)*100).toFixed(1)+"%");
        originValue = 0;
      } else {
        next.find(".slider").slider("value",0).next().text("0%");
        originValue += temp;
      }
    }
    var accu = 0;
    for(let i=0;i<4;i++){
      accu += $("#probability div .slider").eq(i).slider("value");
      GachaProbability[i] = accu;
    }

  });
  $("#probability button").click(function () {
    if(current_gacha_data.sssr) GachaProbability = DefaultProbability.map(x=>{return x-0.003});
    else GachaProbability = DefaultProbability.map(x=>{return x});
    var zero = 0;
    for(let i in GachaProbability){
      $("#probability div .slider").eq(i).slider("value",GachaProbability[i]-zero)
        .next().text(((GachaProbability[i]-zero)*100).toFixed(1)+"%");
      zero = GachaProbability[i];
    }
    $("#probability div .slider").eq(3).slider("value",1-zero)
      .next().text(((1-zero)*100).toFixed(1)+"%");
  });
  $("#scoreboard h3").click(function () { $(this).next().toggle(); })
  $("#toggleScore").click(function () {
    $("#scoreboard").toggle(400);
    if(Storage){
      var temp = localStorage.gachaScoreBoard;
      temp = temp == "true"?false:true;
      localStorage.gachaScoreBoard = temp;
    } else {console.log("Browser don't support localStorage");}
  });
  const DefaultProbability = [0.7,0.95,1];
  var GachaProbability = [0.7,0.95,1];
  socket.on("gacha result",function (data) {
    console.log(data);
    data = data.result;
    current_gacha_data = data;
    $(".monitor").attr({'id':data.id,'key':data.key});
    if(data.sssr) {
      GachaProbability = DefaultProbability.map(x=>{return x-0.003});
      $("#probability div").eq(3).show();
    } else {
      GachaProbability = DefaultProbability.map(x=>{return x});
      $("#probability div").eq(3).hide();
    }

    if(data.key == "special_cat" || data.key == "super_cat"){
      GachaProbability[0] = 0.61 ;
      GachaProbability[1] = 0.91 ;
    }
    if(data.key == "platinum") GachaProbability = [-1,-1,1];
    var zero = 0;
    for(let i in GachaProbability){
      $("#probability div .slider").eq(i).slider("value",GachaProbability[i]-zero)
        .next().text(((GachaProbability[i]-zero)*100).toFixed(1)+"%");
      zero = GachaProbability[i];
    }
    $("#probability div .slider").eq(3).slider("value",1-zero)
      .next().text(((1-zero)*100).toFixed(1)+"%");

  });
  function gacha(n) {
    let data=[],
        key = $(".monitor").attr('key');

    if(!key){alert("尚未選擇轉蛋");showhideNav(null,0);return}
    showhideNav(null,1);
    for(let i=0;i<n;i++){
      let result = Math.random();
      if(result<GachaProbability[0]) {data.push("r");r++;}
      else if(GachaProbability[0]<=result&&result<GachaProbability[1]) {data.push("sr");sr++;}
      else if(GachaProbability[1]<=result&&result<GachaProbability[2]){data.push("ssr");ssr++;}
      else if(GachaProbability[2]<=result) {data.push("sssr");sssr++;}
    }

    for(let i in data){
      let rarity = data[i],
          buffer = current_gacha_data[rarity],
          choose = buffer[Math.floor((Math.random()*buffer.length))];
      $("#result").append('<span class="card cat" value="'+
      choose.id+'" rarity="'+rarity+'" '+
       'style="background-image:url('+
       Unit.imageURL('cat',choose.id)+');'+
       "margin:5px;transform:scale(0);"+
       '"name="'+choose.name+'"></span>');
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

    if(africa <= 0.01 && sssr == 0) $("#www").text("非洲大酋長");
    else if(africa<0.04 && sssr == 0) $("#www").text("非洲土著");
    else if(africa>0.09 || sssr != 0) $("#www").text("歐皇");
    else if(africa>0.06 && sssr == 0) $("#www").text("歐洲人");
    else $("#www").text("普通人");

    socket.emit("gacha history",{
      uid:CurrentUserID,
      gacha:current_gacha_data.key,
      sssr,ssr,sr,r
    });
  }
  $(".monitor,#scoreboard").click(()=>{showhideNav(null,1)})
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
