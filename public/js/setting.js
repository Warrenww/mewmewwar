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
  $(document).on('blur','#userName',function () {
    let val = $(this).val() ;
    if(!confirm("確定要將名字改為"+val+"嗎?")) return
    $("#current_user_name").text("Hi, "+val);
    socket.emit("rename",{uid:current_user_data.uid,name:val});
  });
  $(document).on("click","#reset_cat_lv",function () {
    let r = confirm("所有貓咪等級將重設為"+current_user_data.setting.default_cat_lv+"等");
    if(!r) return
    socket.emit("reset cat level",current_user_data.uid);
  });
  $(document).on("click","#reset_own_cat",function () {
    let r = confirm("要重置所有擁有的貓咪嗎?");
    if(!r) return
    socket.emit("reset owned cat",current_user_data.uid);
  });
  $(document).on("click","#logout",function () {
    if(!confirm("確定要登出嗎")) return
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
    }, function(error) {
      // An error happened.
    });
  });
  $(document).on("click","input[type='checkbox']",function () {
    let type = $(this).attr("id").split("show_")[1];
    socket.emit("change setting",{
      type:type,
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
  let cat_owned_show = 0;
  $(document).on("click","#own_cat",function () {
    if(!cat_owned_show){
      $("#cat_own").css({"height":560});
      $(this).css({transform:"rotate(0deg)"});
      scroll_to_div("cat_own")
    } else {
      $("#cat_own").css({"height":0});
      $(this).css({transform:"rotate(-90deg)"});
    }
    cat_owned_show = cat_owned_show ? 0 : 1 ;
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
      socket.emit("display cat",{
        uid : current_user_data.uid,
        cat : id,
        history:true
      });
      location.assign("/view/cat.html");
    } else if(type == 'enemy'){
      socket.emit("display enemy",{
        uid:current_user_data.uid,
        id:id,
        history:true
      });
      location.assign("/view/enemy.html");
    }
  });


  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",user);
      socket.emit("require setting",user.uid);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    socket.emit("history",data.uid);
    $("#userName").attr('value',data.name);
  });
  socket.on("user setting",function (data) {
    console.log(data);
    for(let i in data){
      if(i == "default_cat_lv"){
        $("#default_cat_lv").attr('value',data.default_cat_lv);
      } else {
        $("#"+i).prop('checked',data[i]);
      }
    }
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
    for(let i in history.owned)
      $("#cat_own").append(
        '<span class="card" type="cat" value="'+history.owned[i].id+'" '+
        'style="background-image:url('+
        image_url_cat+history.owned[i].id+'.png);">'+
        history.owned[i].name+'</span>');
  });


});
