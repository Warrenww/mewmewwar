var startTime,
    start = false,
    speed = 1,
    score = 0,
    on_ground = true,
    jumpCD = false,
    dropTimeOut,
    enemyTimeOut;
$(document).ready(function () {
  var socket = io.connect();
  $(document).keydown(function (event) {
    // console.log(event);
    if(event.keyCode == 32){
      if(start){
        jump();
      }
      return false
    }
    if(event.keyCode == 27){
      EndGame();
    }
  });
  $(document).keyup(function (event) {
    if(event.keyCode == 32){
      if(!start){
        initialGame()
      } else {
        drop()
      }
    }
  });

  setInterval(function () {
    if(start){
      $(".scene").css("background-position-x","-="+speed+"px");
      score += speed;
      $(".scoreBoard #score").text(Math.ceil(score/10));
      speed = Math.floor(Math.log(score)*2)+1;
      $(".enemy").css("left","-="+speed+"px");
      updateScene();
    }
  },100);
  setInterval(function () {
    if(start){
      var now = new Date().getTime(),
          pass = ((now-startTime)/1000).toFixed(0);
      $(".scoreBoard #time").text((pass/60).toFixed(0)+":"+AddZero(pass%60));
    }

  },1000);

  function displayCatData(data,lv=30) {
    let html = "",
        id = data.id,
        grossID = id.substring(0,3),
        maxState = id.substring(3,4)
        arr = [];
    for(let i = Number(maxState)-1;i>0;i--) arr.push(grossID+"-"+i)
    for (let i in data){
      if(i=='hp'||i=='hardness'||i=='atk'||i=='dps')
        $(".dataTable").find("#"+i).text(data.Tovalue(i,lv));
      else if(i == 'name')
        $(".dataTable").find("."+i).text(data.Name);
      else if(i == 'aoe')
        $(".dataTable").find("#"+i).text(data.Aoe);
      else if(i == 'char')
        $(".dataTable").find("#"+i).html(data.CharHtml(lv));
      else if(i == 'condition')
        $(".dataTable").find("#"+i).html(data.CondHtml());
      else
        $(".dataTable").find("#"+i).text(data[i]);
    }
    $(".dataTable").find('.img').css('background-image','url("'+data.imgURL+'")');
  }

});
function initialGame(size) {
  start = true;
  startTime = new Date().getTime();
  score = 0;
  speed = 1;
  on_ground = true;
  $(".cat").css("bottom",50);
  $(".scene").css({
    "background-position-x":"0%",
    "filter":"blur(0px)"
  });
  $("#step").text(0);
  $("#time").text("0:00");
  $(".enemy").remove();
  generateEnemy();
}
function EndGame() {
  start = false;
  $(".scene").css("filter","blur(5px)");
  clearTimeout(enemyTimeOut);
}
function jump() {
  if(on_ground && !jumpCD){
    on_ground = false;
    jumpCD = true;
    $(".cat").animate({bottom:"+=100px"},300,'linear');
    dropTimeOut = setTimeout(drop,1000);
  }
}
function drop() {
  clearTimeout(dropTimeOut);
  if(!on_ground){
    on_ground = true;
    $(".cat").animate({bottom:"-=100px"},300,'linear',function () {
      setTimeout(function () {jumpCD = false; },100);
    });
  }
}
function generateEnemy() {
  $(".scene").append('<span class="enemy"></span>');
  if(start){
    enemyTimeOut = setTimeout(generateEnemy,2000);
  }
}
function updateScene() {
  var cat_x = Number($(".cat").css("left").split('px')[0]),
      cat_y = Number($(".cat").css("bottom").split('px')[0]);
  // console.log("------------");
  // console.log("cat : ",cat_x,cat_y);
  $(".enemy").each(function () {
    let x = Number($(this).css("left").split('px')[0]),
        y = Number($(this).css("bottom").split('px')[0]),
        w = Number($(this).css("width").split('px')[0]),
        h = Number($(this).css("height").split('px')[0]);
    if(x < -100) $(this).remove();
    console.log(x,y,w,h);
    if(x-25<cat_x&&x+25>cat_x){
      if(cat_y<y+h/2){
        console.log("Hit!!!");
        EndGame();
      }
    }
  });
}
function AddZero(n) {
  return n>9?n:"0"+n
}
function random(min = 0,max = 1,tofixed = 0) {
  var width = max-min,
      rand = Math.random()*width;
  return Number((min + rand).toFixed(tofixed))
}
