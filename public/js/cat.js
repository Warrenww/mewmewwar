var CurrentUserID;
var CurrentCatID;
var CurrentCatStage;
var current_search = [];
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
$(".select_ability").find(".ability_icon").each(function () {
  var name = $(this).attr("id");
  $(this).css("background-image","url('"+image_url_icon+name+".png')");
});
$(document).ready(function () {
  var timer = new Date().getTime();

  auth.onAuthStateChanged(function(user) {
    if (user)  socket.emit("user connect",{user:user,page:location.pathname});
    else  {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    CurrentUserID = data.uid;
    if(data.last_cat)
      socket.emit("required data",{
        type:'cat',
        target:[{id:data.last_cat.toString().substring(0,3),lv:'user'}],
        record:true,
        uid:data.uid
      });
    if(data.compare_c2c) {
      $(".compareTarget").empty();
      $("#compare_number").text(data.compare_c2c.length);
      compare = [];
      for(let i in data.compare_c2c){
        let id = data.compare_c2c[i].id,
            name = data.compare_c2c[i].name,
            stage = data.compare_c2c[i].stage;
        compareTargetAddCard(id,name,stage);
        compare.push(id);
      }
    }
    if(data.last_cat_search){
      let last = data.last_cat_search;
      // console.log(last);
      if(last.query)
        socket.emit(last.query_type+" search",last);
      if(last.query_type=='gacha'){
        $("#gacha_search").click();
        for(let i in last.query)
          $(".gachalTable").find(".button[name='"+last.query[i]+"']").click();
      } else {
        for(let i in last.query)
         for(let j in last.query[i])
          $(".normalTable").find(".button[name='"+last.query[i][j]+"']").click();
        if(Number(last.colorAnd)) $("#colorAnd").click();
        if(Number(last.abilityAnd)) $("#abilityAnd").click();
        if(Number(last.instinct)) $("#instinct_involve").click();
      }
      var value_search = false;
      for(let i in last.filterObj){
        $(".valueTable").find("th[id='"+i+"']").attr('active',last.filterObj[i].active?1:0)
          .next().children().attr({
          'value':last.filterObj[i].type==2?("["+last.filterObj[i].value+"]"):last.filterObj[i].value,
          'type':last.filterObj[i].type
        });
        filterSlider($(".valueTable").find("th[id='"+i+"']").next().children());
      }
    }
    if(data.setting.show_ability_text && screen.width > 768)
        $(".select_ability").children(".button").each(function () {
          $(this).removeClass("smallicon");
        });
        if(data.setting.resultDataPreview){
          if(data.setting.resultDataPreview.cat) resultDataPreview.cat = data.setting.resultDataPreview.cat;
          if(data.setting.resultDataPreview.enemy) resultDataPreview.enemy = data.setting.resultDataPreview.enemy;
        }  });

  $(document).on('click','.card,#selected>div',function (e) {
    if($(this).parent().parent().attr("class")=='compareTarget_holder') return;
    socket.emit("required data",{
      type:'cat',
      target:[{id:($(this).attr('value')||$(this).attr("id")).split("-")[0],lv:'user'}],
      record:true,
      uid:CurrentUserID
    });
    scroll_to_div(".display",null,-50);
  });

  var input_org ;
  $(document).on('click','.editable',function () {
      input_org = $(this).text();
      $(this).html('<input type="number" value="' +input_org+ '"></input>').find('input').select();
  });
  $(document).on('blur', '.editable input', calculateLV);

  var level_org ;
  $(document).on('click','#level_num',function () {
      level_org = Number($(this).text());
      $(this).html('<input type="number" value="' +level_org+ '"></input>').find('input').select();
  });
  $(document).on('blur','#level_num input',function () {
    let val = Number($(this).val()) ;
    val = val && val>0 && val<101 ? val : level_org ;
    $('#level').slider('option','value',val);
  });
  $(document).on('click','.searchCombo',function () {
    socket.emit("combo search",{
      uid:CurrentUserID,
      id:[$(this).attr('val')]
    }) ;
    switchIframe("combo");
  }) ;

  socket.on("required data",(data)=>{
    console.log(data);
    displayCatData(data.buffer[0]) ;
    $(".display").css("pointer-events","auto");
  });
  function displayCatData(buffer) {
    // console.log(buffer);
    var html = "",
        package = buffer.data,
        count = buffer.count,
        id = package.id,
        own = buffer.own,
        data = [],
        lv = buffer.lv,
        currentStage = buffer.currentStage-1,
        survey = buffer.survey?buffer.survey:{};
        info = {statistic:package.statistic,comment:package.comment};
    for(let i in package.data){
      if(i!=0) data.push(new Cat(package.data[i]));
    }
    current_cat_data = data;
    CurrentCatID = id;
    CurrentCatStage = currentStage;
    $(".dataTable").find("#title").empty();
    $(".instinctTable").empty();
    $(".displayControl #rarity").empty().text(Cat.parseRarity(package.rarity));

    if(own) $(".displayControl #mark_own").attr({"value":1,'cat':id,'text':'我有這隻貓'}).html("&#xE8E6;");
    else $(".displayControl #mark_own").attr({"value":0,'cat':id,'text':'我沒有這隻貓'}).html("&#xE8E7;");
    $(".displayControl #out ").attr("href","http://battlecats-db.com/unit/"+id+".html");
    $(".displayControl #addcart ").attr("value",id);

    for (let cat in data){
      $(".dataTable").find("#title").append(
        "<div class='img'stage='"+cat+"'style='background-image:url(\""+data[cat].image+
        "\")'active='0'></div><div class='name' active='0'>"+data[cat].Name+"</div>");
    }
    updateCatData(currentStage,lv);
    $(".dataTable").find("#count").text(count);
    $(".dataTable").find("#level_num").text(lv);
    $(".dataTable").find("#id").text(id);

    $('.comboTable').html(AddCombo(buffer.combo));
    $('.instinctTable').html(AddInstinct(data,package.rarity));
    initialSlider(data,lv);
    initial_survey();
    addSurvey(info.statistic,survey);
    append_comment(info.comment);;

    // scroll_to_class("content",1);
  }
  // Change Cat Stage
  $(document).on('click',".dataTable #title .img",function () {
    CurrentCatStage = $(this).attr("stage");
    updateCatData(CurrentCatStage,$(".dataTable").find("#level_num").text());
    socket.emit("store stage",{
      uid : CurrentUserID,
      id : CurrentCatID,
      stage : CurrentCatStage
    });
    $("#selected #"+CurrentCatID).find(".img").eq(CurrentCatStage).attr('active',1).siblings(".img").attr('active',0);
    $("#selected #"+CurrentCatID).find(".name").eq(CurrentCatStage).attr('active',1).siblings(".name").attr('active',0);
    $("#selected #"+CurrentCatID).find(".optional").eq(CurrentCatStage).attr('active',1).siblings(".optional").attr('active',0);
    $("#selected #"+CurrentCatID).attr('stage',CurrentCatStage);
  });
  function updateCatData (currentStage,lv = null) {
    var data = current_cat_data[currentStage];
    $(".displayControl .data #img").css("background-image",`url('${data.image}')`);
    $(".displayControl .data #name").text(data.Name);
    for(let i in data){
      if(i=='hp'||i=='hardness'||i=='atk'||i=='dps')
      $(".dataTable").find("#"+i).html("<span class='editable'>"+data.Tovalue(i,lv)+"</span>");
      else if(i == 'aoe')
      $(".dataTable").find("#"+i).text(data.Aoe);
      else if(i == 'char')
      $(".dataTable").find("#"+i).html(data.CharHtml(lv));
      else if(i == 'condition')
      $(".dataTable").find("#"+i).html(data.CondHtml());
      else if(i!='id')
      $(".dataTable").find("#"+i).text(data[i]);
    }
    $(".dataTable").find("#title .name").eq(currentStage).attr("active",1).siblings('.name').attr("active",0);
    $(".dataTable").find("#title .img").eq(currentStage).attr("active",1).siblings('.img').attr("active",0);
  }
  function initialSlider(data,lv) {
    $("#level").slider({
      max: 100,
      min: 1,
      value: lv,
    });
    // setTimeout(function () { $("#level").slider('option','value',lv) },800);
    var store_lv_timeOut ;
    $("#level").on("slidechange", function(e,ui) {
      clearTimeout(store_lv_timeOut);
      $("#level_num").html(ui.value);
      updateState(ui.value);
      store_lv_timeOut = setTimeout(function () {
        // console.log('scroll');
        socket.emit("store level",{
          uid : CurrentUserID,
          id : CurrentCatID,
          lv : ui.value,
          type : 'cat'
        });
      },200);
    });
    $("#level").on("slide", function(e,ui) {
      $("#level_num").html(ui.value);
      updateState(ui.value);
    });
  }
  function updateState(level) {
    var data = current_cat_data[CurrentCatStage];
    var change = ['hp','hardness','atk','dps'] ;
    for(let i in change){
      let target = $('.dataTable').find('#'+change[i]) ;

      target.html("<span class='editable'>"+
      data.Tovalue(change[i],level)+
      "</span>").css('background-color',' rgba(242, 213, 167, 0.93)');
      setTimeout(function () {
        target.removeAttr("style");
      },500);
    }
    if(data.serial){
      $(".dataTable #char #serial").text("("+data.serialATK(level)+")");
    }
  }

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
      $(".normalTable .button").each(function () {
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
        case '一次攻擊':
          ww = '1次攻擊'
          break;
        default:
          ww = ww;
      }
      aFilter=[ww];
      $(".normalTable .button").each(function () {
        if($(this).attr('name')==ww||$(this).attr('value')=='1') $(this).click() ;
      });
    }
    socket.emit("normal search",{
      uid:CurrentUserID,
      query:{rFilter,cFilter,aFilter},
      query_type:type,
      filterObj:{},
      type:"cat",
      value:0,
      optional:["tag"].concat(resultDataPreview.cat)
    });
    scroll_to_div(".chooser");
    openTable("resultTable");
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
    if(data.find) switchIframe("stage");
    else window.open('https://battlecats-db.com/stage/'+data.stage+'.html',"_blank");
  });

  $(".slider").slider();

  function calculateLV() {
    var val = Number($(this).val()),
        rarity = current_cat_data.rarity,
        type = $(this).parents('td').attr('id'),
        ori = current_cat_data[CurrentCatStage][type],
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
      $(this).parent().html(Cat.levelToValue(ori,rarity,100));
    } else if(lv <1){
      alert("超出範圍!!!");
      $('#level').slider('option','value',1);
      $(this).parent().html(Cat.levelToValue(ori,rarity,1));
    }
    else{
      $('#level').slider('option','value',lv);
      $(this).parent().html(Cat.levelToValue(ori,rarity,lv));
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
        Unit.imageURL('cat',arr[i].cat[j])+');"></span>' ;
      } else {
        pic_html += "<span class='card' style='background-color: lightgray;pointer-events: none;'></span>";
      }
    }
    pic_html += "</div>" ;
    html += "<tr class='combo'>"+
            "<th val='"+arr[i].id.substring(0,2)+"'style='min-width:120'>"+arr[i].catagory+"</th>"+
            "<td>"+arr[i].name+"</td>"+
            "<td class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>"+
            "</tr><tr class='combo'>"+
            "<td colspan=3 class='comboPic'>"+pic_html+"</td></tr>";
  }
  // console.log(html);
  return html
}
function AddInstinct(data,rarity) {
  if(!data[2]) return createHtml("tr",createHtml("td","本能未開放",{colspan:6}));
  var arr = data[2].instinct,thead="",tbody="";
  if(!arr) return;
  ["能力","等級上限","等級1加值/花費NP","等級2-5加值/花費NP","等級6-10加值/花費NP"].map(x=>thead += createHtml("th",x));
  thead = createHtml("tr",thead);
  for(let i in arr){
    let temp = createHtml("th",addPs(arr[i]),{rowspan:2});
    temp += createHtml("td",arr[i].maxlv,{rowspan:2});
    temp += createHtml("td",arr[i].range[0]?(arr[i].range[0]+" "+unit(arr[i].ability)):"-");
    if(arr[i].maxlv!=1)
      temp += createHtml("td",
            ((arr[i].range[1]-arr[i].range[0])/(arr[i].maxlv-1)).toFixed(0)+" "+unit(arr[i].ability));
    else
      temp += createHtml("td","-");
    if(arr[i].maxlv!=1)
      temp += createHtml("td",
            ((arr[i].range[1]-arr[i].range[0])/(arr[i].maxlv-1)).toFixed(0)+" "+unit(arr[i].ability));
    else
      temp += createHtml("td","-");
    tbody += createHtml("tr",temp);
    temp = "";
    if(arr[i].maxlv==1){
      temp += createHtml("td",arr[i].np*{R:2,SR:3,SSR:4}[rarity]+" NP");
      temp += createHtml("td","-");
      temp += createHtml("td","-");
    } else{
      temp += createHtml("td",arr[i].np*{R:1,SR:2,SSR:3}[rarity]+" NP");
      temp += createHtml("td",5*{R:1,SR:2,SSR:3}[rarity]+" NP");
      temp += createHtml("td",10*{R:1,SR:2,SSR:3}[rarity]+" NP");
    }
    tbody += createHtml("tr",temp);

  }
  return thead+tbody;

  function unit(s) {
    if(s.indexOf("時間")!=-1||s.indexOf("緩速強化")!=-1||s.indexOf("降攻")!=-1)s = "F";
    else if(s.indexOf("金額")!=-1)s = "元";
    else if(s.indexOf("移動")!=-1)s = "";
    else s = "%";
    return s;
  }
  function addPs(s) {
    let iconname = temp = s.ability;
    if(s.ability.indexOf("增攻")!=-1) temp += `<br>(體力低於${s.range[2]}%)`;
    if(s.ability.indexOf("波動")!=-1&&s.range[2]) temp += `<br>(Lv.${s.range[2]} 波動)`;
    if(s.ability=='緩速能力解放') temp += `<br>(${s.range[2]}% 機率緩速)`;
    if(s.ability=='降攻能力解放') temp += `<br>(${s.range[2]}% 機率降攻${s.range[3]}%)`;
    iconname = iconname.split("能力解放")[0];
    iconname = iconname.split("強化")[0];
    if(iconname.includes("屬性新增")) iconname = iconname.split("屬性新增")[1];
    temp = new Cat({}).smallIcon(iconname) + temp;
    return temp;
  }
}
