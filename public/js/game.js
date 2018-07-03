var gamesequene,open,clear,start,startTime,size=4,step;
const iconPic = "../public/css/footage/icon.png";
var catArr ;
$(document).ready(function () {
  var socket = io.connect();
  socket.emit("Game Picture");
  socket.on("Game Picture",(data)=>{
    console.log(data);
    for(let i in data){
      if(!data[i]){
        socket.emit("Game Picture");
        return
      }
    }
    catArr = data;
    initialGame(size);
  });
  $(document).on('click',".game_table td",function () {
    var coord = $(this).attr("id"),
        x = Number(coord.substring(1,2)),
        y = Number(coord.substring(3,4)),
        pos = x*size+y,
        ans = gamesequene[pos];
    if(clear.indexOf(coord)!=-1) {
      let data = new Cat(catArr[Decode(ans)]);
      displayCatData(data);
      scroll_to_class('display',0)
      return
    }
    if(!start) startTime = new Date().getTime();
    start = true;
    $(this).css({
      "background-image":"url(../public/css/footage/cat/u"+catArr[Decode(ans)].id+".png)",
      "background-blend-mode":"normal"
    });
    open.push({coord,ans});
    step ++ ;
    $(".game_result #step").text(step);
    if(open.length == 2){
      $(".game_table td").bind('click',noclick);
      if(open[0].ans!=open[1].ans)
        setTimeout(function () {
          $(".game_table td").unbind('click',noclick);
          $(".game_table td").each(function () {
            if(clear.indexOf($(this).attr('id'))==-1)
              $(this).css({
                "background-image":"url('"+iconPic+"')",
                "background-blend-mode":"multiply"
              });
          });
        },1000);
      else{
        $(".game_table td").unbind('click',noclick);
        clear.push(open[0].coord)
        clear.push(open[1].coord)
        let data = new Cat(catArr[Decode(open[0].ans)]);
        displayCatData(data);
      }
      open = [];
      checkEndState(clear);
    }
  });
  $("#again").click(function () { initialGame(size); });
  $("#switch").click(function () {
    size = size==4?6:4;
    $('.game_table').toggle();
    initialGame(size);
  });
  $("#confirm").click(function () {
    $(".game_table").css("filter","blur(0px)");
    $(".game_result").css("top",0);
  });
  setInterval(function () {
    if(start){
      var now = new Date().getTime(),
          pass = ((now-startTime)/1000).toFixed(0);
      $(".game_result #time").text((pass/60).toFixed(0)+":"+AddZero(pass%60));
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
noclick = function (event) {
  event.preventDefault();
  return false
}
function initialGame(size) {
  gamesequene = generateSequene(size);
  open = [];
  clear = [];
  start = false;
  step = 0;
  $(".game_table").css("filter","").find("td").each(function () {
    $(this).css({
      "background-image":"url('"+iconPic+"')",
      "background-blend-mode":"multiply"
    }).unbind('click',noclick);
  });
  $(".game_result").css("top","0px").children().eq(1).hide();
  $("#step").text(0);
  $("#time").text("0:00");
}
function generateSequene(size) {
  var set = [],gamesequene='';
  for(let i=0;i<(size*size/2);i++){
    let n = Math.ceil(Math.random()*18);
    n = String.fromCharCode(96+n);
    if(set.indexOf(n) == -1) set.push(n) ;
    else i--;
  }
  // console.log(set);
  var close = [];
  for(let i=0;i<(size*size);i++){
    let n = Math.floor(Math.random()*set.length);
    if(close.indexOf(set[n]) == -1){
      gamesequene += set[n];
      close.push(set[n]);
    } else {
      gamesequene += set[n];
      set.splice(n,1);
    }
  }
  console.log(gamesequene);
  return gamesequene
}
function checkEndState(clear) {
  if(clear.length == size*size) {
    // $(".game_table td").bind('click',noclick);
    console.log("finish!!");
    start = false;
    $(".game_table").css("filter","blur(5px)");
    $(".game_result").css("top",function () {
      return size==4?"-200px":"-300px"
    }).children().eq(1).show();
  }
}
function AddZero(n) {
  return n>9?n:"0"+n
}
function Decode(s) {
  s = s.charCodeAt(0);
  return s-97
}
