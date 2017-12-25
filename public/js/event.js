$(document).ready(function () {
  let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
  var site ;
  var socket = io.connect();

  socket.emit('get event date');
  socket.on('true event date',function (date) {
    let corr = new Date(date);
    dd = corr.getDate(),
    mm = corr.getMonth()+1,
    yy = corr.getFullYear() ;
    site = url+yy+addZero(mm)+addZero(dd)+".html";
    console.log(site);
    $("iframe").attr("src",site);
  });

  var iframe = $('iframe').contents();
  iframe.find("a").click(function(){
     alert("test");
  });

  function addZero(n) {
    n = Number(n) ;
    return n < 10 ? "0"+n : n ;
  }

});
