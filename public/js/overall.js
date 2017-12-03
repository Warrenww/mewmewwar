$(document).ready(function () {
  var socket = io.connect();
  var facebook_provider = new firebase.auth.FacebookAuthProvider();
  $(document).on('click', '#current_user_name', facebookLog); //Facebook登入
  function facebookLog() {
    auth.signInWithPopup(facebook_provider).then(function(result) {
      // This gives you a Facebook Access Token. You can use it to access the Facebook API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      console.log(user);

      socket.emit("user login",result.user) ;

      // window.location.assign("/");

    }).catch(function(error) {
      console.log(error);
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
    });
  }


  socket.emit('connet',location.href) ;

  if(screen.width < 768){
    $("#lower_table .value_display").attr("colspan",7);
  }
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
    let on = $(this).siblings().children('[value=1]') ;
    if(on.length > 0) on.each(function () {$(this).attr('value',0);});
    else $(this).siblings().children().each(function () {
      $(this).attr('value',1);
    });
  });
  $(document).on('click','#next_sel_pg',function () {turnPage(1);}) ;
  $(document).on('click','#pre_sel_pg',function () {turnPage(-1);}) ;
  function turnPage(n) {
    $('#selected').unbind('mousewheel', scroll_select);
    $(window).bind('mousewheel', false);
    let current = $("#selected").scrollTop();
    let offset = $("#selected").height(); ;
    $("#selected").animate(
      {scrollTop: current+offset*n},
      100,'easeInOutCubic');
    setTimeout(function(){
      $('#selected').bind('mousewheel', scroll_select);
      $(window).unbind('mousewheel', false);
    }, 300);
  }
  var scroll_select = function (e) {
    if(e.originalEvent.wheelDelta < 0) {
      if($(this).scrollTop()+$(this).height() == $(this)[0].scrollHeight) return true
      turnPage(1);
        //scroll down
    }else {
      if($(this).scrollTop() == 0) return true
      turnPage(-1);
        //scroll up
        // alert('Up');
    }
    //prevent page fom scrolling
    return false;
  };
  $('#selected').bind('mousewheel', scroll_select);

  var nav_site = ["cat","enemy","combo","calender","event","compareCat"],
      nav_text = ["貓咪資料","敵人資料","查詢聯組","活動日程","最新消息","比較貓咪"];

  var nav_html = "" ;
  for (let i in nav_site){
    nav_html += "<a href='"+nav_site[i]+".html' id='a_"+nav_site[i]+"'>"+nav_text[i]+"</a>"
  }
  $("nav .navLinkBox").html(nav_html) ;
  $(".m_navLinkBox").html(nav_html) ;

  var setting_html = '<a id="current_user_name">登入</a>'+
      '<i class="material-icons" data-toggle="modal" data-target="#helpModal">info</i>'+
      '<i class="material-icons" data-toggle="modal" data-target="#settingModal" id="setting">settings</i>' ;
  $("nav .settingBox").html(setting_html);
  $(".m_settingBox").html(setting_html);
  $("i[data-target='#helpModal']").click(function () {
    let dialog = $("#helpModal").find(".modal-header"),
        ending = dialog[0].scrollHeight ;
        console.log(ending)
        $("#helpModal .modal-header").scrollTop(100)
    dialog.scrollTop(ending);
  })
  auth.onAuthStateChanged(function(user) {
    if (user) {
      $("#current_user_name").text("Hi, "+user.displayName)
      .attr({'id':'userdata','href':'userdata.html'}) ;
    } else {
      console.log('did not sign in');
      r= confirm('登入來啟用更多功能!!');
      if (r) facebookLog();
    }
  });

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
  socket.on("connet",function (data) {
    console.log("server ready")
  }) ;

});
