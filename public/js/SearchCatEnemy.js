var page = location.pathname.split("/")[1];
if(page == 'list') page = 'cat';
var number_page,page_factor ;
var filterObj = {};

// Press enter to trigger search
$('.search_type .button').click(function () {
  var type = $(this).attr('id').split("_")[0];
  if($(this).attr('value') == 1) return false;
  if(type == 'normal'){
    $("#gacha_search,#value_search").attr("value",0);
    $("#upper_table").css('max-height',1200).siblings().css('max-height',0);
  } else if(type == 'gacha'){
    $("#normal_search,#value_search").attr("value",0);
    $("#gacha_table").css('max-height',1200).siblings().css('max-height',0);
  } else if(type == 'value'){
    $("#normal_search,#gacha_search").attr("value",0);
    $("#lower_table").css('max-height',1200).siblings().css('max-height',0);
    type = 'normal';
  }
  $("#search_ability").attr("value",type);
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
}
// Only available on when searching cat
if(page == 'cat'){
  var tip_fadeOut;
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
}

$("#colorAnd,#abilityAnd,#instinct_involve").click(function () {
  $(this).attr("value",(Number($(this).attr('value'))+1)%2);
});
// Text Search
$('#searchBut').click(textSearch);
$(document).on('keypress','#searchBox',function (e) {
  if ((e.keyCode ? e.keyCode : e.which) == 13) textSearch();
});
function textSearch() {
  var keyword = $("#searchBox").val(),opt = $("#searchBox").prev("select").val();
  if(keyword.trim()=="") return;
  socket.emit("text search",{uid:CurrentUserID,key:keyword,type:page,option:opt});
  scroll_to_div('#selected',null,-100);
}
// Start a search
$('#search_ability').click(search) ;
function search() {
  // Get the query data and store into array
  var rarity = $(".select_rarity [value=1]"),
      color = $(".select_color [value=1]"),
      ability = $(".select_ability [value=1]"),
      gacha = $(".gacha_search td .button[value=1]"),
      type = $("#search_ability").attr("value"),
      instinct = Number($("#instinct_involve").attr('value'));
  var rFilter = [], cFilter = [], aFilter = [],gFilter = [] ;
  for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
  for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
  for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;
  for(let i = 0;i<gacha.length;i++) gFilter.push(gacha.eq(i).attr('name')) ;
  if(instinct){
    for(let i in aFilter) aFilter.push(aFilter[i]+"能力解放");
    for(let i in cFilter) cFilter.push("屬性新增"+cFilter[i].substring(1)+"敵人");
  }
  // Send query require
  socket.emit(type+" search",{
    uid:CurrentUserID,
    query:type == 'normal'?{rFilter,cFilter,aFilter}:gFilter,
    query_type:type,
    colorAnd:$("#colorAnd").attr('value'),
    abilityAnd:$("#abilityAnd").attr('value'),
    filterObj:filterObj,
    type:page,
    instinct:instinct
  });
  scroll_to_div('#selected',null,-100);
}
$(document).ready(function () {
  // Recive query response
  socket.on("search result",function (data) {
    if(data.type != page) return;
    console.log("recive search result");
    console.log(data);
    current_search = [];
    number_page = 0 ; // # of page of search result
    page_factor = 1 ; // 1 dot represent how many pages
    // Clear old result and display new result
    $("#selected,#page_dot").empty();
    $("#selected").css('display','flex').scrollTop(0).append(
      page == 'cat' ? condenseCatName(data.result): condenseEnemyName(data.result)
    );
    // Calculating # of page and display the dot
    var select_width = $("#selected").innerWidth(),       // Size of result area
        card_width = screen.width > 1024 ? 216 :140,      // Size of card
        per_page = Math.floor(select_width/card_width)*2; // # of cards per page

    number_page = Math.ceil(number_page/per_page) ; // # of pages
    if(number_page>25) page_factor = 2; // 1 dot represent 2 pages when # of page more than 25
    for (let i = 0;i<Math.ceil(number_page)/page_factor;i++) // Display page dot
      $("#page_dot").append("<span value='"+i*page_factor+"'></span>");
    $("#page_dot span").eq(0).css("background-color",'#fea84a'); // Active 1st page dot
    if (data.query_type == "gacha" && data.query.length == 1)
      $(".compareSorce .title #option #Gogacha").attr('value',data.query[0]).show();
    else $(".compareSorce .title #option #Gogacha").hide();
    // Show the query as text
    var query = '';
    if(data.query_type == 'gacha') for(let i in data.query) query += "<span>"+parseGachaName(data.query[i])+"</span>";
    else if(data.query_type == 'text') {}
    else {
      for(let j in data.query.rFilter)
        query +=  "<span>"+Cat.parseRarity(data.query.rFilter[j])+"</span>";
      if(data.query.rFilter) if(data.query.rFilter.length) query += "<b>|</b>";
      for(let j in data.query.cFilter)
        query +=  "<span>"+data.query.cFilter[j]+"</span>";
      if(data.query.cFilter) if(data.query.cFilter.length) query += "<b>|</b>";
      for(let j in data.query.aFilter)
        query +=  "<span>"+data.query.aFilter[j]+"</span>";
      if(data.query.aFilter) if(data.query.aFilter.length) query += "<b>|</b>";
      for(let j in data.filterObj){
        if(!data.filterObj[j].active) continue;
        query +=  "<span>"+Unit.propertiesName(j)+" : "+
                  (typeof(data.filterObj[j].value)=='object'?data.filterObj[j].value.join("到"):data.filterObj[j].value)+
                  ['以上','以下','之間'][data.filterObj[j].type]+"</span>"
      }
    }
    // console.log(query);
    $(".compareSorce").find("#query").html(query);
  });
});
function parseGachaName(name) {
  $("#gacha_table").find(".button").each(function () {
    if($(this).attr('name') == name) name = $(this).text();
  });
  return name
}
function condenseCatName(data) {
  var html = '' ;
  for(let i in data){
    if(!data[i].id) continue
    var nameArr = data[i].name, id = data[i].id, stage = data[i].stage?data[i].stage-1:0;

    html += '<span class="card-group" value="'+id+'">'+
            '<span class="glyphicon glyphicon-refresh"></span>'+
            '<span class="glyphicon glyphicon-shopping-cart"></span>';
    for(let j in nameArr){
      html +=
      '<span class="card" value="'+id+"-"+(Number(j)+1)+
      '"style="background-image:url('+
      Unit.imageURL('cat',`${AddZero(id,2)}-${Number(j)+1}`)+');'+
      (j == stage?"":"display:none")+
      '"name="'+nameArr[j]+'"></span>';
    }
    html += "</span>"

    number_page ++ ;
    current_search.push(id);

  }
  $(".compareSorce #result_count").find("span").text(number_page);
  return html ;
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
     Unit.imageURL('enemy',id)+')" name="'+name+'"></span></span>';
    number_page ++ ;
    current_search.push(id);
  }
  $(".compareSorce #result_count").find("span").text(number_page);
  return html ;
}
// Search result function
var result_expand = 0,originHeight;
$(document).on('click','.compareSorce .title #option i',function () {
  let type = $(this).attr("id");
  if(type == 'result_expand'){
    let trueHeight = $("#selected")[0].scrollHeight;
    if(!result_expand){
      originHeight = $("#selected")[0].offsetHeight;
    }
    $(".compareSorce .title").css('position',function () {
      return result_expand?'relative':'sticky'
    });
    $("#selected").css("height",function () {
      return result_expand?originHeight:trueHeight
    });
    result_expand = result_expand?0:1;
    scroll_to_class("title",0);
  }
  else if(type == 'batch_own'){
    let r = confirm("確定批次加入「我擁有的貓咪」?!");
    if(!r) return
    socket.emit("mark own",{
      uid:CurrentUserID,
      arr:current_search,
      mark:true
    });
    $("#batch_alert").css("left",-10);
    setTimeout(function () { $("#batch_alert").css("left",-250); },2600);
  }
  else if(type == 'batch_compare'){
    // console.log(current_search);
    let r = confirm("確定覆蓋現有比較序列?!");
    if(!r) return
    if(current_search.length<15){
      $(".compareTarget").empty();
      let target = [];
      $("#selected").children('.card-group').each(function () {
        let visible = $(this).children(".card:visible"),
            id = visible.attr('value'),
            name = visible.attr('name');
        // console.log(id,name);
        if(id) {
          id = id.split("-");
          compareTargetAddCard(id[0],name,id[1]);
          target.push(id[0]);
        }
      });
      // console.log(target);
      compare = target;
      socket.emit("Set Compare",{type:'cat',id:CurrentUserID,target:compare});
      if(showcomparetarget) showhidecomparetarget();
      $("#compare_number").text(target.length);
    }
    else alert("超過15隻!!!");
  }
  else if (type == 'Gogacha') {
    socket.emit("set history",{
      uid:CurrentUserID,
      type:'gacha',
      target:$(this).attr('value')
    });
    switchIframe("gacha");
  }
});

