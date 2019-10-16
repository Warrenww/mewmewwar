var FloatDisplayMutex = true; // handle synchronization problem
$(document).ready(function () {
  var page = location.pathname.split('/')[1];
  $(document).on('click','.cat,.enemy',function (e) {
    e.stopPropagation();
    var id, multiple, type;
    if (page == 'stage' || page == 'history'){
      id = $(this).attr("id"),
      multiple = (is_mobile?$(this).parent().next().children().first():$(this).next()).text().split("％")[0],
      type = $(this).attr("class");
    } else {
      id = $(this).attr('value');
      type = 'cat';
    }
    if (page == 'history') multiple = "user";
    socket.emit("required data",{
      type:type,
      target:[{id:id,lv:multiple}],
      record:false,
      uid:CurrentUserID
    });
  });

  socket.on("required data",(data)=>{
    if(!FloatDisplayMutex) {FloatDisplayMutex = true;return;}
    // console.log(data);
    var type = data.type,
        buffer = data.buffer[0],
        data = type == 'cat'?new Cat(buffer.data.data[buffer.currentStage]):new Enemy(buffer.data),
        lv = buffer.lv;

    if(type === 'enemy') lv /= 100;

    $(".floatDisplay_holder").fadeIn();
    $(".floatDisplay .dataTable #lv").text(lv);
    $(".floatDisplay .dataTable .img").css('background-image','url("'+data.imgURL+'")');
    for (let i in data){
      if(i==='hp'||i==='hardness'||i==='atk'||i==='dps')
        $(".floatDisplay .dataTable").find("#"+i).text(data.Tovalue(i,lv));
      else if(i === 'aoe')
        $(".floatDisplay .dataTable").find("#"+i).text(data.Aoe);
      else if(i === 'char')
        $(".floatDisplay .dataTable").find("#"+i).html(data.CharHtml(lv));
      else if(i === 'color')
        $(".floatDisplay .dataTable").find("#"+i).html(data.Color);
      else
        $(".floatDisplay .dataTable").find("#"+i).text(data[i]);
    }
    $(".floatDisplay .dataTable #title").html(
      "<div class='img'style='background-image:url(\""+data.image+
       "\")'active='1'></div><div class='name' active='1'>"+data.Name+"</div>");
    if(type == 'cat') $(".ForCat").show().next().hide();
    else $(".ForCat").hide().next().show();

    $(".floatDisplay div span").attr({"type":type,id:data.id});
    $(document).bind('keydown',handleEscKey);
  });
  $(".floatDisplay_holder").click(()=>{
    $(".floatDisplay_holder").fadeOut();
    $(document).unbind('keydown',handleEscKey);
  })

  $(".floatDisplay div span").click(()=>{
    var type = $('.floatDisplay div span').attr('type'),
        id = $('.floatDisplay div span').attr('id'),
        lv = Number($(".floatDisplay .dataTable #lv").text());
    socket.emit("store level",{
      uid : CurrentUserID,
      id : id,
      lv : lv,
      type : type
    });
    socket.emit("set history",{
      type:type,
      target:id,
      uid:CurrentUserID
    });
    switchIframe(type);
    $(".floatDisplay_holder").hide();
    $(document).unbind('keydown',handleEscKey);
  });
  var handleEscKey = (e) => {
    if(e.key === 'Escape'){
      $(".floatDisplay_holder").hide(100);
      $(document).unbind('keydown',handleEscKey);
    }
  }
});
