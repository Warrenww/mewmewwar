var type = location.pathname.split("/")[1],
    compare = [];
$(document).ready(function () {

  $(document).on('click','.glyphicon-shopping-cart',function () {
    var target = $(this).parent().children(".card:visible").attr('value'),
        name = $(this).parent().children(".card:visible").attr('name');
        target = target.split("-");
        // console.log(target[0],name,target[1]);
    addToCompare(target[0],name,target[1]);
  });
  $(document).on('click',"#addcart", function () {
    var target = $(this).attr('value'),
        stage = Number($(".dataTable").find(".img[active='1']").attr('stage')),
        name = $(".dataTable").find(".name").eq(stage).text().split(" ")[0];
    if(!target) return;
    stage = type == 'cat'?Number(stage)+1:null;
    addToCompare(target,name,stage);
  });
  //compare tag for cat and enemy
  $(document).on('click','#compareTarget_tag',showhidecomparetarget);

  $(document).on('click','.compareTarget .card',function (e) {
    let pos_y = (e.clientY/10).toFixed(0)*10,pos_x = 100 ;
    $('.compare_panel').remove();
    $("#compare_panel_BG").fadeIn();
    $('body').append(
      "<div class='compare_panel' id='"+
      $(this).attr('value')+
      "'><span id='show'>顯示</span><span id='del'>刪除</span></div>");
    $('.compare_panel').css({top:pos_y,left:pos_x}).animate({height:60},400);
    $('.compare_panel #show').click(function () {
      socket.emit("required data",{
        type:type,
        target : $(this).parent().attr('id'),
        record:true,
        uid:CurrentUserID
      });
      showhidecomparetarget();
      $("#compare_panel_BG").fadeOut();
      $('.compare_panel').css('height',0);
    });
    $('.compare_panel #del').click(function () {
      let target = $(".compareTarget .card[value='"+$(this).parent().attr('id')+"']");
      let r = confirm("確定要將"+target.text()+"從比較列中移除?") ;
      if(!r) return
      for(let i in compare){if(compare[i] == target.attr('value')) compare.splice(i,1)}
      target.remove();
      console.log(compare);
      $("#compare_number").text(compare.length);
      socket.emit("Set Compare",{type:type,id:CurrentUserID,target:compare});
      $("#compare_panel_BG").fadeOut();
      $('.compare_panel').css('height',0);
    });
  });
  $("#clear_compare").click(function () {
    let r = confirm("確定要全部移除?!");
    if(!r)return
    showhidecomparetarget();
    $(this).parent().siblings().children().html("");
    compare = [];
    $("#compare_number").text(compare.length);
    socket.emit("Set Compare",{type:type,id:CurrentUserID,target:compare});
  });
  $("#start_compare").click(function () {
    var windowName = type == 'cat'?'compareCat':'compareEnemy';
    if(compare.length == 0){
      alert("購物車中沒有東西!!!!");
      return
    }
    if(window.parent.reloadIframe){
      window.parent.reloadIframe(windowName);
      window.parent.changeIframe(windowName);
    } else {
      window.open("/"+windowName,"_blank");
    }
  });
  $('body').append("<div id='compare_panel_BG'></div>");
  $(document).on('click','#compare_panel_BG',function () {
    $("#compare_panel_BG").fadeOut();
    $('.compare_panel').css('height',0);
  });
});
function compareTargetAddCard(target,name,stage=null) {
  $(".compareTarget").append(
      '<span class="card" value="'+target+
      '" style="background-image:url('+
      Unit.imageURL(type,target+(stage?('-'+stage):''))+
      '" name="'+name+'"></span>');
}
function addToCompare(target,name='',stage=null) {
  $('.compare_panel').css('height',0);
  if(showcomparetarget) showhidecomparetarget();
  compare = []
  $(".compareTarget").children().each(function () {
    compare.push($(this).attr("value"));
  });
  if(compare.indexOf(target) != -1) {
    let repeat = $('.compareTarget').find('[value='+target+']') ;
    repeat.css('border-color','rgb(237, 179, 66)');
    $(".compareTarget_holder").animate({
      scrollTop : repeat[0].offsetTop-100
    },800,'easeInOutCubic');
    setTimeout(function () {
      repeat.css('border-color','white');
    },1000);
  } else {
    compareTargetAddCard(target,name,stage)
    $('.compareTarget_holder').animate({
      scrollTop : $('.compareTarget').height()
    },500,'easeInOutCubic');
    compare = [];
    $(".compareTarget").children().each(function () {
      compare.push($(this).attr("value"));
    });
    $("#compare_number").text(compare.length);
    socket.emit("Set Compare",{type:type,id:CurrentUserID,target:compare});
  }
}
function showhidecomparetarget() {
  $('.compare_panel').css('height',0);
  if(showcomparetarget){
    $('.compareTarget_holder').css('left',0);
    $('#compareTarget_tag').css('left',180).children('i').css({"transform":"rotate(180deg)"});
  } else {
    $('.compareTarget_holder').css('left',-180);
    $('#compareTarget_tag').css('left',0).children('i').css({"transform":"rotate(0deg)"});
  }
  showcomparetarget = showcomparetarget ? 0 : 1 ;
}