// initial filter table slider
$("#lower_table .slider").each(function () {
  var value = $(this).attr('value'),
      type = Number($(this).attr('type')),
      range = JSON.parse($(this).attr('range')),
      step = Number($(this).attr('step'));
  $(this).slider();
  $(this).slider('option','range',type==2);
  $(this).slider('option',{
    'min': range[0],
    'max': range[1],
    'step': step,
    'value':value
  }).parent().siblings(".value_display").text(value).siblings('.type').html(['以上','以下','範圍'][type]);
});

$('.filter_option').click(function () {
  $(this).attr('active',(Number($(this).attr('active'))+1)%2);
  filterSlider($(this).parent().find(".slider"));
});
var filter_org ;
$(document).on('click','.value_display',function () {
    filter_org = Number($(this).text());
    $(this).html('<input type="number" value="' +filter_org+ '"></input>').find('input').select();
});
$(document).on('blur','.value_display input',changeSlider) ;
function changeSlider(e) {
  let target = $(e.target).parents('tr'),
      range = JSON.parse(target.find('.slider').attr('range')),
      step = Number(target.find('.slider').attr('step')),
      value = Number(e.target.value),
      type = Number(target.find('.slider').attr("type"));

  target.find('th').attr('active',1);
  value = Math.round(value/step)*step ;
  if(!value || Number.isNaN(value)) value = filter_org;
  else if(value > range[1]) value = range[1];
  else if(value < range[0]) value = range[0];

  $(e.target).parent().text(value)
  value = type == 2? `[${target.find('.value_display').eq(0).text()},${target.find('.value_display').eq(1).text()}]`:target.find('.value_display').eq(0).text();
  target.find(".slider").attr("value",value);
  filterSlider(target.find(".slider"));
}

