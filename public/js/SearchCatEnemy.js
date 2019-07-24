var page = location.pathname.split("/")[1];
if(page == 'list') page = 'cat';
var number_page,filterObj = {}, resultDataPreview = {cat:[],enemy:[]};

// Press enter to trigger search
var quick_search_mutex = false;
$(".normalTable .button, .gachaTable .button").click(function () {
  if(quick_search_mutex) return;
  $("body").bind('keypress',quickSearch);
  quick_search_mutex = true;
  setTimeout(function () {
    $("body").unbind('keypress',quickSearch);
    quick_search_mutex = false;
  },5000);
});
function quickSearch(e) {
  let code = (e.keyCode ? e.keyCode : e.which);
  if (code == 13) search();
  $("body").unbind('keypress',quickSearch);
  quick_search_mutex = false;
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
  openTable('resultTable');
}
// Start a search
$('#search_ability').click(search) ;
function search() {
  // Get the query data and store into array
  var rarity = $(".select_rarity [value=1]"),
      color = $(".select_color [value=1]"),
      ability = $(".select_ability [value=1]"),
      gacha = $(".gacha_search td .button[value=1]"),
      type = $(".search_type span[value='1']").attr("onclick").split("'")[1].split("Table")[0],
      instinct = Number($("#instinct_involve").attr('value'));
  if(type == 'value') type = 'normal';
  var rFilter = [], cFilter = [], aFilter = [],gFilter = [] ;
  for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
  for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
  for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;
  for(let i = 0;i<gacha.length;i++) gFilter.push(gacha.eq(i).attr('name')) ;
  if(instinct){
    for(let i in aFilter) aFilter.push(aFilter[i]+"能力解放");
    for(let i in cFilter){
      if(cFilter[i].substring(1) === '古代')
        cFilter.push("屬性新增"+cFilter[i].substring(1)+"種");
      else
        cFilter.push("屬性新增"+cFilter[i].substring(1)+"敵人");
    }
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
    instinct:instinct,
    optional: ['tag'].concat(resultDataPreview[page])
  });
  openTable('resultTable');
}
$(document).ready(function () {
  // Recive query response
  socket.on("search result",function (data) {
    if(data.type != page) return;
    console.log("recive search result");
    // console.log(data);

    current_search = [];
    number_page = 0 ; // # of page of search result
    // Clear old result and display new result
    $("#selected,#page_dot").empty();
    $("#selected").append(
      page == 'cat' ? condenseCatName(data.result): condenseEnemyName(data.result)
    );

    if (data.query_type == "gacha" && data.query.length == 1)
      $(".resultTable .title #option #Gogacha").attr('value',data.query[0]).show();
    else $(".resultTable .title #option #Gogacha").hide();
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
    $(".resultTable").find("#query").html(query);
  });
});
function parseGachaName(name) {
  $(".gachaTable").find(".button").each(function () {
    if($(this).attr('name') == name) name = $(this).text();
  });
  return name
}
function condenseCatName(data) {
  var html = '' ;
  for(let i in data){
    if(!data[i].id) continue
    var nameArr = data[i].name,
        id = data[i].id,
        stage = data[i].stage?data[i].stage-1:0,
        tag = [],
        optional = [];
    for(let j in data[i].tag) tag = tag.concat(data[i].tag[j]);
    for(let j in data[i]) if(['id','name','tag','stage'].indexOf(j)==-1) optional.push({key:j,value:data[i][j]});
    html += `<div data-tag='${tag.join(" ")}' id='${id}' stage='${stage}'>`;
    for(let j in data[i].name){
      html += ` <div class='img' stage='${j}' active='${j == stage?1:0}'
                style='background-image:url("${Unit.imageURL('cat',`${AddZero(id,2)}-${Number(j)+1}`)}")'></div>
                <div class='name'active='${j == stage?1:0}'>${data[i].name[j]}</div>
                <div class='optional flex_col'active='${j == stage?1:0}'>
                  ${optional.map(x=>x.key!=""?`<div>${Unit.propertiesName(x.key)} : ${(typeof(x.value[j]) === 'number')?x.value[j].toFixed(0):x.value[j]}</div>`:"").join("")}
                </div>`
    }
    html += ` <div class='function flex'>
                <i class='material-icons cir_but' text='切換階級' onclick='toggleCatStage(event)'>swap_vertical_circle</i>
                <i class='material-icons cir_but' text='加到購物車'onclick='resultToCart(event)'>shopping_cart</i>
              </div>
              </div>`;
    number_page ++ ;
    current_search.push(id);
  }
  $("#result_count span").text(number_page);
  return html ;
}
function condenseEnemyName(data) {
  console.log(data);
  let html = '' ;
  for(let i in data){
    if(!data[i].id) continue
    var name = data[i].name, id = data[i].id, optional = [] ;
    for(let j in data[i]) if(['id','name','tag','stage'].indexOf(j)==-1) optional.push({key:j,value:data[i][j]});
    html += `<div data-tag='${data[i].tag?(data[i].tag[0]?data[i].tag[0].join(" "):""):""}' id='${id}'>`;
    html += ` <div class='img' active='1'
              style='background-image:url("${Unit.imageURL('enemy',`${AddZero(id,2)}`)}")'></div>
              <div class='name'active='1'>${name}</div>
              <div class='optional flex_col'active='1'>
                ${optional.map(x=>`<div>${Unit.propertiesName(x.key)} : ${x.value[0]}</div>`).join("")}
              </div>`
    html += ` <div class='function flex'>
                <i class='material-icons cir_but' text='切換階級' onclick='toggleCatStage(event)'>swap_vertical_circle</i>
                <i class='material-icons cir_but' text='加到購物車'onclick='resultToCart(event)'>shopping_cart</i>
              </div>
              </div>`;

    number_page ++ ;
    current_search.push(id);
  }
  $(".resultTable #result_count").find("span").text(number_page);
  return html ;
}

