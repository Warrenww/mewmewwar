var CurrentUserID;
var UserHistory = {
      cat:{},enemy:{},stage:{},gacha:{},combo:{}
    },cat_history,
    enemy_history,
    combo_history,
    stage_history,
    last_gacha;
$(document).ready(function () {
  var timer = new Date().getTime();

  auth.onAuthStateChanged(function(user) {
    if (user)  socket.emit("user connect",{user:user,page:location.pathname});
    else  {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    CurrentUserID = data.uid;
    UserHistory.cat = data.history.cat;
    UserHistory.enemy = data.history.enemy;
    UserHistory.stage = data.history.stage;
    UserHistory.combo = data.history.combo;
    UserHistory.gacha = data.history.gacha;
    var historyPage = 'cat';
    if(Storage){
      historyPage = localStorage.historyPage?localStorage.historyPage:'cat';
    }
    $(".title span[id='"+historyPage+"']").click();
    // appendHistory(historyPage?historyPage:"cat");
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
      $(this).attr('value',1).siblings().attr('value',0);
      if(type == 'cat') appendHistory("cat");
      else if(type == 'enemy') appendHistory("enemy");
      else if(type == 'stage') appendHistory("stage");
      else if (type == 'gacha') appendHistory("gacha");
    }
    if(Storage){
      localStorage.historyPage = type;
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
    switchIframe(type);
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

  if (yy != today.getFullYear()) return yy+"/"+mm+"/"+dd+" "+h+":"+m ;
  else if (dd == today.getDate()&&mm == today.getMonth()+1) return "今天 "+h+":"+m ;
  else if(dd == today.getDate()-1&&mm == today.getMonth()+1) return "昨天 "+h+":"+m ;
  else return mm+"/"+dd+" "+h+":"+m ;


}
function appendHistory(type) {
  var data = UserHistory[type], count = 0;
  if(!data) return;
  $(".main_board").empty();
  for(let i in data){
    $(".main_board").prepend("<div id='"+data[i].id+"' class='"+type+"'>"+
      historyPicture(type,data[i].id,data[i].stage)+
      historyName(type,data[i].name,data[i].lv,data[i].stage)+
      "<span class='time'>"+parseTime(data[i].time)+"</span>"+
      "</div>");
    count ++;
  }
  if(count == 0) $(".main_board").prepend(createHtml("div","無歷程記錄"))
}
function historyPicture(type,id,stage=null) {
  if(type == 'cat') return "<img src='"+Unit.imageURL('cat',id+'-'+(stage?stage:1))+"'>";
  else if(type == 'enemy') return "<img src='"+Unit.imageURL('enemy',id)+"'>";
  else if(type == 'stage') return "<button class='stageBG' bg='"+stage+"' value='0'></button>";
  else if(type == 'gacha') return "<img src='"+image_url_gacha+id+".png'>";
}
function historyName(type,regular,bold,stage=null) {
  if(type == 'cat') return "<span class='name'><b>Lv."+bold+"</b>"+regular[stage-1]+"</span>";
  else if(type == 'enemy') return "<span class='name'><b>"+bold*100+"%</b>"+regular+"</span>";
  else if(type == 'stage') return "<span class='name'><b>"+regular[1]+"\t</b>"+regular[0]+"</span>";
  else if(type == 'gacha'){
    var temp =  "<ww style='display:flex;flex-direction:column;flex:2;align-items:center'>"+
                "<span class='name'><b>"+regular+"</b></span>"+"<ww style='font-size:14px;font-weight:bold'>"+
                "<span style='color:#18a651'>稀有 : "+(stage[0]?stage[0]:0)+"\t</span>"+
                "<span style='color:#eeb62e'>激稀有 : "+(stage[1]?stage[1]:0)+"\t</span>"+
                "<span style='color:#8e18a6'>超激稀有 : "+(stage[2]?stage[2]:0)+"\t</span>"+
                "<span style='color:#f95656'>傳說稀有 : "+(stage[3]?stage[3]:0)+"\t</span>"+
                "</ww></ww>";
    return temp
  }
}
