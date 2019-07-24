var CurrentUserID;
var current_search = [];
var current_enemy_data = {};

$(document).ready(function () {

  var timer = new Date().getTime();

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
    if(data.last_enemy)
      socket.emit("required data",{
        type:'enemy',
        target:[{id:data.last_enemy,lv:"user"}],
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
        for(let j in last.query[i]) $(".normalTable").find(".button[name='"+last.query[i][j]+"']").click();
      }
      var value_search = false;
      for(let i in last.filterObj){
        $(".valueTable").find("th[id='"+i+"']").attr('active',last.filterObj[i].active?1:0)
          .next().children().attr({
          'value':last.filterObj[i].type==2?("["+last.filterObj[i].value+"]"):last.filterObj[i].value,
          'type':last.filterObj[i].type
        });
        filterSlider($(".valueTable").find("th[id='"+i+"']").next().children());
      }
    }
    if(data.compare_e2e) {
      $(".compareTarget").empty();
      $("#compare_number").text(data.compare_e2e.length);
      compare = [];
      for(let i in data.compare_e2e){
        let id = data.compare_e2e[i].id,
            name = new Enemy(data.compare_e2e[i]).Name;
        compareTargetAddCard(id,name)
        compare.push(id);
      }
    }
    if(data.setting.resultDataPreview){
      if(data.setting.resultDataPreview.cat) resultDataPreview.cat = data.setting.resultDataPreview.cat;
      if(data.setting.resultDataPreview.enemy) resultDataPreview.enemy = data.setting.resultDataPreview.enemy;
    }
  });
  $(document).on('click','.card, #selected>div',function () {
    if($(this).parent().parent().attr("class")=='compareTarget_holder') return
    else
      socket.emit("required data",{
        type:'enemy',
        target:[{id:$(this).attr('value')||$(this).attr("id"),lv:"user"}],
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
        value:0,
        optional:['tag'].concat(resultDataPreview.cat)
      });
      switchIframe("cat");
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
      case '特殊能力封印':
        c = '免疫古代詛咒'
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
      value:0,
      optional:['tag'].concat(resultDataPreview.cat)
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

  function displayEnemyData(data,lv = 1,count) {
    let html = "";

    $(".displayControl #out ").attr("href","http://battlecats-db.com/enemy/"+data.id+".html");
    $(".displayControl #addcart ").attr("value",data.id);

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
    $(".dataTable #title").html(
      "<div class='img'style='background-image:url(\""+data.image+
       "\")'active='1'></div><div class='name' active='1'>"+data.Name+"</div>");
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
