$(document).ready(function () {
  let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
  var site ;
  var socket = io.connect();
  let dd ,mm ,yy ,d_31 = [1,3,5,7,8,10,12] ;

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


  $("iframe").load(function () {
    $(".debugwindow h3").text("如果沒有東西出現請按重試按鈕");
  });
  var i = 0  ;
  $(document).on('click','#retry',function () {
    dd = new Date().getDate();
    $(".debugwindow h3").text("重新抓取資料中...");
    dd -= i ;
    if( dd < 1){
      dd = mm-1 != 2 ? (d_31.indexOf(mm-1) != -1 ? 31 :30) : 29 ;
      mm -- ;
    }
    if( mm < 1){mm = 12 ; yy -- ;}
    var load = confirm("貓咪:確定要載入"+mm+"月"+dd+"日的活動嗎?");
    if(load){
      let corr = Date.parse(mm+" "+dd+","+yy);
      site = url+yy+addZero(mm)+addZero(dd)+".html";
      console.log(site);
      $("iframe").attr("src",site);
      i++ ;
    }
    else{
      $(".debugwindow h3").text("如果沒有東西出現請按重試按鈕");
      dd += i ;
    }

  });
  function addZero(n) {
    n = Number(n) ;
    return n < 10 ? "0"+n : n ;
  }

});
