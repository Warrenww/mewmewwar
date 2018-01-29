$(document).ready(function () {
  var socket = io.connect();
  var rank_data;
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };
  var gacha_url = 'https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/gacha/rare/tw/'

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",user);
    } else {
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
  });
  $(".tag").each(function () {
    if($(this).attr("id")!='monitor'){
      $(this).append("<span id='search'>篩選</span>");
    }
  });
  $(document).on("click",'.tag span',function (e) {
    e.stopPropagation();
    let id = $(this).parent().attr('id');
    socket.emit("search",{
      uid:current_user_data.uid,
      rFilter:[],
      cFilter:[],
      aFilter:[],
      gFilter:[id],
      filterObj:[],
      type:"cat"
    });
    window.parent.reloadIframe('cat');
  });


  var expand = 0 ;
  $(document).on("click",'.tag',function () {
    let name = $(this).attr("id"),
        target = name,
        offset = $(".screen")[0].offsetLeft;
    if(name == 'monitor') $(this).attr("value",1).siblings().find(".tag").attr("value",0);
    else {
      $("#monitor").attr("value",0);
      $(this).attr('value',1).siblings().attr("value",0)
      .parent().siblings().find(".tag").attr("value",0);
    }
    let arr = [];
    $(".iframe_box").children().each(function () {
      arr.push($(this).attr("id"));
    });
    if(arr.indexOf(target)==-1&&target){
      $(".iframe_box").append(
        "<iframe id='"+target+"' src='"+gacha_url+target+".html'></iframe>"
      );
      $(".iframe_box").find("#"+target+"").load(function () {
        $(this).css("bottom","0%").siblings().css("bottom","-100%");
      });
    }
    else
    $(".iframe_box").find("#"+target).css("bottom","0%").siblings().css("bottom","-100%");

    $(".choose").find("span").text($(this).text());
    if(screen.width<426){
      $(this).parents(".navigation").css("height",0);
      expand = 0 ;
      $('.choose').find("i").css("transform",function () {
        if(expand) return 'rotate(90deg)'
        else return 'rotate(-90deg)'
      });
    }
  });
  $(document).on("click",".title",function () {
    $(this).next().toggle(400);
  });
  $(document).on('click','.choose',function () {
    expand = expand?0:1;
    $(".navigation").css("height",function () {
      if(expand) return 240
      else return 0
    });
    $(this).find("i").css("transform",function () {
      if(expand) return 'rotate(90deg)'
      else return 'rotate(-90deg)'
    });
  });


  var r = sr = ssr = 0 ;
  $(document).on('click','#test',function () {
    www(1)
  });
  $(document).on('click','#test_2',function () {
    www(11)
  });
  $(document).on('click','#test_3',function () {
    $(".result").empty();
    $(".number,.probability,#www").text("");
    r = sr = ssr = 0 ;
  });

  $(document).on('click','#scoreboard h2',function () {
    $(this).children("i").toggle().parent().siblings('table').toggle();
  });

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",user);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
  });

  function www(n) {
    let data=[];
    for(let i=0;i<n;i++){
      let result = Math.random();
      if(result<0.05) {data.push("SSR");ssr++;}
      if(0.05<result&&result<0.3) {data.push("SR");sr++;}
      if(0.3<result) {data.push("R");r++;}
    }
    socket.emit("gacha",{
      uid:current_user_data.uid,
      result:data
    });
  }
  socket.on("choose",function (data) {
    // console.log(data);
    for(let i in data){
      $(".result").append('<span class="card" value="'+data[i].id+'" '+
      'style="background-image:url('+
      image_url_cat+data[i].id+'.png);'+
      (screen.width>768?"width:180;height:120;":"width:90;height:60;")+"margin:5px;"+
      "border-color:"+(data[i].rarity == 'SSR' ?"rgb(241, 71, 71)":
      data[i].rarity == 'SR' ?"rgb(231, 184, 63)":"rgb(139, 214, 31)" )
      +'">'+data[i].name+'</span>');
    }
    $('body').animate({
      scrollTop : $('.result')[0].offsetHeight
    },1000,"easeInOutCubic");
    let total = r+sr+ssr,africa = ssr/total;
    $("#scoreboard").find("#R").children(".number")
      .text(r).next().text((r/total*100).toFixed(0)+"%");
    $("#scoreboard").find("#SR").children(".number")
      .text(sr).next().text((sr/total*100).toFixed(0)+"%");
    $("#scoreboard").find("#SSR").children(".number")
      .text(ssr).next().text((ssr/total*100).toFixed(0)+"%");

    if(africa == 0) $("#www").text("非洲大酋長");
    else if(africa<0.04) $("#www").text("非洲土著");
    else if(africa>0.09) $("#www").text("歐皇");
    else if(africa>0.06) $("#www").text("歐洲人");
    else $("#www").text("普通人");
  });
  $(document).on('click','.card',function () {
    let id = $(this).attr('value');
    socket.emit("display cat",{
      uid : current_user_data.uid,
      cat : id,
      history:true
    }) ;
    // location.assign("/view/cat.html");
    window.parent.parent.changeIframe('cat');
    window.parent.parent.reloadIframe('cat');


  });


});
