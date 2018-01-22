$(document).ready(function () {
  var timer = new Date().getTime();
  var compare = [] ;
  var socket = io.connect();
  var current_cat_data = {};
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };

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
      socket.emit("search",{
        uid:data.uid,
        rFilter:last.rFilter?last.rFilter:[],
        cFilter:last.cFilter?last.cFilter:[],
        aFilter:last.aFilter?last.aFilter:[],
        gFilter:last.gFilter?last.gFilter:[],
        filterObj:last.otherFilter?last.otherFilter:[],
        type:"cat"
      });
      for(let i in last){
        if(i == 'otherFilter'){
          for(let j in last[i]){
            $("#lower_table").find("th[id='"+last[i][j].name+"']")
              .attr({'active':true,'value':last[i][j].limit,'reverse':last[i][j].reverse})
              .click();
          }
        }
        else if(i=='gFilter'){
          for(let j in last[i]) $("#gacha_table").find(".button[id='"+last[i][j]+"']").click();
          $("#more_gacha_search").click();
        }
        else for(let j in last[i]) $("#upper_table").find(".button[name='"+last[i][j]+"']").click();
      }
    }
    show_more = !data.setting.show_more_option;
    if(!data.setting.show_ability_text ||screen.width<768){
        $(".select_ability").children(".button").each(function () {
          $(this).css({'padding':0,'border-radius':7,'overflow':'hidden'})
            .children("span").fadeOut().siblings("i").css({width:40,height:40});
        });
    }
    setTimeout(function () {
      $("#loading").fadeOut();
    },2500);
  });
  socket.emit("require gachadata");
  socket.on("return gachadata",function (data) {
    // console.log(data);
    // for(let i in data){
    //   // console.log(i,data[i].name);
    //   $("#gacha_search").append("<span id='"+i+"' class='button' value = 0>"+data[i].name.split(" 稀有轉蛋")[0]+"</span>").toggle();
    // }
  });
  var more_gacha = 0 ;
  $(document).on("click","#more_gacha_search",function () {
    if(more_gacha) $(this).find("i").css("transform","rotate(90deg)");
    else $(this).find("i").css("transform","rotate(-90deg)");
    $(".gacha_search").toggle();
    more_gacha = more_gacha?0:1;
  });
  var tip_fadeOut;
  $(document).on("click",".select_ability .button",function () {
    let text = $(this).children("span").text(),
        val = $(this).attr('value')=='1'?true:false;
        console.log(val);
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
  });
  $(document).on('keypress','#searchBox',function (e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      let keyword = $(this).val();
      socket.emit("text search",{key:keyword,type:'cat'});
      ga('send', 'event', 'cat', 'search', 'text',{text:val});
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
    location.assign('combo.html')
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
    console.log(result) ;
    let data = new Cat(result.this),
        arr = result.bro,
        brr = result.combo,
        lv = (result.lv == 'default'||result.lv == null) ? current_user_data.setting.default_cat_lv : result.lv,
        own = result.own;

    displayCatData(data,arr,brr,lv,result.count,own) ;
    current_cat_data = data;
  });
  var number_page,page_factor ;
  socket.on("search result",function (data) {
    console.log("recive search result");
    console.log(data);
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
  function displayCatData(data,arr,brr,lv,count,own) {
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

    html += "<tr><th "+(showID?"":"hidden")+">ID</th><td "+(showID?"":"hidden")+">"+data.id+
            "</td><th "+(showCount?"":"hidden")+">查詢次數</th><td "+(showCount?"":"hidden")+">"+count+"</td>"+
            "<td id='more' colspan='2'>更多選項</td></tr>";

    html += displayCatHtml(data,arr,brr,lv,count);

    $(".dataTable").empty();
    $(".dataTable").attr('id',data.id).append(html);
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
      socket.emit("store cat level",{
        uid : current_user_data.uid,
        id : $(this).parents(".dataTable").attr("id"),
        lv : ui.value
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
  function search() {
    let rarity = $(".select_rarity [value=1]"),
    color = $(".select_color [value=1]"),
    ability = $(".select_ability [value=1]"),
    gacha = $(".gacha_search td .button[value=1]");
    console.log(more_gacha);
    let rFilter = [], cFilter = [], aFilter = [],gFilter = [] ;
    for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
    for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;
    if(more_gacha)
      for(let i = 0;i<gacha.length;i++) gFilter.push(gacha.eq(i).attr('id')) ;

    let  filterObj = [] ;
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
    socket.emit("search",{
      uid:current_user_data.uid,
      rFilter,cFilter,aFilter,gFilter,filterObj,
      type:"cat"
    });
    scroll_to_div('selected');
  }
  function condenseCatName(data) {
    console.log('condensing....');
    let now = '000' ;

    let html = '<span class="card-group" hidden>' ;
    for(let i in data){
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
      }
    }
    return html ;
  }
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
    socket.emit("search",{
      uid:current_user_data.uid,
      rFilter,cFilter,aFilter,gFilter,filterObj,
      type:"cat"
    });
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
        name = $(".dataTable").find("#name").text();
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

  var showcomparetarget = 1 ;
  $(document).on('click','#compareTarget_tag',showhidecomparetarget);
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
  function toggleCatStage() {
    let current = $(this).parent().children(".card:visible").next('.card').attr('value');
    if(current != undefined){
      $(this).parent().children(".card:visible").hide().next('.card').show();
    }
    else{
      $(this).parent().children(".card:visible").hide().parent().children('.card').eq(0).show();
    }
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
      $(".compareTarget").append('<div class="compareTarget_child" value='+id+'>'+
      '<i class="fa fa-trash"></i>'+
      '<span class="card" value="'+id+
      '" style="background-image:url('+
      image_url_cat+id+'.png'+
      '">'+name+'</span></div>');
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
  $('#a_compareCat ').bind('click',function () {
    compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
    socket.emit("compare cat",{id:current_user_data.uid,target:compare});
    location.assign('/compareCat.html');
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
    console.log(val+","+rarity+","+ori+","+limit);
    lv = val/ori*10-8 ;
    lv = lv/2 > limit ? lv-limit : lv/2 ;
    lv = Math.ceil(lv) ;
    console.log(lv);
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
    return "</tr><tr><td colspan=6>無可用聯組</td>"
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
            ("</tr><tr>"+
            "<th val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
            "<td>"+arr[i].name+"</td>"+
            "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
            "</tr><tr>"+
            "<td colspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>") :
            ("</tr><tr>"+
            "<th colspan=2 val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
            "<td colspan=4 rowspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>"+
            "</tr><tr>"+
            "<td colspan=2 >"+arr[i].name+"</td>"+
            "</tr><tr>"+
            "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
            "</tr><tr>"
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
function displayCatHtml(data,arr,brr,lv,count) {
  let html = '';
  html += screen.width > 768 ?
  "<tr>"+
  "<th style='height:80px;padding:0'><img src='"+data.imgURL+"' style='height:100%'></th>"+
  "<th colspan=3 rarity='"+data.rarity+"' id='name'>["+data.Rarity+"] "+data.Name+"</th>"+
  "<th colspan=2>"+Thisbro(arr)+"</th>"+
  "</tr>" :
  "<tr>"+
  "<th colspan='6' style='height:80px;padding:0;background-color:transparent'><img src='"+
  data.imgURL+"' style='height:100%'>"+Thisbro(arr)+"</th>"+
  "</tr><tr>"+
  "<th colspan='6' rarity='"+data.rarity+"' id='name'>["+data.Rarity+"] "+data.Name+"</th>"+
  "</tr>" ;

  html +=
  "<tr>"+
  "<th colspan='1'>等級</th>"+
  "<td colspan='4' class='level'>"+
  "<div id='level' class='slider'></div>"+
  "</td>"+
  "<td colspan='"+(screen.width < 768 ? 5 : 1)+"' >"+
  "<span id='level_num'>30</span>"+
  "</td >"+
  "<tr>"+
  "<th>體力</th><td id='hp'>"+
  "<span class='editable'>"+data.Tovalue('hp',lv)+"</span></td>"+
  "<th>KB</th><td id='KB'>"+data.Tovalue('kb',lv)+"</td>"+
  "<th>硬度</th><td id='hardness'>"+
  "<span class='editable'>"+data.Tovalue('hardness',lv)+"</span></td>"+
  "</tr><tr>"+
  "<th>攻擊力</th><td id='atk'>"+
  "<span class='editable'>"+data.Tovalue('atk',lv)+"</span></td>"+
  "<th>DPS</th><td id='dps'>"+
  "<span class='editable'>"+data.Tovalue('dps',lv)+"</span></td>"+
  "<th>射程</th><td id='range'>"+data.range+"</td>"+
  "</tr><tr>"+
  "<th>攻頻</th><td id='freq'>"+data.Freq+" s</td>"+
  "<th>跑速</th><td id='speed'>"+data.speed+"</td>"+
  "<td colspan='2' rowspan='3' id='aoe'>"+data.Aoe+"</td>"+
  "</tr><tr>"+
  "<th>攻擊週期</th><td id='cost'>"+data.Period+" s</td>"+
  "<th>攻發時間</th><td id='cd'>"+data.atk_speed+" s</td>"+
  "</tr><tr>"+
  "<th>花費</th><td id='cost'>"+data.cost+"</td>"+
  "<th>再生産</th><td id='cd'>"+data.cd+" s</td>"+
  "</tr><tr>"+
  "<th>取得方法</th>"+
  "<td colspan='5' id='get_method'>"+data.get_method+"</td>"+
  "</tr><tr>"+
  "<td colspan = '6' id='char'>"+data.CharHtml(lv)+"</td>"+
  "</tr><tr>"+
  "<th colspan='6'>發動聯組</th>"+
  AddCombo(brr)+
  "</tr>"
  return html
}

function parseRarity(r) {
  let arr = ['基本','EX','稀有','激稀有','激稀有狂亂','超激稀有'],
      brr = ['B','EX','R','SR','SR_alt','SSR'];

  return arr[brr.indexOf(r)]
}
