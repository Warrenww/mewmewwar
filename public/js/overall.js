$(document).ready(function () {



  if(screen.width < 768){
    $("#lower_table .value_display").attr("colspan",7);
  }
  console.log(location.href) ;
  const beta = location.href.indexOf('github.io') != -1 ? false : true ;
  console.log(beta) ;
  if(beta) BetaFunction() ;
  $(document).on('click','#updateCatData',function () {io().emit('force_update_cat_data');});
  $(document).on('keypress', 'input', function(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      $(this).blur();
    }
  });

  $(document).on('click', 'input',function (e) {
    e.stopPropagation();
  });

  $(document).on('click',".button",toggleButton);
  function toggleButton() {
    let val = Number($(this).attr('value')) ;
    $(this).attr('value',function () {
      val = val ? 0 : 1 ;
      return val ;
    });
  }
  var showMobilePanel = 1 ;
  $(document).on('click','#m_nav_menu',function () {
    if(showMobilePanel){
      $(".m_nav_panel").css('right',0);
      $("#m_nav_panel_BG").fadeIn();
      showMobilePanel = 0 ;
    }
    else{
      $(".m_nav_panel").css('right',-180);
      $("#m_nav_panel_BG").fadeOut();
      showMobilePanel = 1 ;
    }
  });
  $(document).on('click','#m_nav_panel_BG',function () {
    if(!showMobilePanel){
      $(".m_nav_panel").css('right',-180);
      $("#m_nav_panel_BG").fadeOut();
      showMobilePanel = 1 ;
    }
  });
  $(document).on('click','#upper_table th',function () {
    // let className = $(this).siblings('td').attr('class') ;
    // clearSelected(className) ;
    let on = $(this).siblings().children('[value=1]') ;
    // console.log(on.length);
    if(on.length > 0) on.each(function () {$(this).attr('value',0);});
    else $(this).siblings().children().each(function () {
      $(this).attr('value',1);
    });
  });

  var nav_site = ["cat","enemy","combo","calender","event"],
      nav_text = ["貓咪資料","敵人資料","查詢聯組","活動日程","最新消息"];

  var nav_html = "" ;
  for (let i in nav_site){
    nav_html += "<a href='"+nav_site[i]+".html'>"+nav_text[i]+"</a>"
  }
  $("nav .navLinkBox").html(nav_html) ;
  $(".m_navLinkBox").html(nav_html) ;

  var xmlhttp = new XMLHttpRequest() ;
  var url = "public/update_dialog.txt";
  var update_dialog ;

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  xmlhttp.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200){
      update_dialog = this.responseText ;
      $("#helpModal").find(".update_dialog").html(update_dialog)
      .parent().siblings(".modal-body").html(
        "<h4>常見問題</h4>"+
        "<b>圖片無法顯示</b></br>"+
        "<p>因部分圖片是由超絕攻略網抓取，受限於domain問題，"+
        "請開啟<a href='http:"+"//battlecats-db.com/unit/status_r_all.html'>"+
        "超絕攻略網</a>待圖片讀取完畢後"+
        "本網站即可顯示圖片</p>"+
        "<b>最新消息沒有顯示</b></br>"+
        "<p>最新消息發布的日期若與今天日期不同，"+
        "則會抓取到空白頁面，受限於domain問題，無法自動偵測有無顯示，"+
        "煩請手動點按頁面下方retry調整至最近的發布日期</p>"
      );

    }
  }

  function BetaFunction() {
    io().emit('connet') ;
  }

});
