$(document).ready(function () {
  var socket = io.connect();
  var timer = new Date().getTime();
  var current_user_data = {};
  var current_enemy_data = {};
  var current_search = [];

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    // console.log(data);
    current_user_data = data ;
    if(data.last_enemy && location.pathname.indexOf("once") == -1)
      socket.emit("display enemy",{uid:data.uid,id:data.last_enemy,history:true});
    if(data.last_enemy_search){
      let last = data.last_enemy_search;
      if(last.query)
        socket.emit("normal search",last);
      for(let i in last.query){
        for(let j in last.query[i]) $("#upper_table").find(".button[name='"+last.query[i][j]+"']").click();
      }
      if(last.value){
        $("#value_search").click();
        for(let i in last.filterObj)
          $("#lower_table").find("th[id='"+last.filterObj[i].name+"']")
          .attr({'active':true,'value':last.filterObj[i].limit,'reverse':last.filterObj[i].reverse})
          .click();
      }
    }
    if(data.compare_e2e) {
      $(".compareTarget").empty();
      $("#compare_number").text(data.compare_e2e.length)
      for(let i in data.compare_e2e){
        let id = data.compare_e2e[i].id,
            name = data.compare_e2e[i].name;
        $(".compareTarget").append(
        '<span class="card" value="'+id+
        '" style="background-image:url('+
        image_url_enemy+id+'.png'+
        '">'+name+'</span>');
      }
    }
  });

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
    if($(this).parent().parent().attr("class")=='compareTarget_holder') return
    else
      socket.emit("display enemy",{
        uid:current_user_data.uid,
        id:$(this).attr('value'),
        history:true
      });
  });

  $(document).on('click','#char #type',function () {
    let type = $(this).text(),
        reverse = ReverseType(type),
        norev = ['增攻','會心一擊','復活','地中移動','對貓咪城傷害x4','遠方攻擊'];

    if(type.indexOf('連續攻擊')==-1&&type.indexOf('免疫')==-1&&norev.indexOf(type)==-1){
      socket.emit("normal search",{
        uid:current_user_data.uid,
        query:{rFilter:[],cFilter:[],aFilter:[reverse]},
        query_type:'normal',
        filterObj:[],
        type:"cat",
        value:0
      });
      window.parent.reloadIframe('cat');
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
      uid:current_user_data.uid,
      query:{rFilter:[],cFilter:type,aFilter:[]},
      query_type:'normal',
      filterObj:[],
      type:"cat",
      value:0
    });
    window.parent.reloadIframe('cat');

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
    // console.log(buffer);
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
      html += '<span class="card-group">'+
      '<span class="glyphicon glyphicon-shopping-cart"></span>'+
      '<span class="card" value="'+id+'" '+
      'style="background-image:url('+
       image_url_enemy+id+'.png'
      +')">'+
      name+'</span></span>'
      number_page ++ ;
      current_search.push(id);
    }
    $(".compareSorce #result_count").find("span").text(number_page);
    return html ;
  }
  var result_expand = 0,originHeight;
  $(document).on('click','.compareSorce td',function () {
    let type = $(this).attr("id");
    if(type == 'result_snapshot'){
      let target = $("#selected")[0];
      if(!result_expand) {
        $("#result_expand").click();
        setTimeout(function () {
          snapshot(target);
        },500)
        setTimeout(function () {
          $("#result_expand").click();
        },500)
      } else snapshot(target);
    } else if(type == 'result_expand'){
      let trueHeight = $("#selected")[0].scrollHeight;
          // console.log(trueHeight,originHeight);
      if(!result_expand){
        originHeight = $("#selected")[0].offsetHeight;
        $("#selected").css("height",trueHeight);
        $(this).html("收合<i class='material-icons'>&#xe240;</i>");
      } else {
        $("#selected").css("height",originHeight);
        $(this).html("展開<i class='material-icons'>&#xe240;</i>");
      }
      result_expand = result_expand?0:1;
    } else if(type == 'batch_compare'){
      // console.log(current_search);
      let r = confirm("確定覆蓋現有比較序列?!");
      if(!r) return
      if(current_search.length<10){
        socket.emit("compare enemy",{id:current_user_data.uid,target:current_search});
        $(".compareTarget").empty();
        $("#selected").children().each(function () {
          $(this).children(".card").clone().appendTo('.compareTarget');
        });
        if(showcomparetarget) showhidecomparetarget();
        $("#compare_number").text(current_search.length);
      }
      else alert("超過10隻!!!");
    }

  });
  function search() {
    let color = $(".select_color [value=1]"),
        ability = $(".select_ability [value=1]");
    let cFilter = [], aFilter = [], rFilter = [], filterObj = [],gFilter = [] ;
    for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;

    // console.log(cFilter);
    // console.log(aFilter);

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

    socket.emit("normal search",{
      query:{cFilter,aFilter},
      filterObj,
      type:'enemy',
      uid:current_user_data.uid,
      value:filterObj.length
    });
    scroll_to_div('selected');
  }
  var number_page,page_factor ;
  socket.on("search result enemy",function (result) {
    // console.log(result);
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
        card_width = screen.width > 1024 ? 216 :140,
        per_page = Math.floor(select_width/card_width)*2;

    number_page = Math.ceil(number_page/per_page) ;
    if(number_page>25) page_factor = 2;
    for (let i = 0;i<Math.ceil(number_page)/page_factor;i++)
      $("#page_dot").append("<span value='"+i*page_factor+"'></span>");
    $("#page_dot span").eq(0).css("background-color",'rgb(254, 168, 74)');

  });
  socket.on('display enemy result',function (data) {
    data = new Enemy(data);
    // console.log(data);
    current_enemy_data = data;
    $(".dataTable").attr("id",data.id);
    displayEnemyData(data) ;
  });

  function displayEnemyData(data) {
    let html = "",
        showID = current_user_data.setting.show_enemy_id,
        showCount = current_user_data.setting.show_enemy_count;

    $("#more_option #out ").attr("href","http://battlecats-db.com/enemy/"+data.id+".html");
    html += "<tr><th "+(showID?"":"hidden")+">ID</th><td "+(showID?"":"hidden")+">"+data.id+
            "</td><th "+(showCount?"":"hidden")+">查詢次數</th><td "+(showCount?"":"hidden")+">"+data.count+"</td>";

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
      uid : current_user_data.uid,
      id : current_enemy_data.id,
      lv : level,
      type : 'enemy'
    });
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

  $('body').append("<div id='compare_panel_BG'></div>");
  $(document).on('click','#compare_panel_BG',function () {
    $("#compare_panel_BG").fadeOut();
    $('.compare_panel').css('height',0);
  });
  var compare = [];
  $(document).on('click','.glyphicon-shopping-cart',addToCompare);
  function addToCompare() {
    $('.compare_panel').css('height',0);
    if(showcomparetarget) showhidecomparetarget();
    let target = $(this).parent().children(".card");

    $(".compareTarget").children().each(function () {
      compare.push($(this).attr("value"));
    });
    if(compare.indexOf(target.attr('value')) != -1) {
      let repeat = $('.compareTarget').find('[value='+target.attr('value')+']') ;
      repeat.css('border-color','rgb(237, 179, 66)');
      $(".compareTarget_holder").animate({
        scrollTop : repeat[0].offsetTop-100
      },800,'easeInOutCubic');
      setTimeout(function () {
        repeat.css('border-color','white');
      },1000);
    } else {
      target.clone().appendTo('.compareTarget');
      $('.compareTarget_holder').animate({
        scrollTop : $('.compareTarget').height()
      },500,'easeInOutCubic');
      compare = [];
      $(".compareTarget").children().each(function () {
        compare.push($(this).attr("value"));
      });
      $("#compare_number").text(compare.length);
      socket.emit("compare enemy",{id:current_user_data.uid,target:compare});
    }
  }
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
      socket.emit("display enemy",{
        uid : current_user_data.uid,
        id : $(this).parent().attr('id'),
        history:true
      });
      showhidecomparetarget();
      $("#compare_panel_BG").fadeOut();
      $('.compare_panel').css('height',0);
    });
    $('.compare_panel #del').click(function () {
      let target = $(".compareTarget .card[value='"+$(this).parent().attr('id')+"']");
      let r = confirm("確定要將"+target.text()+"從比較列中移除?") ;
      if(!r) return
      target.remove();
      $(".compareTarget").children().each(function () {
        compare.push($(this).attr("value"));
      });
      $("#compare_number").text(compare.length);
      socket.emit("compare enemy",{id:current_user_data.uid,target:compare});
      $("#compare_panel_BG").fadeOut();
      $('.compare_panel').css('height',0);
    });
  });
  $(document).on('click',"#addcart", function () {
    $('.compare_panel').css('height',0);
    if(showcomparetarget) showhidecomparetarget();
    let id = $(".dataTable").attr('id'),
        name = $(".dataTable").find("#name").text();
    $(".compareTarget").children().each(function () {
      compare.push($(this).attr("value"));
    });
    if(compare.indexOf(id) != -1) {
      let repeat = $('.compareTarget').find('[value='+id+']') ;
      repeat.css('border-color','rgb(237, 179, 66)');
      $(".compareTarget_holder").animate({
        scrollTop : repeat[0].offsetTop-100
      },800,'easeInOutCubic');
      setTimeout(function () {
        repeat.css('border-color','white');
      },1000);
    } else {
      $(".compareTarget").append(
          '<span class="card" value="'+id+
          '" style="background-image:url('+
          image_url_enemy+id+'.png'+
          '">'+name+'</span>');
      $('.compareTarget_holder').animate({
        scrollTop : $('.compareTarget').height()
      },500,'easeInOutCubic');
      $(".compareTarget").children().each(function () {
        compare.push($(this).attr("value"));
      });
      $("#compare_number").text(compare.length);
      socket.emit("compare enemy",{id:current_user_data.uid,target:compare});
    }

  });
  $("#clear_compare").click(function () {
    let r = confirm("確定要移除所有敵人?!");
    if(!r)return
    showhidecomparetarget();
    $(this).siblings().html("");
    compare = [];
    $("#compare_number").text(compare.length);
    socket.emit("compare enemy",{id:current_user_data.uid,target:compare});
  });

});
function displayenemyHtml(data) {
  let html = '';
  html += screen.width > 768 ?
  "<tr>"+
  "<th style='height:80px;padding:0'><img src='"+
  data.imgURL+
  "' style='height:100%'></th>"+
  "<th colspan=5 id='name'>"+data.Name+"</th>"+
  "</tr>" :
  "<tr>"+
  "<th colspan='6' style='height:80px;padding:0;background-color:transparent'><img src='"+
  data.imgURL+"' style='height:100%'"
  +"</tr><tr>"+
  "<th colspan='6' id='name'>"+data.Name+"</th>"+
  "</tr>" ;
  html+=
  "<tr>"+
  "<th colspan='1'>倍率</th>"+
  "<td colspan=5 id='level_num'>"+
  // "<button>-100%</button><button>-50%</button>"+
  "<span style='margin:0 10px'>"+data.lv*100+" %</span>"+
  // "<button>+50%</button><button>+100%</button>"+
  "</td >"+
  "<tr>"+
  "<th>體力</th><td id='hp'>"+
  data.Tovalue('hp')+"</td>"+
  "<th>KB</th><td id='KB'>"+data.kb+"</td>"+
  "<th>硬度</th><td id='hardness'>"+
  data.Tovalue('hardness')+"</td>"+
  "</tr><tr>"+
  "<th>攻擊力</th><td id='atk'>"+
  data.Tovalue('atk')+"</td>"+
  "<th>DPS</th><td id='DPS'>"+
  data.Tovalue('dps')+"</td>"+
  "<th>射程</th><td id='range'>"+data.range+"</td>"+
  "</tr><tr>"+
  "<th>攻頻</th><td id='freq'>"+data.freq+" s</td>"+
  "<th>跑速</th><td id='speed'>"+data.speed+"</td>"+
  "<td colspan='2' rowspan='2' id='aoe'>"+data.Aoe+"</td>"+
  "</tr><tr>"+
  "<th>獲得金錢</th><td id='reward'>"+data.reward+"</td>"+
  "<th>屬性</th><td id='color'>"+data.Color+"</td>"+
  "</tr><tr>"+
  "<td colspan='6' id='char'>"+
  data.CharHtml()+
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
