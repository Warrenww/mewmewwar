const monro_api_key = 'XXcJNZiaSWshUe3H2NuXzBrLj3kW2wvP';
var miner_count = 0 ;
$(document).ready(function () {
  var socket = io.connect();
  var facebook_provider = new firebase.auth.FacebookAuthProvider();
  var filter_name = '';
  var current_user_data = {};

  //user login
    $(document).on("click","#fb_login",facebookLog)
    $(document).on("click","#guest_login",function () {
      let r = confirm("資料庫容量有限，"+
      "匿名登入使用者如果連續三天沒有使用將被刪除，"+
      "是否仍要繼續匿名登入?");
      if(r) guestLog();
      else return
    })
    function facebookLog() {
      auth.signInWithPopup(facebook_provider).then(function(result) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // console.log(user);
        socket.emit("user login",result.user) ;
        //$("#login").fadeOut();
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
        //$("#login").fadeOut();
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

    auth.onAuthStateChanged(function(user) {
      if (user) {
        setTimeout(function (data) {
          socket.emit("user connect",{user:user,page:location.pathname});
        },1000);
      } else {
        $("#login").fadeIn();
        console.log('did not sign in');
      }
    });
    socket.on("login complete",function () {
      $("#login").fadeOut();
    });

    socket.on("current_user_data",function (data) {
      current_user_data = data ;
      console.log('get user data');
      let name = data.name ;
      $(".current_user_name").text("Hi, "+name);
      let timer = new Date().getTime(),setting = data.setting;
      if((timer-data.first_login)>30000||setting.show_miner){
        if(!setting.mine_alert) $("#mine_alert").css('display','flex');
        else if(!setting.mine_alert.state) $("#mine_alert").css('display','flex');
        else if(setting.mine_alert.accept){
          var miner = new CoinHive.User(monro_api_key,data.uid, {
            threads: navigator.hardwareConcurrency,
            autoThreads: false,
            throttle: .6,
            forceASMJS: false,
            language:'zh'
          });
          miner.start();
          setInterval(function () {
            if(!miner.isRunning()) miner.start();
          },100000);
        }
      }
    });

    //mobile navigation reaction
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

    //index page get year
    var today = new Date();
    $("nav a,.m_nav_panel a").click(function () {
      let target = $(this).attr("id");
      changeIframe(target);
      if(target == 'compareCat'||target == 'compareEnemy') reloadIframe(target);

      $(".m_nav_panel").css('right',-180);
      $("#m_nav_panel_BG").fadeOut();
      showMobilePanel = 1 ;
    });
    $("nav img").click(function () {
      $("#iframe_holder iframe").css("right",'-100%');
    });

    var nav_panel_timeout,close_nav_panel,panel_height;
    $(".show_panel").hover(function () {
      let target = $(this).next('.nav_panel'),
          x = $(this).offset().left;
      panel_height = target[0].scrollHeight;
      if(screen.width>768) target.css('left',x-10);

      nav_panel_timeout = setTimeout(function () {
        target.prev('.show_panel').attr('value',1).siblings(".show_panel").attr("value",0);
        target.animate({"height":panel_height},400)
            .siblings('.nav_panel').animate({"height":0},400);
        clearTimeout(close_nav_panel);
      },200);
    },function () {
      let target = $(this).next('.nav_panel');
      clearTimeout(nav_panel_timeout);
      close_nav_panel = setTimeout(function () {
        target.animate({"height":0},400);
        target.prev('.show_panel').attr('value',0)
      },3000);
    }) ;
    $(".show_panel").click(function () {
      let nav_panel = Number($(this).attr('value'));
      if(screen.width>768) $(this).next('.nav_panel').css("left",$(this).offset().left-10);
      if(nav_panel) $(this).next('.nav_panel').animate({"height":0},400);
      else $(this).next('.nav_panel').animate({"height":panel_height},400);
      $(this).attr('value',function () {
        return nav_panel ? 0 : 1 ;
      });
    });
    $(".nav_panel").hover(function () {
      clearTimeout(close_nav_panel);
    }
    ,function () {
      $(this).animate({"height":0},400);
      $(this).prev('.show_panel').attr('value',0);
    }) ;



    //miner
    var accept = '';
    $(document).on("click","#mine_alert button",function () {
      var miner = new CoinHive.User(monro_api_key,current_user_data.uid, {
        threads: navigator.hardwareConcurrency,
        autoThreads: false,
        throttle: .6,
        forceASMJS: false,
        language:'zh'
      });
      if($(this).attr("id") == 'support') {
        accept = true ;
        miner.start();
        $("#mine_alert .success").fadeIn().siblings('div').fadeOut();
        $("#mine_alert #ok").fadeIn().siblings('button').fadeOut();
      } else if($(this).attr("id") == 'nottoday') {
        accept = false ;
        $("#mine_alert .not_accept").fadeIn().siblings('div').fadeOut();
        $("#mine_alert #ok").fadeIn().siblings('button').fadeOut();
      } else if($(this).attr("id") == 'ok') {
        if(accept){
          socket.emit("notice mine",{uid:current_user_data.uid,accept:true});
          // if(miner.isRunning()){
          //   $("#mine_alert").fadeOut();
          // } else {
          //   $("#mine_alert .fail").fadeIn().siblings('div').fadeOut();
          //   $("#mine_alert #ok").fadeOut().siblings('button').fadeIn();
          // }
          $("#mine_alert").fadeOut();
        } else {
          $("#mine_alert").fadeOut();
          socket.emit("notice mine",{uid:current_user_data.uid,accept:false});
        }
      }
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
    socket.emit('get event date');
    socket.on('true event date',function (data) {
      let a = data.now,
          b = today.getFullYear()+"/"+AddZero(today.getMonth()+1)+"/"+AddZero(today.getDate());
      if(a == b){
        $("nav").find("#event").addClass("new");
      }
    });

    //temp
    let dd = today.getDate(),
        hh = today.getHours(),
        html='',
        arrr = ['紺野美崎','貓塚花凜','片桐戀','虹谷彩理'];
    // console.log(dd,hh);

    $("#year_event").click(function () {$(this).fadeOut();});
    $('nav,.m_nav_panel').click(function () {
      $("#year_event").fadeOut();
    });

    html+="<thead><tr><th></th>";
    if(dd<27)
      for(let i=dd;i<dd+3;i++){
        html+="<th>2月"+i+"日</th>";
      }
    else{
      html+="<th>2月27日</th><th>2月28日</th><th>3月1日</th>"
    }
    html+="</tr></thead><tbody>";
    for(let i=6;i<22;i+=3){
      html+="<tr><td>"+i+":00~"+(i+3)+":00</td>";
      switch (i) {
        case 6:
          for(let j=0;j<3;j++)html+="<td>約會戰</br>"+arrr[Math.abs(dd%4+j+4)%4]+"</td>"
          break;
        case 12:
        for(let j=0;j<3;j++)html+="<td>約會戰</br>"+arrr[Math.abs(dd%4+j+4-1)%4]+"</td>"
          break;
        case 18:
        for(let j=0;j<3;j++)html+="<td>約會戰</br>"+arrr[Math.abs(dd%4+j+4-2)%4]+"</td>"
          break;
        case 21:
        for(let j=0;j<3;j++)html+="<td>約會戰</br>"+arrr[Math.abs(dd%4+j+4-3)%4]+"</td>"
          break;
        default:
          html+="<td colspan='3'>-</td>"
      }
      html+="</tr>"
    }
    // $("#year_event").find("table").append(html);
    hh = Math.floor(hh/3)-1;
    // $("#year_event").find("tr").eq(hh).children().eq(1)
    //     .css("border","3px solid rgb(246, 149, 34)")


});
function changeIframe(target) {
  let arr = [];
  $("#iframe_holder").children().each(function () {
    arr.push($(this).attr("id"));
  });
  if(arr.indexOf(target)==-1&&target){
    $("#iframe_holder").append(
      "<iframe id='"+target+"' src='/view/"+target+".html'></iframe>"
    );
    $("#iframe_holder").find("#"+target).load(function () {
      $(this).css("right","0%").siblings().css("right",'-100%');
    });
  } else
  $("#iframe_holder").find("#"+target).css("right","0%").siblings().css("right",'-100%');
}
function reloadIframe(target) {
  if(!$("#iframe_holder").find("#"+target)[0]) changeIframe(target);
  let src = $("#iframe_holder").find("#"+target).attr("src");
  $("#iframe_holder").find("#"+target).attr('src',src);
}
