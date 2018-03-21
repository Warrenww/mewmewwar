$(document).ready(function () {
  var compare = [] ;
  var socket = io.connect();
  var current_user_data = {},
      current_compare_cat = {};

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    // console.log(data);
    current_user_data = data;
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
    $(".comparedatabody").empty();
    for(let i in compare){
      let data = new Cat(compare[i].data),
          lv = compare[i].lv,
          bro = compare[i].bro;
      // console.log(data);
      current_compare_cat[data.id] = data;
      $(".comparedatabody").append(AddCompareData(data,lv,bro));
    }
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
      socket.emit("compare cat",{id:current_user_data.uid,target:arr});
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
        socket.emit("display cat",{
          uid : current_user_data.uid,
          cat : bro[0],
          history:false
        });
      }
    }
    else {
      socket.emit("mark own",{
        uid:current_user_data.uid,
        cat:id.substring(0,3),
        mark:true
      });
      closePanel();
    }
  });
  $(document).on('click','.panel #switch span',function () {
    socket.emit("display cat",{
      uid : current_user_data.uid,
      cat : $(this).attr('id'),
      history:false
    });
  })
  socket.on("display cat result",function (result) {
    // console.log(result) ;
    let data = new Cat(result.this),
        arr = result.bro,
        lv = result.lv,
        id = data.id.substring(0,3),
        brr=[];
    current_compare_cat[data.id] = data;
    $(".comparedata").each(function () {
      let a = $(this).attr("id").substring(0,3),
          _this = $(this);
      if(a == id) {
        $(AddCompareData(data,lv,arr)).insertBefore(this);
        $(this).remove();
      }
    });
    highlightTheBest();
    $(".comparedata").each(function () {brr.push($(this).attr("id"))});
    socket.emit("compare cat",{id:current_user_data.uid,target:brr});
    closePanel();
  });
  $('.compareDisplay').on("scroll",closePanel);
  function closePanel() {
    $('.panel').css("height",0).attr('value',0);
    $("#level i").css("transform",'rotate(0deg)');
  }

  $(document).on('click','.comparedata img',function () {
    let id = $(this).parents('.comparedata').attr('id');
    socket.emit("display cat",{
      uid : current_user_data.uid,
      cat : id,
      history:true
    }) ;
    window.parent.reloadIframe('cat');
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
          data = current_compare_cat[id];

      if (level && level < 101 && level > 0) {
        $(this).parent().html(level);
        let change = ['hp','hardness','atk','DPS'] ;
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
          uid : current_user_data.uid,
          id : id,
          lv : level,
          type : 'cat'
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
  $(document).on('click','.compareTable .comparedatahead th',sortCompareCat);
  var char_detail = 0 ;
  function sortCompareCat() {
    let name = $(this).attr("id");
    var arr = [] ;
    let flag = true ;
    if(name == 'char'){
      // console.log(current_compare_cat);
      $(".comparedata").each(function () {
        // console.log(char_detail);
        let id = $(this).attr('id'),
        data = current_compare_cat[id],
        lv = Number($(this).find("#level").children('span').text()),
        char = data.CharHtml(lv),
        tag = data.tag?data.tag.join("/"):"無";
        $(this).find("#char").html(char_detail?tag:char);
      });
      char_detail = char_detail?0:1;
      return
    }
    if(name == 'Picture' || name == 'name' || name =='multi' || name == 'KB') return ;
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
    // console.log(arr);
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
      "<th id='level'><span>"+lv+"</span><i class='material-icons'>&#xe5c5;</i></th>"+
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
      "<td id='freq'>"+data.freq+"</td>"+
      "</tr><tr>"+
      "<td id='speed'>"+data.speed+"</td>"+
      "</tr><tr>"+
      "<td id='multi'>"+data.Aoe+"</td>"+
      "</tr><tr>"+
      "<td id='cost'>"+data.cost+"</td>"+
      "</tr><tr>"+
      "<td id='cd'>"+data.cd+"</td>"+
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
