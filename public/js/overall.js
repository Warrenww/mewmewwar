const image_url_cat =  "../public/css/footage/cat/u" ;
const image_url_enemy =  "../public/css/footage/enemy/e" ;
$(document).ready(function () {
  var socket = io.connect();
  var facebook_provider = new firebase.auth.FacebookAuthProvider();
  // $(document).on('click', '#current_user_name', facebookLog); //Facebook登入
  $(document).on("click","#fb_login",facebookLog)
  $(document).on("click","#guest_login",guestLog)
  function facebookLog() {
    auth.signInWithPopup(facebook_provider).then(function(result) {
      // This gives you a Facebook Access Token. You can use it to access the Facebook API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      // console.log(user);
      socket.emit("user login",result.user) ;
      $("#login").fadeOut();
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
  function guestLog() {
    firebase.auth().signInAnonymously().catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    })
    .then(function () {
      $("#login").fadeOut();
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          // console.log(user);
          socket.emit("user login",user) ;
          var isAnonymous = user.isAnonymous;
          var uid = user.uid;
          // ...
        } else {
          // User is signed out.
          // ...
        }
        // ...
      });
    });
  }
  var today = new Date();
  $(".start_holder p span").text(today.getFullYear());
  $(".start_holder p ").animate({
    top:-$(".start_holder p ").height()
  },60000,"linear");

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
    let current = $("#selected").scrollTop(),
        offset = $("#selected").height(),
        current_page = current/offset ;

    $("#selected").animate(
      {scrollTop: current+offset*n},
      100*Math.sqrt(Math.abs(n)),'easeInOutCubic');

    $("#page_dot").find("span[value='"+(current_page+n)+"']")
      .css('background-color','rgb(254, 168, 74)')
      .siblings().css('background-color','white')

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
  $(document).on('click','#page_dot span',function () {
    let current = $("#selected").scrollTop(),
        offset = $("#selected").height(),
        current_page = current/offset,
        goto = $(this).attr('value') ;
    // console.log(current_page+","+goto);
    let n = current_page-goto;
    // console.log(n);
    turnPage(-n);
    // $(this).css('background-color','rgb(254, 168, 74)')
    //   .siblings().css('background-color','white');
    // $(this).attr('active',true).siblings().attr('active',false);
  });
  var nav_site_1 = ["cat","enemy","combo","stage"],
      nav_text_1 = ["貓咪資料","敵人資料","查詢聯組","關卡資訊"];
  var nav_site_2 = ["compareCat","calender","event","gacha"],
      nav_text_2 = ["比較貓咪","活動日程","最新消息","轉蛋"];

  var nav_html_panel = "" ,
      nav_html = '';
  for (let i in nav_site_1){
    nav_html_panel += "<a href='"+(location.pathname == "/"?"/view/":"")+
    nav_site_1[i]+".html' id='a_"+nav_site_1[i]+"'>"+nav_text_1[i]+"</a>";
  }
  nav_html += "<span class='show_panel'>資料庫</span><div class='nav_panel'>"+nav_html_panel+"</div>"
  for (let i in nav_site_2){
    nav_html += "<a href='"+(location.pathname == "/"?"/view/":"")+
    nav_site_2[i]+".html' id='a_"+nav_site_2[i]+"'>"+nav_text_2[i]+"</a>";
  }


  $("nav .navLinkBox").html(nav_html) ;
  $(".m_navLinkBox").html(nav_html) ;

  var setting_html = '<a class="current_user_name"></a><div style="display:flex;justify-content:center">'+
      '<i class="material-icons" data-toggle="modal" data-target="#helpModal">info</i>'+
      '<a href="'+(location.pathname == "/"?"/view/":"")+
      'setting.html"><i class="material-icons" id="setting">settings</i></a></div>' ;
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
      socket.emit("user name",user.uid);
    } else {
      $("#login").fadeIn();
      console.log('did not sign in');

      if(location.pathname == '/view/once.html') {

      }
      else if(location.pathname != '/') {
        alert("登入以獲得更多功能!!!");
        location.assign("/");
      }
    }
  });
  socket.on("user name",function (name) {
    $(".current_user_name").text("Hi, "+name);
  });



  var xmlhttp = new XMLHttpRequest() ;
  var url = "../public/update_dialog.html";
  var update_dialog ;

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  xmlhttp.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200){
      update_dialog = this.responseText ;
      $("#helpModal").find(".modal-body").html(update_dialog);
      $("#helpModal").find(".modal-header .title").text("更新紀錄");
      $("#helpModal").find(".modal-footer").html("本網站資料來源主要為<a href='https://cnhv.co/rnwe' target='blank'>超絕攻略網</a>");
    }
  }
  socket.on("connet",function (data) {
    console.log("server ready")
  }) ;
  //temp
  $("body").append("<div id='year_event'>"+yearevent()+"</div><div id='year_event_BG'></div>");
  $("#year_event").click(function () {
    $(this).fadeOut();
    $("#year_event_BG").fadeOut();
  });
  let hr = today.getHours(),
      y_h = $("#year_event tr[id="+hr+"]")[0] ? $("#year_event tr[id="+hr+"]")[0].offsetTop : 0;
  $("#year_event").animate({
    scrollTop : y_h-200
  },800,"easeInOutCubic");

});
$(window).load(function () {
  var nav_panel = 0, nav_panel_timeout;
  $(".show_panel").hover(function () {
    nav_panel_timeout = setTimeout(function () {
      $(".nav_panel").css("height",200);
      nav_panel = 1;
    },200);
  },function () {
    clearTimeout(nav_panel_timeout);
  }) ;
  $(".show_panel").click(function () {
    if(nav_panel) $(".nav_panel").css("height",0);
    else $(".nav_panel").css("height",200);
    nav_panel = nav_panel ? 0 :1 ;
  });
  $(".nav_panel").hover(function () {}
  ,function () {
    $(".nav_panel").css("height",0);
    nav_panel = 0 ;
  }) ;
});
//google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'UA-111466284-1');


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
    {scrollTop: $("#"+div_id).offset().top-100},
    1000,'easeInOutCubic');
}
function scroll_to_class(class_name,n) {
  $('html,body').animate(
    {scrollTop: $("."+class_name).eq(n).offset().top},
    1000,'easeInOutCubic');
}
function AddZero(n) {
  return n<10 ? "0"+n : n
}

