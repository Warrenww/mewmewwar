$(document).ready(function () {
  var socket = io.connect();
  var timer = new Date().getTime();
  const image_url =  "public/css/footage/enemy/e" ;
  var current_user_data = {};
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connet",user);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    if(data.last_enemy) socket.emit("display enemy",data.last_enemy) ;
  });

  var color = ['紅敵','浮敵','黑敵','鋼鐵敵','天使敵','外星敵','不死敵','白敵','無屬性敵'];
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
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'enemy',
      id : $(this).attr('value')
    });
    socket.emit("display enemy",$(this).attr('value'));
  });


  function TextSearch() {
    let keyword = $("#searchBox").val();
    let buffer = [] ;
    for(let id in enemydata){
      if(enemydata[id].全名.indexOf(keyword) != -1) buffer.push(enemydata[id]) ;
    }
    console.log(buffer);
    scroll_to_div('selected');
    $("#selected").empty();
    $("#selected").scrollTop(0);
    $("#selected").append(condenseEnemyName(buffer));
    $(".button_group").css('display','flex');
  }
  function condenseEnemyName(data) {
    let html = '' ;
    for(let i in data){
      let name = data[i].name;
      let id = data[i].id ;
      html += '<span class="card" value="'+id+'" '+
      'style="background-image:url('+
       image_url+id+'.png'
      +')">'+
      name+'</span>'
    }
    return html ;
  }
  function search() {
    let color = $(".select_color [value=1]"),
        ability = $(".select_ability [value=1]");
    let cFilter = [], aFilter = [], rFilter = [], filterObj = [] ;
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

    socket.emit("search",{rFilter,cFilter,aFilter,filterObj,type:'enemy'});
    scroll_to_div('selected');
  }
  socket.on("search result",function (result) {
    $("#selected").height(screen.width > 768 ?280:200);
    console.log(result)
    $("#selected").empty();
    $("#selected").css('display','flex');
    $("#selected").scrollTop(0);
    $("#selected").append(condenseEnemyName(result));
    $(".button_group").css('display','flex');
  });
  socket.on('display enemy result',function (data) {
    displayEnemyData(data) ;
  });

  function displayEnemyData(data) {
    let html = "" ;
    // html += setting.display_id ? "<tr><th>Id</th><td id='id'>"+id+"</td></tr>" : "" ;

    html += screen.width > 768 ?
    "<tr>"+
    "<th style='height:80px;padding:0'><img src='"+
    image_url+data.id+'.png'
    +"' style='height:100%'></th>"+
    "<th colspan=5 id='全名'>"+data.全名+"</th>"+
    "</tr>" :
    "<tr>"+
    "<th colspan='6' style='height:80px;padding:0;background-color:transparent'><img src='"+
    image_url+data.id+'.png'
    +"</tr><tr>"+
    "<th colspan='6' id='全名'>"+data.全名+"</th>"+
    "</tr>" ;


    $(".dataTable").empty();
    $('.compareTable').empty();
    $(".dataTable").append(
      html+
      "<tr>"+
      "<th colspan='1'>倍率</th>"+
      "<td colspan='4' class='level'>"+
      "<div id='level' class='slider'></div>"+
      "</td>"+
      "<td colspan='"+(screen.width < 768 ? 5 : 1)+"' >"+
      "<span id='level_num'>100 %</span>"+
      "</td >"+
      "<tr>"+
      "<th>體力</th><td id='體力' original='"+data.體力+"'>"+
      levelToValue(data.體力,1).toFixed(0)+"</td>"+
      "<th>KB</th><td id='KB'>"+data.kb+"</td>"+
      "<th>硬度</th><td id='硬度' original='"+data.硬度+"'>"+
      levelToValue(data.硬度,1).toFixed(0)+"</td>"+
      "</tr><tr>"+
      "<th>攻擊力</th><td id='攻撃力' original='"+data.攻撃力+"'>"+
      levelToValue(data.攻撃力,1).toFixed(0)+"</td>"+
      "<th>DPS</th><td id='DPS' original='"+data.dps+"'>"+
      levelToValue(data.dps,1).toFixed(0)+"</td>"+
      "<th>射程</th><td id='射程'>"+data.射程+"</td>"+
      "</tr><tr>"+
      "<th>攻頻</th><td id='攻頻'>"+data.攻頻.toFixed(1)+" s</td>"+
      "<th>跑速</th><td id='跑速'>"+data.速度+"</td>"+
      "<td colspan='2' rowspan='2' id='範圍'>"+data.範圍+"</td>"+
      "</tr><tr>"+
      "<th>獲得金錢</th><td id='獲得金錢'>"+data.獲得金錢+"</td>"+
      "<th>屬性</th><td id='屬性'>"+addColor(data.分類)+"</td>"+
      "</tr><tr>"+
      "<td colspan='6' id='特性' "+(
      data.特性.indexOf("連續攻撃") != -1 ?
      "original='"+data.特性+"'>"+
      serialATK(data.特性,levelToValue(data.攻撃力,1)) :
      ">"+data.特性)+
      "</td>"+
      "</tr><tr>"
    );
    initialSlider(data);
    scroll_to_class("display",0) ;
  }
  function addColor(str) {
    let a = str.split('['),
        b = [] ;
    for(let i in a) b.push(a[i].split(']')[0]) ;
    return b.join(" ")
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
  $('#slider_holder').children('.active').click(function () {
    let target = $("#"+filter_name+".filter_option");
    target.attr('active',target.attr('active')=='true'?'false':'true');
    $(this).html(target.attr('active')=='true'?'<i class="material-icons">&#xe837;</i>':'<i class="material-icons">&#xe836;</i>');
  });
  $('#slider_holder').children('.reverse').click(function () {
    let target = $("#"+filter_name+".filter_option");
    target.attr('reverse',target.attr('reverse')=='true'?'false':'true');
    $(this).html(target.attr('reverse')=='true'?'以下':'以上');
  });
  $('#slider_holder').find('.slider').on("slidechange",function (e,ui) {
    $("#lower_table").find("#"+filter_name).attr('value',ui.value);
  });
  $("#lower_table").find("#selectAll").click(function () {
    if($(this).text().trim() == '全選') {
      $(".filter_option").attr('active','true');
      $(this).text('全部清除');
      $('.active').html('<i class="material-icons">&#xe837;</i>');
    }
    else{
      filter_name = "" ;
      $(".filter_option").attr('active','false');
      $(this).text('全選');
      $('.active').html('<i class="material-icons">&#xe836;</i>');
      $("#slider_holder").hide().siblings().children('.filter_option').css('border-bottom','0px solid');
    }
  });
  $(".filter_option").hover(
    function () {
      let position = $(this).offset(),
          value = $(this).attr('value'),
          width = $(this).outerWidth()-10,
          active = $(this).attr('active') == 'true' ? true : false ,
          reverse = $(this).attr('reverse') == 'true' ? '以下' : '以上';
      position.top -= 30 ;
        if(active && screen.width > 768){
          $("#TOOLTIP").finish().fadeIn();
          $("#TOOLTIP").offset(position).width(width).text(value+reverse) ;
        }

    },function () {
      $("#TOOLTIP").fadeOut();
  });
  $(".slider").slider();
  $(".slider").on("slide", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });
  $(".slider").on("slidechange", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });

  function scroll_to_div(div_id){
    $('.page_1').animate(
      {scrollTop: $("#"+div_id).offset().top},
      1000);
  }
  function levelToValue(value,m) {
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
  function initialSlider(data) {
    $("#level").slider({
      max: 5000,
      min: 100,
      step: 50,
      value: 100,
    });
    $("#level").on("slide", function(e,ui) {
      $("#level_num").html(ui.value+" %");
      updateState(ui.value/100);
    });
    $("#level").on("slidechange", function(e,ui) {
      $("#level_num").html(ui.value+" %");
      updateState(ui.value/100);
    });
    function updateState(level) {
      let change = ['體力','硬度','攻撃力','DPS'] ;
      for(let i in change){
        let target = $('.dataTable').find('#'+change[i]) ;
        let original = target.attr('original');
        target.html(levelToValue(original,level).toFixed(0))
              .css('background-color',' rgba(242, 213, 167, 0.93)');
        setTimeout(function () {
          target.css('background-color','rgba(255, 255, 255, .9)');
        },500);
      }
      if(data.特性.indexOf("連續攻擊") != -1){
        let target = $('.dataTable').find('#特性');
        target.html(serialATK(data.特性,levelToValue(data.攻撃力,level)));
      }
    }
  }




});
