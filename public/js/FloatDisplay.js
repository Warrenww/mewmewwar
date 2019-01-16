var FloatDisplayMutex = true; // handle synchronization problem
$(document).ready(function () {
  var page = location.pathname.split('/')[1];
  $(document).on('click','.cat,.enemy',function (e) {
    e.stopPropagation();
    var id, multiple, type;
    // console.log(CurrentUserID);
    if (page == 'stage' || page == 'history'){
      id = $(this).attr("id"),
      multiple = (is_mobile?$(this).parent().next().children().first():$(this).next()).text().split("％")[0],
      type = $(this).attr("class");
    } else {
      id = $(this).attr('value');
      type = 'cat';
    }
    if (page == 'history') multiple = null;
    socket.emit("required data",{
      type:type,
      target:id,
      record:false,
      uid:CurrentUserID,
      lv:multiple
    });
  });

  socket.on("required data",(data)=>{
    if(!FloatDisplayMutex) {FloatDisplayMutex = true;return;}
    console.log(data);
    var type = data.type,
        buffer = data.buffer[0],
        data = type == 'cat'?new Cat(buffer.data.data[buffer.currentStage]):new Enemy(buffer.data),
        lv = buffer.lv/(type == "enemy"?100:1);
    $(".floatDisplay_holder").fadeIn();
    $(".floatDisplay .dataTable #lv").text(lv);
    $(".floatDisplay .dataTable .img").css('background-image','url("'+data.imgURL+'")');
    for (let i in data){
      if(i=='hp'||i=='hardness'||i=='atk'||i=='dps')
        $(".floatDisplay .dataTable").find("#"+i).text(data.Tovalue(i,lv));
      else if(i == 'name')
        $(".floatDisplay .dataTable").find("."+i).text(data.Name);
      else if(i == 'aoe')
        $(".floatDisplay .dataTable").find("#"+i).text(data.Aoe);
      else if(i == 'char')
        $(".floatDisplay .dataTable").find("#"+i).html(data.CharHtml(lv));
      else
        $(".floatDisplay .dataTable").find("#"+i).text(data[i]);
    }
    if(type == 'cat') $(".ForCat").show().next().hide();
    else $(".ForCat").hide().next().show();

    $(".floatDisplay div span").attr({"type":type,id:data.id});

  });
  $(".floatDisplay_holder i").click(()=>{$(".floatDisplay_holder").fadeOut();})
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
    if(window.parent.reloadIframe){
      window.parent.reloadIframe(type);
      window.parent.changeIframe(type);
    } else {
      window.open("/"+type,"_blank");
    }
    $(".floatDisplay_holder").hide();
  });
});
