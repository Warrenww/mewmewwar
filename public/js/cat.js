$(document).ready(function () {
  var timer = new Date().getTime();
  var compare = [] ;
  var socket = io.connect();
  var current_cat_data = {};
  var current_cat_survey = {};
  var current_cat_statistic = {};
  var current_search = [];
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };

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
    if(data.last_cat && location.pathname.indexOf('once') == -1)
    socket.emit("display cat",{
      uid : data.uid,
      cat : data.last_cat,
      history:true
    }) ;
    if(data.compare_c2c) {
      $(".compareTarget").empty();
      $("#compare_number").text(data.compare_c2c.length)
      for(let i in data.compare_c2c){
        let id = data.compare_c2c[i].id,
            name = data.compare_c2c[i].name;
        $(".compareTarget").append(
        '<span class="card" value="'+id+
        '" style="background-image:url('+
        image_url_cat+id+'.png'+
        '">'+name+'</span>');
      }
    }
    if(data.last_cat_search){
      let last = data.last_cat_search;
      if(last.query)
        socket.emit(last.query_type+" search",last);
      if(last.query_type=='gacha'){
        $("#gacha_search").click();
        for(let i in last.query)
          $("#gacha_table").find(".button[id='"+last.query[i]+"']").click();
      } else {
        for(let i in last.query)
         for(let j in last.query[i])
          $("#upper_table").find(".button[name='"+last.query[i][j]+"']").click();
      }
      if(last.value){
        $("#value_search").click();
        for(let i in last.filterObj)
          $("#lower_table").find("th[id='"+last.filterObj[i].name+"']")
          .attr({'active':true,'value':last.filterObj[i].limit,'reverse':last.filterObj[i].reverse})
          .click();
      }
    }
    show_more = !data.setting.show_more_option;
    if(!data.setting.show_ability_text ||screen.width<768){
        $(".select_ability").children(".button").each(function () {
          $(this).css({'padding':0,'border-radius':7,'overflow':'hidden'})
            .children("span").fadeOut().siblings("i").css({width:40,height:40});
        });
    if(!data.setting.show_cat_id)
      $('.display').find("#id").css({'background-color':'transparent','color':'transparent'})
        .prev().css({'background-color':'transparent','color':'transparent'})
    if(!data.setting.show_cat_count)
      $('.display').find("#count").css({'background-color':'transparent','color':'transparent'})
        .prev().css({'background-color':'transparent','color':'transparent'})
    }
    setTimeout(function () {
      $("#loading").fadeOut();
    },2500);
  });

  if(screen.width<=768) $("#level_num").parent().attr("colspan",5);
  var tip_fadeOut;
  $(document).on("click",".select_ability .button",function () {
    let text = $(this).children("span").text(),
        val = $(this).attr('value')=='1'?true:false;
        // console.log(val);
    if((!current_user_data.setting.show_ability_text||screen.width<768)&&val){
      clearTimeout(tip_fadeOut);
      $(".ability_tip").remove();
      $("body").append("<div class='ability_tip'>"+text+"<div>");
      setTimeout(function () {
        $(".ability_tip").css("left",-10);
      },100)
      tip_fadeOut = setTimeout(function () {
        $(".ability_tip").css("left",-250)
      },2000);
    }
  });
  $(document).on('click','.search_type .button',function () {
    let type = $(this).attr('id').split("_")[0];
    if(type == 'normal'){
      $(this).attr("value",1);
      $("#gacha_search").attr("value",0);
      $("#gacha_table").hide(200);
      $("#upper_table").show(200);
      $("#search_ability").attr("value",type);
    } else if(type == 'gacha'){
      $(this).attr("value",1);
      $("#normal_search").attr("value",0);
      $("#upper_table").hide(200);
      $("#gacha_table").show(200);
      $("#search_ability").attr("value",type);
    } else {
      $("#lower_table").toggle(300);
    }
  });

  $(document).on('click','.card',function (e) {
    if($(this).parent().parent().attr("class")=='compareTarget_holder') return
    else {
      socket.emit("display cat",{
        uid : current_user_data.uid,
        cat : $(this).attr('value'),
        history:true
      });
    }

  });
  $(document).on('click','#search_ability',search) ;
  $(document).on('click','#searchBut',function () {
    let keyword = $(this).siblings().val();
    socket.emit("text search",{key:keyword,type:'cat'});
    ga('send', 'event', 'search', 'text search','cat');
  });
  $(document).on('keypress','#searchBox',function (e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      let keyword = $(this).val();
      socket.emit("text search",{key:keyword,type:'cat'});
      ga('send', 'event', 'search', 'text search','cat');
    }
  });
  $(document).on('click',".search_table .button",function () {
    $("body").bind('keypress',quickSearch);
    setTimeout(function () {
      $("body").unbind('keypress',quickSearch);
    },5000);
  });
  function quickSearch(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) search();
    $("body").unbind('keypress',quickSearch);
    ga('send', 'event', 'search', 'quick search','cat');
  }

  var input_org ;
  $(document).on('click','.editable',function () {
      input_org = $(this).text();
      $(this).html('<input type="number" value="' +input_org+ '"></input>');
      $(this).find('input').select();
  });
  $(document).on('blur', '.editable input', calculateLV);
  $(document).on('click','.filter_option',filterSlider);
  var filter_org ;
  $(document).on('click','.value_display,#level_num',function () {
      filter_org = Number($(this).text());
      $(this).html('<input type="number" value="' +filter_org+ '"></input>');
      $(this).find('input').select();
  });
  $(document).on('blur','.value_display input',changeSlider) ;
  $(document).on('blur','#level_num input',function () {
    let val = Number($(this).val()) ;
    val = val && val>0 && val<101 ? val : filter_org ;
    $('#level').slider('option','value',val);
  });
  $(document).on('click','.searchCombo',function () {
    socket.emit("search combo",{
      uid:current_user_data.uid,
      id:[$(this).attr('val')]
    }) ;
    // location.assign('combo.html');
    window.parent.reloadIframe('combo');
  }) ;
  $(document).on("click","#share",function () {
    let id = $(this).parents("#more_option").siblings().attr("id"),
        lv = $(this).parents("#more_option").siblings().find("#level_num").text(),
        host = location.origin;
    $(this).append(
      "<input type='text' value='"+
      host+"/view/once.html?q=cat&"+
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
  $(".select_ability").find(".ability_icon").each(function () {
    let name = $(this).attr("id");
    $(this).css("background-image","url('"+image_url_icon+name+".png')");
  });
  socket.on("display cat result",function (result) {
    console.log("recive cat data,starting display") ;
    // console.log(result) ;
    let data = new Cat(result.this),
        arr = result.bro,
        brr = result.combo,
        lv = (result.lv == 'default'||result.lv == null) ? current_user_data.setting.default_cat_lv : result.lv,
        own = result.own,
        survey = result.survey;
    // if(!result.survey&&Math.random()>0.5) $(".survey_holder").css("display",'flex');
    displayCatData(data,arr,brr,lv,result.count,own,survey) ;
    append_comment(result.this.comment);
    current_cat_data = data;
  });
  var number_page,page_factor ;
  socket.on("search result",function (data) {
    console.log("recive search result");
    // console.log(data);
    number_page = 0 ;
    page_factor = 1 ;
    $("#selected").empty();
    $("#page_dot").empty();
    $("#selected").css('display','flex');
    $("#selected").scrollTop(0);
    $("#selected").append(condenseCatName(data));
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
  function displayCatData(data,arr,brr,lv,count,own,survey) {
    let html = "",
        showID = current_user_data.setting.show_cat_id,
        showCount = current_user_data.setting.show_cat_count,
        id = data.id,
        grossID = id.substring(0,3);

    if(current_user_data.setting.show_more_option) $("#more_option").css("height",50);
    else $("#more_option").css("height",0);
    if(own) $("#more_option #mark_own").attr({"value":1,"style":"color:rgb(96, 176, 37)"}).find("span").fadeOut();
    else $("#more_option #mark_own").attr({"value":0,"style":"color:rgb(224, 103, 103)"}).find("span").fadeIn();
    $("#more_option #out ").attr("href","http://battlecats-db.com/unit/"+grossID+".html");

    // console.log(data);

    for (let i in data){
      if(i=='hp'||i=='hardness'||i=='atk'||i=='dps')
        $(".dataTable").find("#"+i).text(data.Tovalue(i,lv));
      else if(i == 'count')
        $(".dataTable").find("#"+i).text(count);
      else if(i == 'name')
        $(".dataTable").find("."+i).text(data.Name);
      else if(i == 'aoe')
        $(".dataTable").find("#"+i).text(data.Aoe);
      else if(i == 'char')
        $(".dataTable").find("#"+i).html(data.CharHtml(lv));
      else
        $(".dataTable").find("#"+i).text(data[i]);
    }
    survey = survey?survey:{};
    initial_survey();
    addSurvey(data.statistic,survey);
    $(".dataTable").attr('id',data.id).find('.bro').html(Thisbro(arr));
    $(".dataTable").find('.img').children().attr('src',data.imgURL);
    $(".dataTable").find(".combo").remove();
    $(AddCombo(brr)).insertAfter('.dataTable #combo_head');
    initialSlider(data,lv);
    scroll_to_class("display",0);

    if(data.id == "334-2"&&(Math.random()<0.4)) {
      $(".dataTable").append(
        '<div class="animate_cat">'+
        '<img src="../public/css/footage/animate/u334-2.gif" style="width:100%" />'+
        '</div>'
      );
      $(".animate_cat").fadeIn().css("display","flex");
      setTimeout(function () {
        $(".animate_cat").fadeOut();
      },30000);
      $(".animate_cat").click(function (e) {
        $(this).fadeOut();
        return false
      });
    }
  }
  function initialSlider(data,lv) {
    $("#level").slider({
      max: 100,
      min: 1,
      value: 30,
    });
    setTimeout(function () {
      $("#level").slider('option','value',lv)
    },800);

    $("#level").on("slidechange", function(e,ui) {
      $("#level_num").html(ui.value);
      updateState(ui.value);
      socket.emit("store level",{
        uid : current_user_data.uid,
        id : $(this).parents(".dataTable").attr("id"),
        lv : ui.value,
        type : 'cat'
      });
    });
    $("#level").on("slide", function(e,ui) {
      $("#level_num").html(ui.value);
      updateState(ui.value);
    });
    function updateState(level) {
      let rarity = data.rarity;
      let change = ['hp','hardness','atk','dps'] ;
      for(let i in change){
        let target = $('.dataTable').find('#'+change[i]) ;

        target.html("<span class='editable'>"+
        data.Tovalue(change[i],level)+
        "</span>").css('background-color',' rgba(242, 213, 167, 0.93)');
        setTimeout(function () {
          target.css('background-color','rgba(255, 255, 255, .9)');
        },500);
      }
      if(data.serial){
        $('.dataTable').find('#char').children("span[id=serial]")
          .text("("+data.serialATK(level)+")");
      }
    }
  }

  var toggle_combo = toggle_survey = toggle_comment = 0;
  $('#combo_head,#survey_head,#comment_head').click(function () {
    let type = $(this).attr("id").split("_head")[0];
    $(this).find('i').css('transform',function () {
      if(type == 'combo')
        return toggle_combo?'rotate(-90deg)':'rotate(90deg)'
      else if(type == 'survey')
        return toggle_survey?'rotate(-90deg)':'rotate(90deg)'
      else
        return toggle_comment?'rotate(-90deg)':'rotate(90deg)'
    })
    if(type == 'combo'){
      $(this).siblings('.combo').toggle();
      toggle_combo = toggle_combo?0:1;
    }else if(type == 'survey'){
      $(this).siblings('.survey').each(function () {
        let Class = $(this).attr('class').split(" ");
        if(screen.width>425&&Class.indexOf("mobile")!=-1)return
        if(screen.width<=425&&Class.indexOf("non_mobile")!=-1)return
        $(this).toggle();
      });
      toggle_survey = toggle_survey?0:1;
    }else{
      $(this).siblings('.comment').toggle();
      toggle_comment = toggle_comment?0:1;
    }
  });
  function search() {
    let rarity = $(".select_rarity [value=1]"),
        color = $(".select_color [value=1]"),
        ability = $(".select_ability [value=1]"),
        gacha = $(".gacha_search td .button[value=1]"),
        type = $("#search_ability").attr("value"),
        value_search = Number($("#value_search").attr("value"));
    let rFilter = [], cFilter = [], aFilter = [],gFilter = [], filterObj = [] ;

    for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
    for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;
    for(let i = 0;i<gacha.length;i++) gFilter.push(gacha.eq(i).attr('id')) ;
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
    // console.log(type);
    socket.emit(type+" search",{
      uid:current_user_data.uid,
      query:type == 'normal'?{rFilter,cFilter,aFilter}:gFilter,
      query_type:type,
      filterObj,
      type:"cat",
      value:value_search&&filterObj.length
    });
    ga('send', 'event', 'search', type,'cat');

    scroll_to_div('selected');
  }
  function condenseCatName(data) {
    console.log('condensing....');
    let now = '000' ;
    // console.log(data);

    let html = '<span class="card-group" hidden>' ;
    for(let i in data){
      if(!data[i].id) continue
      let name = data[i].name;
      let id = data[i].id ;
      let current = id.substring(0,3) ;
      if(current == now){
        html += '<span class="card" value="'+id+'" '+
        'style="background-image:url('+
        image_url_cat+id+'.png);display:none">'+
        name+'</span>' ;
      }
      else{
        html += '</span>' ;
        html += '<span class="card-group" value="'+current+'">'+
        '<span class="glyphicon glyphicon-refresh"></span>'+
        '<span class="glyphicon glyphicon-shopping-cart"></span>'+
        '<span class="card" value="'+id+'" '+
        'style="background-image:url('+
        image_url_cat+id+'.png)">'+
        name+'</span>' ;
        now = current ;
        number_page ++ ;
        current_search.push(current);
      }
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
    } else if(type == 'batch_own'){
      // console.log(current_search);
      socket.emit("mark own",{
        uid:current_user_data.uid,
        arr:current_search,
        mark:true
      });
      $("#batch_alert").css("left",-10);
      setTimeout(function () {
        $("#batch_alert").css("left",-250);
      },2600);
    }

  });
  $(document).on("click","#mark_own",function () {
    let val = Number($(this).attr("value"))?0:1,
        cat = $(this).parents("#more_option").siblings().attr("id").substring(0,3);
    socket.emit("mark own",{
      uid:current_user_data.uid,
      cat:cat,
      mark:val
    });
    if(val) $(this).attr({"value":1,"style":"color:rgb(96, 176, 37)"}).find("span").fadeOut();
    else $(this).attr({"value":0,"style":"color:rgb(224, 103, 103)"}).find("span").fadeIn();

  });
  var show_more = 1;
  $(document).on("click","#more",function () {
    // console.log(show_more);
    if(show_more) $("#more_option").css("height",50);
    else $("#more_option").css("height",0);
    show_more = show_more?0:1;
  });
  $(document).on("click","#char span[id!='serial']",function () {
    let type = $(this).attr("id"),
    rFilter=[],aFilter=[],gFilter=[],filterObj=[],cFilter=[];
    if(type == 'color') {
      let ww = $(this).text().split(",")
      for(let i in ww){
        cFilter.push("對"+ww[i].substring(0,2))
      }
      $("#upper_table .button").each(function () {
        if(cFilter.indexOf($(this).attr('name'))==-1) $(this).attr('value',0);
        else $(this).attr('value',1);
      });

    }
    else {
      let ww = $(this).text().split(" ")[0].split("(")[0];
      if(ww.indexOf("連續攻擊")!=-1) ww = '連續攻擊';
      switch (ww) {
        case '會心一擊':
          ww = '爆擊'
          break;
        case '對敵城傷害x4':
          ww = '攻城'
          break;
        case '擊倒敵人時，獲得2倍金錢':
          ww = '2倍金錢'
          break;
        default:
          ww = ww;
      }
      aFilter=[ww];
      $("#upper_table .button").each(function () {
        if($(this).attr('name')==ww||$(this).attr('value')=='1') $(this).click() ;
      });
    }
    socket.emit("normal search",{
      uid:current_user_data.uid,
      query:{rFilter,cFilter,aFilter},
      query_type:type,
      filterObj:[],
      type:"cat",
      value:0
    });
    if($('#normal_search').attr("value")!=1) $("#normal_search").click();
  });
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

  $(".sortable").sortable({
    scroll:false,
    delay:150
  });
  $(".slider").slider();

  $(".slider").on("slide", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });
  $(".slider").on("slidechange", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });
  $('.compareTable').on('sort',function (e,ui) {
    $('.comparedatahead').find('th').css('border-left','0px solid');
  });


  $('body').append("<div id='compare_panel_BG'></div>");
  $(document).on('click','.glyphicon-refresh',toggleCatStage);
  $(document).on('click','.glyphicon-shopping-cart',addToCompare);
  $(document).on('click',"#addcart", function () {
    $('.compare_panel').css('height',0);
    if(showcomparetarget) showhidecomparetarget();
    let id = $(".dataTable").attr('id'),
        name = $(".dataTable").find("#name").text().split(" ")[1];
    compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
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
          image_url_cat+id+'.png'+
          '">'+name+'</span>');
      $('.compareTarget_holder').animate({
        scrollTop : $('.compareTarget').height()
      },500,'easeInOutCubic');
      compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
      $("#compare_number").text(compare.length);
      socket.emit("compare cat",{id:current_user_data.uid,target:compare});
    }

  });
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
      socket.emit("display cat",{
        uid : current_user_data.uid,
        cat : $(this).parent().attr('id'),
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
      compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
      $("#compare_number").text(compare.length);
      socket.emit("compare cat",{id:current_user_data.uid,target:compare});
      $("#compare_panel_BG").fadeOut();
      $('.compare_panel').css('height',0);
    });
  });
  $(document).on('click','#compare_panel_BG',function () {
    $("#compare_panel_BG").fadeOut();
    $('.compare_panel').css('height',0);
  });

  $(document).on("click","#addfight",function () {
    let id = $(this).parents("#more_option").siblings().attr("id");
    socket.emit("compare C2E",{
      uid : current_user_data.uid,
      target : {cat:{id:id}}
    });
    $("#fight_alert").css("left",-10);
    setTimeout(function () {
      $(this).find("input").remove();
      $("#fight_alert").css("left",-250);
    },2600);
  });

  function initial_survey() {
    $(".survey #nickname div").text("暫無暱稱");
    $("#rank i").attr('value',0);
    $('#rank span').attr("new",'true');
    $("#rank_c").find("path").remove();
    $('#rank').parent().attr('colspan',function () { return screen.width>425?2:3 });
    $('#rank_respec').parent().attr('colspan',function () { return screen.width>425?2:6 });
    $('#rank_respec').parent().attr('rowspan',function () { return screen.width>425?6:1 });
    d3.select("#rank_c").select('text').text('尚無評分')
      .attr({
        x:"26,46,26,46",y:"40",dy:'0,0,20',
        style:"font-size:14px;font-weight:normal"
      });
    $('#rank_detail .detail').each(function () {
      $(this).find(".char").css('width',"0%")
        .siblings(".num").text(0);
    });
    var rank_respec_name = ['atk','control','cost','hp','range','speed'],
        index=0;
    $('.rank_respec').each(function () {
      $(this).html('<span new="true" type="'+rank_respec_name[index]+'">'+
        '<i class="material-icons" value="0" no="1">&#xe885;</i>'+
        '<i class="material-icons" value="0" no="2">&#xe885;</i>'+
        '<i class="material-icons" value="0" no="3">&#xe885;</i>'+
        '<i class="material-icons" value="0" no="4">&#xe885;</i>'+
        '<i class="material-icons" value="0" no="5">&#xe885;</i>'+
        '</span>'
      ).attr('colspan',function () { return screen.width>425?3:5 });
      index++;
    });
    $("#rank_respec").find("path[id='char']").remove();
    var application_name = ['ash','attack','control','fastatk','shield','tank'];
    index = 0;
    $(".survey").find('.application').each(function () {
      $(this).html(
        '<i class="material-icons">&#xe836;</i>'+
        '<i class="material-icons" style="display:none">&#xe837;</i>'
      ).attr({'type':application_name[index],'value':0})
        .prev('.num').text('0票');
      index ++;
    });
  }
  function addSurvey(data,survey) {
    // console.log(data,survey);
    current_cat_survey = survey;
    current_cat_statistic = data;
    let arr = [];
    if(!data) return
    if(data.nickname){
      for(let i in data.nickname)
        arr.push(data.nickname[i].nickname);
      $(".survey #nickname div").text(arr.join(","));
    }
    update_total_rank(data.rank);
    update_respect_rank(data.rank);
    update_application(data.application);
    if(survey.rank){
      for(let type in survey.rank){
        if(survey.rank[type]){
          let star =  $(".survey").find("span[type='"+type+"']").children("i"),
              flag = false;
          star.attr('value',1);
          for(let i=5;i>0;i--){
            if(survey.rank[type][i]) {flag=true;break}
            star.eq(i-1).attr("value",0);
          }
          if(flag) star.parent().attr("new",'false');
        }
      }
    }
    if(survey.application){
      for(let i in survey.application)
        if(survey.application[i])
          $('.survey .application[type="'+i+'"]').children().toggle();
    }
  }
  $(document).on('click','#nickname span',function () {
    let type = $(this).attr("id").split("_nick")[0],
        quene = current_cat_statistic.nickname?current_cat_statistic.nickname:[],
        org = [];
    for(let i in quene)
      org.push(quene[i].nickname);

    if(type == 'add'){
      $(this).hide().siblings('span').show();
      $(this).siblings('div')
        .html('<input type="text" placeholder="請輸入暱稱" />')
        .find('input').focus();
      return
    }
    else if(type == 'confirm'){
      let val = $('#nickname').find("input").val();
      update_nickname(val,quene,org);
    }
    $(this).siblings('div').html(org.join(","))
    $("#add_nick").show().siblings('span').hide();
  });
  $(document).on('keypress','#nickname div input',function (e) {
    if(e.keyCode!=13) return
    let val = $(this).val(),
        quene = current_cat_statistic.nickname?current_cat_statistic.nickname:[],
        org = [];
    for(let i in quene)
      org.push(quene[i].nickname);
    update_nickname(val,quene,org);
    $(this).parent().html(org.join(","));
    $("#add_nick").show().siblings('span').hide();
  });
  $(document).on('click',".survey #rank span i,.rank_respec span i",function () {
    let a = $(this).attr("no"),
        New = $(this).parents('span').attr('new'),
        type = $(this).parents('span').attr('type');
    $(this).parent().children('i').each(function () {
      let b = $(this).attr("no");
      if (b>a) $(this).attr('value',0);
      else $(this).attr('value',1);
    });
    // console.log(type,a,New);
    if(New == 'true'){
      if(!current_cat_statistic.rank)
        current_cat_statistic.rank = {
          atk:{1:0,2:0,3:0,4:0,5:0},
          control:{1:0,2:0,3:0,4:0,5:0},
          cost:{1:0,2:0,3:0,4:0,5:0},
          hp:{1:0,2:0,3:0,4:0,5:0},
          range:{1:0,2:0,3:0,4:0,5:0},
          speed:{1:0,2:0,3:0,4:0,5:0},
          total:{1:0,2:0,3:0,4:0,5:0}
        };
      current_cat_statistic.rank[type][a]++;
      if(!current_cat_survey.rank)
        current_cat_survey.rank = {
          atk:{1:0,2:0,3:0,4:0,5:0},
          control:{1:0,2:0,3:0,4:0,5:0},
          cost:{1:0,2:0,3:0,4:0,5:0},
          hp:{1:0,2:0,3:0,4:0,5:0},
          range:{1:0,2:0,3:0,4:0,5:0},
          speed:{1:0,2:0,3:0,4:0,5:0},
          total:{1:0,2:0,3:0,4:0,5:0}
        };
      current_cat_survey.rank[type][a] = 1;
    }
    else{
      let org = 0;
      for(let i in current_cat_survey.rank[type])
        if(current_cat_survey.rank[type][i]) org = i;
      if (org == a) return
      current_cat_survey.rank[type][a] = 1;
      current_cat_survey.rank[type][org] = 0;
      current_cat_statistic.rank[type][a]++;
      current_cat_statistic.rank[type][org]--;
    }
    update_total_rank(current_cat_statistic.rank);
    update_respect_rank(current_cat_statistic.rank);
    socket.emit("cat survey",{
      uid : current_user_data.uid,
      cat : current_cat_data.id,
      type : 'rank',
      add : current_cat_survey.rank,
      all : current_cat_statistic.rank
    });
    $(this).parents('span').attr('new',false);

  });
  $(document).on('click','.application i',function () {
    let active = Number($(this).parent().attr('value')),
        type = $(this).parent().attr('type');
    $(this).hide().siblings().show().parent().attr('value',function () {
      return active?0:1
    });
    if(!current_cat_statistic.application)
      current_cat_statistic.application = {
        ash:0,attack:0,control:0,fastatk:0,shield:0,tank:0
      }
    if(!current_cat_survey.application)
      current_cat_survey.application = {
        ash:0,attack:0,control:0,fastatk:0,shield:0,tank:0
      }
    current_cat_statistic.application[type] += (active?(-1):1);
    current_cat_survey.application[type] = (active?0:1);
    update_application(current_cat_statistic.application);
    socket.emit("cat survey",{
      uid : current_user_data.uid,
      cat : current_cat_data.id,
      type : 'application',
      add : current_cat_survey.application,
      all : current_cat_statistic.application
    });

  });
  $(document).on("click",'#mobile_rank_respec',function () {
    for(let i=0;i<6;i++){
      if(i) $('.rank_respec').eq(i).parent().toggle();
      else $('.rank_respec').eq(i).toggle().siblings().toggle();
    }
  });
  $(document).on("click","#comment_submit",submitComment);
  $(document).on('keypress','.comment_input textarea',function (e) {
    if(e.keyCode == '13' && !e.shiftKey) {submitComment();return false}
  });
  function update_nickname(val,quene,org) {
    let r = confirm('確定加入暱稱 : '+val+" ?");
    if(!r) return
    if(val == ''||!val){
      alert("請輸入暱稱!");
      return
    }
    for(let i in quene)
      if(quene[i].nickname == val){
        alert("暱稱已存在!");
        return
      }
    let obj = {
      owner:current_user_data.uid,
      nickname:val
    }
    quene.push(obj);
    org.push(val);
    socket.emit("cat survey",{
      uid : current_user_data.uid,
      cat : current_cat_data.id,
      type : 'nickname',
      add : obj,
      all : quene
    });
  }
  function update_total_rank(rank) {
    if(!rank) return
    let total_rank = rank.total;
    let count = sum = max = 0;
    for(let i in total_rank){
      count += total_rank[i];
      sum += i*total_rank[i];
      max = total_rank[i]>max?total_rank[i]:max;
    }
    let angle = 2*Math.PI*sum/count/5;
    let arc = d3.svg.arc()
                .innerRadius(37)
                .outerRadius(43)
                .startAngle(0)
                .endAngle(angle);
    $('#rank_c').find('path').remove();
    d3.select("#rank_c").append('path').attr({
      'd':arc,
      'fill':'rgb(83, 245, 162)',
      'style':'transform:translate(43px,43px)'
    });
    if(Number(sum/count))
      d3.select("#rank_c").select('text')
        .text((sum/count).toFixed(1))
        .attr({
          x:22,y:53,dy:0,
          style:'font-size:30px;font-weight:bold'
        });
    let i = 5;
    $('#rank_detail .detail').each(function () {
      $(this).find(".char").css('width',function () {
        return (total_rank[i]/max*100)+"%"
      }).siblings(".num").text(total_rank[i]);
      i -- ;
    });
  }
  function update_respect_rank(rank) {
    let eq = 0,pos=[];
    for(let i in rank){
      let sum = count = 0;
      if(i == 'total') continue
      for(let j in rank[i]){
        sum += rank[i][j]*j;
        count += rank[i][j];
      }
      // console.log(i,sum,count);
      let a = Math.PI/3*eq+Math.PI/2,r = count?80*sum/count/5:0;
      pos.push({x:r*Math.cos(a)+119.28,y:-r*Math.sin(a)+100})
      eq++;
    }
    // console.log(pos);
    var line = d3.svg.line()
     .x(function(d) {return d.x;})
     .y(function(d) {return d.y;})
     .interpolate('linear-closed');
    $("#rank_respec").find("path[id='char']").remove();
    d3.select("#rank_respec").append('path')
      .attr({
        'd': line(pos),
        'y': 0,
        'stroke': '#ff8a11',
        'stroke-width': '3px',
        'fill': 'rgba(232, 185, 146, 0.6)',
        'id':'char'
      });
  }
  function update_application(app) {
    for(let i in app)
      $('.survey .application[type="'+i+'"]').prev(".num").text(app[i]+"票");
  }
  function append_comment(comment) {
    // console.log(comment);
    $(".comment_input").parents('tr').siblings(".comment").remove();
    if(comment == undefined){
      $("<tr class='comment'><td colspan='6'>尚無評論</td></tr>")
        .insertAfter(".dataTable #comment_head");
        return
    }
    let html = '';
    for(let i in comment){
      html +=
        '<tr class="comment"><td colspan="6">'+
        '<div class="comment_content">'+
        '<span class="photo"></span>'+
        '<div id="'+i+'">'+
        '<span class="bubble">'+comment[i].comment.split("\n").join("</br>")+'</span>'+
        '<span class="time">'+commentTime(comment[i].time)+'</span></div>'+
        '</div></td></tr>'
    }
    $(html).insertAfter(".dataTable #comment_head");
  }
  function submitComment() {
    let comment = $(".comment_input").find('textarea').val();
    // console.log(comment);
    if(!comment) return
    socket.emit('comment cat',{
      cat:current_cat_data.id,
      owner:current_user_data.uid,
      comment:comment,
      time:new Date().getTime()
    });
    $(".comment_input").find('textarea').val('');
  }
  function commentTime(date) {
    var now = new Date().getTime(),
        d = now-date,
        e = new Date(date);

    if(d<60000) return (d/1000).toFixed(0)+"秒前"
    else if(d<3600000) return (d/60000).toFixed(0)+"分鐘前"
    else if(d<86400000) return (d/3600000).toFixed(0)+"小時前"
    else return e.getFullYear+"/"+(e.getMonth+1)+"/"+e.getDate
  }

  function toggleCatStage() {
    let group = $(this).parent(),
        current = group.children(".card:visible").next('.card').attr('value');
    if(group.children(".card").length>1) group.css("transform","rotateY(90deg)");
    setTimeout(function () {
      group.css("transform","rotateY(0)");
      if(current != undefined){
        group.children(".card:visible").hide().next('.card').show();
      }
      else{
        group.children(".card:visible").hide().parent().children('.card').eq(0).show();
      }
    },400);
  }
  var compare ;
  $('#selected').sortable('option',{
    item: '> .card-group',
    connectWith: ".compareTarget"
  });
  $('.compareTarget').sortable('option',{
    item: '> comparedata'
  });
  $('#selected').on('sortstart',function (e,ui) {
    $('.compareTarget_holder').css('left',0);
    $('#compareTarget_tag').css('left',180).children('i').css({"transform":"rotate(180deg)"});
    showcomparetarget = 0 ;
  });
  $('.compareTarget').on('sortover',function (e,ui) {
    let input = ui.item.children('.card:visible');
    compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
    if(compare.indexOf(input.attr('value')) != -1){
      let repeat = $(this).find('[value='+input.attr('value')+']') ;
      repeat.css('border-color','rgb(237, 179, 66)');
      setTimeout(function () {
        repeat.css('border-color','white');
      },1000);
      $("#selected").sortable('cancel');
      $(".compareTarget_holder").animate({
        scrollTop : repeat[0].offsetTop-100
      },800,'easeInOutCubic');
    }
    else if(ui.sender.is('#selected')){
      let id = input.attr('value'),
          name = input.text();
      $(".compareTarget").append(
      '<span class="card" value="'+id+
      '" style="background-image:url('+
      image_url_cat+id+'.png'+
      '">'+name+'</span>');
      $("#selected").sortable('cancel');
      $('.compareTarget_holder').animate({
        scrollTop : $('.compareTarget').height()
      },500,'easeInOutCubic');
      compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
      $("#compare_number").text(compare.length);
      socket.emit("compare cat",{id:current_user_data.uid,target:compare});
    }
    else $("#selected").sortable('cancel');
  });
  $('.compareTarget').on('sortout',function (e,ui) {
    let x = ui.position.left,
        y = ui.position.top ;
    if(ui.sender.is('.compareTarget')) {
      let r = confirm("確定要將"+ui.item.children(".card").text()+"從比較列中移除?") ;
      if(!r) return
      ui.item.remove();
      compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
      $("#compare_number").text(compare.length);
      socket.emit("compare cat",{id:current_user_data.uid,target:compare});
    }
  });
  function addToCompare() {
    $('.compare_panel').css('height',0);
    if(showcomparetarget) showhidecomparetarget();
    let target = $(this).parent().children(".card:visible");
    compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
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
      compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
      $("#compare_number").text(compare.length);
      socket.emit("compare cat",{id:current_user_data.uid,target:compare});
    }
  }
  $("#clear_compare").click(function () {
    let r = confirm("確定要移除所有貓咪?!");
    if(!r)return
    showhidecomparetarget();
    $(this).siblings().html("");
    compare = [];
    $("#compare_number").text(compare.length);
    socket.emit("compare cat",{id:current_user_data.uid,target:compare});
  });

  function changeSlider() {
    let target = $("#"+filter_name+".filter_option");
    let range = JSON.parse(target.attr('range')),
        step = Number(target.attr('step')),
        value = Number($(this).val()) ;

    value = Math.round(value/step)*step ;

    if(value && value<range[1] && value>range[0]) $("#slider_holder").find('.slider').slider('option','value',value);
    else $("#slider_holder").find('.slider').slider('option','value',filter_org);
  }
  function calculateLV() {
    let val = Number($(this).val()),
        rarity = current_cat_data.rarity,
        type = $(this).parents('td').attr('id'),
        ori = current_cat_data[type],
        lv;
    if(!val){
      $(this).parent().html(input_org);
      return
    }
    let limit ;
    switch (rarity) {
      case 'R':
      limit = 70 ;
      break;
      case 'SR_alt':
      limit = 20 ;
      break;
      default:
      limit = 60 ;
    }
    // console.log(val+","+rarity+","+ori+","+limit);
    lv = val/ori*10-8 ;
    lv = lv/2 > limit ? lv-limit : lv/2 ;
    lv = Math.ceil(lv) ;
    // console.log(lv);
    if(lv > 100){
      alert("超出範圍!!!");
      $('#level').slider('option','value',100);
      $(this).parent().html(levelToValue(ori,rarity,100));
    } else if(lv <1){
      alert("超出範圍!!!");
      $('#level').slider('option','value',1);
      $(this).parent().html(levelToValue(ori,rarity,1));
    }
    else{
      $('#level').slider('option','value',lv);
      $(this).parent().html(levelToValue(ori,rarity,lv));
    }

  }

});

