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
        socket.emit("user connect",user);
      } else {
        $("#login").fadeIn();
        console.log('did not sign in');
      }
    });

    //index page get year
    var today = new Date();
    $(".start_holder p span").text(today.getFullYear());
    $(".start_holder p ").animate({
      top:-$(".start_holder p ").height()
    },60000,"linear");

    


});
