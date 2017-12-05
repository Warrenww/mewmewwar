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

  if(screen.width < 768){
    $("#lower_table .value_display").attr("colspan",7);
  }
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

  var nav_site = ["cat","enemy","combo","compareCat","calender","event"],
      nav_text = ["貓咪資料","敵人資料","查詢聯組","比較貓咪","活動日程","最新消息"];

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
      $("#helpModal").find(".modal-body").html(update_dialog);
      $("#helpModal").find(".modal-header .title").text("更新紀錄");
    }
  }
  socket.on("connet",function (data) {
    console.log("server ready")
  }) ;

});

function levelToValue(origin,rarity,lv) {
  let limit ;
  switch (rarity) {
    case '稀有':
    limit = 70 ;
    break;
    case '激稀有狂亂':
    limit = 20 ;
    break;
    default:
    limit = 60 ;
  }
  return lv<limit ? (0.8+0.2*lv)*origin : origin*(0.8+0.2*limit)+origin*0.1*(lv-limit) ;
}
function serialATK(prop,atk) {
    let b = prop.split("（")[0];
    let arr = prop.split("（")[1].split("）")[0].split(","),
        c = prop.split("（")[1].split("）")[1];
    // console.log(b+"("+arr.join()+")")
    for(let i in arr) arr[i] = (atk*Number(arr[i])).toFixed(0) ;
    return b+"（"+arr.join(' ')+"）"+c ;

}
function scroll_to_div(div_id){
  $('html,body').animate(
    {scrollTop: $("#"+div_id).offset().top},
    1000,'easeInOutCubic');
}
function scroll_to_class(class_name,n) {
  $('html,body').animate(
    {scrollTop: $("."+class_name).eq(n).offset().top},
    1000,'easeInOutCubic');
}
