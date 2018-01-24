$(document).ready(function () {
  var socket = io.connect();
  var timer = new Date().getTime();
  var current_user_data = {};
  var current_enemy_data = {};
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",user);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    if(data.last_enemy && location.pathname.indexOf("once") == -1)
    socket.emit("display enemy",{uid:data.uid,id:data.last_enemy,history:true});
    show_more = !data.setting.show_more_option;
    if(data.last_enemy_search){
      let last = data.last_enemy_search;
      socket.emit("search",{
        uid:data.uid,
        rFilter:last.rFilter?last.rFilter:[],
        cFilter:last.cFilter?last.cFilter:[],
        aFilter:last.aFilter?last.aFilter:[],
        gFilter:last.gFilter?last.gFilter:[],
        filterObj:last.otherFilter?last.otherFilter:[],
        type:"enemy"
      });
      for(let i in last){
        if(i == 'otherFilter'){
          for(let j in last[i]){
            $("#lower_table").find("th[id='"+last[i][j].name+"']")
              .attr({'active':true,'value':last[i][j].limit,'reverse':last[i][j].reverse})
              .click();
          }
        }
        else for(let j in last[i]) $("#upper_table").find(".button[name='"+last[i][j]+"']").click();
      }
    }
  });

  var color = ['紅敵','浮敵','黑敵','鋼鐵敵','天使敵','外星敵','外星敵(星)','不死敵','白敵','無屬性敵'];
  for(let i in color) $(".select_color").append("<span class='button' name='["+color[i]+"]' value='0'>"+color[i]+"</span>") ;

  var ability = ['增攻','降攻','免疫降攻','爆擊','擊退','免疫擊退','連續攻擊',
                '緩速','免疫緩速','暫停','免疫暫停','遠方攻擊','復活','波動','免疫波動',
                '攻城','傳送','盾'];
  for(let i in ability) $(".select_ability").append("<span class='button' name='["+ability[i]+"]' value='0'>"+ability[i]+"</span>") ;

  $(document).on('click','.filter_option',filterSlider);
  $(document).on('click','#searchBut',function () {
    let keyword = $(this).siblings().val();
    socket.emit("text search",{key:keyword,type:'enemy'});
  });
  $(document).on('keypress','#searchBox',function (e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      let keyword = $(this).val();
      socket.emit("text search",{key:keyword,type:'enemy'});
    }
  });
  $(document).on('click','#search_ability',search) ;
  $(document).on('click','.card',function () {
    socket.emit("display enemy",{
      uid:current_user_data.uid,
      id:$(this).attr('value'),
      history:true
    });
  });
  $(document).on('click',"#level_num button",function () {
    let n = $(this).text().split("%")[0],
        buffer = org = $(this).siblings("span").text().split(" ")[0];
    org = Number(org)+Number(n);
    if(org<100||org>1e6){
      $(this).siblings("span").text(buffer+" %");
    } else {
      $(this).siblings("span").text(org+" %");
      updateState(org/100);
    }
  });
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

  $(document).on('click',"#upper_table .button",function () {
    $("body").bind('keypress',quickSearch);
    setTimeout(function () {
      $("body").unbind('keypress',quickSearch);
    },5000);
  });
  function quickSearch(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) search();
    $("body").unbind('keypress',quickSearch);
  }

  function TextSearch() {
    let keyword = $("#searchBox").val();
    let buffer = [] ;
    for(let id in enemydata){
      if(enemydata[id].name.indexOf(keyword) != -1) buffer.push(enemydata[id]) ;
    }
    console.log(buffer);
    $("#selected").empty();
    $("#selected").scrollTop(0);
    $("#selected").append(condenseEnemyName(buffer));
    $(".button_group").css('display','flex');
    scroll_to_div('selected');
  }
  function condenseEnemyName(data) {
    let html = '' ;
    for(let i in data){
      let name = data[i].name;
      let id = data[i].id ;
      html += '<span class="card" value="'+id+'" '+
      'style="background-image:url('+
       image_url_enemy+id+'.png'
      +')">'+
      name+'</span>'
      number_page ++ ;
    }
    return html ;
  }
  function search() {
    let color = $(".select_color [value=1]"),
        ability = $(".select_ability [value=1]");
    let cFilter = [], aFilter = [], rFilter = [], filterObj = [],gFilter = [] ;
    for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;

    console.log(cFilter);
    console.log(aFilter);

    $(".filter_option[active='true']").each(function () {
      let name = $(this).attr('id'),
          reverse = $(this).attr('reverse') == 'true' ? true : false ,
          limit = $(this).attr('value') ,
          level_bind = $(this).attr('lv-bind') == 'true' ? true : false ,
          bufferObj = {
            "name" : name,
            "reverse" : reverse,
            "limit" : limit,
            "level_bind" : level_bind
          } ;
      filterObj.push(bufferObj);
    });

    socket.emit("search",{rFilter,cFilter,aFilter,filterObj,gFilter,type:'enemy',uid:current_user_data.uid});
    scroll_to_div('selected');
  }
  var number_page,page_factor ;
  socket.on("search result",function (result) {
    $("#selected").height(screen.width > 768 ?280:200);
    console.log(result);
    number_page = 0 ;
    page_factor = 1 ;
    $("#selected").empty();
    $("#page_dot").empty();
    $("#selected").css('display','flex');
    $("#selected").scrollTop(0);
    $("#selected").append(condenseEnemyName(result));
    $(".button_group").css('display','flex');
    scroll_to_div("selected");
    let select_width = $("#selected").innerWidth(),
        card_width = screen.width > 1024 ? 200 :140,
        per_page = Math.floor(select_width/card_width)*2;

    number_page = Math.ceil(number_page/per_page) ;
    if(number_page>25) page_factor = 2;
    for (let i = 0;i<Math.ceil(number_page)/page_factor;i++)
      $("#page_dot").append("<span value='"+i*page_factor+"'></span>");
    $("#page_dot span").eq(0).css("background-color",'rgb(254, 168, 74)');

  });
  socket.on('display enemy result',function (data) {
    data.lv = 1;
    current_enemy_data = data;
    $(".dataTable").attr("id",data.id);
    displayEnemyData(data) ;
  });

  function displayEnemyData(data) {
    let html = "",
        showID = current_user_data.setting.show_enemy_id,
        showCount = current_user_data.setting.show_enemy_count;

    if(current_user_data.setting.show_more_option) $("#more_option").css("height",50);
    else $("#more_option").css("height",0);
    $("#more_option #out ").attr("href","http://battlecats-db.com/enemy/"+data.id+".html");
    html += "<tr><th "+(showID?"":"hidden")+">ID</th><td "+(showID?"":"hidden")+">"+data.id+
            "</td><th "+(showCount?"":"hidden")+">查詢次數</th><td "+(showCount?"":"hidden")+">"+data.count+"</td>"+
            "<td colspan=2 id='more'>更多選項</td></tr>";

    html += displayenemyHtml(data)
    $(".dataTable").empty();
    $(".dataTable").append(html);
    scroll_to_class("display",0) ;
  }
  function updateState(level) {
    let change = ['hp','hardness','atk','DPS'] ;
    for(let i in change){
      let target = $('.dataTable').find('#'+change[i]) ;
      let original = target.attr('original');
      target.html(mutipleValue(original,level).toFixed(0))
            .css('background-color',' rgba(242, 213, 167, 0.93)');
      setTimeout(function () {
        target.css('background-color','rgba(255, 255, 255, .9)');
      },500);
    }
    if(current_enemy_data.tag.indexOf("連續攻擊") != -1){
      console.log("!!");
      let target = $('.dataTable').find('#char');
      target.html(serialATK(current_enemy_data.char,mutipleValue(current_enemy_data.atk,level)));
    }
  }

  function filterSlider() {
    $("#slider_holder").show();
    $(this).css('border-bottom','5px solid rgb(241, 166, 67)').siblings().css('border-bottom','0px solid');
    filter_name = $(this).attr('id') ;
    let value = Number($(this).attr('value')) ;
    let reverse = $(this).attr('reverse') ;
    let range = JSON.parse($(this).attr('range'));
    let step = Number($(this).attr('step')) ;
    let active = $(this).attr('active') ;

    $("#slider_holder").find('.slider').slider('option',{
      'min': range[0],
      'max': range[1],
      'step': step,
      'value': value
    }).parent().siblings('.active').html(active=='true'?'<i class="material-icons">&#xe837;</i>':'<i class="material-icons">&#xe836;</i>')
    .siblings('.reverse').html(reverse=='true'?'以下':'以上');
  }
  var show_more = 1;
  $(document).on("click","#more",function () {
    // console.log(show_more);
    if(show_more) $("#more_option").css("height",50);
    else $("#more_option").css("height",0);
    show_more = show_more?0:1;
  });
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
  $(document).on("click","#addfight",function () {
    let id = $(this).parents("#more_option").siblings().attr("id"),
        lv = $(this).parents("#more_option").siblings().find("#level_num").children("span").text().split(" %")[0];
    socket.emit("compare C2E",{
      uid : current_user_data.uid,
      target : {enemy:{id:id,lv:lv}}
    });
    $("#fight_alert").css("left",-10);
    setTimeout(function () {
      $(this).find("input").remove();
      $("#fight_alert").css("left",-250);
    },2600);
  });


});
function displayenemyHtml(data) {
  console.log(data);
  let html = '';
  html += screen.width > 768 ?
  "<tr>"+
  "<th style='height:80px;padding:0'><img src='"+
  image_url_enemy+data.id+'.png'
  +"' style='height:100%'></th>"+
  "<th colspan=5 id='name'>"+data.name+"</th>"+
  "</tr>" :
  "<tr>"+
  "<th colspan='6' style='height:80px;padding:0;background-color:transparent'><img src='"+
  image_url_enemy+data.id+".png' style='height:100%'"
  +"</tr><tr>"+
  "<th colspan='6' id='name'>"+data.name+"</th>"+
  "</tr>" ;
  html+=
  "<tr>"+
  "<th colspan='1'>倍率</th>"+
  "<td colspan=5 id='level_num'>"+
  "<button>-100%</button><button>-50%</button>"+
  "<span style='margin:0 10px'>"+data.lv*100+" %</span>"+
  "<button>+50%</button><button>+100%</button>"+
  "</td >"+
  "<tr>"+
  "<th>體力</th><td id='hp' original='"+data.hp+"'>"+
  mutipleValue(data.hp,data.lv).toFixed(0)+"</td>"+
  "<th>KB</th><td id='KB'>"+data.kb+"</td>"+
  "<th>硬度</th><td id='hardness' original='"+(data.hp/data.kb)+"'>"+
  mutipleValue(data.hp/data.kb,data.lv).toFixed(0)+"</td>"+
  "</tr><tr>"+
  "<th>攻擊力</th><td id='atk' original='"+data.atk+"'>"+
  mutipleValue(data.atk,data.lv).toFixed(0)+"</td>"+
  "<th>DPS</th><td id='DPS' original='"+data.dps+"'>"+
  mutipleValue(data.dps,data.lv).toFixed(0)+"</td>"+
  "<th>射程</th><td id='range'>"+data.range+"</td>"+
  "</tr><tr>"+
  "<th>攻頻</th><td id='freq'>"+data.freq.toFixed(1)+" s</td>"+
  "<th>跑速</th><td id='speed'>"+data.speed+"</td>"+
  "<td colspan='2' rowspan='2' id='multi'>"+data.multi+"</td>"+
  "</tr><tr>"+
  "<th>獲得金錢</th><td id='reward'>"+data.reward+"</td>"+
  "<th>屬性</th><td id='color'>"+addColor(data.color)+"</td>"+
  "</tr><tr>"+
  "<td colspan='6' id='char' "+(
  data.char.indexOf("連續攻撃") != -1 ?
  "original='"+data.char+"'>"+
  serialATK(data.char,mutipleValue(data.atk,data.lv)) :
  ">"+data.char)+
  "</td>"+
  "</tr><tr>"
  return html
}
function mutipleValue(value,m) {
  // console.log(value+":"+m);
  return value*m
}
function serialATK(prop,atk) {
    let b = prop.split("（")[0];
    let arr = prop.split("（")[1].split("）")[0].split(","),
        c = prop.split("（")[1].split("）")[1];
        console.log(atk)
    console.log("("+arr.join()+")")
    for(let i in arr) arr[i] = (atk*Number(arr[i])).toFixed(0) ;
    console.log(arr.join())
    return b+"（"+arr.join(' ')+"）"+c ;
}
function addColor(str) {
  let a = str.split('['),
      b = [] ;
  for(let i in a) b.push(a[i].split(']')[0]) ;
  return b.join(" ")
}
