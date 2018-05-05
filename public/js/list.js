var list = { upper:[],lower:[] };
$(document).ready(function () {
  var socket = io.connect();
  var tip_fadeOut;

  var current_user_id = '';
  var current_editing_list = null;

  auth.onAuthStateChanged(function(user) {
    if (user)  socket.emit("user connect",{user:user,page:location.pathname});
    else  console.log('did not sign in');
  });
  socket.on("current_user_data",function (data) {
    current_user_id = data.uid;
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
  });
  $(".slider").slider();

//-----------------------------------------------------------------------------
  $(".select_ability .button").click(function () {
    let text = $(this).children("span").text(),
        val = $(this).attr('value')=='1'?true:false;
    if(!val){
      clearTimeout(tip_fadeOut);
      $(".ability_tip").remove();
      $("body").append("<div class='ability_tip'>"+text+"<div>");
      setTimeout(function () { $(".ability_tip").css("left",-10); },100)
      tip_fadeOut = setTimeout(function () { $(".ability_tip").css("left",-250) },2000);
    }
  });
  $('.search_type .button').click(function () {
    let type = $(this).attr('id').split("_")[0];
    if(type == 'normal'){
      $("#gacha_search,#combo_search").attr("value",0);
      $("#gacha_table,#combo_table").hide(200).siblings("#upper_table").show(200);
    } else if(type == 'gacha'){
      $("#normal_search,#combo_search").attr("value",0);
      $("#upper_table,#combo_table").hide(200).siblings("#gacha_table").show(200);
    } else if(type == 'combo'){
      $("#normal_search,#gacha_search").attr("value",0);
      $("#upper_table,#gacha_table").hide(200).siblings("#combo_table").show(200);
    } else {
      $("#lower_table").toggle(300);
      return
    }
    $("#search_ability").attr("value",type);
  });
  $('#search_ability').click(search) ;
  $('#searchBut').click(function () {
    let keyword = $(this).siblings().val();
    socket.emit("text search",{key:keyword,type:'cat'});
  });
  $(document).on('keypress','#searchBox',function (e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      let keyword = $(this).val();
      socket.emit("text search",{key:keyword,type:'cat'});
    }
  });
  $(".search_table .button").click(function () {
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
  $(".select_ability").find(".ability_icon").each(function () {
    let name = $(this).attr("id");
    $(this).css("background-image","url('"+image_url_icon+name+".png')");
  });
  var number_page,page_factor,sortable_item ;
  socket.on("search result",function (data) {
    console.log("recive search result");
    // console.log(data);
    number_page = 0 ;
    page_factor = 1 ;
    $("#selected,#page_dot").empty();
    $("#selected").css('display','flex').scrollTop(0).append(condenseCatName(data.result));
    scroll_to_div("selected");
    let select_width = $("#selected").innerWidth(),
        card_width = screen.width > 1024 ? 216 :140,
        per_page = Math.floor(select_width/card_width)*2;

    number_page = Math.ceil(number_page/per_page) ;
    if(number_page>25) page_factor = 2;
    for (let i = 0;i<Math.ceil(number_page)/page_factor;i++)
      $("#page_dot").append("<span value='"+i*page_factor+"'></span>");
    $("#page_dot span").eq(0).css("background-color",'rgb(254, 168, 74)');
    if (data.type == "gacha"&&data.query.length == 1)
      $(".compareSorce .title #option #Gogacha").attr('value',data.query[0]).show();
    else $(".compareSorce .title #option #Gogacha").hide();
    let query = '';
    for(let i in data.query){
      if(data.type == 'gacha') query+=parseGachaName(data.query[i])+" ";
      else for(let j in data.query[i]) query+=(parseRarity(data.query[i][j])?parseRarity(data.query[i][j]):data.query[i][j])+" ";
    }
    // console.log(query);
    $(".compareSorce").find("#query").text("篩選條件:"+query);
    $("#selected .card-group").sortable({
      items:'.card:visible',
      scroll:true,
      containment:"#edit_pannel",
      opacity:0.5,
      connectWith:"#list_p1,#list_p2",
      helper:'clone',
      change:function (e,ui) {
        sortable_item = ui.item.clone();
      }
    });
    function parseGachaName(name) {
       $("#gacha_table").find(".button").each(function () {
        if($(this).attr('id') == name) name = $(this).text();
      });
      return name
    }
  });
  function condenseCatName(data) {
    let now = '000' ;
    let html = '<span class="card-group" hidden>' ;
    for(let i in data){
      // console.log(data[i].id);
      if(!data[i].id) continue
      let name = data[i].name,id = data[i].id,current = id.substring(0,3) ;
      if(current == now){
        html += '<span class="card" value="'+id+'" '+
        'style="background-image:url('+image_url_cat+id+
        '.png);display:none"cost="'+data[i].cost+'"detail="cost">'+
        name+'</span>' ;
      }
      else{
        html += '</span>' ;
        html += '<span class="card-group" value="'+current+'">'+
        '<span class="glyphicon glyphicon-refresh"></span>'+
        '<span class="card" value="'+id+'" '+
        'style="background-image:url('+image_url_cat+id+
        '.png)"cost="'+data[i].cost+'"detail="cost">'+
        name+'</span>' ;
        now = current ;
        number_page ++ ;
      }
    }
    $(".compareSorce #result_count").find("span").text(number_page);
    return html ;
  }
  function search() {
    let rarity = $(".select_rarity [value=1]"),
        color = $(".select_color [value=1]"),
        ability = $(".select_ability [value=1]"),
        gacha = $(".gacha_search td .button[value=1]"),
        combo = $(".select_effect .button[value=1]"),
        type = $("#search_ability").attr("value"),
        value_search = Number($("#value_search").attr("value"));
    let rFilter = [], cFilter = [], aFilter = [],gFilter = [],A_search = [] ;

    for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
    for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;
    for(let i = 0;i<gacha.length;i++) gFilter.push(gacha.eq(i).attr('id')) ;
    for(let i = 0;i<combo.length;i++) A_search.push(combo.eq(i).attr('name')) ;
    socket.emit(type+" search",{
      uid:current_user_id,
      query:type == 'normal'?{rFilter,cFilter,aFilter}:gFilter,
      query_type:type,
      filterObj,
      type:"cat",
      id:A_search
    });
    scroll_to_div('selected');
  }
  var result_expand = 0,originHeight;
  $(document).on('click','.compareSorce .title #option i',function () {
    let type = $(this).attr("id");
    if(type == 'result_snapshot'){
      let target = $("#selected")[0];
      if(!result_expand) {
        $("#result_expand").click();
        setTimeout(function () { snapshot(target); },500)
        setTimeout(function () { $("#result_expand").click(); },500)
      } else snapshot(target);
    }
    else if(type == 'result_expand'){
      let trueHeight = $("#selected")[0].scrollHeight;
      if(!result_expand){
        originHeight = $("#selected")[0].offsetHeight;
      }
      $("#selected").css("height",function () {
        return result_expand?originHeight:trueHeight
      });
      result_expand = result_expand?0:1;
    }
    else if (type == 'Gogacha') {
      socket.emit("record gacha",{
        uid:current_user_id,
        gacha:$(this).attr('value')
      });
      window.parent.reloadIframe("gacha");
    }
  });
  $(document).on('click','.glyphicon-refresh',toggleCatStage);
  function toggleCatStage() {
    somethingChange();
    let group = $(this).parent(),
        current = group.children(".card:visible").next('.card').attr('value');
    if(group.children(".card").length>1) group.css("transform","rotateY(90deg)");
    setTimeout(function () {
      group.css("transform","rotateY(0)");
      if(current != undefined){
        group.children(".card:visible").hide().next('.card').show();
        group.css('transform','');
      }
      else{
        current = group.children(".card:visible").hide().parent().children('.card').eq(0).show().attr("value");
        group.css('transform','');
      }
      if(checkList(list.upper,current)){
        let n = checkList(list.upper,current)-1;
        $("#list_p1 .card").eq(n).attr('value',current)
        .css('background-image','url(\"'+image_url_cat+current+".png\")");
      }
      if(checkList(list.lower,current)){
        let n = checkList(list.lower,current)-1;
        $("#list_p2 .card").eq(n).attr('value',current)
        .css('background-image','url(\"'+image_url_cat+current+".png\")");
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
  socket.on("combo result",function (arr) {
    searchCombo(arr);
  }) ;
  function searchCombo(arr) {
    $(".dataTable").empty();
    let html = "" ;
    for(let i in arr){
        // console.log(arr[i].id);
        let pic_html = "<div style='display:flex'>" ;
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
        html = screen.width > 768 ?
                ("</tr><tr>"+
                "<th class='searchCombo' val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
                "<td>"+arr[i].name+"</td>"+
                "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
                "</tr><tr>"+
                "<td colspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>") :
                ("</tr><tr>"+
                "<th colspan=2 class='searchCombo' val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
                "<td colspan=4 rowspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>"+
                "</tr><tr>"+
                "<td colspan=2 >"+arr[i].name+"</td>"+
                "</tr><tr>"+
                "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
                "</tr><tr>");
          $(".dataTable").append(html);

    }
    $(".display").show();
    // scroll_to_class("display",0) ;
  }
//------------------------------------------------------------------------------

  $(document).on("click",'.display',function () { $(this).hide(); });
  $(document).on('click','.comboPic',function (e) {
    // console.log(e);
    e.stopPropagation();
    let arr = [];
    $(this).find('.card').each(function () { arr.push($(this).attr("value")); });
    let Toomore = list.upper.length+arr.length;
    for(let i in arr){
      let u = checkList(list.upper,arr[i]),
          d = checkList(list.lower,arr[i]);
      console.log(arr[i],u,d,Toomore&&!u);
      if(u) $("#list_p1 .card").eq(u-1).remove();
      if(d) $("#list_p2 .card").eq(d-1).remove();
      if(Toomore>5&&!u) $("#list_p1 .card:last").remove();
      else if(!u) $("#list_p1 .seat:visible").first().hide();
      $('<span class="card" value="'+arr[i]+'" detail="cost" style="background-image:url('+ image_url_cat+arr[i]+'.png)"></span>')
      .prependTo($("#list_p1"));
      somethingChange()
      Toomore -- ;
    }
    if(!e.ctrlKey) $('.display').hide();
  });
  $('#trash').sortable();
  $('#list_p1,#list_p2').sortable({
    items:'.card',
    opacity:.5,
    connectWith:'#list_p1,#list_p2,#trash',
    update:somethingChange,
    scroll:false
  });
  $('#list_p1,#list_p2').on('sortover',function (e,ui) {$(this).children('.seat:visible').first().css('opacity',.5);});
  $('#list_p1,#list_p2').on('sortout',function (e,ui) {$(this).children('.seat:visible').first().css('opacity',1);});

  $('#list_p1').on('sortreceive',function (e,ui) {
    let id = ui.item.attr("value");
    if(ui.sender.attr("id")!='list_p2'){
       sortable_item.appendTo(ui.sender).show();
       if(checkList(list.upper,id)||checkList(list.upper,id)){ ui.item.remove();  return}
       else if(list.upper.length>=5){
         if(list.lower.length<5) appendCard(2,ui.item);
         else if(ui.item.next().attr('value')) ui.item.next().remove();
         else ui.item.remove();
         list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
         return
       }
       appendCard(1,ui.item);
     }
    else{
     // if(list.upper.length>=5){
       $("#list_p1 .card").last().clone().prependTo($("#list_p2"));
       $("#list_p1 .card").last().remove();
       $('#list_p2').children('.seat:visible').last().hide();
       list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
       list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
       // appendCard(1,ui.item);
     // } else appendCard(2,ui.item);
     return
    }

  });

  $('#list_p2').on('sortreceive',function (e,ui) {
    let id = ui.item.attr("value");
    if(ui.sender.attr("id")!='list_p1'){
      sortable_item.appendTo(ui.sender).show();
      if(checkList(list.upper,id)||checkList(list.lower,id)){ ui.item.remove(); return }
      else if(list.upper.length<5) { appendCard(1,ui.item); return}
      if(list.lower.length>=5){
        if(ui.item.next().attr('value')) ui.item.next().remove();
        else ui.item.remove();
        list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
        return
      }
      appendCard(2,ui.item);
      // else ui.item.remove();
    }
    else {
      if(list.upper.length>=4){
        $("#list_p2 .card").first().clone().appendTo($("#list_p1"));
        $("#list_p2 .card").first().remove();
        $('#list_p1').children('.seat:visible').last().hide();
        list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
        list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
        // appendCard(2,ui.item);
      }else appendCard(1,ui.item);
      return
    }
  });

  $("#trash").on("sortover",function (e,ui) { $(this).find("i").css('color','#e0ad3b') });
  $("#trash").on("sortout",function (e,ui) { $(this).find("i").css('color','#b4b4b4') });
  $('#list_p1,#list_p2').on("sortbeforestop",function () {
    list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
    list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
  });
  $('#list_p1,#list_p2').on("sortstop",somethingChange);
  $('#list_p1,#list_p2').on('sortremove',function (e,ui) {
    $(this).children('.seat:hidden').last().show().css("opacity",1);
  });
  $("#trash").on("sortreceive",function (e,ui) {
    ui.item.remove();
    $(this).find("i").css('color','#b4b4b4') ;
    if(list.upper.length<5 && list.lower.length)
      $("#list_p2").children(".seat:hidden").last().css("opacity",1).show()
          .siblings(".card:first").appendTo($("#list_p1")).siblings(".seat").hide();
    somethingChange();
  });

  function checkList(list,id) {
    for(let i in list) if(list[i].substring(0,3) == id.substring(0,3)) return Number(i)+1
    return false
  }
  function appendCard(n,card) {
    // alert(n)
    if(n == 1) pos = 'upper';
    else pos = 'lower';
    if(list[pos].length) card.insertAfter($('#list_p'+n+' .card').last());
    else card.prependTo($('#list_p'+n));
    $('#list_p'+n).children('.seat:visible').first().hide();
    list[pos] = $("#list_p"+n).sortable("toArray",{attribute:'value'});
    // console.log(list);
  }

  $(document).on('dblclick',"#list_p1 .card,#list_p2 .card",function () {
    let id = $(this).attr("value");
    socket.emit("text search",{key:id.substring(0,3),type:'cat'});
  });

  var org_name = '';
  $("#listname").click(function () {
      org_name = $(this).text();
      $(this).html("<input type='text' style='color:black' id='editListName' value='"+org_name+"' />")
      .find("input").select();
      somethingChange();
  });
  $(document).on('blur','#editListName',function () { $(this).parent().html($(this).val()); });
  $(document).on('keyup','#editListName',function (e) { if(e.keyCode === 27) $(this).val(org_name).blur(); });
  var save_fail;
  $("#save").click(Save);
  function Save() {
    $("#save").attr('state',1);
    let name = $("#listname").text(),
        note = $("#edit_function").find("textarea").val();
    list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
    list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
    // console.log(name,list,note);
    socket.emit("save list",{
      uid:current_user_id,
      name:name,
      list:list,
      note:note,
      key : current_editing_list
    });
    save_fail = setTimeout(function () { $('#save').attr('state',0); },10000);
  }
  $("#clear").click(function () {
    if(confirm("確定要清空出陣列表?!")){
      $("#list_p1,#list_p2").find('.seat').show().siblings(".card").remove();
      somethingChange();
    }
  });
  $("#sortCost").click(function () {
    $("#list_p1 .card").each(function () {
      let _this = $(this),
          _cost = Number(_this.attr("cost")) ;
      $("#list_p1 .card").each(function () {
        let This = $(this),
            Cost = Number(This.attr("cost")) ;
        if(Cost<_cost) This.insertBefore(_this);
      });
    });
    $("#list_p2 .card").each(function () {
      let _this = $(this),
          _cost = Number(_this.attr("cost")) ;
      $("#list_p2 .card").each(function () {
        let This = $(this),
            Cost = Number(This.attr("cost")) ;
        if(Cost<_cost) This.insertBefore(_this);
      });
    });
    somethingChange();
  });
  $("#up_stage").click(function () {
    $("#list_p1,#list_p2").children(".card").each(function () {
      let cat = $(this).attr("id").split("-")[0],
          bro = $(this).attr("bro");
      console.log(cat,bro);
      if(!cat) return
      $(this).attr({
        "value":cat+"-"+bro,
        "style":"background-image:url('"+image_url_cat+cat+"-"+bro+".png')"
      });
    });
    somethingChange();
  });
  $("#switchLv").click(function () {
    let show = $(this).prop("checked");
    $(".list_holder .card").attr("detail",function () { return show?'lv':'cost' });
  })
  socket.on("list save complete",function (data) {
    $("#edit_function h3 span.color").css("color",'#62cb26');
    clearTimeout(save_fail);
    $("#combo").empty();
    $(window).unbind("beforeunload", dontload);
    current_editing_list = data.key;
    console.log(data);
    let combo = data.combo,
        exist_combo = [],
        detail = data.list;
    for(let i in combo){
      $("#combo").append(
        "<li id='"+combo[i].id+"'cat='"+JSON.stringify(combo[i].cat)+"'>"+
        "<span>"+combo[i].catagory+
        "</span><span>"+combo[i].name+
        "</span><span>"+combo[i].effect+
        "</span></li>");
    }
    for (let i in detail.upper)
      for(let j in detail.upper[i])
        $("#list_p1").children('.card').eq(i).attr(j,detail.upper[i][j]);
    for (let i in detail.lower)
      for(let j in detail.lower[i])
        $("#list_p2").children('.card').eq(i).attr(j,detail.lower[i][j]);


    $('#save').attr('state',2);
  });
  $("#edit_function textarea").keypress(function () {
    if(Number($("#save").attr("state")) == 2) somethingChange();
  });
  var blinkBorder;
  $(document).on("click","#combo li",function () {
    $("#list_p1 .card").removeClass("find");
    clearTimeout(blinkBorder);
    let target = JSON.parse($(this).attr("cat"));
    // console.log(target);
    for(let i in target)
      if(target[i] != '-')
        $("#list_p1 .card").eq(checkList(list.upper,target[i])-1).addClass("find");
    blinkBorder = setTimeout(function () {
      $("#list_p1 .card").removeClass("find");
    },3000);
  });
  function somethingChange() {
    list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
    list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
    $('#save').attr('state',0);
    $(window).bind("beforeunload",dontload);
    $("#edit_function h3 span.color").css("color",'#fb6221');
  }
  $("#close_edit").click(function () {
    if(Number($("#save").attr("state")) == 0) $("#close_alert").show().css("display",'flex');
  });
  $("#close_alert button").click(function () {
    let type = $(this).attr("id");
    if(type == 'cancel') $("#close_alert").hide()
    else if(type == 'discard'){
      $("#list_p1 .card,#list_p2 .card").remove();
      $("#list_p1 .seat,#list_p2 .seat").show().css('opacity',1);
      $("#save").attr("state",2); $("#switchLv").prop("checked",0); $("#combo").empty();
      $('#edit_pannel textarea').val("");  $("#listname").text('新出陣列表');
      $(window).unbind("beforeunload", dontload);
      $("#close_alert").hide();
      list.upper = [];
      list.lower = [];
    }
    else if(type == 'savechange'){
      
    }
  });
});
function dontload(e) {return true }
