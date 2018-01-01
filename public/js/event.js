$(document).ready(function () {
  let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
  var site ;
  var socket = io.connect();

  socket.emit('get event date');
  socket.on('true event date',function (data) {
    console.log(data);
    for(let i in data){
      site = url+data[i].split("/").join("")+".html";
      console.log(site);
      $("#"+i).attr("src",site).attr("date",data[i]);
    }
  });
  let string = '';
  $(document).on('keypress','body',function (event) {
    let code = (event.keyCode ? event.keyCode : event.which);
    string += String.fromCharCode(code);
    if(string.length > 3 ){
      let l = string.length ;
      string = string.substring(l-4,l);
      console.log(string);
      if(string == 'next'){
        $(".iframe_holder").animate({left:-width*2},800);
        let date = $(".iframe_holder").children().eq(2).attr("date");
        $("#date").text(date);
        $("#date").fadeIn();
        setTimeout(function () {
          $("#date").fadeOut();
        },2800);
      }
    }

  });
  var width = Number($(document).width());
  $(document).on('click','#left,#right',function () {
     let org = Number(($(".iframe_holder").css("left")).split('px')[0]);
     org += $(this).attr('id') == 'left' ? width : -width;
     if(org > 0 || org < -width) return
     $(".iframe_holder").animate({left:org},800)
     org /= -width ;
     let date = $(".iframe_holder").children().eq(org).attr("date");
     $("#date").text(date);
     $("#date").fadeIn();
     setTimeout(function () {
       $("#date").fadeOut();
     },2800);
  });
  $("iframe_holder").on("swipe",function (e) {
    alert("!!")
    console.log(e);
  })
  function addZero(n) {
    n = Number(n) ;
    return n < 10 ? "0"+n : n ;
  }

});
