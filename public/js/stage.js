$(document).ready(function () {
  var timer = new Date().getTime();
  var filter_name = '' ;
  var socket = io.connect();
  var current_user_data = {};
  var current_level_data = {};

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    // console.log(data);
    current_user_data = data ;
    if(data.last_stage){
      let last_stage = data.last_stage,
          arr = last_stage.split("-");
      socket.emit("required level data",{
        uid:data.uid,
        chapter:arr[0],
        stage:arr[1],
        level:arr[2]
      });
      socket.emit("required stage name",arr[0]);
      $('#select_stage').attr("chapter",arr[0]);
      $('#select_level').attr("stage",arr[1]);
      socket.emit("required level name",{chapter:arr[0],stage:arr[1]});
      $(".select_chapter").find("#"+arr[0]).parent().prev().click();
    }
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
        uid: current_user_data.uid,
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
  });

  $(document).on("click","#select_stage,#select_level",function () {
    $(this).css("flex",'3').siblings().css("flex",'1');
  });
  socket.on("stage name",function (data) {
    // console.log(data);
    $("#select_stage").empty();
    for( let i in data )
      $("#select_stage").append(
        "<button value='0' style='width:180px;height:"+
        (data[i].name.length>9?80:40)+"px;margin:5px' id='"+
        data[i].id+"'>"+data[i].name+"</button>"
      ).css("flex","3").siblings().css("flex","1");
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
    if($(this).parent().css("flex") == '3 1 0%') timeout = 800;
    setTimeout(function () {
      $('#select_stage').animate({
        scrollTop : $('#select_stage button[value="1"]')[0].offsetTop-$("#select_stage").height()
      },800,'easeInOutCubic');
    },timeout);
  });
  socket.on("level name",function (data) {
    // console.log(data);
    $("#select_level").empty();
    for( let i in data.name )
      $("#select_level").append(
        "<span class='card'style='"+
        "background-image:url(\"../public/css/footage/stage/fight_BG_0"+
        (Math.ceil(Math.random()*5))+".png\")"+
        "' id='"+data.name[i].id+"'>"+data.name[i].name+"</span>"
      ).css("flex","3").siblings().css("flex","1");
      $("#select_stage").find("button[id='"+data.stage+"']")
        .attr('value',1).siblings().each(function () {
          $(this).attr('value',0)
        });
      setTimeout(function () {
        $('#select_stage').animate({
          scrollTop : $('#select_stage button[value="1"]')[0].offsetTop-$("#select_stage").height()
        },800,'easeInOutCubic');
      },800);
  });
  $(document).on("click","#select_level .card",function (e) {
    e.stopPropagation();
    let level = $(this).attr('id'),
        stage = $(this).parent().attr('stage'),
        chapter = $(this).parent().siblings().attr('chapter');
    // console.log(chapter+">"+stage+">"+level);
    socket.emit("required level data",{
      uid: current_user_data.uid,
      chapter:chapter,
      stage:stage,
      level:level
    });
  });
  socket.on("level data",function (obj) {
    console.log(obj);
    current_level_data = obj;
    let html = "",
        data = obj.data,
        prev_stage = (obj.prev&&obj.prev!='name')?{chapter:obj.chapter,stage:obj.stage,level:obj.prev}:{},
        next_stage = (obj.next&&obj.next!='name')?{chapter:obj.chapter,stage:obj.stage,level:obj.next}:{};
    $(".dataTable td").empty();
    $(".reward").remove();
    $(".enemy_row").remove();
    $(".dataTable #chapter").text(chapterName(obj.chapter)).attr('value',obj.chapter);
    $(".dataTable #stage").text(obj.parent).attr('value',obj.stage);
    $("#more_option #out").attr("href",'http://battlecats-db.com/stage/'+(data.id).split("-")[1]+"-"+AddZero((data.id).split("-")[2])+'.html');
    $("#more_option #next").attr("query",JSON.stringify(next_stage));
    $("#more_option #prev").attr("query",JSON.stringify(prev_stage));
    for(let i in data){
      if (i == 'exp') $(".dataTable").find("#"+i).text(parseEXP(data[i]));
      else if (i == 'continue') $(".dataTable").find("#"+i).text(data[i]?"可以":"不行");
      else $(".dataTable").find("#"+i).text(data[i]?data[i]:'-');
    }
    $(Addreward(data.reward,data.integral)).insertAfter($("#reward_head"))
    $(Addenemy(data.enemy)).insertAfter($("#enemy_head"));
    // $(Addlist(data.list)).insertAfter($("#list_toggle"));
    scroll_to_class('display',0);
  });
  $('#prev,#next').click(function () {
    let data = JSON.parse($(this).attr('query'));
    // console.log(data.level);
    if(data.level)
      socket.emit("required level data",{
        uid: current_user_data.uid,
        chapter:data.chapter,
        stage:data.stage,
        level:data.level
      });
  })
  $("#AddToCompare").click(function () {
    let enemy = current_level_data.data.enemy,
        arr = [];
    for(let i in enemy){
      let id = enemy[i].id,
          lv = Number(enemy[i].multiple.split("％")[0])/100;
      if(arr.indexOf(id) != -1) continue
      else {
        socket.emit("store level",{
          uid : current_user_data.uid,
          id : id,
          lv : lv,
          type : 'enemy'
        });
        arr.push(id)
      }
    }
    socket.emit("compare enemy",{id:current_user_data.uid,target:arr});
    window.parent.reloadIframe('compareEnemy');
  });
  $(".dataTable #chapter").click(function () {
    scroll_to_div('selector');
    $(".select_chapter").find("button[id='"+$(this).attr('value')+"']").click();
  });
  $(".dataTable #stage").click(function () {
    let chapter = $(this).siblings("#chapter").attr("value"),
        stage = $(this).attr('value');
    socket.emit("required level name",{chapter:chapter,stage:stage});
  });
  $("#reward_head").click(function () {
    $(".reward").toggle();
    $(this).find('i').attr("value",function () {
      return Number($(this).attr("value"))+1
    }).css("transform",function () {
      return "rotate("+Number($(this).attr("value"))*180+"deg)"
    });
  });
  $("#enemy_toggle").click(function () {
    $(".enemy_row,#enemy_head").toggle();
    $(this).find('i').attr("value",function () {
      return Number($(this).attr("value"))+1
    }).css("transform",function () {
      return "rotate("+Number($(this).attr("value"))*180+"deg)"
    });
  });
  function Addreward(arr,b) {
    // console.log(arr);
    let html ="";
    for(let i in arr){
      html += screen.width > 768 ?
              ( "<tr class='reward'><th>"+prize(arr[i].prize.name)+"</th>"+
                "<td>"+arr[i].prize.amount+"</td>"
              ):(
                "<tr class='reward'><th colspan=2>"+prize(arr[i].prize.name)+"</th>"+
                "<td colspan=2>"+arr[i].prize.amount+"</td></tr>"
              );
      html += "<th>"+(b?(arr[i].chance.indexOf("%")!=-1?"取得機率":"累計積分"):"取得機率")+
              "</th>"+"<td>"+arr[i].chance+"</td>"+
              "<th>取得上限</th>"+"<td>"+arr[i].limit+"</td>"+
              "</tr>"

    }
    return html
  }
  function Addenemy(arr) {
    let html ="";
    for(let i in arr){
      if(!arr[i]) continue
      html += "<tr class='enemy_row' id='"+i+"'>"+
              "<td class='enemy' id='"+arr[i].id+"' style='padding:0;"+
              (arr[i].Boss?'border:5px solid rgb(244, 89, 89)':'')+
              "'><img src='"+image_url_enemy+arr[i].id+
              ".png' style='width:100%'/></td>" ;
      html += screen.width > 768 ?(
            "<td id='multiple'>"+arr[i].multiple+"</td>"+
            "<td id='amount'>"+arr[i].amount+"</td>"+
            "<td id='castle'>"+arr[i].castle+"</td>"+
            "<td id='first_show'>"+arr[i].first_show+"</td>"+
            "<td id='next_time'>"+arr[i].next_time+"</td>"+
            "</tr>"):(
              "<td>"+arr[i].multiple+"</td>"+
              "<th>數量</th>"+"<td>"+arr[i].amount+"</td>"+
              "</tr><tr>"+
              "<th>出現條件</th>"+
              "<td colspan='3'>城體力小於<b>"+arr[i].castle+
              "</b></br>且開場已過<b>"+arr[i].first_show+"</b>秒後出現"+
              "</br>間隔<b>"+arr[i].next_time+"</b>秒後再次出現</td><tr>"
            )
    }
    return html
  }
  function Addlist(list) {
    let html = '';
    for(let i in list){
      if(list[i].public||list[i].owner == current_user_data.uid){
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
      'style="background-image:url(\''+image_url_cat+list[i].id+'.png\')"'+
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
      if($(this).attr("id")==s) name = $(this).html();
    });
    return name
  }
  function prize(s) {
    // console.log(s);
    if(s.indexOf("u")!=-1){
      return "<img src='"+image_url_cat+s.split("u")[1]+
      ".png' style='width:100%' class='cat' id='"+s.split("u")[1]+"' />"
    } else {
      return s
    }
  }
  function parseEXP(n) {
    n = n.split(",").join("");
    return Math.ceil(Number(n)*4.2);
  }
  $(document).on("click",".cat",function () {
    socket.emit("display cat",{
      uid : current_user_data.uid,
      cat : $(this).attr('id'),
      history : true
    });
    // location.assign("/view/cat.html");
    // window.parent.changeIframe('cat');
    window.parent.reloadIframe('cat');
  });
  $(document).on('click','.enemy',function () {
    let id = $(this).attr("id"),
        multiple = $(this).next().text().split("％")[0];

    socket.emit("display enemy",{
      uid : current_user_data.uid,
      id : $(this).attr('id'),
      history : true
    });
    socket.emit("store level",{
      uid : current_user_data.uid,
      id : $(this).attr('id'),
      lv : Number(multiple)/100,
      type : 'enemy'
    });
    // window.parent.changeIframe('enemy');
    window.parent.reloadIframe('enemy');

  });


  $(document).on('click','#enemy_head th',sortStageEnemy);
  function sortStageEnemy() {
    let name = $(this).attr('id');
    var arr = [] ;
    let flag = true ;
    $(this).css('border-top','5px solid rgb(59, 184, 246)')
            .siblings().css('border-top','0px solid');

    $(".enemy_row").each(function () {
      let obj = {},
          val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
      obj = {
        id:$(this).attr('id'),
        item: !val ? (val==0?0:99999) : val
      }
      arr.push(obj);
    });
    // console.log(name);
    // console.log(arr);
    for(let i=0;i<arr.length;i++){
      for(let j=i+1;j<arr.length;j++){
        if(arr[j].item<arr[i].item){
          $(".enemy_row[id='"+arr[i].id+"']").before( $(".enemy_row[id='"+arr[j].id+"']"));
          flag = false ;
        }
        arr = [] ;
        $(".enemy_row").each(function () {
          let obj = {},
              val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
          obj = {
            id:$(this).attr('id'),
            item: !val ? (val==0?0:99999) : val
          }
          arr.push(obj);
        });
      }
    }
    if(flag){
      $(this).css('border-top','5px solid rgb(246, 132, 59)')
              .siblings().css('border-top','0px solid');

      for(let i=0;i<arr.length;i++){
        for(let j=i+1;j<arr.length;j++){
          if(arr[j].item>arr[i].item){
            $(".enemy_row[id='"+arr[i].id+"']").before( $(".enemy_row[id='"+arr[j].id+"']"));
          }
          arr = [] ;
          $(".enemy_row").each(function () {
            let obj = {},
            val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
            obj = {
              id:$(this).attr('id'),
              item: !val ? (val==0?0:99999) : val
            }
            arr.push(obj);
          });
        }
      }
    }
  }

});
