var CurrentUserID;
$(document).ready(function () {
  var timer = new Date().getTime();

  var cat_history,enemy_history,combo_history,stage_history,last_gacha;

  auth.onAuthStateChanged(function(user) {
    if (user)  socket.emit("user connect",{user:user,page:location.pathname});
    else  {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    CurrentUserID = data.uid;
    cat_history = data.history.cat;
    enemy_history = data.history.enemy;
    stage_history = data.history.stage;
    combo_history = data.history.combo;
    gacha_history = data.history.gacha;
    if(cat_history){
      $(".main_board").empty();
      for(i in cat_history){
        $(".main_board").prepend("<div id='"+cat_history[i].id+"' class='cat'>"+
          "<img src='"+image_url_cat+cat_history[i].id+".png'>"+
          "<span class='name'><b>Lv."+cat_history[i].lv+" </b>"+
          cat_history[i].name+"</span>"+
          "<span class='time'>"+parseTime(cat_history[i].time)+"</span>"+
          "</div>");
      }
    }
  });

  $(".title span").hover(function () {
    let width = $(this)[0].offsetWidth,
        left = $(this).offset().left-$(this).parent().offset().left;
    // console.log(width,left);
    $(this).siblings("div").css({width:width,left:left});
  },function () { $(this).siblings("div").css('width',0)});

  $(".title span").click(function () {
    let type = $(this).attr("id"),
        active = Number($(this).attr("value"));
    if(!active){
      $(".main_board").empty();
      $(this).attr('value',1).siblings().attr('value',0);
      if(type == 'cat'){
        for(i in cat_history){
          $(".main_board").prepend("<div id='"+cat_history[i].id+"' class='cat'>"+
            "<img src='"+image_url_cat+cat_history[i].id+".png'>"+
            "<span class='name'><b>Lv."+cat_history[i].lv+" </b>"+
            cat_history[i].name+"</span>"+
            "<span class='time'>"+parseTime(cat_history[i].time)+"</span>"+
            "</div>");
        }
      }
      else if(type == 'enemy'){
        for(i in enemy_history){
          $(".main_board").prepend("<div id='"+enemy_history[i].id+"' class='enemy'>"+
            "<img src='"+image_url_enemy+enemy_history[i].id+".png'>"+
            "<span class='name'><b>"+Number(enemy_history[i].lv)*100+"% </b>"+
            enemy_history[i].name+"</span>"+
            "<span class='time'>"+parseTime(enemy_history[i].time)+"</span>"+
            "</div>");
        }
      }
      else if(type == 'stage'){
        for(i in stage_history){
          $(".main_board").prepend("<div id='"+stage_history[i].id+"' class='stage'>"+
            "<button id='"+stage_history[i].chapter+"' value='0'></button>"+
            "<span class='name'><b>"+stage_history[i].stage+" </b>"+
            stage_history[i].level+"</span>"+
            "<span class='time'>"+parseTime(stage_history[i].time)+"</span>"+
            "</div>");
        }
      }
      else if (type == 'gacha') {
        for(i in gacha_history){
          $(".main_board").prepend(
            "<div id='"+gacha_history[i].id+"' class='gacha' style='background-image:url()'>"+
            "<img src='"+image_url_gacha+gacha_history[i].id+".png'>"+
            "<ww style='display:flex;flex-direction:column;flex:2;align-items:center'>"+
            "<span class='name'><b>"+ gacha_history[i].name+"</b></span>"+
            "<ww style='font-size:14px;font-weight:bold'>"+
            "<span style='color:#18a651'>稀有 : "+gacha_history[i].r+"\t</span>"+
            "<span style='color:#eeb62e'>激稀有 : "+gacha_history[i].sr+"\t</span>"+
            "<span style='color:#8e18a6'>超激稀有 : "+gacha_history[i].ssr+"\t</span></ww></ww>"+
            "<span class='time'>"+parseTime(gacha_history[i].time)+"</span>"+
            "</div>");
        }
      }
    }
  });
  $(document).on('click',".main_board div",function () {
    let type = $(this).attr("class"),
        id = $(this).attr("id");

    if(type == 'cat'||type == 'enemy') return
    socket.emit("set history",{
      type:type,
      uid:CurrentUserID,
      target:id
    });
    if(window.parent.reloadIframe){
      window.parent.reloadIframe(type);
      window.parent.changeIframe(type);
    } else {
      window.open("/"+type,"_blank");
    }
  });

});
function parseTime(n) {
  if(!n) return "未知時間"
  let time = new Date(n),
      yy = time.getFullYear(),
      mm = time.getMonth()+1,
      dd = time.getDate(),
      h = AddZero(time.getHours()),
      m = AddZero(time.getMinutes()),
      today = new Date();
  if (dd == today.getDate()&&mm == today.getMonth()+1) return "今天 "+h+":"+m
  else if(dd == today.getDate()-1&&mm == today.getMonth()+1) return "昨天 "+h+":"+m
  else if(yy == today.getFullYear()) return mm+"/"+dd+" "+h+":"+m
  else return yy+"/"+mm+"/"+dd+" "+h+":"+m

}