// Search result function
$("#selected").attr("view_mode",localStore.get("resultViewMode"));
if(localStore.get("resultViewMode") == 'card') $('.resultTable .title #option #view_module').hide().prev().show();
$(document).on('click','.resultTable .title #option i',function () {
  let type = $(this).attr("id");
  if(type == 'view_list'){
    $(this).hide().next().show();
    $("#selected").attr("view_mode","list");
    localStore.set("resultViewMode","list");
  }
  else if (type == 'view_module') {
    $(this).hide().prev().show();
    $("#selected").attr("view_mode","card");
    localStore.set("resultViewMode","card");
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
      $("#selected>div").each(function () {
        let id = $(this).attr('id'),
            stage = Number($(this).attr('stage')),
            name = $(this).children(".name").eq(stage).text();
        // console.log(id,name);
        if(id) {
          compareTargetAddCard(id,name,stage+1);
          target.push(id);
        }
      });
      // console.log(target);
      compare = target;
      socket.emit("Set Compare",{type:'cat',id:CurrentUserID,target:compare});
      if(showcomparetarget) toggle_side_column();
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
  else if(type == 'snapshot'){
    $("#selected").css("max-height",32768);
    setTimeout(()=>{
      snapshot(".resultTable","#fff").then((rs,rj)=>{
        $("#selected").removeAttr("style")
      });
    },500);
  }
});
$(document).on('click','#query span',function () {
  var active = Number($(this).attr('active')),
      query = $(this).text(),
      target = $("#selected>div:not(*[data-tag ~= "+query+"])");
  if(Number.isNaN(active)) active = 0;
  active = (active+1)%2;
  $(this).attr("active",active).siblings().attr('active',0);
  $("#selected>div").show(100);
  if(active) {target.hide(100);$("#result_count span").text(current_search.length - target.length);}
  else $("#result_count span").text(current_search.length);
});
// initial filter table slider
$(".valueTable .slider").each(function () {
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

$('.valueTable .type').click(function (e) {
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

$(".chooser .slider").on("slide",function (e,ui) {
  var type = $(this).attr("type");
  if(type == 2){
    $(this).parents('tr').find('.value_display').eq(0).text(ui.values[0]);
    $(this).parents('tr').find('.value_display').eq(1).text(ui.values[1]);
  } else {
    $(this).parents('tr').find('.value_display').eq(0).text(ui.value);
  }
});
$(".chooser .slider").on("slidestop",function (e,ui) {
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
    value: value,
    lv_bind: target.attr('lv-bind') == 'true'
  }
}
function toggleCatStage(e) {
  e.stopPropagation();
  var parent = $(e.target).parent().parent(),
      stage = Number(parent.attr("stage")),
      maxStage = parent.find(".img").length;

  stage = (stage+1)%maxStage;
  parent.find(".img").eq(stage).attr('active',1).siblings(".img").attr('active',0);
  parent.find(".name").eq(stage).attr('active',1).siblings(".name").attr('active',0);
  parent.find(".optional").eq(stage).attr('active',1).siblings(".optional").attr('active',0);
  parent.attr('stage',stage);

  socket.emit("store stage",{
    uid : CurrentUserID,
    id : parent.attr('id'),
    stage :stage
  });
}
function resultToCart(e) {
  e.stopPropagation();
  var parent = $(e.target).parent().parent(),
      stage = Number(parent.attr("stage"));
  addToCompare(parent.attr("id"),parent.find(".name").eq(stage).text(),stage+1);
}
