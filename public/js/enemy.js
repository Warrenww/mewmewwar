$(document).ready(function () {
  var enemydata ;
  var enemydata ;
  var timer = new Date().getTime();
  const image_url = "http://imgs-server.com/battlecats/e"


  var color = ['紅敵','浮敵','黑敵','鋼鐵敵','天使敵','外星敵','不死敵','白敵','無屬性敵'];
  for(let i in color) $(".select_color").append("<span class='button' name='["+color[i]+"]' value='0'>"+color[i]+"</span>") ;

  var ability = ['增攻','降攻','免疫降攻','爆擊','擊退','免疫擊退','連續攻擊',
                '緩速','免疫緩速','暫停','免疫暫停','遠方攻擊','復活','波動','免疫波動',
                '攻城','傳送','盾'];
  for(let i in ability) $(".select_ability").append("<span class='button' name='["+ability[i]+"]' value='0'>"+ability[i]+"</span>") ;

  $(document).on('click','.filter_option',filterSlider);
  $(document).on('click','#searchBut',TextSearch);
  $(document).on('keypress','#searchBox',function (e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      TextSearch();
    }
  });
  $(document).on('click','#search_ability',search) ;
  $(document).on('click','#next_sel_pg',function () {turnPage(1);}) ;
  $(document).on('click','#pre_sel_pg',function () {turnPage(-1);}) ;
  $(document).on('click','.card',function () {
    displayEnemyData($(this).attr('value'));
    // console.log($(this).attr('value'));
    // let cut =  ThisSite.indexOf(".html");
    // location.search = $(this).attr('value');
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
      let name = data[i].全名;
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
    let cFiliter = [], aFiliter = [] ;
    for(let i = 0;i<color.length;i++) cFiliter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFiliter.push(ability.eq(i).attr('name')) ;

    console.log(cFiliter);
    console.log(aFiliter);

    let buffer_1 = [],
        buffer_2 = [],
        buffer_3 = [];

    if(color.length != 0){
      for(let id in enemydata){
        for(let j in cFiliter){
          // console.log(enemydata[id].id)
          if(enemydata[id]['分類'] == '[無]') break;
          else if(enemydata[id]['分類'].indexOf(cFiliter[j]) != -1) {buffer_1.push(enemydata[id]);break;}
        }
      }
    }
    else buffer_1 = enemydata ;
    console.log(buffer_1) ;
    if(ability.length != 0){
      for(let id in buffer_1){
        for(let j in aFiliter){
          if(buffer_1[id].tag.indexOf(aFiliter[j]) != -1) {buffer_2.push(buffer_1[id]);break;}
        }
      }
    }
    else buffer_2 = buffer_1 ;
    console.log(buffer_2) ;

    $(".filter_option[active='true']").each(function () {
      let name = $(this).attr('id'),
          reverse = $(this).attr('reverse') == 'true' ? true : false ,
          limit = $(this).attr('value') ,
          level_bind = $(this).attr('lv-bind') == 'true' ? true : false ,
          // lv = Number($("#level").slider( "option", "value" )) ;
      buffer_1 = [];
      buffer_1 = buffer_2;
      buffer_2 = [];
      for(let id in buffer_1){
        let value = level_bind ? levelToValue(buffer_1[id][name],buffer_1[id].稀有度,30) : buffer_1[id][name];
        if(value > limit && !reverse) buffer_2.push(buffer_1[id]);
        else if (value < limit && reverse) buffer_2.push(buffer_1[id]);
      }
    });

    console.log(buffer_2) ;
    scroll_to_div('selected');
    // alert(buffer_3.length);
    // generatePage(buffer_3.length);
    $("#selected").empty();
    $("#selected").scrollTop(0);
    $("#selected").append(condenseEnemyName(buffer_2));
    $(".button_group").css('display','flex');

  }
  function displayEnemyData(id) {
    let data = enemydata[id] ;
    $("#selected").height(280);
    let html = "" ;
    // html += setting.display_id ? "<tr><th>Id</th><td id='id'>"+id+"</td></tr>" : "" ;

    html += screen.width > 768 ?
    "<tr>"+
    "<th style='height:80px;padding:0'><img src='"+
    image_url+id+'.png'
    +"' style='height:100%'></th>"+
    "<th colspan=5 id='全名'>"+data.全名+"</th>"+
    "</tr>" :
    "<tr>"+
    "<th colspan='6' style='height:80px;padding:0;background-color:transparent'><img src='"+
    image_url+id+'.png'
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
  function turnPage(n) {
    let current = $("#selected").scrollTop();
    let offset = screen.width > 768 ? 280 : 264 ;
    $("#selected").animate(
      {scrollTop: current+offset*n},
      100,'easeInOutCubic');
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
  function scroll_to_class(class_name,n) {
    $('.page_1').animate(
      {scrollTop: $("."+class_name).eq(n).offset().top},
      1000,'easeInOutCubic');
  }

  var xmlhttp = new XMLHttpRequest() ;
  var url = [];
  url.push("public/js/Enemydata.txt") ;
  // url.push("public/css/footage/cat/dir.txt") ;
  // url.push("public/js/Enemydata.txt") ;
  var image_list ;

    xmlhttp.open("GET", url[0], true);
    xmlhttp.send();

  xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        console.log(this.responseURL);
        // console.log(this.response);
        if(this.responseURL.indexOf("Catdata.txt") != -1){
          var data = JSON.parse(this.responseText) ;
          console.log(data) ;
          let nowtime =  new Date().getTime();
          console.log(nowtime-timer) ;
          enemydata = data ;

          xmlhttp.open("GET", url[1], true);
          xmlhttp.send();
        }
        else if(this.responseURL.indexOf("Enemydata.txt") != -1){
          var data = JSON.parse(this.responseText) ;
          console.log(data[0]) ;
          enemydata = data[0] ;
          // if(q_pos != -1){
          //   var q_search = ThisSite.substring(q_pos+3);
          //   console.log(q_search);
          //   displayenemydata(q_search);
          // }
        }
      }
  };




});
