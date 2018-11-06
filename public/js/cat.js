var CurrentUserID;
var current_search = [];
$(".select_ability").find(".ability_icon").each(function () {
  var name = $(this).attr("id");
  $(this).css("background-image","url('"+image_url_icon+name+".png')");
});
$(document).ready(function () {
  var timer = new Date().getTime();

  var current_cat_data = {};
  var current_cat_survey = {};
  var current_cat_statistic = {
    application:{
      ash:0,attack:0,control:0,fastatk:0,shield:0,tank:0
    },
    nickname:[],
    rank:{
      atk:{1:0,2:0,3:0,4:0,5:0},
      control:{1:0,2:0,3:0,4:0,5:0},
      cost:{1:0,2:0,3:0,4:0,5:0},
      hp:{1:0,2:0,3:0,4:0,5:0},
      range:{1:0,2:0,3:0,4:0,5:0},
      speed:{1:0,2:0,3:0,4:0,5:0},
      total:{1:0,2:0,3:0,4:0,5:0},
    }
  };

  auth.onAuthStateChanged(function(user) {
    if (user)  socket.emit("user connect",{user:user,page:location.pathname});
    else  {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    CurrentUserID = data.uid;
    if(data.last_cat && location.pathname.indexOf('once') == -1)
      socket.emit("required data",{
        type:'cat',
        target:data.last_cat,
        record:true,
        uid:data.uid
      });
    if(data.compare_c2c) {
      $(".compareTarget").empty();
      $("#compare_number").text(data.compare_c2c.length)
      for(let i in data.compare_c2c){
        let id = data.compare_c2c[i].id, name = data.compare_c2c[i].name;
        compareTargetAddCard(id,name);
      }
      compare = data.compare_c2c;
    }
    if(data.last_cat_search){
      let last = data.last_cat_search;
      if(last.query)
        socket.emit(last.query_type+" search",last);
      if(last.query_type=='gacha'){
        $("#gacha_search").click();
        for(let i in last.query)
          $("#gacha_table").find(".button[name='"+last.query[i]+"']").click();
      } else {
        for(let i in last.query)
         for(let j in last.query[i])
          $("#upper_table").find(".button[name='"+last.query[i][j]+"']").click();
        if(Number(last.colorAnd)) $(".select_color").prev().click();
        if(Number(last.abilityAnd)) $(".select_ability").prev().click();
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
    if(data.setting.show_ability_text && screen.width > 768)
        $(".select_ability").children(".button").each(function () {
          $(this).removeClass("smallicon");
        });
    if(!data.setting.show_cat_id)
      $('.display').find("#id").css({'background-color':'transparent','color':'transparent'})
        .prev().css({'background-color':'transparent','color':'transparent'});
    if(!data.setting.show_cat_count)
      $('.display').find("#count").css({'background-color':'transparent','color':'transparent'})
        .prev().css({'background-color':'transparent','color':'transparent'});

    setTimeout(function () { $("#loading").fadeOut(); },2500);
  });
  if(screen.width<=768) $("#level_num").parent().attr("colspan",5);

  $(document).on('click','.card',function (e) {
    if($(this).parent().parent().attr("class")=='compareTarget_holder') return
    else
    socket.emit("required data",{
      type:'cat',
      target:$(this).attr('value'),
      record:true,
      uid:CurrentUserID
    });
  });

  var input_org ;
  $(document).on('click','.editable',function () {
      input_org = $(this).text();
      $(this).html('<input type="number" value="' +input_org+ '"></input>').find('input').select();
  });
  $(document).on('blur', '.editable input', calculateLV);
  $('.filter_option').click(function () {
    $("#slider_holder").show();
    $(this).css('border-bottom','5px solid rgb(241, 166, 67)').siblings().css('border-bottom','0');
    filter_name = $(this).attr('id') ;
    filterSlider($(this));
  });
  var filter_org ;
  $(document).on('click','.value_display,#level_num',function () {
      filter_org = Number($(this).text());
      $(this).html('<input type="number" value="' +filter_org+ '"></input>').find('input').select();
  });
  $(document).on('blur','.value_display input',changeSlider) ;
  $(document).on('blur','#level_num input',function () {
    let val = Number($(this).val()) ;
    val = val && val>0 && val<101 ? val : filter_org ;
    $('#level').slider('option','value',val);
  });
  $(document).on('click','.searchCombo',function () {
    socket.emit("search combo",{
      uid:CurrentUserID,
      id:[$(this).attr('val')]
    }) ;
    if(window.parent.reloadIframe){
      window.parent.reloadIframe('combo');
      window.parent.changeIframe('combo');
    } else {
      window.open("/combo","_blank");
    }
  }) ;
  $(document).on("click",".dataTable .name",function () {
    let name = $(this).text();
    $(this).append(
      "<input type='text' value='"+
      name+"' style='position:fixed;top:-100px'/>"
    ).find("input").select();
    document.execCommand("Copy");
    $("#copy_alert").css("left",-10);
    setTimeout(function () {
      $(this).find("input").remove();
      $("#copy_alert").css("left",-250);
    },2600);
  });

  socket.on("required data",(data)=>{
    // console.log(data);
    var data = data.buffer[0],
        _data = new Cat(data.data);
    current_cat_data = _data;
    displayCatData(_data,data.bro,data.combo,data.lv,data.count,data.own) ;
    socket.emit('required cat comment',{
      uid:CurrentUserID,
      id:_data.id.substring(0,3)
    });
  });
  socket.on("comment",function (data) {
    console.log(data);
    var survey = data.survey?data.survey:{};
    var info = data.comment?data.comment:{statistic:null,comment:null};
    initial_survey();
    addSurvey(info.statistic,data.survey);
    append_comment(info.comment);
  });
  function displayCatData(data,arr,brr,lv,count,own) {
    let html = "",
        id = data.id,
        grossID = id.substring(0,3);

    if(own) $("#more_option #mark_own").attr({"value":1,'cat':grossID,'text':'我有這隻貓'}).html("&#xE8E6;");
    else $("#more_option #mark_own").attr({"value":0,'cat':grossID,'text':'我沒有這隻貓'}).html("&#xE8E7;");
    $("#more_option #out ").attr("href","http://battlecats-db.com/unit/"+grossID+".html");

    for (let i in data){
      if(i=='hp'||i=='hardness'||i=='atk'||i=='dps')
        $(".dataTable").find("#"+i).text(data.Tovalue(i,lv));
      else if(i == 'count')
        $(".dataTable").find("#"+i).text(count);
      else if(i == 'name')
        $(".dataTable").find("."+i).text(data.Name+" ["+data.Rarity+"]");
      else if(i == 'aoe')
        $(".dataTable").find("#"+i).text(data.Aoe);
      else if(i == 'char')
        $(".dataTable").find("#"+i).html(data.CharHtml(lv));
      else if(i == 'condition')
        $(".dataTable").find("#"+i).html(data.CondHtml());
      else
        $(".dataTable").find("#"+i).text(data[i]);
    }

    $(".dataTable").attr('id',data.id).find('.bro').html(Thisbro(arr));
    $(".dataTable").find('.img').css('background-image','url("'+data.imgURL+'")');

    $(".dataTable").find(".combo").remove();
    $(AddCombo(brr)).insertAfter('.dataTable #combo_head');
    initialSlider(data,lv);
    scroll_to_class("content",1);
  }
  function initialSlider(data,lv) {
    $("#level").slider({
      max: 100,
      min: 1,
      value: 30,
    });
    setTimeout(function () { $("#level").slider('option','value',lv) },800);
    var store_lv_timeOut ;
    $("#level").on("slidechange", function(e,ui) {
      clearTimeout(store_lv_timeOut);
      $("#level_num").html(ui.value);
      updateState(ui.value);
      store_lv_timeOut = setTimeout(function () {
        socket.emit("store level",{
          uid : CurrentUserID,
          id : current_cat_data.id,
          lv : ui.value,
          type : 'cat'
        });
      },200);
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
        if(screen.width>768&&Class.indexOf("mobile")!=-1)return
        if(screen.width<=768&&Class.indexOf("non_mobile")!=-1)return
        $(this).toggle();
      });
      toggle_survey = toggle_survey?0:1;
    }else{
      $(this).siblings('.comment').toggle();
      toggle_comment = toggle_comment?0:1;
    }
  });

  $(document).on("click","#mark_own",function () {
    let val = Number($(this).attr("value"))?0:1,
        cat = $(this).attr("cat"),
        icon = val?"&#xE8E6;":"&#xE8E7;";
    $(this).attr("text",function () {
      return "我"+(val?"":"沒")+"有這隻貓"
    }).html(icon);
    if(cat)
      socket.emit("mark own",{
        uid:CurrentUserID,
        cat:cat,
        mark:val
      });
    if(val) $(this).attr("value",1).find(".tag span").fadeOut();
    else $(this).attr("value",0).find(".tag span").fadeIn();
  });
  $(document).on("click","#char span[id!='serial']",function () {
    let type = $(this).attr("id"),
    rFilter=[],aFilter=[],gFilter=[],cFilter=[];
    if(type == 'color') {
      let ww = $(this).text().split(",")
      for(let i in ww) cFilter.push("對"+ww[i].substring(0,2));
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
      uid:CurrentUserID,
      query:{rFilter,cFilter,aFilter},
      query_type:type,
      filterObj:[],
      type:"cat",
      value:0
    });
    if($('#normal_search').attr("value")!=1) $("#normal_search").click();
  });
  $(document).on("click","#condition span",function () {
    var type = $(this).attr("type"),
        id = $(this).attr("id");
    if(type == "gacha"){
      socket.emit("gacha search",{
        uid:CurrentUserID,
        query:[id],
        query_type:"gacha",
        filterObj,
        type:"cat"
      });
    }
    else if(type == 'stage'){
      socket.emit("cat to stage",{
        uid : CurrentUserID,
        stage : id
      });
    }
  });
  socket.on("cat to stage",function (data) {
    // console.log(data);
    if(data.find) {
      if(window.parent.reloadIframe){
        window.parent.reloadIframe('stage');
        window.parent.changeIframe('stage');
      } else {
        window.open("/stage","_blank");
      }
    }
    else
      window.open('https://battlecats-db.com/stage/'+data.stage+'.html',"_blank");
  });

  $(".slider").slider();

  $(document).on('click','.glyphicon-refresh',toggleCatStage);

  function initial_survey() {
    $(".survey #nickname div").text("暫無暱稱");
    $("#rank i").attr('value',0);
    $('#rank span').attr("new",'true');
    $("#rank_c").find("path").remove();
    $('#rank').parent().attr('colspan',function () { return screen.width>768?2:3 });
    $('#rank_respec').parent().attr('colspan',function () { return screen.width>768?2:6 });
    $('#rank_respec').parent().attr('rowspan',function () { return screen.width>768?6:1 });
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
      ).attr('colspan',function () { return screen.width>768?3:5 });
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
    current_cat_survey = survey?survey:{};
    current_cat_statistic = data?data:current_cat_statistic;
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
    ga('send', 'event', 'survey_cat', 'rank',current_cat_data.id);
    socket.emit("cat survey",{
      uid : CurrentUserID,
      cat : current_cat_data.id.substring(0,3),
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
    ga('send', 'event', 'survey_cat', 'application',current_cat_data.id);
    socket.emit("cat survey",{
      uid : CurrentUserID,
      cat : current_cat_data.id.substring(0,3),
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
    ga('send', 'event', 'survey_cat', 'nickname',current_cat_data.id);
    let obj = {
      owner:CurrentUserID,
      nickname:val
    }
    quene.push(obj);
    org.push(val);
    socket.emit("cat survey",{
      uid : CurrentUserID,
      cat : current_cat_data.id.substring(0,3),
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
    let max = -1e10,maxapp = null ;
    for(let i in app) {
      if(Number(app[i])>max) {max = app[i];maxapp = [i]}
      else if(Number(app[i])==max) {max = app[i];maxapp.push(i);}
      $('.survey .application[type="'+i+'"]').prev(".num").text(app[i]+"票");
    }
    $('.survey .application').prev(".num").css({"color":"black","font-weight":"normal"});
    for(let i in maxapp)
    $('.survey .application[type="'+maxapp[i]+'"]').prev(".num")
    .css({"color":"#f79942","font-weight":'bold'})
  }
  var commentMap = {};
  function append_comment(comment) {
    // console.log(comment);
    commentMap = {};
    $(".comment_input").parents('tr').siblings(".comment").remove();
    if(!comment){
      $("<tr class='comment'><td colspan='6'>尚無評論</td></tr>")
        .insertAfter(".dataTable #comment_head");
        return
    }
    let html = '';
    for(let i in comment){
      html += commentHtml(i,comment[i]);
      if(!commentMap[comment[i].owner]){
        commentMap[comment[i].owner] = [i]
      }else{
        commentMap[comment[i].owner].push(i);
      }
    }
    $(html).insertAfter(".dataTable #comment_head");
    commentPhoto(commentMap);
  }
  function submitComment() {
    ga('send', 'event', 'comment', 'cat',current_cat_data.id);
    let comment = $(".comment_input").find('textarea').val();
    // console.log(comment);
    if(!comment) return
    socket.emit('comment cat',{
      cat:current_cat_data.id.substring(0,3),
      owner:CurrentUserID,
      comment:comment,
      time:new Date().getTime()
    });
    $(".comment_input").find('textarea').val('');
  }
  socket.on('cat comment push',function (data) {
    // console.log(data);
    let last = $('.comment').last();
    $(commentHtml(data.key,data,data.photo,data.name)).insertBefore(last);
    // $(".content").eq(1).animate({scrollTop:$('.comment').last()[0].offsetTop},800);
  });
  function commentHtml(id,comment,photo=null,name=null) {
    let html,uid = CurrentUserID;
    html = '<tr class="comment" style="display:'+(toggle_comment?'none':'')+'">'+
    '<td colspan="6" style="border-left:'+
    (comment.owner == uid?"5px solid rgb(235, 138, 38)":"0")+
    '"><div class="comment_content">'+
    '<span class="photo" style="'+
    (photo?'background-image:url(\''+photo+'\')':'')+'")"></span>'+
    '<span class="name">'+(name?name:'')+'</span>'+
    '<div id="'+id+'">'+
    '<span class="bubble">'+comment.comment.split("\n").join("</br>")+'</span>'+
    "<span class='function'>"+
    '<span class="time">'+commentTime(comment.time)+'</span>'+
    '<span class="like">'+likeOrEdit(comment.owner,comment.like)+'</span>'+
    '</span></div></div></td></tr>'
    return html
  }
  function commentTime(date) {
    var now = new Date().getTime(),
        d = now-date,
        b = new Date(date);
    if(d<60000) return (d/1000).toFixed(0)+"秒前"
    else if(d<3600000) return (d/60000).toFixed(0)+"分鐘前"
    else if(d<86400000) return (d/3600000).toFixed(0)+"小時前"
    else if(d<86400000*7) return (d/86400000).toFixed(0)+"天前"
    else return b.getFullYear()+"/"+(b.getMonth()+1)+"/"+b.getDate()
  }
  function likeOrEdit(uid,like) {
    var html = '',me = CurrentUserID,count = 0;
    for(let i in like) count++;
    html+='<i class="material-icons" id="like" value='+
          (like?(like[me]?1:0):0) +'>&#xe8dc;</i>'+
          '<span id="num_like">'+count+'</span>';
    if(uid == me){
      html+='<i class="material-icons" id="edit">&#xe254;</i>';
      html+='<i class="material-icons" id="del">&#xe872;</i>';
    }
    return html
  }
  function commentPhoto(obj) {
    console.log(obj);
    var buffer = [];
    for(let i in obj) buffer.push(i);
    socket.emit("required users photo",buffer);
  }
  socket.on('return users photo',function (obj) {
    console.log(obj);
    var default_photo = image_url_cat+"001-1.png";
    for(let i in obj){
      if(!obj[i]) obj[i] = {photo:default_photo,name:"使用者"};
      for(let j in commentMap[i]){
        let id = commentMap[i][j];
        $('.dataTable').find("#"+id).siblings('.photo')
          .css('background-image','url("'+(obj[i].photo?obj[i].photo:default_photo)+'")')
          .siblings('.name').text(obj[i].name);
      }
    }
  });

  $(document).on('click','.function .like i',function () {
    var type = $(this).attr('id'),
        num = Number($(this).next('span').text()),
        val = Number($(this).attr('value')),
        key = $(this).parents('div').attr("id"),
        inverse = false;
    // console.log(type);
    if(type == 'like'){
      if(!val) $(this).next('span').text(num+1);
      else {$(this).next('span').text(num-1);inverse = true;}
    }
    else if(type == 'del'){
      let r = confirm('確定刪除?!');
      if(r)
        $(this).parents(".comment").remove();
    }
    else {
      a = $(this).parents(".function").siblings(".bubble");
      b = a.html().split("<br>").join("\n");
      a.html("<textarea rows='1' maxlength='100'></textarea>")
        .find("textarea").val(b).select();
      return
    }
    socket.emit('comment function',{
      uid:CurrentUserID,
      key:key,
      cat:current_cat_data.id.substring(0,3),
      type:type,
      inverse:inverse
    });
    $(this).attr('value',function () { return val?0:1 });
  });
  $(document).on('keypress','.comment_content textarea',function (e) {
    if(e.keyCode == '13' && !e.shiftKey) {$(this).blur();return false}
  });
  $(document).on('blur','.comment_content textarea',editComment);
  function editComment() {
    var r = confirm("確定修改?");
    if(!r) return
    var val = $('.comment_content textarea').val(),
        key = $(this).parents('div').attr("id"),
        b = val.split("\n").join("<br>");
    $(this).parent().html(b);
    socket.emit('comment function',{
      uid:CurrentUserID,
      key:key,
      cat:current_cat_data.id.substring(0,3),
      type:'edit',
      val:val,
      inverse:false
    });

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
    },300);
  }
  function changeSlider() {
    let target = $("#"+filter_name+".filter_option");
    let range = JSON.parse(target.attr('range')),
        step = Number(target.attr('step')),
        value = Number($(this).val()),
        type = Number(target.attr("type"));

    value = Math.round(value/step)*step ;

    if(value && value<range[1] && value>range[0]) $("#slider_holder").find('.slider').slider('option','value',value);
    else $("#slider_holder").find('.slider').slider('option','value',filter_org);
  }
  function calculateLV() {
    var val = Number($(this).val()),
        rarity = current_cat_data.rarity,
        type = $(this).parents('td').attr('id'),
        ori = current_cat_data[type],
        lv;
    if(!val){
      $(this).parent().html(input_org);
      return
    }
    var limit ;
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
    lv = lv/2 > limit ? (lv > 2*limit+20 ? (lv-10-1.5*limit)*2 : lv-limit) : lv/2 ;
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
