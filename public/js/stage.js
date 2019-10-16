var CurrentUserID;
var current_level_data = {},
    current_enemy_data = {},
    current_user_setting = {};

$(document).ready(function () {
  var timer = new Date().getTime();

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
      let temp = Number($(".chapterTable").find("#"+arr[0]).parent().attr('target'));
      $('.chapterTable>div:first').children().eq(temp).click();
    }
  });

  $(".chapterTable>div:first-of-type>div").click(function () {
    var temp = Number($(this).attr("value")),target = Number($(this).attr('target'));
    if(temp) return;
    $(this).attr("value",1).siblings().attr("value",0);
    $(this).parent().next().children().eq(target).attr("value",1).siblings().attr("value",0);
  });
  $(".rewardSelectorTable button").click(search);
  function search() {
    var list = [];
    $(".rewardSelectorTable .button[value='1']").each(function () {
      list.push($(this).attr("name"));
    });
    // console.log(list);
    socket.emit("search stage",list);
  }
  socket.on("search stage",(buffer)=>{
    console.log(buffer);
    var count = 0;
    $(".searchResultTable .result").empty();

    for(let i in buffer){
      count ++;
      $(".searchResultTable .result").append(
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
    $(".searchResultTable").find("#num").text(count);
    openTable("searchResultTable")
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
    $(".searchResultTable .result").empty();
    for(let i in data){
      $(".searchResultTable .result").append(
        "<span id='"+data[i].id+"'>"+
        resultName(data[i],text)+"</span>"
      );
    }
    $(".searchResultTable").find("#num").text(data.length);
    openTable("searchResultTable")
    function resultName(obj,text) {
      let id = obj.id.split("-"),
          name = id.length == 3?"<c>關卡</c> ":"<c>大關</c> ";
      name += " <d>"+chapterName(id[0])+"</d> <d>";
      name += obj.name.split("<br>").join("").split("/").join("</d> <d>").split(text).join("<b>"+text+"</b>");
      return name
    }
  });
  $(document).on("click",".searchResultTable .result span,.legendquestTable th .card",function () {
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
      openTable("levelTable");
    }
  });

  var loadingTimeOut;
  $(document).on("click",".chapterTable button",function () {
    let chapter = $(this).attr('id');
    $(this).attr("value",1);
    $(".chapterTable button[value=1]").attr("value",0);
    $("#select_stage").empty();
    $("#select_level").empty();

    $("#select_stage").attr("chapter",chapter);
    socket.emit("required stage name",chapter);
    openTable('levelTable');
    loadingTimeOut = setTimeout(function () {
      if(chapter !== 'legendquest') $("#select_stage").addClass("loading");
    },300);
  });
  socket.on("stage name",function (data) {
    // console.log(data);
    clearTimeout(loadingTimeOut);
    $("#select_stage").empty().removeClass("loading");
    for( let i in data )
      $("#select_stage").append(
        "<button value='0' id='"+data[i].id+"'>"+data[i].name+"</button>"
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
    if(chapter === 'legendquest' && level == 48){
      socket.emit("required level data",{
        uid: CurrentUserID,
        chapter:'story',
        stage:'s00048',
        level:'1'
      });
      return;
    }
    $(".legendquestTable").hide();
    socket.emit("required level data",{
      uid: CurrentUserID,
      chapter:chapter,
      stage:stage,
      level:level
    });
    scroll_to_class('display',0);
  });
  socket.on("level data",(obj) => {
    displayStageData(obj);
    var trimId = obj.data.id.split("-");
    trimId = [trimId[1],trimId[2]].join("-");
    $(".legendquestTable").hide();
    socket.emit("required comment",{type:'stage',id:trimId});
  });
  socket.on("legendquest",data => {
    $(".legendquestTable").show();
    var level = Number(data.level),
        obj = {
          chapter:"legendquest",
          parent:"傳奇尋寶記",
          data:{
            continue:false,
            energy:(Math.floor(level/20)+1)*50,
            exp:(Math.floor(level/20)+1)*950,
            id: "legendquest-s16000-"+level,
            integral:false,
            name: "Level "+(level+1),
            reward:[],
            enemy: data.response
          }
        },
        res = data.response,
        table = "<tr>",
        searchQueue = [];
    if([15,25,35,40,45,48].indexOf(level+1) !== -1){
      obj.data.reward.push({chance:"100%",limit:1,prize:{amount:(level+1 === 48?3:1)+"個",name:"貓眼石【傳說稀有】"}});
    }
    else if([11,21,31,41,47].indexOf(level+1) !== -1){
      obj.data.reward = ["ＥＸ","稀有","激稀有","超激稀有","傳說稀有"].map(x=>{return {chance:"20%",limit:1,prize:{amount:"3個",name:`貓眼石【${x}】`}}});
    }
    else if([13,17,19,23,26,28,33,36,38,43].indexOf(level+1) !== -1){
      obj.data.reward.push({chance:"100%",limit:1,prize:{amount:"1個",name:"貓咪卷"}});
    }
    else if([20,30].indexOf(level+1) !== -1){
      obj.data.reward.push({chance:"100%",limit:1,prize:{amount:"1個",name:"稀有卷"}});
    }
    else{
      obj.data.reward = ["加速","寶物雷達","土豪貓","貓型電腦","洞悉先機","狙擊手"].map(x=>{
        return {chance:"16%",limit:1,prize:{amount:(level+1 < 28?1:(level+1<43?2:3))+"個",name:x}}
      });
    }

    res.map((x,i)=>{
      let stage = x.name.id, stageName = x.name.name;
      table += `<th colspan='3'>${stageName}</th></tr><tr>`;
      x.stage.map((temp,j)=>{
        let exist = [],enemyHtml="";
        table += `<th style="padding:0"><span class='card' id='${['story',stage,temp.id].join("-")}' style="background-image:url('/css/footage/stage/${temp.bg}.png')">${temp.name}</span></th>`;
        for(let k in temp.enemy){
          let enemyID = temp.enemy[k].id;
          if(exist.indexOf(enemyID) !== -1 || enemyID == '023') continue;
          exist.push(enemyID);
          enemyHtml += "<img src='"+Unit.imageURL("enemy",enemyID)+"'/>";
        }
        table +=  "<td><div data='"+JSON.stringify(exist)+"'>"+enemyHtml+
                  `</div></td><td style='width:50px'><i class='material-icons cir_but' data='${''+i+j}' text='載入敵人資訊'>get_app</i></td></tr><tr>`;
        searchQueue = searchQueue.concat(exist.map(x => {if(searchQueue.indexOf(x) === -1) return x;else return null}));
      });
    });
    table += "</tr>";

    $(".legendquestTable").eq(0).find(".starReq td").each(function (index) {
      $(this).html(index+(level<40?1:2)+"★");
    });
    $(".legendquestTable:last thead tr td").empty().append("<div>"+searchQueue.map(x=>{
      return x?"<img active=0 data='"+x+"' src='"+Unit.imageURL("enemy",x)+"'/>":"";
    }).join("")+"</div>");
    $(".legendquestTable:last tbody").empty().append(table);

    displayStageData(obj);
  });
  var legendEnemyChoosed = [];
  $(document).on('click',"#enemyChooser img",function(){
    var filter = $(this).attr('data'),
        active = Number($(this).attr('active'));
        active = Number(!active);

    if(active) legendEnemyChoosed.push(filter);
    else legendEnemyChoosed.splice(legendEnemyChoosed.indexOf(filter),1);

    $(this).attr("active",active);

    $(".legendquestTable:last tbody tr").each(function () {
      let temp = JSON.parse($(this).find('div').attr('data') || "[]");
      for(i of legendEnemyChoosed){
        if(temp.indexOf(i) !== -1) continue;
        $(this).hide();
        return;
      }
      $(this).show();
    });
  });

  $(document).on('click','.legendquestTable .cir_but',function () {
    var ref = $(this).attr("data");
    data = current_level_data.data.enemy[ref.substring(0,1)].stage[ref.substring(1)];
    scroll_to_class('enemyTable',0);
    $(".enemyTable tbody").empty().append(Addenemy(data.enemy));
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
  });
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
    socket.emit("Set Compare",{type:"enemy",id:CurrentUserID,target:arr});
    setTimeout(function () {
      if(Storage) localStorage.compareType = 'enemy'
      switchIframe("compare");
    },800);
  });
  $("#snapshot").click(()=>{
    $(".display .panel,.toggle_next").css("display","none");
    setTimeout(()=>{
      snapshot("#selected","#eee").then((rs,rj)=>{
        $(".display .panel,.toggle_next").removeAttr("style")
      });
    },500);
  });
  // Show where this level come from
  $(".display .dataTable #chapter").click(function () {
    $(".search_type span:first").click();
  });
  $(".display .dataTable #stage").click(function () {
    let chapter = $(this).siblings("#chapter").attr("value"),
        stage = $(this).attr('value');
    socket.emit("required level name",{chapter:chapter,stage:stage});
  });

  $(document).on("click",".enemyTable thead .panel span",function (e) {
    var target = $(this).text(),
    name = $(this).parent().parent().attr('id');;
    // console.log(target,name);
    if(target == "無篩選") {
      $(".enemy_row").show();
      $(".enemyTable thead").find("th div span").attr("active",0);
      $(".enemyTable thead").find("th").attr("reverse",'');
    }
    else{
      $(".enemy_row").each(function () {
        let val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
        val = Number.isNaN(val) ? 1e20 : val;
        if(val!=target) $(this).hide();
        else $(this).show();
      });
      $(".enemyTable thead").find("th div span").attr("active",0);
      $(".enemyTable thead").find("th").attr("reverse",'');
      $(this).attr("active",1).parent().parent().attr("reverse",'filter');
    }
    $("#panelBG").click();
    e.stopPropagation();
  });
  // Switch level/enemy data
  $("#swapdata").click(function (e) {
    if(current_enemy_data){
      $('.moredata').toggle().siblings("*[class='orgdata']").toggle();
      if(!current_level_data.data.enemy[0].point) $(" .enemyTable thead #point").hide();
    } else {
      var enemy = current_level_data.data.enemy,
          arr = enemy.map(x => { return {id:x.id,lv:"default"}});
      FloatDisplayMutex = false;
      socket.emit("required data",{
        type : 'enemy',
        target : arr,
        record : false,
        uid : CurrentUserID
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
      $(".enemyTable thead tr").append(createHtml("th",Unit.propertiesName(showlist[i]),{id:showlist[i],class:'moredata'}));
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

  function displayStageData(obj) {
    current_level_data = obj;
    current_enemy_data = null;

    var html = "",
        data = obj.data,
        prev_stage = (obj.prev&&obj.prev!='name')?{chapter:obj.chapter,stage:obj.stage,level:obj.prev}:{},
        next_stage = (obj.next&&obj.next!='name')?{chapter:obj.chapter,stage:obj.stage,level:obj.next}:{};

    // Initialization
    $(".moredata").remove();
    $(".display #star").hide();
    $("*[class='orgdata']").show();
    $(".enemyTable thead th").attr("reverse","");
    $(".display .dataTable td,.display .enemyTable tbody,.display .rewardTable tbody").empty();
    $(".display .dataTable img").remove();

    // Initialize more option
    $(".display .dataTable #chapter").html(chapterName(obj.chapter)).attr('value',obj.chapter);
    $(".display .dataTable #stage").html(`${(obj.parent?obj.parent:"")}<i class='material-icons'>create</i>`).attr('value',obj.stage);
    if(data.id) $(".displayControl .control #out").attr("href",'http://battlecats-db.com/stage/'+(data.id).split("-")[1]+
          "-"+(Number((data.id).split("-")[2])?AddZero((data.id).split("-")[2]):(data.id).split("-")[2])+'.html');
    $(".displayControl .control #next").attr("query",JSON.stringify(next_stage));
    $(".displayControl .control #prev").attr("query",JSON.stringify(prev_stage));
    $(".displayControl .data #name").text(`${chapterName(obj.chapter)}>${obj.parent?obj.parent.replace("<br>"," "):""}>${data.name}`);
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
      else if(i == 'name') $(".display .dataTable").find("#"+i).html(`${data[i]?data[i]:data.jp_name}<i class='material-icons'>create</i>`);
      else $(".display .dataTable").find("#"+i).text(data[i]?data[i]:'-');
    }
    $(".rewardTable tbody").append(Addreward(data.reward,data.integral));
    if(obj.chapter !== 'legendquest') $(".enemyTable tbody").append(Addenemy(data.enemy));
    // $(Addlist(data.list)).insertAfter($("#list_toggle"));
    setTimeout(function () {
      scrollSelectArea('stage',obj.stage);
      scrollSelectArea('level',data.id.split("-")[2]);
    },300);

    socket.emit("required comment",{type:'stage',id:data.id});
  }
  function Addreward(arr,b) {
    // console.log(arr);
    let html ="";
    for(let i in arr){
      html += "<tr><th>"+prize(arr[i].prize.name)+"</th>"+
                (arr[i].prize.name=="寶物"?`<td onclick='toTreasure("${arr[i].prize.amount}")'>`:"<td>")+
                arr[i].prize.amount+"</td>";
      html += "<th>"+(b?((arr[i].chance.indexOf("%")!=-1||arr[i].chance.indexOf("％")!=-1)?
                  "取得機率":"累計積分"):"取得機率")+
              "</th>"+"<td>"+arr[i].chance+"</td>"+
              "<th>取得上限</th>"+"<td>"+arr[i].limit+"</td>"+
              "</tr>"
    }
    return html
  }
  function Addenemy(arr) {
    if(!arr) return;
    var html = "",
        range = {
          multiple:[],
          amount:[],
          castle:[],
          first_show:[],
          next_time:[]
        };
    if(arr[0].point) $(".enemyTable thead tr #point").show();
    else $(".enemyTable thead tr #point").hide();
    for(let i in arr){
      if(!arr[i]) continue
      html += "<tr class='enemy_row' id='"+i+"'>"+
      "<th class='enemy' id='"+arr[i].id+"' style='padding:0;"+
      (arr[i].Boss?'border:5px solid var(--red)':'')+
      "'  colspan='1'><img src='"+Unit.imageURL('enemy',arr[i].id)+
      "' style='width:100%'/></th>" ;
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
      $(".enemyTable thead tr").find("#"+j).children(".panel").empty().append("<span>無篩選</span>");
      for(let k in range[j])
        if(!Number.isNaN(range[j][k]))
          $(".enemyTable thead tr").find("#"+j).children(".panel")
            .append("<span>"+range[j][k]+"</span>");
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
    $(".chapterTable").find('button').each(function () {
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
    if(!Number.isNaN(Number(n))) return n;
    n = n.split(",").join("");
    return Math.ceil(Number(n)*4.2);
  }
  function rewardPicture(s) {
    var html = "";
    $(".rewardSelectorTable .button").each(function () {
      if($(this).attr("name") == s) html = $(this).html();
    });
    return html
  }
  $(document).on('click','.enemyTable thead tr th',sortStageEnemy);
  function sortStageEnemy() {
    var name = $(this).attr('id'),
        arr = [],
        flag = $(this).attr('reverse') ;
    $(".enemy_row").each(function () {
      let obj = {},
          val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
      obj = {
        id:$(this).attr('id'),
        item: Number.isNaN(val) ? 1e20 : val
      }
      arr.push(obj);
    });
    arr = quickSort(arr,'item');
    // console.log(arr);
    if(flag != 'increase'){
      for(let i=arr.length-1;i>=0;i--) $(".enemyTable tbody").append($(".enemy_row[id='"+arr[i].id+"']"));
      $(this).attr('reverse','increase').siblings().attr('reverse','');
    } else {
      for(let i=0;i<arr.length;i++) $(".enemyTable tbody").append($(".enemy_row[id='"+arr[i].id+"']"));
      $(this).attr('reverse','decrease').siblings().attr('reverse','');
    }
    $(".enemyTable tbody tr").show()
  }

  var tip_fadeOut;
  $(".rewardSelectorTable .button").click(function () {
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

  var renameTimer;
  $(document).on("click",".dataTable #stage i,.dataTable #name i",function () {
    if($(this).is(".noedit")) return;
    var id = current_level_data.data.id.split("-"),
        stage = $(this).parent().is("#stage"),
        orgText = $(this).parent().html().split("<")[0];

    renameTimer = setTimeout(TimeOut,20000);
    function TimeOut() {
      $(".dataTable").find("input").parent().html(`${orgText}<i class='material-icons'>create</i>`);
      alert(`因為閒置過久所以取消編輯`);
      socket.emit("user rename stage",{status:"abort",id:id});
    }

    if(stage) id.pop();
    id = id.join("-");
    socket.emit("user rename stage",{status:"edit",id:id});

    $(this).parent().html(`<input type='text' value='${orgText}' id='${id}'/>`)
    .find("input").focus().select().bind("keydown",function (e) {
      clearTimeout(renameTimer);
      renameTimer = setTimeout(TimeOut,20000);
      if(e.key=='Escape'||e.keyCode===27){
        $(this).parent().html(`${orgText}<i class='material-icons'>create</i>`);
        clearTimeout(renameTimer);
        socket.emit("user rename stage",{status:"abort",id:id});
      }
      if(e.keyCode == 13){
        if(e.shiftKey) $(this).val($(this).val()+"<br>").focus();
        else {
          var val = $(this).val(),
          r = confirm(`確定將關卡名稱改為${val}?`);
          clearTimeout(renameTimer);
          if(r && (val.trim() != "")){
            socket.emit("user rename stage",{status:"commit",id:id,name:val});
          } else {
            $(this).parent().html(`${orgText}<i class='material-icons'>create</i>`);
            socket.emit("user rename stage",{status:"abort",id:id});
          }
        }
      }
    });
  });
  socket.on("user rename stage",(data)=>{
    clearTimeout(renameTimer);
    switch (data.status) {
      case "editing":
        var id_editing = data.id.split("-"),
            id_current = current_level_data.data.id.split("-");
        if(id_editing[0] != id_current[0]) break;
        if(id_editing[1] != id_current[1]) break;
        if(!id_editing[2]){
          $(".dataTable #stage i").addClass("noedit");
        } else if(id_editing[2] == id_current[2]){
          $(".dataTable #name i").addClass("noedit");
        }
      break;
      case "fail":
        var orgText = $(".dataTable").find("input").attr("value");
        $(".dataTable").find("input").parent().html(`${orgText}<i class='material-icons'>create</i>`);
        alert(`因為${data.reason}所以無法編輯/更新關卡名稱，請重新整理或稍後在試`);
        break;
      case "finish":
        var id_editing = data.id.split("-"),
            id_current = current_level_data.data.id.split("-");
        if(id_editing[0] != id_current[0]) break;
        if(id_editing[1] != id_current[1]) break;
        if(!id_editing[2]){
          $(".dataTable #stage").html(`${data.name}<i class='material-icons'>create</i>`);
          $("#select_stage").find("#"+id_editing[1]).html(data.name);
        } else if(id_editing[2] == id_current[2]){
          $(".dataTable #name ").html(`${data.name}<i class='material-icons'>create</i>`);
          $("#select_level .card[value='1']").html(data.name);
        }
        break;
      case "release":
        var id_editing = data.id.split("-"),
            id_current = current_level_data.data.id.split("-");
        if(id_editing[0] != id_current[0]) break;
        if(id_editing[1] != id_current[1]) break;
        if(!id_editing[2]){
          $(".dataTable #stage i").removeClass("noedit");
        } else if(id_editing[2] == id_current[2]){
          $(".dataTable #name i").removeClass("noedit");
        }
        break;
      default:
    }
  });

});
$(window).unload(function () {
  var id = current_level_data.data.id.split("-");
  socket.emit("user rename stage",{status:"abort",id:id.join("-")});
  id.pop();
  socket.emit("user rename stage",{status:"abort",id:id.join("-")});
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
function toTreasure(s) {
  if(!s) return;
  switchIframe("treasure?"+s);
}