$('#lower_table .type').click(function (e) {
  var target = $(e.target).parents('tr'),
      type = Number(target.find(".slider").attr('type')),
      value = type == 2?JSON.parse(target.find(".slider").attr('value')):Number(target.find(".slider").attr('type')),
      range = JSON.parse(target.find(".slider").attr("range"));

  type = (type+1)%3;
  if(type == 2){
    let temp = range[1]-range[0];
    target.find(".slider").attr('value',"["+temp/4+","+temp/4*3+"]");
    target.find(".type").attr("colspan",1).prev().show();
  }
  else if(typeof(value) == 'object'){
    target.find(".slider").attr('value',(value[0]+value[1])/2);
    target.find(".type").attr("colspan",2).prev().hide();
  }

  target.find(".slider").attr('type',type);
  target.find("th").attr('active',1);
  filterSlider(target.find(".slider"));
});

$(".slider").on("slide",function (e,ui) {
  var type = $(this).attr("type");
  if(type == 2){
    $(this).parents('tr').find('.value_display').eq(0).text(ui.values[0]);
    $(this).parents('tr').find('.value_display').eq(1).text(ui.values[1]);
  } else {
    $(this).parents('tr').find('.value_display').eq(0).text(ui.value);
  }
});
$(".slider").on("slidestop",function (e,ui) {
  var type = $(this).attr("type");
  if(type == 2){
    $(this).attr('value',"["+ui.values[0]+","+ui.values[1]+"]");
  } else {
    $(this).attr('value',ui.value);
  }
  filterSlider($(this));
});

function filterSlider(target) {
  let value = target.attr('value') ,
      type = Number(target.attr('type')) ,
      range = JSON.parse(target.attr('range')),
      step = Number(target.attr('step')) ,
      active = target.parent().prev().attr('active') == 1,
      filter_name = target.parent().prev().attr('id');

  target.slider("destroy");
  target.slider({
    range: type == 2,
    min: range[0],
    max: range[1],
    step: step
  });
  target.parents('tr').find('.type').html(['以上','以下','範圍'][type]);
  if(type == 2){
    value = JSON.parse(value);
    if(value[1] < value[0]) value = value.reverse();
    target.slider("option","values",value);
    target.parents('tr').find(".value_display").eq(0).text(value[0]);
    target.parents('tr').find(".value_display").eq(1).text(value[1]);
  }
  else{
    target.slider("option","value",Number(value));
    target.parents('tr').find(".value_display").eq(0).text(Number(value));
  }
  filterObj[filter_name] = {
    type: Number(type),
    active: active,
    value: type != 2 ? Number(value) : JSON.parse(value),
    lv_bind: target.attr('lv-bind') == 'true'
  }
}
