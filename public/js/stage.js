$(document).ready(function () {
  var timer = new Date().getTime();
  var compare = [] ;
  var setting = {
        compare_max : 4 ,
        display_id : false
      } ;
  var filter_name = '' ;
  const image_url =  "../public/css/footage/cat/u" ;
  var socket = io.connect();
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connet",user);
    } else {
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    if(data.last_stage){
      let last_stage = data.last_stage,
          arr = last_stage.split("-");
      socket.emit("required level data",{chapter:arr[0],stage:arr[1],level:arr[2]});
      socket.emit("required stage name",arr[0]);
      $('#select_stage').attr("chapter",arr[0]);
      $('#select_level').attr("stage",arr[1]);
      socket.emit("required level name",{chapter:arr[0],stage:arr[1]});
    }
  });

  var chapter = ['世界篇','未來篇','宇宙篇','傳說故事','極難關','月間關','開眼關','貓咪</br>風雲塔'] ;
  var chapter_id = ['world','future','universe','story','hard','month','openEye','tower'] ;
  for(let i in chapter) $(".select_chapter").append("<button id='"+chapter_id[i]+"' value='0'>"+chapter[i]+"</button>") ;
  $(".select_chapter").css('width',200*chapter.length)

  $(document).on("click","#select_stage,#select_level",function () {
    $(this).css("flex",'3').siblings().css("flex",'1');
  });

  $(document).on("click",".select_chapter button",function () {
    let chapter = $(this).attr('id');
    $(this).attr("value",'1');
    setTimeout(function () {
      $(".select_chapter button[value=1]").attr("value",0);
    },4000);
    console.log(chapter);
    $("#select_stage").attr("chapter",chapter);
    if(chapter != 'story' && chapter != 'tower') alert("not yet ready");
    else socket.emit("required stage name",chapter);
  });
  socket.on("stage name",function (data) {
    console.log(data);
    $("#select_stage").empty();
    for( let i in data )
      $("#select_stage").append(
        "<button value='0' style='width:180px;height:40px;margin:5px' id='"+data[i].id+"'>"+data[i].name+"</button>"
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
    console.log(chapter+">"+stage);
    socket.emit("required level name",{chapter:chapter,stage:stage});
    let timeout = 0;
    if($(this).parent().css("flex") == '3 1 0%') timeout = 800;
    setTimeout(function () {
      $('#select_stage').animate({
        scrollTop : $('#select_stage button[value="1"]')[0].offsetTop-500
      },800,'easeInOutCubic');
    },timeout);
  });
  socket.on("level name",function (data) {
    console.log(data);
    $("#select_level").empty();
    for( let i in data )
      $("#select_level").append(
        "<span class='card'style='"+
        "background-image:url(\"../public/css/footage/fight_BG_0"+
        (Math.ceil(Math.random()*5))+".png\")"+
        "' id='"+data[i].id+"'>"+data[i].name+"</span>"
      ).css("flex","3").siblings().css("flex","1");
  });
  $(document).on("click","#select_level .card",function (e) {
    e.stopPropagation();
    let level = $(this).attr('id'),
        stage = $(this).parent().attr('stage'),
        chapter = $(this).parent().siblings().attr('chapter');
    console.log(chapter+">"+stage+">"+level);
    socket.emit("required level data",{chapter:chapter,stage:stage,level:level});
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'stage',
      id : chapter+"-"+stage+"-"+level
    });
  });
  socket.on("level data",function (obj) {
    console.log(obj);
    let html = "",
        data = obj.data;
    $(".dataTable").empty();
    html += "<tr>"+
            (screen.width > 768 ?"<td colspan=2 style='background:transparent'></td>":"")+
            "<th>接關</th><td>"+(data.continue?"可以":"不行")+"</td>"+
            "<td colspan=2><a target='blank' href='http://battlecats-db.com/stage/"+
            data.id+".html'>在超絕攻略網打開<i class='material-icons'>insert_link</i></a></td></tr>";
    html += screen.width > 768 ?
            ( "<tr>"+
              "<th rowspan=2 colspan=1>"+chapterName(data.id)+"</th>"+
              "<th rowspan=2 colspan=1>"+obj.parent+"</th>"+
              "<th rowspan=2 colspan=2>"+data.name+"</th>"+
              "<th>統帥力</th>"+"<td>"+data.energy+"</td>"+
              "</tr><tr>"+
              "<th>經驗值</th>"+"<td>"+data.exp+"</td>"+
              "</tr><tr>"+
              "<th>城堡體力</th>"+"<td>"+data.castle+"</td>"+
              "<th>戰線長度</th>"+"<td>"+data.length+"</td>"+
              "<th>出擊限制</th>"+"<td>"+data.limit_no+"</td>"+
              "</tr><tr>"+
              "<th colspan=6>過關獎勵</th>"+
              "</tr><tr>"+Addreward(data.reward)+
              "</tr><tr>"+
              "<th colspan=6>關卡敵人</th>"+
              "</tr><tr>"+
              "<th>敵人</th><th>倍率</th><th>數量</th>"+
              "<th>城連動</th><th>首次出現(s)</th><th>再次出現(s)</th>"+
              "</tr><tr>"+Addenemy(data.enemy)+
              "</tr><tr>"+
              "</tr>" ):(
              "<tr>"+
              "<th colspan=1>"+chapterName(data.id)+"</th>"+
              "<th colspan=1>"+obj.parent+"</th>"+
              "<th colspan=2>"+data.name+"</th>"+
              "</tr><tr>"+
              "<th>經驗值</th>"+"<td>"+data.exp+"</td>"+
              "<th>統帥力</th>"+"<td>"+data.energy+"</td>"+
              "</tr><tr>"+
              "<th>城堡體力</th>"+"<td colspan=3>"+data.castle+"</td>"+
              "</tr><tr>"+
              "<th>戰線長度</th>"+"<td colspan=3>"+data.length+"</td>"+
              "</tr><tr>"+
              "<th>出擊限制</th>"+"<td colspan=3>"+data.limit_no+"</td>"+
              "</tr><tr>"+
              "<th colspan=4>過關獎勵</th>"+
              "</tr><tr>"+Addreward(data.reward)+
              "</tr><tr>"+
              "<th colspan=6>關卡敵人</th>"+
              "</tr><tr>"+Addenemy(data.enemy)+
              "</tr>"
            ) ;

    $(".dataTable").append(html);
    // $(".display_BG").css('background-image','url(\"../public/css/footage/fight_BG_02.png\")');

    scroll_to_class('display',0);
  });
  function Addreward(arr) {
    let html ="";
    for(let i in arr){
      html += screen.width > 768 ?
              ( "<tr><th>"+prize(arr[i].prize.name)+"</th>"+
                "<td>"+arr[i].prize.amount+"</td>"
              ):(
                "<tr><th colspan=2>"+prize(arr[i].prize.name)+"</th>"+
                "<td colspan=2>"+arr[i].prize.amount+"</td></tr>"
              );
      html += "<th>取得機率</th>"+"<td>"+arr[i].chance+"</td>"+
              "<th>取得上限</th>"+"<td>"+arr[i].limit+"</td>"+
              "</tr>"

    }
    return html
  }
  function Addenemy(arr) {
    let html ="";
    for(let i in arr){
      html += "<tr>"+
              "<td class='enemy' id='"+arr[i].id+"' style='padding:0;"+
              (arr[i].Boss?'border:5px solid rgb(244, 89, 89)':'')+
              "'><img src='"+image_url_enemy+arr[i].id+
              ".png' style='width:100%'/></td>" ;
      html += screen.width > 768 ?(
            "<td>"+arr[i].multiple+"</td>"+
            "<td>"+arr[i].amount+"</td>"+
            "<td>"+arr[i].castle+"</td>"+
            "<td>"+arr[i].first_show+"</td>"+
            "<td>"+arr[i].next_time+"</td>"+
            "</tr>"):(
              "<td>"+arr[i].multiple+"</td>"+
              "<th>數量</th>"+"<td>"+arr[i].amount+"</td>"+
              "</tr><tr>"+
              "<th>出現條件</th>"+
              "<td>城體力<"+arr[i].castle+"</td>"+
              "<td>"+arr[i].first_show+"秒後出現</td>"+
              "<td>間隔"+arr[i].next_time+"秒後出現</td><tr>"
            )
    }
    return html
  }
  function chapterName(s) {
    let c = s.split("-")[0],
        d = chapter_id.indexOf(c);
    return chapter[d]
  }
  function prize(s) {
    switch (s) {
      case 'expression':

        break;
      default:
        return s
    }
  }
  $(document).on('click','.enemy',function () {
    let id = $(this).attr("id"),
        multiple = $(this).next().text().split("％")[0];
    // socket.emit("user Search",{
    //   uid : current_user_data.uid,
    //   type : 'enemy',
    //   id : id
    // });
    // location.assign("/view/enemy.html");
    // location.assign("/view/once.html?q=enemy&"+id+"&"+multiple);
    $("body").append(
      "<div class='float'><iframe src='"+
      location.origin+"/view/once.html?q=enemy&"+
      id+"&"+multiple+"'></iframe></div>"
    );
    $(".float_BG").fadeIn();
    $(".float_BG").click(function () {
      $(this).fadeOut();
      $(".float").remove();
    });
  });


  $('.select_chapter_holder').bind('mousewheel', function (e) {
    let origin = $(".select_chapter_holder").scrollLeft();
    $(".select_chapter_holder").scrollLeft(origin-e.originalEvent.wheelDelta);
    return false;
  });


});


function sleep(n) {
  let start = now = new Date().getTime();
  while (now-start<n) {
    now = new Date().getTime()
  }
  return
}
