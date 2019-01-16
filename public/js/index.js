const monro_api_key = 'XXcJNZiaSWshUe3H2NuXzBrLj3kW2wvP';
var miner_count = 0 ;
var userPhoto;

if(Storage){
  if(localStorage.userDisplayName){
    $(".current_user_name").text("Hi, "+localStorage.userDisplayName);
  }
  if(localStorage.userPhoto){
    $("#userPhoto").css("background-image","url("+localStorage.userPhoto+")");
  } else if(localStorage.userPhoto == "undefined"){
    $("#userPhoto").css("background-image","url("+image_url_cat+"001-1.png)");
  }
  if(localStorage.tutorial_ != 1) $(".tutorial").attr("show",true);
  else $(".tutorial").remove();
}
else {
  console.log("Browser don't support local storage!!");
}

var CurrentUserId;
$(document).ready(function () {
  var facebook_provider = new firebase.auth.FacebookAuthProvider();
  var google_provider = new firebase.auth.GoogleAuthProvider();
  var filter_name = '';
  var newUser = false;
  //user login
  $("#fb_login").click(facebookLogin);
  $("#google_login").click(googleLogin);
  $("#guest_login").click(function () {
    let r = confirm("資料庫容量有限，"+
    "匿名登入使用者如果連續五天沒有使用將被刪除，"+
    "是否仍要繼續匿名登入?");
    if(r) guestLog();
    else return
  })
  function facebookLogin() {
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
    });
  }
  function googleLogin() {
    $(".login_box").children('span').hide().siblings('i').show();
    auth.signInWithPopup(google_provider).then(function(result) {
      // This gives you a Google Access Token. You can use it to access the Google API.
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
  socket.on("login complete",function (data) {
    $("#login").fadeOut();
    $(".current_user_name").text("Hi, "+name);
    socket.emit("user connect",{user:data.user,page:location.pathname});
  });
  socket.on("current_user_data",function (data) {
    CurrentUserId = data.uid ;
    console.log('get user data');
    let name = data.name ;
    $(".current_user_name").text("Hi, "+name);
    if(Storage) {
      localStorage.userDisplayName = name;
      $(".current_user_name").text("Hi, "+localStorage.userDisplayName);
      localStorage.userPhoto = data.setting.userPhoto;
      $("#userPhoto").css("background-image","url("+data.setting.user_photo+")");
      if(localStorage.event){
         $("#"+localStorage.event).show();
         $("#"+localStorage.event+"_but").attr('value',1);
       }
      else {
        $("#event_tw").show();
        $("#event_tw_but").attr('value',1);
        localStorage.event = "event_tw";
      }
    }
    let timer = new Date().getTime(),setting = data.setting;
    if((timer-data.first_login)>30000||setting.show_miner){
      if(!setting.mine_alert) {}
      else if(!setting.mine_alert.state) {}
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
    for(let i in data.legend.mostSearchCat){
      let target = $(".LegendCard").eq(i);
      target.children("img").attr("src",image_url_cat+data.legend.mostSearchCat[i].id+'-1.png');
      for(let j in dataArr) target.children("span").eq(j).text(dataBrr[j]+data.legend.mostSearchCat[i][dataArr[j]]);
      target.attr({"id":data.legend.mostSearchCat[i].id,type:'cat'});
    }
    dataCrr = ['name','energy','count'];
    dataDrr = ['','消耗統帥力 : ','查詢次數 : '];
    for(let i in data.legend.mostSearchStage){
      let target = $(".LegendCard").eq(Number(i)+3),enemy=[];
      target.children("div").attr("bg",data.legend.mostSearchStage[i].id.split("-")[0]);
      for(let j in dataCrr) target.children("span").eq(j).text(dataDrr[j]+data.legend.mostSearchStage[i][dataCrr[j]]);
      for(let j in data.legend.mostSearchStage[i].enemy) enemy.push(data.legend.mostSearchStage[i].enemy[j].id)
      target.children("span").eq(3).attr("enemy",JSON.stringify(enemy));
      target.attr({"id":data.legend.mostSearchStage[i].id,type:'stage'});
    }

    // Update Event
    $("#event_tw,#event_jp").empty(); // Initial area
     // Append prediction queue
    $("#event_tw").append(createPredictionQueue(data.event.prediction));
    $("#event_jp").append(createPredictionQueue(data.event.prediction_jp));
    // calculate table width
    $("#event_tw").css('width',function(){ return Number($(this).find("th").length)/2*60 + 100 });
    $("#event_jp").css('width',function(){ return Number($(this).find("th").length)/2*60 + 100 });
    // Append source URL
    $("#event_source_tw").attr('href',data.event.prediction.source);
    $("#event_source_jp").attr('href',data.event.prediction_jp.source);
    // Find most recent new event day
    var flag = false,str="",last;
    $("#event_date").empty();
    for(let i in data.event){
      if(i.indexOf('prediction')!=-1||i=="text_event") continue ;
      if(data.event[i]){
        if(str != ""){
          str += strTodate(Number(i)-1)+"</option>";
          $("#event_date").prepend(str);
          str = "<option value='"+i+"'>"+strTodate(i)+"~";
        } else {
          str = "<option value='"+i+"'>"+strTodate(i)+"~";
        }
        last = i ;
      }
    }
    $("#event_date").prepend(str+"</option>"); // Add date option to selector
    $('#event_date').val(last); // choose most recent date
    function strTodate(s) {
      s = s.toString();
      return [s.substring(0,4),s.substring(4,6),s.substring(6,8)].join("/")
    }
    // if device is running ios OS replace iframe with text div
    var alt_text="";
    for(i in data.event.text_event){
      alt_text += "<h3>"+data.event.text_event[i].title+"</h3><div>"+data.event.text_event[i].content+"</div>"
    }
    $("#alt_text").append(alt_text);
    if(is_ios){
      $("#event_iframe").prev().prop("disabled",'disabled');
      $("#event_iframe").hide().next().show();
    }
    // update new event iframe
    updateNewEventIframe(last);
    $("#event_date").on("change",function () {
      var date = $("#event_date").val();
      updateNewEventIframe(date)
    });
  });
  function updateNewEventIframe(date) {
    var url = eventURL+date+'.html';
    $("#event_iframe").attr("src",url)
        .next().children().eq(0).attr("href",url);
  }
  $("#expandContent").click(function () {
    $('#bulletin').animate(
      {scrollTop: $(".main").eq(2).offset().top},
      600,'easeInOutCubic');
  });

  $(".LegendCard span").click(function () {
    if(!$(this).attr("enemy")) return
    var arr = JSON.parse($(this).attr("enemy"));
    $('body').append("<div id='enemyBoard'><div></div></div>");
    for(let i in arr) $("#enemyBoard div").append("<img src='"+image_url_enemy+arr[i]+".png'/>");
  });
  $(document).on('click',"#enemyBoard",function () { $(this).remove() });

  $("nav a,.m_nav_panel a").click(function () {
    if(!openInNew&&!is_ios)  $('#iframe_holder').attr("active",true);
    let target = $(this).attr("id");
    if(target == 'compareCat'||target == 'compareEnemy') reloadIframe(target,false);
    changeIframe(target);

    $(".m_nav_panel,#m_nav_panel_BG").attr("active",function () {
      return (Number($(this).attr("active"))+1)%2
    });
    iframeNormalize();
  });
  $("nav img").click(function () { $("#iframe_holder").attr("active",false); });

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
  },function () {
    var target = $(this);
    close_nav_panel = setTimeout(function () {
      target.animate({"height":0},400);
      target.prev('.show_panel').attr('value',0);
    },800);
  }) ;

  $('.navBox i').click(function () {
    var type = $(this).attr("id");
    if(type == 'reload'){
      var target = $("#iframe_holder iframe[active='true']").attr("id");
      reloadIframe(target,false);
    }
    else{
      // Do nothing if there aren't any iframe
      if($("#iframe_holder").children().length == 0) return
      // if alt-tab state is true restore normal view
      if($(this).attr("active") == 'true'){
        $("#iframe_holder").attr("active",true);
        $("#iframe_holder iframe").attr("style","");
        $("#iframe_holder").unbind("mousewheel",scrollHolder);
        $(this).attr("active",false);
      } else {  // Turn into carousel view
        var _index = 0, // indexing iframe
            doc_h = $(document).height(), // Get the height of document
            active_index; // Store the index of active iframe
            // console.log(doc_h);
        $("#iframe_holder").attr("active","alt-tab"); // Turn into carousel view
        // loop through iframe and set its position
        $("#iframe_holder iframe").each(function () {
          if($(this).attr('active') == 'true') active_index = _index;
          // console.log(_index,-(0.25*doc_h-150+_index*(0.5*doc_h-50)));
          $(this).css("top",-(0.25*doc_h-150+_index*(0.5*doc_h-50)));
          _index += 1;
        });
        // Scroll iframe to active iframe
        setTimeout(function () {
          $("#iframe_holder iframe").css("top","-="+active_index*doc_h/2+"px");
        },_index*200);
        // Bind it to scrollHolder function
        $("#iframe_holder").bind("mousewheel",scrollHolder);
        $(this).attr("active",true);
      }
      return
    }
  });
  // e for event d for direction (touch input only)
  var scrollHolder = function (e,d=null) {
    // prevent successively trigger event
    $('#iframe_holder').unbind('mousewheel', scrollHolder);
    $(window).bind('mousewheel', false);

    var wheelDelta = e.originalEvent ? e.originalEvent.wheelDelta : 0, // handle input type
        doc_h = $(document).height(), // get document height
        target = $('#iframe_holder iframe[active="true"]'), // find active iframe
        newTarget; // store target iframe
    // scroll down or swipe up
    if(wheelDelta < 0 || d == 'up') newTarget = target.next();
    else if(wheelDelta > 0 || d == 'down') newTarget = target.prev();
    else return

    if(!newTarget.attr('id')) { // target iframe not exist
      newTarget = target;
    } else { // activate target iframe and deactivate current iframe
      target.attr('active',false);
      newTarget.attr('active',true);
    }
    var scrollDistance = doc_h/4 - newTarget.offset().top;
    // scroll to target iframe
    $("#iframe_holder iframe").css("top","+="+scrollDistance+"px");
    // Show the active iframe name
    $("#iframe_holder .nameHolder").remove();
    $("#iframe_holder").append(
      "<div class='nameHolder'>"+
      parse_iframe_name(newTarget.attr("id"))+
      "</div>"
    );
    // re-bind to the scrollHolder function
    setTimeout(function(){
      $('#iframe_holder').bind('mousewheel', scrollHolder);
      $(window).unbind('mousewheel', false);
      $("#iframe_holder .nameHolder").fadeOut();
    }, 1000);
    return false
  }
  $("#iframe_holder").swipe({
      //Generic swipe handler for all directions
      // Bind this event to scrollHolder function
      swipe:scrollHolder,
      //Default is 75px, set to 0 for demo so any distance triggers swipe
      threshold : 100
  });
  // return to normal view
  $("#iframe_holder").click(iframeNormalize);
  function iframeNormalize () {
    if(openInNew||is_ios) return
    $("#iframe_holder").attr("active",true); // Turn iframe to normal view
    $("#iframe_holder").children().attr('style',""); // Restore all iframes' top
    $("#iframe_holder").unbind("mousewheel",scrollHolder); // Unbind event
    $("#carousel").attr("active",false); // Reset alt-tab trigger state
    $("#iframe_holder .nameHolder").remove(); // remove iframe name holder
  }

  var iframeName = {
    "cat":"貓咪資料", "enemy":"敵人資料", "combo":"查詢聯組", "stage":"關卡資訊",
    "gacha":"轉蛋模擬器", "compareCat":"貓咪比較器", "compareEnemy":"敵人比較器",
    "book":"我的貓咪圖鑑", "calendar":"活動日程", "event":"最新消息", "intro":"新手專區",
    "setting":"設定","rank":"等級排行","history":"歷程記錄","list":"出陣列表",
    "game":"釣魚小遊戲","expCalculator":"經驗計算機"
  }
  function parse_iframe_name(str) {
    return iframeName[str]
  }


  socket.on("online user change",(onLineUser)=>{
    $("#onLineUser span").text(onLineUser);
  });

  $(".searchMore").click(function () {
    let id = $(this).parent().attr("id"),
        type = $(this).parent().attr("type");
    socket.emit("set history",{
      type:type,
      target:id,
      uid:CurrentUserId
    });
    window.parent.reloadIframe(type);
    window.parent.changeIframe(type);
  });
  $("#event_tw_but,#event_jp_but").click(function () {
    var target = $(this).attr('id').split("_but")[0];
    $(this).siblings(".button").attr("value",0);
    if(Storage) localStorage.event = target;
    $("#"+target).show().siblings("table").hide();
  });

  var xmlhttp = new XMLHttpRequest() ;
  var url = "./data/update_dialog.html";
  var update_dialog ;

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  xmlhttp.onreadystatechange = function(){
    if (this.readyState == 4 && this.status == 200){
      update_dialog = this.responseText ;
      $("#helpModal").find(".modal-body").html(update_dialog);
    }
  }

});

