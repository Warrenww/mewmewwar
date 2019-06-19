var CurrentUserId;
var userPhoto;

if(Storage){
  if(localStorage.userDisplayName){
    $(".current_user_name").text("Hi, "+localStorage.userDisplayName);
  }
  if(localStorage.userPhoto){
    $("#userPhoto").css("background-image","url("+localStorage.userPhoto+")");
  } else if(localStorage.userPhoto == "undefined"){
    $("#userPhoto").css("background-image","url("+Unit.imageURL('cat','001-1')+")");
  }
  if(localStorage.tutorial_ != 1) $(".tutorial").attr("show",true);
  else $(".tutorial").remove();
}
else {
  console.log("Browser don't support local storage!!");
}

var facebook_provider = new firebase.auth.FacebookAuthProvider();
var google_provider = new firebase.auth.GoogleAuthProvider();
var newUser = false;

function login(method = null) {
  $(".login_box").children('span').css("opacity",0);
  $(".login_box").addClass("loading");
  if(method){
    var provider;
    if(method == 'facebook') provider = facebook_provider;
    else if(method == 'google') provider = google_provider;
    else alert("未知錯誤，請重新整理");

    auth.signInWithPopup(provider).then(function(result) {
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
      if(errorCode == "auth/popup-closed-by-user"){
        $(".login_box").removeClass("loading").children('span').css("opacity",1);
      }
      else if(errorCode == "auth/web-storage-unsupported"){
        $(".login_box").append("<div style='padding: 15; font-weight: bold; color: var(--red);'>"+
         "<div>登入錯誤</div>瀏覽器禁用了第三方cookie，請從設定中啟用第三方cookie<br>"+
        (window.navigator.userAgent.indexOf("Chrome") != -1?
        "點擊複製以下連結，並在網址列貼上以前往設定<div class='copiable' style='background:var(--bluegreen);border-radius: 10px; padding: 0 5; color: white;'>chrome://settings/content/cookies</div>":"")+
        "</div>").children('span').hide();
      }
      else if(errorCode == "auth/network-request-failed"){
        
      }
      else if(errorCode == "auth/popup-blocked"){

      }
    });
  } else {
    if(confirm("資料庫容量有限，匿名登入使用者如果連續五天沒有使用將被刪除，是否仍要繼續匿名登入?")) {
      firebase.auth().signInAnonymously()
      .catch(function(error) { console.log(error); })
      .then(function () {
        firebase.auth().onAuthStateChanged(function(user) {
          if (user) { socket.emit("user login",user) ; }
        });
      });
    } else return
  }
}

