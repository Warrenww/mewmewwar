var CurrentUserID;
if(Storage){
  if(localStorage.stageSelector == "true"){
    $("#rewardSelector").attr("show",1);
    $("#toggleSearch").attr("value",1);
  } else {
    $("#rewardSelector").attr("show",0);
    $("#toggleSearch").attr("value",0);
  }
}
var current_level_data = {},
    current_enemy_data = {},
    current_user_setting = {};
$(document).ready(function () {
  var timer = new Date().getTime();
  var filter_name = '' ;


  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    // console.log(data);
    CurrentUserID = data.uid ;
    current_user_setting = data.setting;
    if(data.last_stage){
      let last_stage = data.last_stage,
          arr = last_stage.split("-");
      socket.emit("required level data",{
        uid:data.uid,
        chapter:arr[0],
        stage:arr[1],
        level:arr[2]
      });
      setTimeout(function () {
        $("#select_stage").find("#"+arr[1]).attr("value",1);
        $("#select_level").find("#"+arr[2]).attr("value",1);
      },500)
      socket.emit("required stage name",arr[0]);
      $('#select_stage').attr("chapter",arr[0]);
      $('#select_level').attr("stage",arr[1]);
      socket.emit("required level name",{chapter:arr[0],stage:arr[1]});
      $(".select_chapter").find("#"+arr[0]).parent().prev().click();
    }
  });

  $("#toggleSearch").click(function () {
    var temp = Number($("#rewardSelector").attr("show"));
    temp = (temp+1)%2;
    $("#rewardSelector").attr("show",temp);
    if(Storage){
      if(temp == 1) localStorage.stageSelector = true;
      else localStorage.stageSelector = false;
    }
  });
  $("#rewardSelector button").click(search);
  function search() {
    var list = [];
    $("#rewardSelector .button[value='1']").each(function () {
      list.push($(this).attr("name"));
    });
    // console.log(list);
    socket.emit("search stage",list);
  }
  socket.on("search stage",(buffer)=>{
    console.log(buffer);
    var count = 0;
    $("#searchResult .result").empty();

    for(let i in buffer){
      count ++;
      $("#searchResult .result").append(
        "<span id='"+i+"'>"+
        content(i,buffer[i])+
        "</span>"
      );
    }
    function content(id,data) {
      var id = id.split("-"),
          name = chapterName(id[0])+" "+data.name.split("-").join(" "),
          reward = "";
      for(let i in data){
        if (i == 'name') continue
        reward += rewardPicture(i)+" "+data[i];
      }
      return "<span>"+name+"</span><span style='float:right'>"+reward+"</span>"
    }
    $("#searchResult").find("#num").text(count);
    $("#searchResult").show(300);
    $("#toggleSearch").attr("value",0);
    $("#rewardSelector").attr("show",0);
  });

  $("#searchBox").blur(textSearch);
  $("#searchBut").click(textSearch);
  function textSearch() {
    let text = $("#searchBox").val();
    if(text) socket.emit('text search stage',text);
  }
  socket.on('text search stage',function (data) {
    // console.log(data);
    let text = $("#searchBox").val();
    $("#searchResult .result").empty();
    for(let i in data){
      $("#searchResult .result").append(
        "<span id='"+data[i].id+"'>"+
        resultName(data[i],text)+"</span>"
      );
    }
    $("#searchResult").find("#num").text(data.length);
    $("#searchResult").show(300);
    function resultName(obj,text) {
      let id = obj.id.split("-"),
          name = id.length == 3?"<c>關卡</c> ":"<c>大關</c> ";
      name += " <d>"+chapterName(id[0])+"</d> <d>";
      name += obj.name.split("<br>").join("").split("/").join("</d> <d>").split(text).join("<b>"+text+"</b>");
      return name
    }
  });
  $("#searchResult i").click(function () {$("#searchResult").hide(300); });
  $(document).on("click","#searchResult .result span",function () {
    let id = $(this).attr("id").split("-");
    if(id.length == 3){
      socket.emit("required level data",{
        uid: CurrentUserID,
        chapter:id[0],
        stage:id[1],
        level:id[2]
      });
    } else {
      socket.emit("required stage name",id[0]);
      $("#select_stage").attr("chapter",id[0]);
      socket.emit("required level name",{chapter:id[0],stage:id[1]});
      $("#select_level").attr("stage",id[1]);
      scroll_to_class("lv_sg_box",0);
    }
  });
  $(document).on("click",".select_chapter span",function () {
    $(this).next().toggle(400).siblings("div").hide(400)
  });
  var expend_sl_chap = 1 ;
  $(document).on('click','#select_chap_tag',showhideselectchap);
  function showhideselectchap() {
    if(expend_sl_chap){
      $('.select_chapter_holder').css('left',0);
      $('#select_chap_tag').css('left',250).children('i').css({"transform":"rotate(180deg)"});
    } else {
      $('.select_chapter_holder').css('left',-250);
      $('#select_chap_tag').css('left',0).children('i').css({"transform":"rotate(0deg)"});
    }
    expend_sl_chap = expend_sl_chap ? 0 : 1 ;
  }

  var loadingTimeOut;
  $(document).on("click",".select_chapter button",function () {
    let chapter = $(this).attr('id');
    $(this).attr("value",'1');
    setTimeout(function () {
      $(".select_chapter button[value=1]").attr("value",0);
      expend_sl_chap = 0;
      showhideselectchap();
    },1000);
    $("#select_stage").empty();
    $("#select_level").empty();
    // console.log(chapter);
    $("#select_stage").attr("chapter",chapter);
    socket.emit("required stage name",chapter);
    scroll_to_div('selector');
    $("#select_stage").empty();
    loadingTimeOut = setTimeout(function () {
      $("#select_stage").addClass("loading");
    },300);
  });
  socket.on("stage name",function (data) {
    // console.log(data);
    clearTimeout(loadingTimeOut);
    $("#select_stage").empty().removeClass("loading");
    for( let i in data )
      $("#select_stage").append(
        "<button value='0' style='width:180px;height:"+
        (data[i].name.length>9?80:40)+"px;margin:5px' id='"+
        data[i].id+"'>"+data[i].name+"</button>"
      );
  });
  $(document).on("click","#select_stage button",function (e) {
    e.stopPropagation();
    let stage = $(this).attr('id'),
        chapter = $(this).parent().attr('chapter');
    $(this).attr('value',1).siblings().each(function () {
      $(this).attr('value',0);
    });
    $("#select_level").attr("stage",stage);
    // console.log(chapter+">"+stage);
    socket.emit("required level name",{chapter:chapter,stage:stage});
    let timeout = 0;
    scrollSelectArea('stage',stage);
    $("#select_level").empty();
    loadingTimeOut = setTimeout(function () {
      $("#select_level").addClass("loading");
    },300);
  });
  socket.on("level name",function (data) {
    clearTimeout(loadingTimeOut);
    $("#select_level").empty().removeClass("loading");
    for( let i in data )
      $("#select_level").append(
        '<span class="card"style="'+
        "background-image:url('"+image_url_stage+
        (data[i].bg?data[i].bg:("bg"+AddZero(Math.ceil(Math.random()*12),2)))+
        ".png')\"id='"+data[i].id+"'>"+data[i].name+"</span>"
      );
      $("#select_stage").find("button[id='"+data[0].id.split("-")[1]+"']")
        .attr('value',1).siblings().attr('value',0);
        scrollSelectArea('stage',data[0].id.split("-")[1]);
  });
  $(document).on("click","#select_level .card",function (e) {
    e.stopPropagation();
    let level = $(this).attr('id'),
        stage = $(this).parent().attr('stage'),
        chapter = $(this).parent().siblings().attr('chapter');
    // console.log(chapter+">"+stage+">"+level);
    $(this).attr('value',1).siblings().each(function () {
      $(this).attr('value',0);
    });
    socket.emit("required level data",{
      uid: CurrentUserID,
      chapter:chapter,
      stage:stage,
      level:level
    });
    scroll_to_class('display',0);
  });
  socket.on("level data",function (obj) {
    // console.log(obj);
    current_level_data = obj;
    current_enemy_data = null;

    var html = "",
        data = obj.data,
        prev_stage = (obj.prev&&obj.prev!='name')?{chapter:obj.chapter,stage:obj.stage,level:obj.prev}:{},
        next_stage = (obj.next&&obj.next!='name')?{chapter:obj.chapter,stage:obj.stage,level:obj.next}:{};
    // Initialization
    $(".display .dataTable td").empty();
    $(".reward,.moredata,.enemy_row").remove();
    $(".display .dataTable img").remove();
    $(".display #star").hide();
    $("*[class='orgdata']").show();
    $(".enemy_head th").attr("reverse","");
    // Initialize more option
    $(".display .dataTable #chapter").html(chapterName(obj.chapter)).attr('value',obj.chapter);
    $(".display .dataTable #stage").html(obj.parent).attr('value',obj.stage);
    $("#more_option #out").attr("href",'http://battlecats-db.com/stage/'+(data.id).split("-")[1]+
          "-"+(Number((data.id).split("-")[2])?AddZero((data.id).split("-")[2]):(data.id).split("-")[2])+'.html');
    $("#more_option #next").attr("query",JSON.stringify(next_stage));
    $("#more_option #prev").attr("query",JSON.stringify(prev_stage));
    // append data
    for(let i in data){
      if (i == 'exp') $(".display .dataTable").find("#"+i).text(parseEXP(data[i]));
      else if (i == 'continue') $(".display .dataTable").find("#"+i).text(data[i]?"可以":"不行");
      else if (i == 'castle_img') $(".display .dataTable").find("#"+i).html("<img src='"+image_url_stage+data[i]+".png'>");
      else if (i == 'bg_img') $(".display .dataTable").find("#"+i).html("<img src='"+image_url_stage+data[i]+".png'>");
      else if (i == 'star') {
        let starArr = data[i],starhtml="";
        if(data[i].length > 1) {
          $("#star").show();
          for(let j in starArr){
            if(j == 0)
              starhtml += '<i class="material-icons" val="'+starArr[j]+'" active="1"> star </i>';
            else if(j != starArr.length-1)
              starhtml += '<i class="material-icons" val="'+starArr[j]+'"star="'+j+'"> star </i>';
          }
          $(".display .dataTable").find("#"+i).html(starhtml);
        }
      }
      else $(".display .dataTable").find("#"+i).text(data[i]?data[i]:'-');
    }
    $("#rewardTable").append(Addreward(data.reward,data.integral));
    $("#enemyTable").append(Addenemy(data.enemy));
    // $(Addlist(data.list)).insertAfter($("#list_toggle"));
    setTimeout(function () {
      scrollSelectArea('stage',obj.stage);
      scrollSelectArea('level',data.id.split("-")[2]);
    },300);
  });
  // Change level star
  $(document).on('click',"#star i",function () {
    var mul = Number($(this).attr("val"))/Number($("#star i[active='1']:last").attr('val')),
        star = $(this).attr("star");
    $(this).attr('active',1).prev().attr('active',1).prev().attr('active',1);
    $(this).next().attr('active',0).next().attr('active',0).next().attr('active',0);
    $(".enemy_row").each(function () {
      let org = $(this).find("#multiple");
      org.text((Number(org.text().split("％")[0])*mul).toFixed(0)+"％");
    });
    current_level_data.data.enemy.map((x) => {x.multiple = (Number(x.multiple.split("％")[0])*mul).toFixed(0)+"％"});
    if(star == 3) $(".dataTable #constrain").text("Ex・稀有");
    else $(".dataTable #constrain").text("-");
    // console.log(current_level_data);
  });
  // More Option
  $('#prev,#next').click(function () {
    let data = JSON.parse($(this).attr('query'));
    // console.log(data.level);
    $("#select_level").find("#"+data.level)
      .attr("value",1).siblings().attr("value",0);
    if(data.level)
      socket.emit("required level data",{
        uid: CurrentUserID,
        chapter:data.chapter,
        stage:data.stage,
        level:data.level
      });
  })
  $("#AddToCompare").click(function () {
    var enemy = current_level_data.data.enemy,
        arr = [];
    for(let i in enemy){
      let id = enemy[i].id,
          lv = Number(enemy[i].multiple.split("％")[0])/100;
      if(arr.indexOf(id) != -1) continue
      else {
        socket.emit("store level",{
          uid : CurrentUserID,
          id : id,
          lv : lv,
          type : 'enemy'
        });
        arr.push(id)
      }
    }
    socket.emit("compare enemy",{id:CurrentUserID,target:arr});
    if(window.parent.reloadIframe){
      window.parent.reloadIframe('compareEnemy');
      window.parent.changeIframe('compareEnemy');
    } else {
      window.open("/compareEnemy","_blank");
    }
  });
  // Show where this level come from
  $(".display .dataTable #chapter").click(function () {
    scroll_to_div('selector');
    $(".select_chapter").find("button[id='"+$(this).attr('value')+"']").click();
  });
  $(".display .dataTable #stage").click(function () {
    let chapter = $(this).siblings("#chapter").attr("value"),
        stage = $(this).attr('value');
    socket.emit("required level name",{chapter:chapter,stage:stage});
  });
  // Enemy filter function
  $("#reward_head,#enemy_head").click(function () { $(this).next("table").toggle(); });
  $(".enemy_head th>span").click(function (e) {
    e.stopPropagation();
    if($(this).attr("active") == "true")
      $(this).attr('active',false).next().css("height",0);
    else
      $(this).attr('active',true).next().css("height","auto")
        .parent().siblings().each(function () {
          $(this).find('span').attr('active',false).next().css("height",0);
        });
    $(document).bind('click',closePanel);
  });
  var closePanel = function () {
    $(".enemy_head").find('span').attr('active',false).next().css("height",0);
    $(document).unbind('click',closePanel);
  }
  $(".enemy_head th>div").click(function (e) {
    e.stopPropagation();
    $(this).children().click(function (e) {
      var target = $(this).text(),
          name = $(this).parent().parent().attr('id');;
      // console.log(target,name);
      if(target == "無篩選") {
        $(".enemy_row").show();
        $(".enemy_head").find("th div div").attr("active",0);
        $(".enemy_head").find("th").attr("reverse",'');
        $(this).parent().css('height',0).prev().attr("active",false);
      }
      else{
        $(".enemy_row").each(function () {
          let val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
          val = !val ? (val==0?0:1e20) : val;
          if(val!=target) $(this).hide();
          else $(this).show();
        });
        $(".enemy_head").find("th div div").attr("active",0);
        $(".enemy_head").find("th").attr("reverse",'');
        $(this).attr("active",1)
        .parent().css('height',0).prev().attr("active",false)
        .parent().attr("reverse",'filter');
      }
    });
  });
  // Switch level/enemy data
  $("#enemy_head span").click(function (e) {
    e.stopPropagation();
    if(current_enemy_data){
      $('.moredata').toggle().siblings("*[class='orgdata']").toggle();
      if(!current_level_data.data.enemy[0].point) $(" .enemy_head #point").hide();
    } else {
      var enemy = current_level_data.data.enemy,
          arr = [];
      FloatDisplayMutex = false;
      for(let i in enemy) arr.push(enemy[i].id)
      socket.emit("required data",{
        type : 'enemy',
        target : arr,
        record : false,
        uid : CurrentUserID,
        lv : 1
      });
    }
  });
  socket.on("required data",(data)=>{
    if(FloatDisplayMutex || current_enemy_data) return;
    // console.log(data);
    current_enemy_data = {};
    for(let i in data.buffer) {
      let id = data.buffer[i].data.id;
      current_enemy_data[id] = new Enemy(data.buffer[i].data);
    }
    SwitchData();
  });
  function SwitchData(data) {
    var showlist = ['hp','atk','range','tag'];
    if(current_user_setting.MoreDataField) showlist = current_user_setting.MoreDataField;
    $(".orgdata").hide();
    for(let i in showlist){
      $(".enemy_head").append(createHtml("th",Unit.propertiesName(showlist[i]),{id:showlist[i],class:'moredata'}));
      $(".enemy_row").each(function () {
        var id = $(this).children().eq(0).attr('id').toString(),
            lv = Number($(this).children().eq(1).text().split("％")[0])/100,
            appendText;
        if(showlist[i] == 'tag'){
          if(current_enemy_data[id].tag) appendText = current_enemy_data[id].tag;
          else appendText = "-";
        }
        else if(showlist[i] == 'aoe'){
          appendText = current_enemy_data[id].Aoe;
        }
        else if (showlist[i] == 'char') {
          appendText = current_enemy_data[id].CharHtml(lv);
        }
        else if(showlist[i] == 'color'){
          appendText = current_enemy_data[id].Color;
        }
        else if (showlist[i] == 'name') {
          appendText = current_enemy_data[id].Name;
        }
        else appendText = current_enemy_data[id].Tovalue(showlist[i],lv);

        $(this).append("<td id='"+showlist[i]+"'class='moredata'>"+appendText+"</td>")
      });
    }
  }

  function Addreward(arr,b) {
    // console.log(arr);
    let html ="";
    for(let i in arr){
      html += "<tr class='reward'><th>"+prize(arr[i].prize.name)+"</th>"+
                "<td>"+arr[i].prize.amount+"</td>";
      html += "<th>"+(b?((arr[i].chance.indexOf("%")!=-1||arr[i].chance.indexOf("％")!=-1)?
                  "取得機率":"累計積分"):"取得機率")+
              "</th>"+"<td>"+arr[i].chance+"</td>"+
              "<th>取得上限</th>"+"<td>"+arr[i].limit+"</td>"+
              "</tr>"
    }
    return html
  }
  function Addenemy(arr) {
    var html = "",
        range = {
          multiple:[],
          amount:[],
          castle:[],
          first_show:[],
          next_time:[]
        };
    if(arr[0].point) $(".enemy_head #point").show();
    else $(".enemy_head #point").hide();
    for(let i in arr){
      if(!arr[i]) continue
      html += "<tr class='enemy_row' id='"+i+"'>"+
      "<td class='enemy' id='"+arr[i].id+"' style='padding:0;"+
      (arr[i].Boss?'border:5px solid rgb(244, 89, 89)':'')+
      "'  colspan='1'><img src='"+Unit.imageURL('enemy',arr[i].id)+
      "' style='width:100%'/></td>" ;
      html += "<td id='multiple'>"+arr[i].multiple+"</td>"+
      "<td id='amount'class='orgdata'>"+arr[i].amount+"</td>"+
      "<td id='castle'class='orgdata'>"+arr[i].castle+"</td>"+
      "<td id='first_show'class='orgdata'>"+arr[i].first_show+"</td>"+
      "<td id='next_time'class='orgdata'>"+arr[i].next_time+"</td>"+
      (arr[0].point?"<td id='point'class='orgdata'>"+arr[i].point+"</td>":"")+
      "</tr>";
      for(let j in range) if(range[j].indexOf(arr[i][j]) == -1) range[j].push(arr[i][j]);
    }
    for(let j in range){
      for(let k in range[j])
        range[j][k] = Number(range[j][k].split("％")[0].split("~")[0]);
    }
    for(let j in range){
      range[j] = quickSort(range[j]);
      $(".enemy_head").find("#"+j).children("div").empty().append("<div>無篩選</div>");
      for(let k in range[j])
        if(!Number.isNaN(range[j][k]))
          $(".enemy_head").find("#"+j).children("div")
            .append("<div>"+range[j][k]+"</div>");
    }
    // console.log(range);
    return html
  }
  function Addlist(list) {
    let html = '';
    for(let i in list){
      if(list[i].public||list[i].owner == CurrentUserID){
        html+="<tr class='list'><td colspan=6>"+
        "<div id='"+list[i].key+"' class='list_display_holder' public='"+list[i].public+"'>"+
        "<div class='list_display'>"+appendCat(list[i].list.upper)+appendCat(list[i].list.lower)+"</div>"+
        "<div class='list_data'>"+"<h3>"+list[i].name+"</h3>"+
        "<div class='list_detail'>"+
        "<span class='combo'>發動聯組 : <b>"+appendCombo(list[i].combo)+"</b></span>"+
        "<span>連結關卡 : </span>"+
        "<span class='stage'><b>"+appendStage(list[i].stageBind)+"</b></span>"+
        "<span>備註 : </span>"+
        "<span class='note'><b>"+list[i].note.split("\n").join("<br>")+"</b></span>"+
        "</div>"+
        "</div>"+
        "<div class='option'>"+
        "<i class=\"material-icons\"id='edit'text='編輯'>create</i>"+
        "<i class=\"material-icons\"id='del'text='刪除'>delete</i>"+
        "<i class=\"material-icons\"id='analyze'text='分析'>pie_chart</i>"+
        "</div>"+
        "</div></td></tr>"
      }
    }
    return html
  }
  function appendCat(list) {
    let html = "<div>",count=0;
    for(let i in list){
      html +=
      '<span class="card" value="'+list[i].id+'"'+
      'style="background-image:url(\''+Unit.imageURL('cat',list[i].id)+'\')"'+
      'cost="'+list[i].cost+'"lv="'+list[i].lv+'"bro="'+list[i].bro+'" detail="cost"></span>';
      count++;
    }
    for(let i=count;i<5;i++){
      html += "<span class='seat'>-</span>"
    }
    html += "</div>"
    return html
  }
  function appendCombo(combo) {
    let html = "";
    for(let i in combo) html += "<span data='"+JSON.stringify(combo[i])+"'>"+combo[i].effect+"</span> / ";;
    return html.substring(0,html.length-2)
  }
  function appendStage(stage=[]) {
    let html = "";
    for(let i in stage) html += "<span id='"+stage[i].id+"'>"+stage[i].name+"</span><br>";
    if(stage.length) return html
    else return "無"
  }
  function chapterName(s) {
    var name='';
    $(".select_chapter").find('button').each(function () {
      if($(this).attr("id")==s) name = $(this).text();
    });
    return name
  }
  function prize(s) {
    // console.log(s);
    var html;
    if(s.indexOf("u")!=-1){
      html = "<img src='"+Unit.imageURL('cat',s.split("u")[1])+
      "' style='width:100%' class='cat' id='"+s.split("u")[1]+"' />"
    } else {
      html = s + rewardPicture(s);
    }
    return html
  }
  function parseEXP(n) {
    n = n.split(",").join("");
    return Math.ceil(Number(n)*4.2);
  }
  function rewardPicture(s) {
    var html = "";
    $("#rewardSelector .button").each(function () {
      if($(this).attr("name") == s) html = $(this).html();
    });
    return html
  }
  $(document).on('click','.enemy_head th',sortStageEnemy);
  function sortStageEnemy() {
    var name = $(this).attr('id'),
        arr = [],
        flag = $(this).attr('reverse') ;
    $(".enemy_row").each(function () {
      let obj = {},
          val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
      obj = {
        id:$(this).attr('id'),
        item: !val ? (val==0?0:1e20) : val
      }
      arr.push(obj);
    });
    arr = quickSort(arr,'item');
    // console.log(arr);
    if(flag != 'increase'){
      for(let i=arr.length-1;i>=0;i--) $(".enemy_head:visible:last").after($(".enemy_row[id='"+arr[i].id+"']"));
      $(this).attr('reverse','increase').siblings().attr('reverse','');
    } else {
      for(let i=0;i<arr.length;i++) $(".enemy_head:visible:last").after($(".enemy_row[id='"+arr[i].id+"']"));
      $(this).attr('reverse','decrease').siblings().attr('reverse','');
    }
    $(".enemy_head").find("span").attr("active",false).next().css("height",0);
    $(".enemy_head").find("th div div").attr("active",0);
    $(".enemy_row").show();
  }

  var tip_fadeOut;
  $("#rewardSelector .button").click(function () {
    let text = $(this).attr("name"),
    val = $(this).attr('value')=='1'?true:false;
    if(!val){
      clearTimeout(tip_fadeOut);
      $(".ability_tip").remove();
      $("body").append("<div class='ability_tip'>"+text+"<div>");
      setTimeout(function () { $(".ability_tip").css("left",-10); },100)
      tip_fadeOut = setTimeout(function () { $(".ability_tip").css("left",-250) },2000);
    }
  });

});

function scrollSelectArea(area,target) {
  // console.log(area,target);
  var This = $("#select_"+area),
      Target = This.find("#"+target);

  // If this area is still loading
  if(This.attr("class") == "loading"){
    setTimeout(function () {
      scrollSelectArea(area,target);
    },500);
    return
  }
  if(!target || !Target) return
  var scrollTop = This ? This.scrollTop() : 0,
      TargetOffsetTop = Target.offset() ? Target.offset().top : 0,
      ThisOffsetTop = This ? This.offset().top : 0,
      ThisHeight = This ? This.outerHeight()/2 : 0,
      TargetHeight = Target ? Target.outerHeight()/2 : 0 ;
  This.animate({
    scrollTop: scrollTop + TargetOffsetTop - ThisOffsetTop - ThisHeight + TargetHeight
  },400);
}