function changeIframe(target,record = true) {
  if(!target) return
  if(is_ios||openInNew){
    window.open("/"+target,"_blank");
    return
  }
  $("#iframe_holder").attr("active",true);
  let arr = [];
  $("#iframe_holder").children().each(function () {
    arr.push($(this).attr("id"));
  });
  if(arr.indexOf(target)==-1&&target){
    $("#iframe_holder").append(
      "<iframe id='"+target+"' src='"+target+"'></iframe>"
    );
    $("#iframe_holder").find("#"+target).attr("active",true)
    .siblings().attr("active",false);
  } else
  $("#iframe_holder").find("#"+target).attr("active",true)
  .siblings().attr("active",false);
}
function reloadIframe(target,record = true) {
  if(!$("#iframe_holder").find("#"+target)[0]) {
    changeIframe(target,record);
  }
  else{
    let src = $("#iframe_holder").find("#"+target).attr("src");
    $("#iframe_holder").find("#"+target).attr('src',src);
  }
}

function changePhoto(photo) {
  $("#userPhoto").css('background-image',"url("+photo+")");
}
function reloadEventIframe() {
  $("#event_iframe").attr("src",$("#event_iframe").attr("src"));
}
function eventTableScroll(direction) {
  direction = direction == "L"?-1:1;
  $(".eventTableHolder").animate({
    scrollLeft: $(".eventTableHolder").scrollLeft() + 480*direction
  },400)
}
function showhideNav() {
  var active = Number($('#m_nav_menu').attr("active"));
  $("#m_nav_menu,#m_nav_panel_BG,.m_nav_panel").attr("active",(active+1)%2);
}
var pureText = false;
function switchPureText() {
    if(is_ios) return;
    if(pureText){
      $("#event_iframe").prev().prop("disabled",false);
      $("#event_iframe").show().next().hide();
    } else {
      $("#event_iframe").prev().prop("disabled",'disabled');
      $("#event_iframe").hide().next().show();
    }
    pureText = pureText?false:true;
}
