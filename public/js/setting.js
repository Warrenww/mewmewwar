$(document).ready(function () {
  var socket = io.connect();
  var current_user_data = {};

  $(document).on('blur','#default_cat_lv',function () {
    let val = Number($(this).val()) ;
    if(val>100||val<1){
      $(this).val(current_user_data.setting.default_cat_lv);
      return
     }
    socket.emit("set default cat level",{uid:current_user_data.uid,lv:val})
  });
  $(document).on("click","#reset_cat_lv",function () {
    let r = confirm("所有貓咪等級將重設為"+current_user_data.setting.default_cat_lv+"等");
    if(!r) return
    socket.emit("reset cat level",current_user_data.uid);
  });
  $(document).on("click","#show_cat_id",function () {
    socket.emit("show hide cat id",{
      uid:current_user_data.uid,
      state:$(this).prop("checked")
    });
  });
  $(document).on("click","#show_cat_count",function () {
    socket.emit("show hide cat count",{
      uid:current_user_data.uid,
      state:$(this).prop("checked")
    });
  });
  let cat_history_show = 0;
  $(document).on("click","#cat_history",function () {
    if(!cat_history_show){
      $("#history_cat").css({"height":560});
      $(this).css({transform:"rotate(0deg)"});
      scroll_to_div("history_cat")
    } else {
      $("#history_cat").css({"height":0});
      $(this).css({transform:"rotate(-90deg)"});
    }
    cat_history_show = cat_history_show ? 0 : 1 ;
  });
  let ene_history_show = 0;
  $(document).on("click","#ene_history",function () {
    if(!ene_history_show){
      $("#history_ene").css({"height":560});
      $(this).css({transform:"rotate(0deg)"});
      scroll_to_div("history_ene")
    } else {
      $("#history_ene").css({"height":0});
      $(this).css({transform:"rotate(-90deg)"});
    }
    ene_history_show = ene_history_show ? 0 : 1 ;
  });
  $(document).on('click','.card',function () {
    let id = $(this).attr('value'),
        type = $(this).attr('type');
    if(type == 'cat'){
      socket.emit("user Search",{
        uid : current_user_data.uid,
        type : 'cat',
        id : id
      });
      location.assign("/view/cat.html");
    } else if(type == 'enemy'){
      socket.emit("user Search",{
        uid : current_user_data.uid,
        type : 'enemy',
        id : id
      });
      location.assign("/view/enemy.html");
    }
  });


  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connet",user);
      socket.emit("require setting",user.uid);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    socket.emit("history",data.uid);
  });
  socket.on("user setting",function (data) {
    console.log(data);
    $("#default_cat_lv").attr('value',data.default_cat_lv);
    $("#show_cat_id").prop('checked',data.show_cat_id);
    $("#show_cat_count").prop('checked',data.show_cat_count);
  });


  socket.on("return history",function (history) {
    console.log(history);
    for(let i in history.cat){
      $("#history_cat").append(
        '<span class="card" type="cat" value="'+history.cat[i].id+'" '+
        'style="background-image:url('+
        image_url_cat+history.cat[i].id+'.png);">'+
        history.cat[i].name+'</span>');
    }
    for(let i in history.enemy)
      $("#history_ene").append(
        '<span class="card" type="enemy" value="'+history.enemy[i].id+'" '+
        'style="background-image:url('+
        image_url_enemy+history.enemy[i].id+'.png);">'+
        history.enemy[i].name+'</span>');
  });


});
