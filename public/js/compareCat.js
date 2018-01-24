$(document).ready(function () {
  const image_url =  "../public/css/footage/cat/u" ;
  var compare = [] ;
  var socket = io.connect();
  var current_user_data = {};

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",user);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    if(data.compare_c2c) {
      let buffer = [] ;
      for(let i in data.compare_c2c){
        let id = data.compare_c2c[i].id ;
        buffer.push(id);
      }
      socket.emit("start compare c2c",{id:data.uid,target:buffer});
    }
  });

  socket.on("c2c compare", function (compare){
    $(".compareTable").append(
      "<div class='comparedatahead'>"+
      "<table>"+
      "<tr>"+"<th>Level</th>"+
      "</tr><tr>"+"<th style='height:80px;'>Picture</th>"+
      "</tr><tr>"+"<th id='name'>全名</th>"+
      "</tr><tr>"+"<th id='hp'>體力</th>"+
      "</tr><tr>"+"<th id='kb'>KB</th>"+
      "</tr><tr>"+"<th id='hardness'>硬度</th>"+
      "</tr><tr>"+"<th id='atk'>攻擊力</th>"+
      "</tr><tr>"+"<th id='DPS'>DPS</th>"+
      "</tr><tr>"+"<th id='range'>射程</th"+
      "</tr><tr>"+"<th id='freq'>攻頻</th>"+
      "</tr><tr>"+"<th id='speed'>跑速</th>"+
      "</tr><tr>"+"<th id='multi'>範圍</th>"+
      "</tr><tr>"+"<th id='cost'>花費</th>"+
      "</tr><tr>"+"<th id='cd'>再生産</th>"+
      "</tr><tr>"+"<th id='char'>特性</th>"+
      "</tr>"+"</table>"+"</div>"+
      "<div class='comparedataholder'>"+
      "<div style='display:flex' class='comparedatabody'></div>"
      +"</div>"

    );
    for(let i in compare){
      let data = new Cat(compare[i].data),
          lv = compare[i].lv;
      // console.log(data);
      $(".comparedatabody").append(
        "<div style='flex:1' class='comparedata' id='"+data.id+"'>"+
        "<table>"+
        "<tr>"+
        "<th id='level'>"+lv+"</th>"+
        "</tr><tr>"+
        "<th style='height:80px;padding:0'><img src='"+data.imgURL+"' style='height:100%'></th>"+
        "</tr><tr>"+
        "<th id='name'>"+data.Name+"</th>"+
        "</tr><tr>"+
        "<td id='hp'>"+data.Tovalue('hp',lv)+"</td>"+
        "</tr><tr>"+
        "<td id='KB'>"+data.kb+"</td>"+
        "</tr><tr>"+
        "<td id='hardness'>"+data.Tovalue('hardness',lv)+"</td>"+
        "</tr><tr>"+
        "<td id='atk'>"+data.Tovalue('atk',lv)+"</td>"+
        "</tr><tr>"+
        "<td id='DPS'>"+data.Tovalue('dps',lv)+"</td>"+
        "</tr><tr>"+
        "<td id='range'>"+data.range+"</td>"+
        "</tr><tr>"+
        "<td id='freq'>"+data.Freq+"</td>"+
        "</tr><tr>"+
        "<td id='speed'>"+data.speed+"</td>"+
        "</tr><tr>"+
        "<td id='multi'>"+data.Aoe+"</td>"+
        "</tr><tr>"+
        "<td id='cost'>"+data.cost+"</td>"+
        "</tr><tr>"+
        "<td id='cd'>"+data.cd+"</td>"+
        "</tr><tr>"+
        "<td id='char'>"+data.CharHtml(lv)+"</td>"+
        "</tr>"+
        "</table>"+
        "</div>"
      );
    }
    highlightTheBest();
  });

  var input_org ;
  $(document).on('click',".comparedata #level",function () {
    input_org = $(this).text();
    $(this).html('<input type="text" value="' +input_org+ '"></input>');
    $(this).find('input').select();
  });
  $(document).on('blur', '.comparedata #level input', changeCompareLevel);
  function changeCompareLevel() {
      let level = Number($(this).val());
      let rarity = $(this).parent().attr('rarity');
      let id = $(this).parents('.comparedata').attr('id');

      if (level && level < 101 && level > 0) {
        $(this).parent().html(level);
        let change = ['hp','hardness','atk','DPS'] ;
        for(let i in change){
          let target = $('.compareTable #'+id).find('#'+change[i]) ;
          let original = target.attr('original');
          target.html(levelToValue(original,rarity,level).toFixed(0))
                .css('background-color',' rgba(242, 213, 167, 0.93)');
          setTimeout(function () {
            target.css('background-color','rgba(255, 255, 255, .9)');
          },500);
        }
        let target = $('.compareTable #'+id).find('#char'),
            original = target.attr('original'),
            atk = target.attr('atk');
        if(original && original.indexOf("連續攻擊") != -1) target.html(serialATK(original,levelToValue(atk,rarity,level)))
        highlightTheBest();
        $('.comparedatahead').find('th').css('border-left','0px solid');
      }
      else $(this).parent().html(input_org);
  }
  function highlightTheBest() {
    $('.comparedata').find('td').removeClass('best');
    $('.comparedatahead tbody').children().each(function () {
      let name = $(this).children().attr("id");
      if(!name||name==undefined) return ;
      // console.log(name);
      if(name == 'multi'){
        $(".comparedata").each(function () {
          if($(this).find("#"+name).text() == '範圍') $(this).find("#"+name).attr('class','best') ;
        });
        return ;
      }
      let arr = [];
      let max = [],
          min = [];
      let max_val = -1,
          min_val = 1e10 ;

      $(".comparedata").each(function () {
        let obj = {};
        obj = {
          id:$(this).attr('id'),
          item:Number($(this).find("#"+name).text())
        }
        arr.push(obj);
      });
      // console.log(arr);
      for(let i in arr) {
        if(arr[i].item > max_val) {
          max_val = arr[i].item ;
          max = [arr[i]];
        }
        if(arr[i].item < min_val) {
          min_val = arr[i].item ;
          min = [arr[i]];
        }
        if(arr[i].item == max_val) max.push(arr[i]) ;
        if(arr[i].item == min_val) min.push(arr[i]) ;
      }
      // console.log(name);
      // console.log(max);
      // console.log(min);
      if(name == 'cd' || name == 'freq' || name == 'cost') {
        for(let i in min) $("#"+min[i].id).find("#"+name).attr('class','best');
      }
      else for(let i in max) $("#"+max[i].id).find("#"+name).attr('class','best');
      // $(".compareTable").children("#"+min.id).find("#"+name).css('color','rgb(82, 174, 219)');
    });
  }
  $(document).on('click','.compareTable .comparedatahead th',sortCompareCat);
  function sortCompareCat() {
    let name = $(this).attr("id");
    var arr = [] ;
    let flag = true ;
    if(name == 'Picture' || name == 'name' ||name == 'char' || name =='multi' || name == 'KB') return ;
    $(this).css('border-left','5px solid rgb(246, 132, 59)')
            .parent().siblings().children().css('border-left','0px solid');

    $(".comparedata").each(function () {
      let obj = {};
      obj = {
        id:$(this).attr('id'),
        item:Number($(this).find("#"+name).text())
      }
      arr.push(obj);
    });
    // console.log(name);
    console.log(arr);
    for(let i=0;i<arr.length;i++){
      for(let j=i+1;j<arr.length;j++){
        if(arr[j].item>arr[i].item){
          $(".comparedatabody").children('#'+arr[i].id).before( $(".comparedatabody").children('#'+arr[j].id));
          flag = false ;
        }
        arr = [] ;
        $(".comparedata").each(function () {
          let obj = {};
          obj = {
            id:$(this).attr('id'),
            item:Number($(this).find("#"+name).text())
          }
          arr.push(obj);
        });
      }
    }
    if(flag){
      $(this).css('border-left','5px solid rgb(59, 184, 246)')
              .parent().siblings().children().css('border-left','0px solid');

      for(let i=0;i<arr.length;i++){
        for(let j=i+1;j<arr.length;j++){
          if(arr[j].item<arr[i].item){
            $(".comparedatabody").children('#'+arr[i].id).before( $(".comparedatabody").children('#'+arr[j].id));
          }
          arr = [] ;
          $(".comparedata").each(function () {
            let obj = {};
            obj = {
              id:$(this).attr('id'),
              item:Number($(this).find("#"+name).text())
            }
            arr.push(obj);
          });
        }
      }
    }
  }

  $(document).on("click","#snapshot",function () {
    let target = $(".compareTable");
    let max_height = -10;
    $(".comparedata").each(function () {
      let height = $(this).children("table")[0].offsetHeight
      if(height > max_height) max_height = height ;
    });
    console.log(max_height);
    target.css("height",max_height);
    target = target[0];
    snapshot(target);
  });
  var nav_timeout ;
  $("#nav_main").hover(function () {
    $(this).siblings().fadeIn().css("display",'flex');
    $("#nav_zoom_in").css("transform","translate(-77.28px,-20.72px)");
    $("#nav_zoom_out").css("transform","translate(-56.57px,56.57px)");
    $("#nav_org").css("transform","translate(20.72px,77.28px)");
  },function () {
    nav_timeout = setTimeout(function () {hideZoom()},3000);
  });
  $(".compareNav div[id!='nav_main']").hover(function () {
    clearTimeout(nav_timeout);
  },function () {
    nav_timeout = setTimeout(function () {hideZoom()},1500);
  });
  function hideZoom() {
    $("#nav_zoom_in").css("transform","translate(0px,0px)").fadeOut();
    $("#nav_zoom_out").css("transform","translate(0px,0px)").fadeOut();
    $("#nav_org").css("transform","translate(0px,0px)").fadeOut();
  }
  var scale = 1 ;
  $(document).on('click','.compareNav div',function () {
    let type = $(this).attr("id").split("nav_")[1];
    if(type == 'zoom_in'){
      scale = scale>1.5?scale:scale+.1;
    } else if(type == 'zoom_out'){
      scale = scale<.11?scale:scale-.1;
    } else if(type == 'org') scale = 1 ;
    $(".compareTable").css('transform','scale('+scale+','+scale+')');
  });
});
