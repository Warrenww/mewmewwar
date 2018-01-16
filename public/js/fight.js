$(document).ready(function () {
  var socket = io.connect();
  var current_cat_data = {};
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",user);
    } else {
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    let fade = true ;
    if(data.fight.cat)
      $("#helper .alert").find("#no_cat").toggle(400).parent()
        .append("<span><i class='material-icons'>&#xe86c;</i> 貓咪 <j>"+data.fight.cat.name+"</j> 已加入對戰</span>");
    else fade = false ;
    if(data.fight.enemy)
      $("#helper .alert").find("#no_enemy").toggle(400).parent()
        .append("<span><i class='material-icons'>&#xe86c;</i> 敵人 <j>"+data.fight.enemy.name+"</j> 已加入對戰</span>");
    else fade = false ;
    if(fade) setTimeout(function () {
      $("#helper").fadeOut().parent().find("#helper_BG").fadeOut();
    },1000);
  });

  $("#helper_BG").fadeIn();
  $(document).on("click","#helper_BG",function () {
    $(this).fadeOut();
    $("#helper").fadeOut();
  });
});
