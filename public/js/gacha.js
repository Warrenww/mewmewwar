$(document).ready(function () {
  const image_url =  "../public/css/footage/cat/u" ;
  var socket = io.connect();
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
      image_url+data[i].id+'.png);'+
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
    location.assign("/view/cat.html");
  });

});