$(document).ready(function () {
  socket.emit("public data",['index']);
  socket.on("public data",(data)=>{
    console.log(data);

    var dataArr = ['name','hp','atk','count'],
        dataBrr = ['','血量 : ','攻擊 : ','查詢次數 : '];
    for(let i in data.index.legend.mostSearchCat){
      let target = $(".LegendCard").eq(i);
      target.children("img").attr("src",Unit.imageURL('cat',data.index.legend.mostSearchCat[i].id+"-1"));
      for(let j in dataArr) target.children("span").eq(j).text(dataBrr[j]+data.index.legend.mostSearchCat[i][dataArr[j]]);
      target.attr({"id":data.index.legend.mostSearchCat[i].id,type:'cat'});
    }
    for(let i in data.index.legend.mostSearchStage){
      let target = $(".LegendCard").eq(Number(i)+3),level=[],
          temp = data.index.legend.mostSearchStage[i],
          id = temp.id.split("-");
      target.children("div").attr("bg",data.index.legend.mostSearchStage[i].id.split("-")[0]);
      for(let j in temp.name) if(temp.name[j].id == id[1]) target.children("span").eq(0).text(temp.name[j].name);
      target.children("span").eq(1).text("子關卡數 : "+temp.data.length);
      target.children("span").eq(2).text("平均查詢數 : "+Math.round(temp.count));
      target.children("span").eq(3).attr("level",JSON.stringify(temp.data));
      target.attr({"id":temp.id,type:'stage'});
    }
    $(".LegendCard span").click(function () {
      if(!$(this).attr("level")) return;
      var arr = JSON.parse($(this).attr("level"));
      $('body').append("<div id='levelBoard'><div></div></div>");
      for(let i in arr)
        $("#levelBoard div")
          .append("<span class='card' name='"+arr[i].name+
                  "' style='background:url(\""+image_url_stage+arr[i].bg+".png\");background-size: cover;'/>");
    });
    $(document).on('click',"#levelBoard",function () { $(this).remove() });

    // Update Event
    $("#event_tw,#event_jp").empty(); // Initial area
     // Append prediction queue
    $("#event_tw").append(createPredictionQueue(data.index.event.prediction));
    $("#event_jp").append(createPredictionQueue(data.index.event.prediction_jp));
    // calculate table width
    $("#event_tw").css('width',function(){ return Number($(this).find("th").length)/2*60 + 100 });
    $("#event_jp").css('width',function(){ return Number($(this).find("th").length)/2*60 + 100 });
    // Append source URL
    $("#event_source_tw").attr('href',data.index.event.prediction.source);
    $("#event_source_jp").attr('href',data.index.event.prediction_jp.source);
    // Find most recent new event day
    var flag = false,str="",last;
    $("#event_date").empty();
    for(let i in data.index.event){
      if(i.indexOf('prediction')!=-1||i=="text_event") continue ;
      if(data.index.event[i]){
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
    for(i in data.index.event.text_event){
      alt_text += "<h3>"+data.index.event.text_event[i].title+"</h3><div>"+data.index.event.text_event[i].content+"</div>"
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

    if(Storage) {
      localStorage.userDisplayName = data.name;
      $(".current_user_name").text("Hi, "+localStorage.userDisplayName);
      localStorage.userPhoto = data.photo;
      $("#userPhoto").css("background-image","url("+localStorage.userPhoto+")");
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
    console.log(data);
  });
  function updateNewEventIframe(date) {
    var url = eventURL+date+'.html';
    $("#event_iframe").attr("src",url).next()
        .next().children().eq(0).attr("href",url);
  }

  $("nav a,.left-side-column a").click(function () {
    var target = $(this).attr("id");
    if(switchIframe(target))  $('#iframe_holder').attr("active",true);
    $(".m_nav_panel,#m_nav_panel_BG").attr("active",function () {
      return (Number($(this).attr("active"))+1)%2
    });
    $(".side-column-bg").click();
    iframeNormalize();
  });
  $("nav img").click(function () { $("#iframe_holder").attr("active",false); });

  $(".show_panel").click(function () {
    let temp = Number($(this).attr('value'));
    if(Number.isNaN(temp)) temp = 0;
    temp = (temp+1)%2;
    $(this).attr("value",temp);
    $(this).next('.nav_panel').attr("value",temp);
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
          // $(this).css("top",-(0.25*doc_h-150+_index*(0.5*doc_h-50)));
          $(this).attr("style",`top:calc(-${25+50*_index}% + ${30*(_index+1)}px)`);
          _index += 1;
        });
        // Scroll iframe to active iframe
        setTimeout(function () {
          $("#iframe_holder iframe").css("top","-="+active_index*(doc_h/2-30)+"px");
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
    // $(window).bind('mousewheel', false);

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
    var openInNew = Storage?(localStorage.openMethod!='iframe'||false):false;
    if(openInNew||is_ios) return
    $("#iframe_holder").attr("active",true); // Turn iframe to normal view
    $("#iframe_holder").children().attr('style',""); // Restore all iframes' top
    $("#iframe_holder").unbind("mousewheel",scrollHolder); // Unbind event
    $("#carousel").attr("active",false); // Reset alt-tab trigger state
    $("#iframe_holder .nameHolder").remove(); // remove iframe name holder
  }

  function parse_iframe_name(str) {
    return {
      "cat":"貓咪資料", "enemy":"敵人資料", "combo":"查詢聯組", "stage":"關卡資訊",
      "gacha":"轉蛋模擬器", "compare":"比較器", "book":"我的貓咪圖鑑",
      "calendar":"活動日程", "document":"使用教學",
      "setting":"設定","rank":"等級排行","history":"歷程記錄","list":"出陣列表",
      "game":"釣魚小遊戲","expCalculator":"經驗計算機","treasure":"寶物圖鑑"
    }[str]
  }

  socket.on("online user change",(onLineUser)=>{ $("#onLineUser span").text(onLineUser); });

  $(".searchMore").click(function () {
    let id = $(this).parent().attr("id"),
        type = $(this).parent().attr("type");
    if(type == 'stage') id += '-1';
    socket.emit("set history",{
      type:type,
      target:id,
      uid:CurrentUserId
    });
    switchIframe(type);
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
  $("#iframe_holder").attr("active",true);
  if($("#iframe_holder #"+target.split("?")[0]).length)
    $("#iframe_holder").find("#"+target.split("?")[0]).attr("active",true) .siblings().attr("active",false);
  else
  {
    $("#iframe_holder").append(
      "<iframe id='"+target.split("?")[0]+"' src='"+target+"'></iframe>"
    );
    $("#iframe_holder").find("#"+target.split("?")[0]).attr("active",true)
    .siblings().attr("active",false);
  }
}
function reloadIframe(target,record = true) {
  if(!$("#iframe_holder").find("#"+target.split("?")[0])[0]) {
    changeIframe(target,record);
  }
  else{
    // let src = $("#iframe_holder").find("#"+target.split("?")[0]).attr("src");
    $("#iframe_holder").find("#"+target.split("?")[0]).attr('src',target);
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
