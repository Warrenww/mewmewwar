$(document).ready(function () {
  var timer = new Date().getTime();
  var filter_name = '' ;
  var socket = io.connect();
  var current_user_data = {};
  var current_level_data = {};

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",user);
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
      $(".select_chapter").children().first().before($(".select_chapter").find("#"+arr[0])[0]);
    }
    if(current_user_data.setting.show_more_option) $("#more_option").css("height",50);
    else $("#more_option").css("height",0);
  });

  var chapter = {
    p:{name : '實況野球</br>合作關卡',id : 'baseball',show : true},
    k:{name : '經驗關',id : 'XP',show : true},
    l:{name : '開眼小小貓',id : 'smallCat',show : true},
    j:{name : '狂亂系列',id : 'crazy',show : true},
    g:{name : '極難關',id : 'hard',show : true},
    b:{name : '傳說故事',id : 'story',show : true},
    m:{name : '旋渦關',id : 'cyclone',show : true},
    n:{name : '貓薄荷',id : 'evolution',show : true},
    o:{name : '城堡素材',id : 'castleMaterial',show : true},
    c:{name : '貓咪</br>風雲塔',id : 'tower',show : true},
    d:{name : '世界篇',id : 'world',show : true},
    e:{name : '未來篇',id : 'future',show : true},
    f:{name : '宇宙篇',id : 'universe',show : true},
    q:{name : '貓咪卷關卡',id : 'ticket',show : true},
    a:{name : '梅露可</br>合作關卡',id : 'maylook',show : true},
    h:{name : '月間關',id : 'month',show : false},
    i:{name : '開眼關',id : 'openEye',show : false},
  };
  let chapter_count = 0;
  for(let i in chapter) {
    $(".select_chapter").append(
        "<button id='"+chapter[i].id+
      "' value='0' show='"+chapter[i].show+"'>"
      +chapter[i].name+"</button>"
    ) ;
    chapter_count ++ ;
  }
  $(".select_chapter").css('width',200*chapter_count);
  var expend_sl_chap = 1 ;
  $("#expend_sl_chap").click(function () {
    $(".select_chapter").css('width',function () {
      if(expend_sl_chap) return "100%"
      else return 200*chapter_count
    });
    $("#expend_sl_chap i").css('transform',function () {
      if(expend_sl_chap) return "rotate(180deg)"
      else return "rotate(0deg)"
    })
    expend_sl_chap = expend_sl_chap?0:1;
  });

  $(document).on("click","#select_stage,#select_level",function () {
    $(this).css("flex",'3').siblings().css("flex",'1');
  });
  $(document).on("click",".select_chapter button",function () {
    let chapter = $(this).attr('id'),
        show = $(this).attr("show")=="true"?true:false;
    $(this).attr("value",'1');
    setTimeout(function () {
      $(".select_chapter button[value=1]").attr("value",0);
    },4000);
    $("#select_stage").empty();
    $("#select_level").empty();
    // console.log(chapter);
    $("#select_stage").attr("chapter",chapter);
    if(!show) alert("not yet ready");
    else socket.emit("required stage name",chapter);
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
    $(".dataTable").empty();
    html += "<tr>"+
            (screen.width > 768 ?
              "<td id='prev' query='"+JSON.stringify(prev_stage)+"'>"+
              "<i class='material-icons' style='transform:rotate(180deg)'>&#xe154;</i>上一關</td>"+
              "<td id='next' query='"+JSON.stringify(next_stage)+"'>下一關"+
              "<i class='material-icons'>&#xe154;</i></td>":"")+
            "<th>接關</th><td>"+(data.continue?"可以":"不行")+"</td>"+
            "<td colspan=2><a target='blank' href='http://battlecats-db.com/stage/"+
            (data.id).split("-")[1]+"-"+AddZero((data.id).split("-")[2])+".html'>在超絕攻略網打開<i class='material-icons'>insert_link</i></a></td></tr>";
    html += screen.width > 768 ?
            ( "<tr>"+
              "<th rowspan=2 colspan=1 id='chapter' value='"+obj.chapter+"'>"
              +chapterName(obj.chapter)+"</th>"+
              "<th rowspan=2 colspan=1 id='stage' value='"+obj.stage+"'>"
              +obj.parent+"</th>"+
              "<th rowspan=2 colspan=2>"+data.name+"</th>"+
              "<th>統帥力</th>"+"<td>"+data.energy+"</td>"+
              "</tr><tr>"+
              "<th>經驗值</th>"+"<td>"+data.exp+"</td>"+
              "</tr><tr>"+
              "<th>城堡體力</th>"+"<td>"+data.castle+"</td>"+
              "<th>戰線長度</th>"+"<td>"+data.length+"</td>"+
              "<th>敵人出擊限制</th>"+"<td>"+data.limit_no+"</td>"+
              "</tr><tr>"+
              "<th>我方出擊限制</th>"+"<td colspan='5'>"+(data.constrain?data.constrain:"無")+"</td>+"+
              "</tr><tr>"+
              "<th colspan=6>過關獎勵</th>"+
              "</tr><tr>"+Addreward(data.reward,data.integral)+
              "</tr><tr>"+
              "<th colspan=5>關卡敵人</th><th id ='AddToCompare'>加入比較序列</th>"+
              "</tr><tr>"+
              "<th>敵人</th><th class='enemy_head' id='multiple'>倍率</th>"+
              "<th class='enemy_head' id='amount'>數量</th>"+
              "<th class='enemy_head' id='castle'>城連動</th>"+
              "<th class='enemy_head' id='first_show'>首次出現(s)</th>"+
              "<th class='enemy_head' id='next_time'>再次出現(s)</th>"+
              "</tr><tr>"+Addenemy(data.enemy)+
              "</tr><tr>"+
              "</tr>" ):(
              "<tr>"+
              "<th colspan=1 id='chapter' value='"+obj.chapter+"'>"
              +chapterName(obj.chapter)+"</th>"+
              "<th colspan=1 id='stage' value='"+obj.stage+"'>"
              +obj.parent+"</th>"+
              "<th colspan=2>"+data.name+"</th>"+
              "</tr><tr>"+
              "<th>經驗值</th>"+"<td>"+data.exp+"</td>"+
              "<th>統帥力</th>"+"<td>"+data.energy+"</td>"+
              "</tr><tr>"+
              "<th>城堡體力</th>"+"<td colspan=3>"+data.castle+"</td>"+
              "</tr><tr>"+
              "<th>戰線長度</th>"+"<td colspan=3>"+data.length+"</td>"+
              "</tr><tr>"+
              "<th>敵方出擊限制</th>"+"<td colspan=3>"+data.limit_no+"</td>"+
              "</tr><tr>"+
              "<th>我方出擊限制</th>"+"<td colspan=3>"+(data.constrain?data.constrain:"無")+"</td>"+
              "</tr><tr>"+
              "<th colspan=4>過關獎勵</th>"+
              "</tr><tr>"+Addreward(data.reward,data.integral)+
              "</tr><tr>"+
              "<th colspan=6>關卡敵人</th>"+
              "</tr><tr>"+Addenemy(data.enemy)+
              "</tr>"
            ) ;

    $(".dataTable").append(html);
    // $(".display_BG").css('background-image','url(\"../public/css/footage/fight_BG_02.png\")');

    scroll_to_class('display',0);
  });
  $(document).on("click",'#prev,#next',function () {
    let data = JSON.parse($(this).attr('query'));
    console.log(data.level);
    if(data.level)
      socket.emit("required level data",{
        uid: current_user_data.uid,
        chapter:data.chapter,
        stage:data.stage,
        level:data.level
      });
  })
  $(document).on("click","#AddToCompare",function () {
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
    window.parent.changeIframe('compareEnemy');
    window.parent.reloadIframe('compareEnemy');
  });
  $(document).on("click",".dataTable #chapter",function () {
    scroll_to_div('selector');
    $(".select_chapter").find("button[id='"+$(this).attr('value')+"']").click();
  });
  $(document).on("click",".dataTable #stage",function () {
    let chapter = $(this).siblings("#chapter").attr("value"),
        stage = $(this).attr('value');
    socket.emit("required level name",{chapter:chapter,stage:stage});
  });
  function Addreward(arr,b) {
    // console.log(arr);
    let html ="";
    for(let i in arr){
      html += screen.width > 768 ?
              ( "<tr><th>"+prize(arr[i].prize.name)+"</th>"+
                "<td>"+arr[i].prize.amount+"</td>"
              ):(
                "<tr><th colspan=2>"+prize(arr[i].prize.name)+"</th>"+
                "<td colspan=2>"+arr[i].prize.amount+"</td></tr>"
              );
      html += "<th>"+(b?"累計積分":"取得機率")+"</th>"+"<td>"+arr[i].chance+"</td>"+
              "<th>取得上限</th>"+"<td>"+arr[i].limit+"</td>"+
              "</tr>"

    }
    return html
  }
  function Addenemy(arr) {
    let html ="";
    for(let i in arr){
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
              "</b>時</br>於<b>"+arr[i].first_show+"</b>秒後出現"+
              "</br>間隔<b>"+arr[i].next_time+"</b>秒後再次出現</td><tr>"
            )
    }
    return html
  }
  function chapterName(s) {
    for(let i in chapter){
       if (chapter[i].id == s) return chapter[i].name ;
    }
    return
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
  $(document).on("click",".cat",function () {
    socket.emit("display cat",{
      uid : current_user_data.uid,
      cat : $(this).attr('id'),
      history : true
    });
    // location.assign("/view/cat.html");
    window.parent.changeIframe('cat');
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
    window.parent.changeIframe('enemy');
    window.parent.reloadIframe('enemy');

    // $("body").append(
    //   "<div class='float'><iframe src='"+
    //   location.origin+"/view/once.html?q=enemy&"+
    //   id+"&"+multiple+"'></iframe></div>"
    // );
    // $(".float_BG").fadeIn();
    // $(".float_BG").click(function () {
    //   $(this).fadeOut();
    //   $(".float").remove();
    // });
  });


  $('.select_chapter_holder').bind('mousewheel', function (e) {
    let origin = $(".select_chapter_holder").scrollLeft();
    $(".select_chapter_holder").scrollLeft(origin-e.originalEvent.wheelDelta);
    return false;
  });

  $(document).on('click','.enemy_head',sortStageEnemy);
  function sortStageEnemy() {
    let name = $(this).attr('id');
    var arr = [] ;
    let flag = true ;
    $(this).css('border-top','5px solid rgb(246, 132, 59)')
            .siblings().css('border-top','0px solid');

    $(".enemy_row").each(function () {
      let obj = {},
          val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
      obj = {
        id:$(this).attr('id'),
        item: !val ? 99999 : val
      }
      arr.push(obj);
    });
    // console.log(name);
    // console.log(arr);
    for(let i=0;i<arr.length;i++){
      for(let j=i+1;j<arr.length;j++){
        if(arr[j].item>arr[i].item){
          $(".enemy_row[id='"+arr[i].id+"']").before( $(".enemy_row[id='"+arr[j].id+"']"));
          flag = false ;
        }
        arr = [] ;
        $(".enemy_row").each(function () {
          let obj = {},
              val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
          obj = {
            id:$(this).attr('id'),
            item:!val?99999:val
          }
          arr.push(obj);
        });
      }
    }
    if(flag){
      $(this).css('border-top','5px solid rgb(59, 184, 246)')
              .siblings().css('border-top','0px solid');

      for(let i=0;i<arr.length;i++){
        for(let j=i+1;j<arr.length;j++){
          if(arr[j].item<arr[i].item){
            $(".enemy_row[id='"+arr[i].id+"']").before( $(".enemy_row[id='"+arr[j].id+"']"));
          }
          arr = [] ;
          $(".enemy_row").each(function () {
            let obj = {},
            val = Number($(this).find("#"+name).text().split("％")[0].split("~")[0]);
            obj = {
              id:$(this).attr('id'),
              item:!val?99999:val
            }
            arr.push(obj);
          });
        }
      }
    }
  }

});

function sleep(n) {
  let start = now = new Date().getTime();
  while (now-start<n) {
    now = new Date().getTime()
  }
  return
}
