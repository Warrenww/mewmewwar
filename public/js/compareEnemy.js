var CurrentUserID;
$(document).ready(function () {
  var compare = [] ;

  var current_compare_enemy = {};

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    // console.log(data);
    CurrentUserID = data.uid;
    if(data.compare_e2e) {
      let buffer = [] ;
      for(let i in data.compare_e2e){
        let id = data.compare_e2e[i].id ;
        buffer.push(id);
      }
      // socket.emit("start compare e2e",{id:data.uid,target:buffer});
      socket.emit("required data",{
        type:"enemy",
        target:buffer,
        record:false,
        uid:data.uid
      });
    }
  });

  socket.on("required data",(compare)=>{
    compare = compare.buffer;
    // console.log(compare);
    if(compare.length == 1) return
    $(".comparedatabody").empty();
    for(let i in compare){
      let data = new Enemy(compare[i].data),
          lv = compare[i].lv;
      // console.log(data);
      current_compare_enemy[data.id] = data;
      $(".comparedatabody").append(AddCompareData(data,lv));
    }
    highlightTheBest();
  });
  $(document).on('click','.comparedata img',function () {
    let id = $(this).parents('.comparedata').attr('id');
    socket.emit("set history",{
      type:'enemy',
      target:id,
      uid:CurrentUserID
    });
    window.parent.reloadIframe('enemy');
    window.parent.changeIframe('enemy');
  });

  var input_org ;
  $(document).on('click',".comparedata #level",function () {
    input_org = $(this).text();
    $(this).html('<input type="number" value="' +input_org.split("%")[0]+ '"></input>');
    $(this).find('input').select();
  });
  $(document).on('blur', '.comparedata #level input', changeCompareLevel);
  function changeCompareLevel() {
      let level = (Number($(this).val())/50).toFixed(0)*50,
          id = $(this).parents('.comparedata').attr('id'),
          data = current_compare_enemy[id];

      if ( level > 0) {
        $(this).parent().html(level+"%");
        let change = ['hp','hardness','atk','DPS'] ;
        level /= 100;
        for(let i in change){
          let target = $('.compareTable #'+id).find('#'+change[i]) ;
          let original = target.attr('original');
          target.html(data.Tovalue(change[i],level))
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
        socket.emit("store level",{
          uid : CurrentUserID,
          id : id,
          lv : level,
          type : 'enemy'
        });
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
  $(document).on('click','.compareTable .comparedatahead th',sortCompareEnemy);
  var char_detail = 0 ;
  function sortCompareEnemy() {
    let name = $(this).attr("id");
    var arr = [] ;
    let flag = true ;
    if(name == 'char'){
      $(".comparedata").each(function () {
        // console.log(char_detail);
        let id = $(this).attr('id'),
        data = current_compare_enemy[id],
        lv = Number($(this).find("#level").text())/100,
        char = data.CharHtml(lv),
        tag = data.tag?data.tag.join("/"):"無";
        $(this).find("#char").html(char_detail?tag:char);
      });
      char_detail = char_detail?0:1;
      return
    }
    if(name == 'Picture' || name == 'name' || name =='multi' || name == 'KB') return ;

        $(".comparedata").each(function () {
          let obj = {};
          obj = {
            id:$(this).attr('id'),
            item:Number($(this).find("#"+name).text())
          }
          arr.push(obj);
        });
        arr = quickSort(arr,'item');
        // console.log(arr);
        if(flag != 'increase'){
          for(let i=arr.length-1;i>=0;i--) $(".comparedatabody").append($(".comparedata[id='"+arr[i].id+"']"));
          $(this).parent().attr('reverse','increase').siblings().attr('reverse','');
        } else {
          for(let i=0;i<arr.length;i++) $(".comparedatabody").append($(".comparedata[id='"+arr[i].id+"']"));
          $(this).parent().attr('reverse','decrease').siblings().attr('reverse','');
        }
  }

  $(document).on("click","#snapshot",function () {
    let target = $(".compareTable");
    let max_height = -10;
    $(".comparedata").each(function () {
      let height = $(this).children("table")[0].offsetHeight
      if(height > max_height) max_height = height ;
    });
    // console.log(max_height);
    target.css("height",max_height);
    target = target[0];
    snapshot(target);
  });
  var nav_timeout ;
  $(".side_bar").hover(function () {
    let i = 1 ;
    $(this).children().each(function () {
      $(this).animate({right:0},100*i);
      i++
    });
  },function () {
    hideZoom()
  });
  function hideZoom() {
    let i = 1 ;
    $('.side_bar').children().each(function () {
      $(this).animate({right:-100},100*i);
      i++
    });
  }
  var scale = 1 ;
  $(document).on('click','.floatbutton',function () {
    let type = $(this).attr("id");
    if(type == 'nav_zoom_in'){
      scale = scale>1.5?scale:scale+.1;
    } else if(type == 'nav_zoom_out'){
      scale = scale<.11?scale:scale-.1;
    } else if(type == 'nav_org') scale = 1 ;
    else if(type == 'showall'){
      $('.comparedata').show(400);
    }
    $(".compareTable").css('transform','scale('+scale+','+scale+')');
  });

  function AddCompareData(data,lv) {
    let html = '';
    html +=
    "<div style='flex:1' class='comparedata' id='"+data.id+"'>"+
    "<table>"+
    "<tr>"+
    "<th id='level'>"+lv*100+"%</th>"+
    "</tr><tr>"+
    "<th style='height:80px;padding:0'><img src='"+data.imgURL+"' style='height:100%'></th>"+
    "</tr><tr>"+
    "<th id='name'>"+data.Name+"</th>"+
    "</tr><tr>"+
    "<th id='color'>"+data.color+"</th>"+
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
    "<td id='freq'>"+data.freq+"</td>"+
    "</tr><tr>"+
    "<td id='speed'>"+data.speed+"</td>"+
    "</tr><tr>"+
    "<td id='multi'>"+data.Aoe+"</td>"+
    "</tr><tr>"+
    "<td id='cost'>"+data.reward+"</td>"+
    "</tr><tr>"+
    "<td id='char'>"+
    (char_detail?data.CharHtml(lv):(data.tag?data.tag.join("/"):"無"))+
    "</td>"+
    "</tr>"+
    "</table>"+
    "</div>";
    return html
  }
});
