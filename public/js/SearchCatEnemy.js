var page = location.pathname.split("/")[1];
if(page == 'list') page = 'cat';
var number_page,page_factor ;

// Press enter to trigger search
$('.search_type .button').click(function () {
  let type = $(this).attr('id').split("_")[0];
  if(Number($(this).attr('value')) && type != 'value') return false
  if(type == 'normal'){
    $("#gacha_search").attr("value",0);
    $("#gacha_table").hide().siblings("#upper_table").show();
  } else if(type == 'gacha'){
    $("#normal_search").attr("value",0);
    $("#upper_table").hide().siblings("#gacha_table").show();
  } else {
    $("#lower_table").toggle(300);
    return
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
// Text Search
$('#searchBut').click(function () {
  let keyword = $(this).siblings().val();
  socket.emit("text search",{uid:CurrentUserID,key:keyword,type:page});
});
$(document).on('keypress','#searchBox',function (e) {
  let code = (e.keyCode ? e.keyCode : e.which);
  if (code == 13) {
    let keyword = $(this).val();
    socket.emit("text search",{uid:CurrentUserID,key:keyword,type:page});
  }
});
//table th reaction
$('#upper_table th').click(function () {
  if($(this).next().attr('class') == 'select_rarity') return
  var andCase = Number($(this).attr("andCase"))?1:0;
  andCase ++;
  $(this).attr("andCase",andCase%2);
});
// Start a search
$('#search_ability').click(search) ;
function search() {
  // Get the query data and store into array
  var rarity = $(".select_rarity [value=1]"),
      color = $(".select_color [value=1]"),
      ability = $(".select_ability [value=1]"),
      gacha = $(".gacha_search td .button[value=1]"),
      type = $("#search_ability").attr("value"),
      value_search = Number($("#value_search").attr("value"));
  var rFilter = [], cFilter = [], aFilter = [],gFilter = [] ;
  for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
  for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
  for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;
  for(let i = 0;i<gacha.length;i++) gFilter.push(gacha.eq(i).attr('name')) ;
  // Send query require
  socket.emit(type+" search",{
    uid:CurrentUserID,
    query:type == 'normal'?{rFilter,cFilter,aFilter}:gFilter,
    query_type:type,
    colorAnd:$(".select_color").prev().attr("andCase"),
    abilityAnd:$(".select_ability").prev().attr("andCase"),
    filterObj:value_search?filterObj:{},
    type:page
  });
  scroll_to_div('selected');
}
$(document).ready(function () {
  // Recive query response
  socket.on("search result",function (data) {
    if(data.type != page) return;
    console.log("recive search result");
    // console.log(data);
    current_search = [];
    number_page = 0 ; // # of page of search result
    page_factor = 1 ; // 1 dot represent how many pages
    // Clear old result and display new result
    $("#selected,#page_dot").empty();
    $("#selected").css('display','flex').scrollTop(0).append(
      page == 'cat' ? condenseCatName(data.result): condenseEnemyName(data.result)
    );
    scroll_to_div("selected");
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
      if(data.query.rFilter.length) query += "<b>|</b>";
      for(let j in data.query.cFilter)
        query +=  "<span>"+data.query.cFilter[j]+"</span>";
      if(data.query.cFilter.length) query += "<b>|</b>";
      for(let j in data.query.aFilter)
        query +=  "<span>"+data.query.aFilter[j]+"</span>";
      if(data.query.aFilter.length) query += "<b>|</b>";
      for(let j in filterObj){
        if(!filterObj[j].active) continue;
        query +=  "<span>"+Unit.propertiesName(j)+" : "+
                  (typeof(filterObj[j].value)=='object'?filterObj[j].value.join("到"):filterObj[j].value)+
                  ['以上','以下','之間'][filterObj[j].type]+"</span>"
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
    socket.emit("record gacha",{
      uid:CurrentUserID,
      gacha:$(this).attr('value')
    });
    if(window.parent.reloadIframe){
      window.parent.reloadIframe("gacha");
      window.parent.changeIframe("gacha");
    } else {
      window.open("/gacha","_blank");
    }
  }
});
