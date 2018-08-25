$(document).ready(function () {
  var socket = io.connect(),
      page = location.pathname.split('/')[2].split('.')[0];
  $(document).on('click','.cat,.enemy',function () {
    let id, multiple, type;
    // console.log(CurrentUserID);
    if (page == 'stage' || page == 'history'){
      id = $(this).attr("id"),
      multiple = $(this).next().text().split("％")[0],
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
    var type = data.type,
        buffer = data.buffer[0],
        data = type == 'cat'?new Cat(buffer.data):new Enemy(buffer.data),
        lv = buffer.lv;
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
    if(type == 'enemy') lv /= 100;
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
    window.parent.reloadIframe(type);
    window.parent.changeIframe(type);
    $(".floatDisplay_holder").hide();
  });
});
