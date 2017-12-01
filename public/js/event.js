$(document).ready(function () {
  let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
  let today = new Date();
  let dd = today.getDate(),
      mm = today.getMonth()+1,
      yy = today.getFullYear() ;
  let site = url+yy+addZero(mm)+addZero(dd)+".html";
  var eventUpdate = {
        modify_date: dd,
        modify_to:"",
      };
  let d_31 = [1,3,5,7,8,10,12] ;


  $("iframe").load(function () {
    $(".debugwindow h3").text("如果沒有東西出現請按重試按鈕");
  });
  $("iframe").attr("src",site);
  $(document).on('click','#fine',function () {
    // alert("test");
    $(".debugwindow").fadeOut();
  });
  $(document).on('click','#retry',function () {
    $(".debugwindow h3").text("重新抓取資料中...");
    dd -- ;
    if( dd < 1){
      dd = mm-1 != 2 ? (d_31.indexOf(mm-1) != -1 ? 31 :30) : 29 ;
      mm -- ;
    }
    if( mm < 1){mm = 12 ; yy -- ;}
    var load = confirm("貓咪:確定要載入"+mm+"月"+dd+"日的活動嗎?");
    if(load){
      site = url+yy+addZero(mm)+addZero(dd)+".html";
      console.log(site);
      $("iframe").attr("src",site);
    }
    else{
      $(".debugwindow h3").text("如果沒有東西出現請按重試按鈕");
      dd += 1 ;
    }

  });
  function addZero(n) {
    n = Number(n) ;
    return n < 10 ? "0"+n : n ;
  }

});
