$(document).ready(function () {
  const image_url =  "public/css/footage/cat/u" ;
  var compare = [] ;
  var socket = io.connect();
  var current_user_data = {};

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
    if(data.compare_c2c) {
      let buffer = [] ;
      for(let i in data.compare_c2c){
        let id = data.compare_c2c[i].id ;
        buffer.push(id);
      }
      socket.emit("start compare c2c",buffer);
    }
  });

  socket.on("c2c compare", function (compare){
    $(".compareTable").append(
      "<div class='comparedatahead'>"+
      "<table>"+
      "<tr>"+"<th>Level</th>"+
      "</tr><tr>"+"<th style='height:80px;'>Picture</th>"+
      "</tr><tr>"+"<th>全名</th>"+
      "</tr><tr>"+"<th>體力</th>"+
      "</tr><tr>"+"<th>KB</th>"+
      "</tr><tr>"+"<th>硬度</th>"+
      "</tr><tr>"+"<th>攻擊力</th>"+
      "</tr><tr>"+"<th>DPS</th>"+
      "</tr><tr>"+"<th>射程</th"+
      "</tr><tr>"+"<th>攻頻</th>"+
      "</tr><tr>"+"<th>跑速</th>"+
      "</tr><tr>"+"<th>範圍</th>"+
      "</tr><tr>"+"<th>花費</th>"+
      "</tr><tr>"+"<th>再生産</th>"+
      "</tr><tr>"+"<th>特性</th>"+
      "</tr>"+"</table>"+"</div>"+
      "<div class='comparedataholder'>"+
      "<div style='display:flex' class='comparedatabody'></div>"
      +"</div>"

    );
    for(let i in compare){
      let data = compare[i];
      // console.log(data);
      $(".comparedatabody").append(
        "<div style='flex:1' class='comparedata' id='"+data.id+"'>"+
        "<table>"+
        "<tr>"+
        "<th id='level' rarity='"+data.稀有度+"'>30</th>"+
        "</tr><tr>"+
        "<th style='height:80px;padding:0'><img src='"+
        image_url+compare[i].id+'.png'+
        "' style='height:100%'></th>"+
        "</tr><tr>"+
        "<th id='全名'>"+data.全名+"</th>"+
        "</tr><tr>"+
        "<td id='體力' original='"+data.lv1體力+"'>"+levelToValue(data.lv1體力,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='KB'>"+data.kb+"</td>"+
        "</tr><tr>"+
        "<td id='硬度' original='"+data.lv1硬度+"'>"+levelToValue(data.lv1硬度,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='攻擊力' original='"+data.lv1攻擊+"'>"+levelToValue(data.lv1攻擊,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='DPS' original='"+data.lv1dps+"'>"+levelToValue(data.lv1dps,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='射程'>"+data.射程+"</td>"+
        "</tr><tr>"+
        "<td id='攻頻'>"+data.攻頻.toFixed(1)+"</td>"+
        "</tr><tr>"+
        "<td id='跑速'>"+data.速度+"</td>"+
        "</tr><tr>"+
        "<td id='範圍'>"+data.範圍+"</td>"+
        "</tr><tr>"+
        "<td id='花費'>"+data.花費+"</td>"+
        "</tr><tr>"+
        "<td id='再生産'>"+data.再生産.toFixed(1)+"</td>"+
        "</tr><tr>"+
        "<td id='特性' "+
        (data.特性.indexOf("連續攻擊") != -1 ?
        "original='"+data.特性+"' atk='"+data.lv1攻擊+"'>"+
        serialATK(data.特性,levelToValue(data.lv1攻擊,data.稀有度,30)) :
        ">"+data.特性
        )+
        "</td>"+
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
        let change = ['體力','硬度','攻擊力','DPS'] ;
        for(let i in change){
          let target = $('.compareTable #'+id).find('#'+change[i]) ;
          let original = target.attr('original');
          target.html(levelToValue(original,rarity,level).toFixed(0))
                .css('background-color',' rgba(242, 213, 167, 0.93)');
          setTimeout(function () {
            target.css('background-color','rgba(255, 255, 255, .9)');
          },500);
        }
        let target = $('.compareTable #'+id).find('#特性'),
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
      let name = $(this).text();
      if(name == 'Picture' || name == '全名' ||name == '特性' || name == 'KB' || name == 'Level') return ;
      // console.log(name);
      if(name == '範圍'){
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
      if(name == '再生産' || name == '攻頻' || name == '花費') {
        for(let i in min) $("#"+min[i].id).find("#"+name).attr('class','best');
      }
      else for(let i in max) $("#"+max[i].id).find("#"+name).attr('class','best');
      // $(".compareTable").children("#"+min.id).find("#"+name).css('color','rgb(82, 174, 219)');
    });
  }
  $(document).on('click','.compareTable .comparedatahead th',sortCompareCat);
  function sortCompareCat() {
    let name = $(this).text();
    var arr = [] ;
    let flag = true ;
    if(name == 'Picture' || name == '全名' ||name == '特性' || name =='範圍' || name == 'KB') return ;
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
});
