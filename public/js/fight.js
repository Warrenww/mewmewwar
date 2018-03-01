$(document).ready(function () {
  var socket = io.connect();
  var current_cat_data = {};
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };
  var enemy = {},cat = {}

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    var fade = true ;
    if(data.fight.cat)
      $("#helper .alert").find("#no_cat").toggle(400).parent()
        .append("<span><i class='material-icons'>&#xe86c;</i> 貓咪 <j>"+data.fight.cat.name+"</j> 已加入對戰</span>");
    else fade = false ;
    if(data.fight.enemy)
      $("#helper .alert").find("#no_enemy").toggle(400).parent()
        .append("<span><i class='material-icons'>&#xe86c;</i> 敵人 <j>"+data.fight.enemy.name+"</j> 已加入對戰</span>");
    else fade = false ;
    if(fade) {
      setTimeout(function () {
        $("#helper").fadeOut().parent().find("#helper_BG").fadeOut();
      },2000);


      $(".datatable").find("#cat_img").empty().append("<img src='"+
      image_url_cat+data.fight.cat.id+'.png'+
      "' style='height:100%'>").siblings("#enemy_img").empty().append("<img src='"+
      image_url_enemy+data.fight.enemy.id+'.png'+
      "' style='height:100%'>");

      $(".datatable").find("#cat_name").empty().text(data.fight.cat.name)
                    .siblings("#enemy_name").empty().text(data.fight.enemy.name);

      socket.emit("display enemy",{uid:"",id:data.fight.enemy.id,history:false});
      socket.emit("display cat",{uid:data.uid,cat:data.fight.cat.id,history:false});

    }
  });

  var cat_ready = ene_ready = false ;
  socket.on('display enemy result',function (data) {
    // console.log(data);
    enemy = data ;
    ene_ready = true ;
    check_data();
  });
  socket.on('display cat result',function (data) {
    // console.log(data);
    cat = data.this ;
    cat.lv = data.lv ;
    cat.atk = levelToValue(cat.atk,cat.rarity,cat.lv);
    cat_ready = true ;
    check_data();
  });

  function check_data() {
    if(ene_ready&&cat_ready) {console.log("All data ready");displayData()}
    else console.log("not yet ready");
  }
  function displayData() {
    console.log(enemy);
    console.log(cat);
  }


  $("#helper_BG").fadeIn();
  $(document).on("click","#helper_BG",function () {
    $(this).fadeOut();
    $("#helper").fadeOut();
  });


});