function AddCombo(arr) {
  if(arr.length == 0){
    return "<tr class='combo'><td colspan=6>無可用聯組</td></tr>"
  }
  let html = "",
      pic_html  ;
  for(let i in arr){
    pic_html = "<div style='display:flex'>" ;
    for(let j in arr[i].cat){
      // console.log(arr[i].cat[j])
      if(arr[i].cat[j] != "-"){
        pic_html +=
        '<span class="card" value="'+arr[i].cat[j]+'" '+
        'style="background-image:url('+
        image_url_cat+arr[i].cat[j]+'.png);'+
        (screen.width > 768 ? "width:90;height:60;margin:5px" : "width:75;height:50;margin:0px")
        +'"></span>' ;
      }
    }
    pic_html += "</div>" ;
    html += screen.width > 768 ?
            ("<tr class='combo'>"+
            "<th val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
            "<td>"+arr[i].name+"</td>"+
            "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
            "</tr><tr class='combo'>"+
            "<td colspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>") :
            ("</tr><tr class='combo'>"+
            "<th colspan=2 val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
            "<td colspan=4 rowspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>"+
            "</tr><tr class='combo'>"+
            "<td colspan=2 >"+arr[i].name+"</td>"+
            "</tr><tr class='combo'>"+
            "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
            "</tr>"
          );

  }
  // console.log(html);
  return html
}
function Thisbro(arr) {
  let html = "<div style='display:flex;justify-content: center;"+(screen.width > 768 ? "" : "padding:10px")+"'>" ;
  for(let i in arr) {
    html +=
    '<span class="card" value="'+arr[i]+'" '+
    'style="background-image:url('+
    image_url_cat+arr[i]+'.png);'+
    (screen.width > 768 ? "width:90;height:60;margin:5px" : "width:75;height:50;margin:5px")
    +'"></span>'  ;
  }
  html += "</div>" ;
  return html
}

function parseRarity(r) {
  let arr = ['基本','EX','稀有','激稀有','激稀有狂亂','超激稀有'],
      brr = ['B','EX','R','SR','SR_alt','SSR'];

  return arr[brr.indexOf(r)]
}