//temp
function yearevent() {
  let today = new Date(),
      day = today.getDate(),
      hr = today.getHours();
  let html = '<h1 style="text-align:center;color:white">1/'+day+' 年初活動</h1><table>';
  let obj = {"1":{},"2":{},"3":{},"4":{},"5":{},"6":{},"7":{},"8":{},"9":{}};
  for(let i in obj){
    for(let j=7;j<24;j++) obj[i][j] = '';
    let time = [7,8,12,13,19,20],
        time_2 = [11,12,13],
        time_3 = [19,20,21];
    for(let j in time) obj[i][time[j]] += "傳奇關卡統率力減半,";

    if(i%2 == 0) {
      obj[i].allday = "世界篇寶物嘉年華,";
      for(let j in time_2) obj[i][time_2[j]] += "游擊戰經驗值喵,";
      for(let j in time_3) obj[i][time_3[j]] += "超級游擊經驗值喵,";

    }
    else {
      obj[i].allday = "未來篇寶物嘉年華,";
      for(let j in time_2) obj[i][time_2[j]] += "超級游擊經驗值喵,";
      for(let j in time_3) obj[i][time_3[j]] += "游擊戰經驗值喵,";
    }
    if(i==3||i==6||i==9) obj[i].allday += "宇宙篇寶物嘉年華,";

    if(i%3 == 1){
      obj[i][16] += "終極游擊經驗值喵,"
      obj[i][22] += "超終極游擊經驗值喵,"
    } else if(i%3 == 2){
      obj[i][22] += "終極游擊經驗值喵,"
      obj[i][8] += "超終極游擊經驗值喵,"
    } else {
      obj[i][8] += "終極游擊經驗值喵,"
      obj[i][16] += "超終極游擊經驗值喵,"
    }

  }
  // console.log(obj);
  // console.log(day+","+hr);
  // console.log(obj[day]);
  html += "<tr><th>全天</th><td>"+turn(obj[day].allday)+"</td></tr>";
  for(let i in obj[day]){
    if(i=='allday') continue
    html += "<tr id='"+i+"'><th>"+AddZero(i)+":00</th>"+
    "<td style='border:"+
    (i==hr?'3px solid rgb(255, 77, 77)':'0px')+
    "'>"+turn(obj[day][i])+"</td></tr>"
  }
  html += "</table>";
  return html
}
function turn(s) {
  let arr = s.split(",");
  let ww = '';
  for(let i in arr) ww += arr[i]+"</br>";
  return ww
}
