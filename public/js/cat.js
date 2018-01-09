$(document).ready(function () {
  var timer = new Date().getTime();
  var compare = [] ;
  var setting = {
        compare_max : 4 ,
        display_id : false
      } ;
  var filter_name = '' ;
  var socket = io.connect();
  var current_cat_data = {};
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };

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
    if(data.last_cat && location.pathname.indexOf('once') == -1) socket.emit("display cat",{
      uid : data.uid,
      cat : data.last_cat
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

  });

  $(document).on('click','.card',function (e) {
    if($(this).parent().parent().attr("class")=='compareTarget_holder') return
    else {
      socket.emit("user Search",{
        uid : current_user_data.uid,
        type : 'cat',
        id : $(this).attr('value')
      });
      socket.emit("display cat",{
        uid : current_user_data.uid,
        cat : $(this).attr('value')
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
    console.log()
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'combo',
      id : [$(this).attr('val')]
    });
    location.assign('combo.html')
  }) ;

  var rarity = ['基本','EX','稀有','激稀有','激稀有狂亂','超激稀有'] ;
  for(let i in rarity) $(".select_rarity").append("<span class='button' name='"+rarity[i]+"' value='0' >"+rarity[i]+"</span>") ;

  var color = ['對紅','對浮','對黒','對鋼鐵','對天使','對外星','對不死','對白'];
  for(let i in color) $(".select_color").append("<span class='button' name='["+color[i]+"]' value='0'>"+color[i]+"</span>") ;

  var ability = ['增攻','降攻','免疫降攻','擅於攻擊','很耐打','超大傷害','爆擊','擊退','免疫擊退','連續攻擊','不死剋星',
                '緩速','免疫緩速','暫停','免疫暫停','遠方攻擊','復活','波動','抵銷波動','免疫波動','2倍金錢','只能攻撃',
                '攻城','鋼鐵','免疫傳送','破盾'];
  for(let i in ability) $(".select_ability").append("<span class='button' name='["+ability[i]+"]' value='0'>"+ability[i]+"</span>") ;

  socket.on("display cat result",function (result) {
    console.log("recive cat data,starting display") ;
    console.log(result) ;
    let data = result.this,
        arr = result.bro,
        brr = result.combo,
        lv = (result.lv == 'default'||result.lv == null) ? current_user_data.setting.default_cat_lv : result.lv,
        own = result.own;
    displayCatData(data,arr,brr,lv,result.count,own) ;
    current_cat_data = result;
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
    number_page /= (screen.width > 1024?8:6) ;
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
        console.log(own);
    // "<tr><th>Id</th><td id='id'>"+data.id+"</td></tr>"
    html += "<tr><td style='background-color:transparent' colspan="+
            (screen.width > 768 ?2:0)+"></td>"+
            "<td style='background-color:transparent' colspan="+
            (screen.width > 768 ?2:3)+"><span class='button' id='mark_own' value='"+
            (own?1:0)+"'>我有這隻貓</span></td>"+
            "<td style='background-color:transparent' colspan="+
            (screen.width > 768 ?2:3)+"><button id='addcart'>加到購物車</button></td>";

    html += "<tr><th "+(showID?"":"hidden")+">ID</th><td "+(showID?"":"hidden")+">"+data.id+
            "</td><th "+(showCount?"":"hidden")+">查詢次數</th><td "+(showCount?"":"hidden")+">"+count+"</td>"+
            "<td colspan=2><a target='blank' href='http://battlecats-db.com/unit/"+
            grossID+".html'>在超絕攻略網打開<i class='material-icons'>insert_link</i></a></td></tr>";

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
      if(ui.value != current_user_data.setting.default_cat_lv){
        socket.emit("store cat level",{
          uid : current_user_data.uid,
          id : $(this).parents(".dataTable").attr("id"),
          lv : ui.value
        });
      }
    });
    $("#level").on("slide", function(e,ui) {
      $("#level_num").html(ui.value);
      updateState(ui.value);
    });
    function updateState(level) {
      let rarity = data.rarity;
      let change = ['hp','hardness','atk','DPS'] ;
      for(let i in change){
        let target = $('.dataTable').find('#'+change[i]) ;
        let original = target.attr('original');
        target.html("<span class='editable' rarity='"+data.rarity+"'>"+
        levelToValue(original,rarity,level).toFixed(0)+
        "</span>").css('background-color',' rgba(242, 213, 167, 0.93)');
        setTimeout(function () {
          target.css('background-color','rgba(255, 255, 255, .9)');
        },500);
      }
      if(data.char.indexOf("連續攻擊") != -1){
        let target = $('.dataTable').find('#char');
        target.html(serialATK(data.char,levelToValue(data.atk,data.rarity,level)));
      }
    }
  }
  function search() {
    let rarity = $(".select_rarity [value=1]"),
    color = $(".select_color [value=1]"),
    ability = $(".select_ability [value=1]");
    let rFilter = [], cFilter = [], aFilter = [] ;
    for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
    for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;

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
      rFilter,cFilter,aFilter,filterObj,
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
    let val = Number($(this).attr("value")) ? 0 : 1,
        cat = $(this).parents("table").attr("id").substring(0,3);
    socket.emit("mark own",{
      uid:current_user_data.uid,
      cat:cat,
      mark:val
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

      // alert(JSON.stringify(position));
      position.top -= 30 ;
        if(active && screen.width > 768){
          $("#TOOLTIP").finish().fadeIn();
          $("#TOOLTIP").offset(position).width(width).text(value+reverse) ;
        }

    },function () {
      $("#TOOLTIP").fadeOut();
  });

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
      socket.emit("user Search",{
        uid : current_user_data.uid,
        type : 'cat',
        id : $(this).parent().attr('id')
      });
      socket.emit("display cat",{
        uid : current_user_data.uid,
        cat : $(this).parent().attr('id')
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
        rarity = $(this).parent().attr('rarity'),
        ori = Number($(this).parents('td').attr('original')),
        lv;
    if(!val){
      $(this).parent().html(input_org);
      return
    }
    let limit ;
    switch (rarity) {
      case '稀有':
      limit = 70 ;
      break;
      case '激稀有狂亂':
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
  "<th style='height:80px;padding:0'><img src='"+
  image_url_cat+data.id+'.png'+
  "' style='height:100%'></th>"+
  "<th colspan=3 rarity='"+data.rarity+"' id='name'>"+data.name+"</th>"+
  "<th colspan=2>"+Thisbro(arr)+"</th>"+
  "</tr>" :
  "<tr>"+
  "<th colspan='6' style='height:80px;padding:0;background-color:transparent'><img src='"+
  image_url_cat+data.id+'.png'+
  "' style='height:100%'>"+Thisbro(arr)+"</th>"+
  "</tr><tr>"+
  "<th colspan='6' rarity='"+data.rarity+"' id='name'>"+data.name+"</th>"+
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
  "<th>體力</th><td id='hp' original='"+data.hp+"'>"+
  "<span class='editable' rarity='"+data.rarity+"'>"+
  levelToValue(data.hp,data.rarity,lv).toFixed(0)+
  "</span></td>"+
  "<th>KB</th><td id='KB'>"+data.kb+"</td>"+
  "<th>硬度</th><td id='hardness' original='"+(data.atk/data.kb).toFixed(0)+"'>"+
  "<span class='editable' rarity='"+data.rarity+"'>"+
  levelToValue(data.atk/data.kb,data.rarity,lv).toFixed(0)+
  "</span></td>"+
  "</tr><tr>"+
  "<th>攻擊力</th><td id='攻擊力' original='"+data.atk+"'>"+
  "<span class='editable' rarity='"+data.rarity+"'>"+
  levelToValue(data.atk,data.rarity,lv).toFixed(0)+
  "</span></td>"+
  "<th>DPS</th><td id='DPS' original='"+data.lv1dps+"'>"+
  "<span class='editable' rarity='"+data.rarity+"'>"+
  levelToValue(data.lv1dps,data.rarity,lv).toFixed(0)+
  "</span></td>"+
  "<th>射程</th><td id='range'>"+data.range+"</td>"+
  "</tr><tr>"+
  "<th>攻頻</th><td id='freq'>"+data.freq.toFixed(1)+" s</td>"+
  "<th>跑速</th><td id='speed'>"+data.speed+"</td>"+
  "<td colspan='2' rowspan='2' id='multi'>"+data.multi+"</td>"+
  "</tr><tr>"+
  "<th>花費</th><td id='cost'>"+data.cost+"</td>"+
  "<th>再生産</th><td id='cd'>"+data.cd.toFixed(1)+" s</td>"+
  "</tr><tr>"+
  "<td colspan='6' id='char' "+(
  data.char.indexOf("連續攻擊") != -1 ?
  "original='"+data.char特性+"'>"+
  serialATK(data.char,levelToValue(data.atk,data.rarity,lv)) :
  ">"+data.char)+
  "</td>"+
  "</tr><tr>"+
  "<th colspan='6'>發動聯組</th>"+
  AddCombo(brr)+
  "</tr>"

  return html
}
