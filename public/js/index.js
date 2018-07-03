const monro_api_key = 'XXcJNZiaSWshUe3H2NuXzBrLj3kW2wvP';
var miner_count = 0 ;
var explor_page = [],explor_index = 0,current_page = '';
$(document).ready(function () {
  var socket = io.connect();
  var facebook_provider = new firebase.auth.FacebookAuthProvider();
  var filter_name = '';
  var current_user_data = {};
  var newUser = false;
  //user login
    $(document).on("click","#fb_login",facebookLog)
    $(document).on("click","#guest_login",function () {
      let r = confirm("資料庫容量有限，"+
      "匿名登入使用者如果連續五天沒有使用將被刪除，"+
      "是否仍要繼續匿名登入?");
      if(r) guestLog();
      else return
    })
    function facebookLog() {
      $(".login_box").children('span').hide().siblings('i').show();
      auth.signInWithPopup(facebook_provider).then(function(result) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // console.log(user);
        socket.emit("user login",result.user) ;
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
      $(".login_box").children('span').hide().siblings('i').show();
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
        if (!newUser)
          socket.emit("user connect",{user:user,page:location.pathname});
      } else {
        newUser = true;
        $("#login").fadeIn();
        console.log('did not sign in');
      }
    });
    socket.on("login complete",function (name) {
      $("#login").fadeOut();
      $(".current_user_name").text("Hi, "+name);
      socket.emit("user connect",{user:user,page:location.pathname});
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
      console.log(data);
      dataArr = ['name','hp','atk','count'];
      dataBrr = ['','血量 : ','攻擊 : ','查詢次數 : '];
      for(let i in data.legend){
        let target = $(".catCard").eq(i);
        target.children("img").attr("src",image_url_cat+data.legend[i].id+'.png');
        for(let j in dataArr) target.children("span").eq(j).text(dataBrr[j]+data.legend[i][dataArr[j]]);
        target.attr("id",data.legend[i].id);
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
    var today = new Date(),iframe_holder_pos = 1;
    $("nav a,.m_nav_panel a").click(function () {
      if(iframe_holder_pos) {$('#iframe_holder').css('right',0);iframe_holder_pos = 0;}
      let target = $(this).attr("id");
      explor_page.splice(0,explor_index);
      if(target == 'compareCat'||target == 'compareEnemy') reloadIframe(target,false);
      else changeIframe(target);

      $(".m_nav_panel").css('right',-180);
      $("#m_nav_panel_BG").fadeOut();
      showMobilePanel = 1 ;
      explor_index = 0;
    });
    $("nav img").click(function () {
      $("#iframe_holder").css("right",'-100%');
      iframe_holder_pos = 1;
    });

    var nav_panel_timeout,close_nav_panel,panel_height;
    $(".show_panel").click(function () {
      let nav_panel = Number($(this).attr('value'));
      let target = $(this).next('.nav_panel'),
          x = $(this).offset().left;
      panel_height = target[0].scrollHeight;
      if(screen.width>768) target.css('left',x-10);
      if(nav_panel){
        $(this).attr('value',0);
        target.animate({"height":0},400);
        return
      }
      nav_panel_timeout = setTimeout(function () {
        target.prev('.show_panel').attr('value',1).siblings(".show_panel").attr("value",0);
        target.animate({"height":panel_height},200)
            .siblings('.nav_panel').animate({"height":0},200);
        clearTimeout(close_nav_panel);
        close_nav_panel = setTimeout(function () {
          target.animate({"height":0},400);
          target.prev('.show_panel').attr('value',0);
        },2000);
      },200);
    }) ;

    $(".nav_panel").hover(function () {
      clearTimeout(close_nav_panel);
    },
    function () {
      var target = $(this);
      close_nav_panel = setTimeout(function () {
        target.animate({"height":0},400);
        target.prev('.show_panel').attr('value',0);
      },800);
    }) ;

    var altTab_timeout;
    $(document).on('click','.navBox i',function () {
      var type = $(this).attr("id");
      // console.log(type);
      if (type == 'prev'){
        explor_index ++;
        if (explor_index>=explor_page.length){
          explor_index--;
          return
        }
      }
      else if (type == 'next') {
        explor_index --;
        if (explor_index<0){
          explor_index++;
          return
        }
      }
      else if(type == 'reload'){
        reloadIframe(current_page,false);
      }
      else{
        let arr = [];
        clearTimeout(altTab_timeout);
        $("#iframe_holder").children('iframe').each(function () {
          arr.push($(this).attr("id"));
        });
        $(".alt-tab").css('right',0).empty();
        for(let i in arr){
          $(".alt-tab").append("<div id="+arr[i]+">"+parse_iframe_name(arr[i])+"</div>");
        }
        let i = 0;
        $('.alt-tab').children().each(function () {
          $(this).animate({right:0},100*i);
          i++
        });
        altTab_timeout =
          setTimeout(function () {
            $(".alt-tab").animate({'right':-300},1000);
          },3000);
        return
      }
      // console.log(explor_index);
      changeIframe(explor_page[explor_index],false);
    });
    var iframeName = {
      "cat":"貓咪資料", "enemy":"敵人資料", "combo":"查詢聯組", "stage":"關卡資訊",
      "gacha":"轉蛋模擬器", "compareCat":"貓咪比較器", "compareEnemy":"敵人比較器",
      "book":"我的貓咪圖鑑", "calendar":"活動日程", "event":"最新消息", "intro":"新手專區",
      "setting":"設定","rank":"等級排行","history":"歷程記錄","list":"出陣列表",
      "game":"釣魚小遊戲"
    }
    function parse_iframe_name(str) {
      return iframeName[str]
    }
    $(".alt-tab").hover(function () {
      clearTimeout(altTab_timeout);
      setTimeout(function () {
        $(".alt-tab").animate({'right':-300},1000);
      },5000);
    },function () {
      altTab_timeout =
        setTimeout(function () {
          $(".alt-tab").animate({'right':-300},1000);
        },500);
    });
    $(document).on("click",".alt-tab div",function () {
      let target = $(this).attr("id");
      console.log(target);
      changeIframe(target);
    });


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
          $("#mine_alert").fadeOut();
        } else {
          $("#mine_alert").fadeOut();
          socket.emit("notice mine",{uid:current_user_data.uid,accept:false});
        }
      }
    });

    $(".searchMore").click(function () {
      let id = $(this).parent().attr("id");
      socket.emit("display cat",{
        uid : current_user_data.uid,
        cat : id,
        history : true
      });
      $('#iframe_holder').css('right',0);
      window.parent.reloadIframe('cat');
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
      }
    }

    //temp
    let dd = today.getDate(),
        hh = today.getHours(),
        html='';
    // console.log(dd,hh);

    $("#year_event").click(function () {$(this).fadeOut();});
    $('nav,.m_nav_panel').click(function () {
      $("#year_event").fadeOut();
    });

    html+="<thead><tr><th></th>";
    if(dd<29)
      for(let i=dd;i<dd+3;i++){
        html+="<th>4月"+i+"日</th>";
      }
    else{
      html+="<th>4月29日</th><th>4月30日</th><th>5月1日</th>"
    }
    html+="</tr></thead><tbody>";
    for(let i=0;i<4;i++){
      switch (i) {
        case 0:
          html+="<tr><td>7:00~9:00</td>";
          for(let j=0;j<3;j++)html+="<td>第"+(9+((dd+j)%2))+"使徒，來襲</br></td>"
          break;
        case 1:
          html+="<tr><td>12:00~14:00</td>";
          for(let j=0;j<3;j++)html+="<td>第"+(9+((dd+j-1)%2))+"使徒，來襲</br></td>"
          break;
        case 2:
          html+="<tr><td>17:00~19:00</td>";
          for(let j=0;j<3;j++)html+="<td>第"+(9+((dd+j)%2))+"使徒，來襲</br></td>"
          break;
        case 3:
          html+="<tr><td>21:00~23:00</td>";
          for(let j=0;j<3;j++)html+="<td>第"+(9+((dd+j-1)%2))+"使徒，來襲</br></td>"
          break;

        default:
          html+="<td colspan='3'>-</td>"
      }
      html+="</tr>"
    }
    $("#year_event").find("table").append(html);
    hh = Math.floor(hh/3)-1;
    $("#year_event").find("tr").eq(hh).children().eq(1)
        .css("border","3px solid rgb(246, 149, 34)")


});
function changeIframe(target,record = true) {
  if(!target) return
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
  if(record) explor_page.splice(0,0,target);
  current_page = target;
  // console.log(explor_page);
}
function reloadIframe(target,record = true) {
  if(!$("#iframe_holder").find("#"+target)[0]) {
    changeIframe(target,record);
  }
  else{
    let src = $("#iframe_holder").find("#"+target).attr("src");
    $("#iframe_holder").find("#"+target).attr('src',src);
    explor_page.splice(0,0,target);
  }
}
