var CurrentUserID;
var current_search = [];

$(document).ready(function () {

  var timer = new Date().getTime();
  var current_enemy_data = {};

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    // console.log(data);
    CurrentUserID = data.uid ;
    if(data.last_enemy && location.pathname.indexOf("once") == -1)
      socket.emit("required data",{
        type:'enemy',
        target:data.last_enemy,
        record:true,
        uid:data.uid
      });
    if(data.last_enemy_search){
      let last = data.last_enemy_search;
      if(last.query){
        socket.emit("normal search",last);
        if(Number(last.colorAnd)) $(".select_color").prev().click();
        if(Number(last.abilityAnd)) $(".select_ability").prev().click();
      } else {
        last.query = {};
        socket.emit("normal search",last);
      }
      for(let i in last.query){
        for(let j in last.query[i]) $("#upper_table").find(".button[name='"+last.query[i][j]+"']").click();
      }
      var value_search = false;
      for(let i in last.filterObj){
        $("#lower_table").find("th[id='"+i+"']").attr({
          'active':last.filterObj[i].active,
          'value':last.filterObj[i].type==2?("["+last.filterObj[i].value+"]"):last.filterObj[i].value,
          'type':last.filterObj[i].type
        }).click();
        if(last.filterObj[i].active) value_search = true;
      }
      if(value_search) $("#value_search").click();
    }
    if(data.compare_e2e) {
      $(".compareTarget").empty();
      $("#compare_number").text(data.compare_e2e.length)
      for(let i in data.compare_e2e){
        let id = data.compare_e2e[i].id,
            name = new Enemy(data.compare_e2e[i]).Name;
        compareTargetAddCard(id,name)
      }
      compare = data.compare_e2e;
    }
    if(!data.setting.show_enemy_id)
      $('.display').find("#id").css({'background-color':'transparent','color':'transparent'})
        .prev().css({'background-color':'transparent','color':'transparent'});
    if(!data.setting.show_enemy_count)
      $('.display').find("#count").css({'background-color':'transparent','color':'transparent'})
        .prev().css({'background-color':'transparent','color':'transparent'});
  });

  $(document).on('click','.filter_option',function () {
    $("#slider_holder").show();
    $(this).css('border-bottom','5px solid rgb(241, 166, 67)').siblings().css('border-bottom','0px solid');
    filter_name = $(this).attr('id') ;
    filterSlider($(this));
  });
  $(document).on('click','.card',function () {
    if($(this).parent().parent().attr("class")=='compareTarget_holder') return
    else
      socket.emit("required data",{
        type:'enemy',
        target:$(this).attr('value'),
        record:true,
        uid:CurrentUserID
      });
  });

  $(document).on('click','#char #type',function () {
    let type = $(this).text(),
        reverse = ReverseType(type),
        norev = ['增攻','會心一擊','復活','地中移動','對貓咪城傷害x4','遠方攻擊'];

    if(type.indexOf('連續攻擊')==-1&&type.indexOf('免疫')==-1&&norev.indexOf(type)==-1){
      socket.emit("normal search",{
        uid:CurrentUserID,
        query:{rFilter:[],cFilter:[],aFilter:[reverse]},
        query_type:'normal',
        filterObj:{},
        type:"cat",
        value:0
      });
      if(window.parent.reloadIframe){
        window.parent.reloadIframe('cat');
        window.parent.changeIframe('cat');
      } else {
        window.open("/cat","_blank");
      }
    }
  });
  function ReverseType(c) {
    c = c.split("(")[0] ;
    switch (c) {
      case '護盾':
        c = '破盾'
        break;
      case '鋼鐵 ':
        c = '爆擊'
        break;
      case '重生':
        c = '不死剋星'
        break;
      default:
        c = '免疫'+c
    }
    return c
  }
  $(document).on('click','#color',function () {
    let type = current_enemy_data.color;
    for(let i in type){
      if(type[i].indexOf("(星)")!=-1) type[i] == ''
      else type[i] = '對'+type[i].substring(0,2);
    }
    socket.emit("normal search",{
      uid:CurrentUserID,
      query:{rFilter:[],cFilter:type,aFilter:[]},
      query_type:'normal',
      filterObj:[],
      type:"cat",
      value:0
    });
    if(window.parent.reloadIframe){
      window.parent.reloadIframe('cat');
      window.parent.changeIframe('cat');
    } else {
      window.open("/cat","_blank");
    }

  })
  var original_lv ;
  $(document).on('click',"#level_num span",function () {
    let org = $(this).text().split(" ")[0];
    original_lv = org ;
    $(this).html("<input type='number' value='"+org+"' />");
    $(this).find("input").select();
  });
  $(document).on('blur',"#level_num span input",function () {
    let org = $(this).val();
    org = (org/50).toFixed(0)*50;
    if(org<100||org>1e6){
      $(this).parent().html(original_lv+" %");
    } else {
      $(this).parent().html(org+" %");
      updateState(org/100);
    }
  });

  socket.on("required data",(data)=>{
    console.log(data);
    data = data.buffer;
    _data = new Enemy(data[0].data);
    current_enemy_data = _data;
    $(".dataTable").attr("id",_data.id);
    displayEnemyData(_data,data[0].lv,data[0].count) ;
  });

  function displayEnemyData(data,lv,count) {
    let html = "";

    $("#more_option #out ").attr("href","http://battlecats-db.com/enemy/"+data.id+".html");

    for (let i in data){
      if(i=='hp'||i=='hardness'||i=='atk'||i=='dps')
        $(".dataTable").find("#"+i).text(data.Tovalue(i,lv));
      else if(i == 'name')
        $(".dataTable").find("."+i).text(data.Name);
      else if(i == 'aoe')
        $(".dataTable").find("#"+i).text(data.Aoe);
      else if(i == 'char')
        $(".dataTable").find("#"+i).html(data.CharHtml(lv));
      else if(i == 'count')
        $(".dataTable").find("#"+i).text(count);
      else
        $(".dataTable").find("#"+i).text(data[i]);
    }
    $(".dataTable").find('.img').css('background-image','url("'+data.imgURL+'")');
    $(".dataTable").find("#level_num").children().text(lv*100+" %");
    scroll_to_class("display",0) ;
  }
  function updateState(level) {
    let change = ['hp','hardness','atk','dps'] ;
    for(let i in change){
      let target = $('.dataTable').find('#'+change[i]) ;
      let original = target.attr('original');
      target.html(current_enemy_data.Tovalue(change[i],level))
            .css('background-color',' rgba(242, 213, 167, 0.93)');
      setTimeout(function () {
        target.css('background-color','rgba(255, 255, 255, .9)');
      },500);
    }
    if(current_enemy_data.serial){
      let target = $('.dataTable').find('#char');
      target.html(current_enemy_data.CharHtml(level));
    }
    socket.emit("store level",{
      uid : CurrentUserID,
      id : current_enemy_data.id,
      lv : level,
      type : 'enemy'
    });
  }
  $(".slider").slider();
  $(document).on("click","#share",function () {
    let id = $(this).parents("#more_option").siblings().attr("id"),
        lv = $(this).parents("#more_option").siblings().find("#level_num").children("span").text().split(" %")[0],
        host = location.origin;
    $(this).append(
      "<input type='text' value='"+
      host+"/view/once.html?q=enemy&"+
      id+"&"+lv+"' style='position:fixed;top:-100px'/>"
    );
    $(this).find("input").select();
    document.execCommand("Copy");
    $("#copy_alert").css("left",-10);
    setTimeout(function () {
      $(this).find("input").remove();
      $("#copy_alert").css("left",-250);
    },2600);
  });

});

function mutipleValue(value,m) {
  // console.log(value+":"+m);
  return value*m
}
function serialATK(prop,atk) {
    let b = prop.split("（")[0];
    let arr = prop.split("（")[1].split("）")[0].split(","),
        c = prop.split("（")[1].split("）")[1];
        // console.log(atk)
    // console.log("("+arr.join()+")")
    for(let i in arr) arr[i] = (atk*Number(arr[i])).toFixed(0) ;
    // console.log(arr.join())
    return b+"（"+arr.join(' ')+"）"+c ;
}
function addColor(str) {
  let a = str.split('['),
      b = [] ;
  for(let i in a) b.push(a[i].split(']')[0]) ;
  return b.join(" ")
}
