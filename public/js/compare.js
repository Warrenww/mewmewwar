var CurrentUserID;
var current_compare = {};
var page = location.pathname.split("/compare")[1].toLowerCase();
$(document).ready(function () {
  var compare = [] ;
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
    CurrentUserID = data.uid;
    var _compare = page == 'cat'?data.compare_c2c:data.compare_e2e;
    if(_compare) {
      let buffer = [] ;
      for(let i in _compare){
        let id = _compare[i].id ;
        buffer.push(id);
      }
      socket.emit("required data",{
        uid:data.uid,
        type:page,
        target:buffer,
        record:false
      });
    }

  });
  socket.on("required data",(data)=>{
    console.log(data);
    if(data.buffer.length > 1){
      $(".comparedatabody").empty();
      for(let i in data.buffer){
        var _data = page == 'cat'?new Cat(data.buffer[i].data):new Enemy(data.buffer[i].data),
            lv = data.buffer[i].lv,
            bro = data.buffer[i].bro;
        current_compare[_data.id] = _data;
        $(".comparedatabody").append(AddCompareData(_data,lv,bro));
      }
    } else if(page =='cat'){
      var _data = new Cat(data.buffer[0].data),
          arr = data.buffer[0].bro,
          lv = data.buffer[0].lv,
          id = _data.id.substring(0,3),
          brr=[];
      current_compare[_data.id] = _data;
      $(".comparedata").each(function () {
        let a = $(this).attr("id").substring(0,3),
            _this = $(this);
        if(a == id) {
          $(AddCompareData(_data,lv,arr)).insertBefore(this);
          $(this).remove();
        }
      });
      $(".comparedata").each(function () {brr.push($(this).attr("id"))});
      socket.emit("compare cat",{id:CurrentUserID,target:brr});
      closePanel();
    } else return
    highlightTheBest();
  });
  $(document).on('click',"#level i",function () {
    let width = $(this).parent()[0].offsetWidth,
        top = $(this).parent().offset().top+$(this).parent()[0].offsetHeight,
        left = $(this).parent().offset().left,
        value = Number($(".panel").attr('value')),
        id = $(this).parents('.comparedata').attr("id"),
        panel_id = $(".panel").attr('id');
    $(".panel").css({
      width:width,
      top:top,
      left:left,
      height:id==panel_id?(value?0:100):100
    }).attr({
      id:$(this).parents('.comparedata').attr("id"),
      value:id==panel_id?(value?0:1):1
    });
    $(this).css('transform',function () {
      return Number($(".panel").attr('value'))?'rotate(180deg)':'rotate(0deg)'
    }).parents('.comparedata').siblings().each(function () {
      $(this).find("#level i").css('transform','rotate(0deg)');
    });
    $('.panel #switch').html("切換階級");
  });
  $(document).on("click",'.panel span',function () {
    let action = $(this).attr("id"),id = $('.panel').attr("id");
    if(action == 'del'){
      let arr = [];
      $(".comparedataholder").find("#"+id).remove();
      $(".comparedata").each(function () {
        let a = $(this).attr("id");
        if(a != id) arr.push(a);
      });
      socket.emit("compare "+page,{id:CurrentUserID,target:arr});
      closePanel();
    }
    else if(action == 'hide'){
      $(".comparedataholder").find("#"+id).hide(400);
      closePanel();
    }
    else if(action == 'switch'){
      let bro = $('.comparedataholder').find("#"+id).attr("bro").split(",");
      if(bro.length>1){
        let html = '';
        for(let i in bro) html+='<span id="'+bro[i]+'">'+bro[i].split("-")[1]+'階</span>';
        $(this).html(html);
      } else {
        socket.emit("required data",{
          uid:CurrentUserID,
          type:"cat",
          target:bro[0]
        });
      }
    }
    else {
      socket.emit("mark own",{
        uid:CurrentUserID,
        cat:id.substring(0,3),
        mark:true
      });
      closePanel();
    }
  });
  $(document).on('click','.panel #switch span',function () {
    socket.emit("required data",{
      uid:CurrentUserID,
      type:"cat",
      target:$(this).attr('id')
    });
  });

  $('.compareDisplay').on("scroll",closePanel);
  function closePanel() {
    $('.panel').css("height",0).attr('value',0);
    $("#level i").css("transform",'rotate(0deg)');
  }

  $(document).on('click','.comparedata img',function () {
    let id = $(this).parents('.comparedata').attr('id');
    socket.emit("set history",{
      type:page,
      target:id,
      uid:CurrentUserID
    });
    if(window.parent.reloadIframe){
      window.parent.reloadIframe(page);
      window.parent.changeIframe(page);
    } else {
      window.open("/"+page,"_blank");
    }
  });

  var input_org ;
  $(document).on('click',".comparedata #level span",function () {
    input_org = $(this).text();
    $(this).html('<input type="text" value="' +input_org+ '"></input>');
    $(this).find('input').select();
  });
  $(document).on('blur', '.comparedata #level input', changeCompareLevel);
  function changeCompareLevel() {
      let level = Number($(this).val()),
          id = $(this).parents('.comparedata').attr('id'),
          data = current_compare[id];

      if (validationLevel(level)) {
        $(this).parent().html(level+(page=='cat'?"":"%"));
        if (page == 'enemy') level /= 100;
        var change = ['hp','hardness','atk','dps'] ;
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
        $('.comparedatahead tr').attr("reverse","");
        socket.emit("store level",{
          uid : CurrentUserID,
          id : id,
          lv : level,
          type : page
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
      var arr = [];
      for(let i in current_compare)
        arr.push({id:i,item:Number(current_compare[i][name])});
      arr = quickSort(arr,'item');
      // console.log(name,arr);
      if(name == 'cd' || name == 'freq' || name == 'cost') {
        for(let i in arr) {
          if(arr[i].item != arr[0].item) break
          $("#"+arr[i].id).find("#"+name).attr('class','best');
        }
      }
      else {
        for(let i=arr.length-1;i>=0;i--) {
          if(arr[i].item != arr[arr.length-1].item) break
          $("#"+arr[i].id).find("#"+name).attr('class','best');
        }
      }
    });
  }
  $(document).on('click','.compareTable .comparedatahead th',sortCompare);
  var char_detail = 0 ;
  function sortCompare() {
    let name = $(this).attr("id"),
        arr = [],
        flag = $(this).parent().attr("reverse") ;
    if(name == 'char'){
      // console.log(current_compare);
      $(".comparedata").each(function () {
        // console.log(char_detail);
        let id = $(this).attr('id'),
        data = current_compare[id],
        lv = Number($(this).find("#level").children('span').text()),
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

  function AddCompareData(data,lv,bro) {
    let html = '';
    html +=
      "<div style='flex:1' class='comparedata' id='"+data.id+"' bro='"+bro+"'>"+
      "<table>"+
      "<tr>"+
      "<th id='level'><span>"+(page == 'cat'?lv:lv*100+"%")+"</span><i class='material-icons'>&#xe5c5;</i></th>"+
      "</tr><tr>"+
      "<th style='height:80px;padding:0'><img src='"+data.imgURL+"' style='height:100%'></th>"+
      "</tr><tr>"+
      "<th id='name'>"+data.Name+"</th>"+
      "</tr><tr>"+
      "<th id='"+(page == 'cat'?"rarity":"color")+"'>"+
      (page == 'cat'?parseRarity(data.rarity):data.color)+"</th>"+
      "</tr><tr>"+
      "<td id='hp'>"+data.Tovalue('hp',lv)+"</td>"+
      "</tr><tr>"+
      "<td id='KB'>"+data.kb+"</td>"+
      "</tr><tr>"+
      "<td id='hardness'>"+data.Tovalue('hardness',lv)+"</td>"+
      "</tr><tr>"+
      "<td id='atk'>"+data.Tovalue('atk',lv)+"</td>"+
      "</tr><tr>"+
      "<td id='dps'>"+data.Tovalue('dps',lv)+"</td>"+
      "</tr><tr>"+
      "<td id='range'>"+data.range+"</td>"+
      "</tr><tr>"+
      "<td id='freq'>"+data.freq+"</td>"+
      "</tr><tr>"+
      "<td id='speed'>"+data.speed+"</td>"+
      "</tr><tr>"+
      "<td id='multi'>"+data.Aoe+"</td>"+
      "</tr><tr>"+
      "<td id='cost'>"+(page == 'cat'?data.cost:data.reward)+"</td>"+
      "</tr>"+(page == 'cat'?
      "<tr><td id='cd'>"+data.cd+"</td></tr>":""
      )+"<tr>"+
      "<td id='char'>"+
      (char_detail?data.CharHtml(lv):(data.tag?data.tag.join("/"):"無"))+
      "</td>"+
      "</tr>"+
      "</table>"+
      "</div>";
      return html
  }

});
$(document).on("keydown",function (e) {
  // console.log(e.keyCode);
  var holder = $(".compareDisplay");
  if(e.keyCode == 39){ // right
    holder.animate({
      scrollLeft: holder.scrollLeft()+180
    });
  } else if(e.keyCode ==37){ // left
    holder.animate({
      scrollLeft: holder.scrollLeft()-180
    });
  }
});
function validationLevel(lv) {
  lv = Number(lv)
  if (!lv || lv <0) return false
  if (page == 'cat' && lv > 100) return false
  return true
}
