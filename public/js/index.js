$(document).ready(function () {
  var timer = new Date().getTime();
  var compare = [] ;
  var setting = {
        compare_max : 4 ,
        display_id : false
      } ;
  var filter_name = '' ;
  const image_url = 'http://imgs-server.com/battlecats/u' ;
  const image_local =  "public/css/footage/cat/u" ;
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
    if(data.last_cat) socket.emit("display cat",data.last_cat) ;
  });

  $(document).on('click','#next_sel_pg',function () {turnPage(1);}) ;
  $(document).on('click','#pre_sel_pg',function () {turnPage(-1);}) ;
  $(document).on('click','.card',function () {
    // console.log(current_user.uid);
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'cat',
      id : $(this).attr('value')
    });
    socket.emit("display cat",$(this).attr('value'));
  });
  $(document).on('click',"#clear_all",function () {clearSelected('select');});
  $(document).on('click','#search_ability',search) ;
  $(document).on('click','.glyphicon-refresh',toggleCatStage);
  $(document).on('click','#compare',compareCat);
  $(document).on('click','.compareTable .comparedatahead th',sortCompareCat);
  $(document).on('click','#searchBut',function () {
    let keyword = $(this).siblings().val();
    socket.emit("text search",{key:keyword,type:'cat'});
  });
  $(document).on('keypress','#searchBox',function (e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      let keyword = $(this).val();
      socket.emit("text search",{key:keyword,type:'cat'});
    }
  });
  $(document).on('click','#setting',showSetting) ;
  $(document).on('click','#setting-submit',changeSetting) ;

  var input_org ;
  $(document).on('click','.comparedata #level,.editable',function () {
      input_org = $(this).text();
      $(this).html('<input type="text" value="' +input_org+ '"></input>');
      $(this).find('input').select();
  });
  $(document).on('blur', '.comparedata #level input', changeCompareLevel);
  $(document).on('blur', '.editable input', calculateLV);
  $(document).on('click','.filter_option',filterSlider);
  var filter_org ;
  $(document).on('click','.value_display,#level_num',function () {
      filter_org = Number($(this).text());
      $(this).html('<input type="text" value="' +filter_org+ '"></input>');
      $(this).find('input').select();
  });
  $(document).on('blur','.value_display input',changeSlider) ;
  $(document).on('blur','#level_num input',function () {
    let val = Number($(this).val()) ;
    val = val && val>0 && val<101 ? val : filter_org ;
    $('#level').slider('option','value',val);
  });
  $(document).on('click','.searchCombo',function () {
    console.log()
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'combo',
      id : [$(this).attr('val')]
    });
    location.assign('combo.html')
  }) ;

  var rarity = ['基本','EX','稀有','激稀有','激稀有狂亂','超激稀有'] ;
  for(let i in rarity) $(".select_rarity").append("<span class='button' name='"+rarity[i]+"' value='0' >"+rarity[i]+"</span>") ;

  var color = ['對紅','對浮','對黒','對鋼鐵','對天使','對外星','對不死','對白'];
  for(let i in color) $(".select_color").append("<span class='button' name='["+color[i]+"]' value='0'>"+color[i]+"</span>") ;

  var ability = ['增攻','降攻','免疫降攻','擅於攻擊','很耐打','超大傷害','爆擊','擊退','免疫擊退','連續攻擊','不死剋星',
                '緩速','免疫緩速','暫停','免疫暫停','遠方攻擊','復活','波動','抵銷波動','免疫波動','2倍金錢','只能攻撃',
                '攻城','鋼鐵','免疫傳送','破盾'];
  for(let i in ability) $(".select_ability").append("<span class='button' name='["+ability[i]+"]' value='0'>"+ability[i]+"</span>") ;

  socket.on("display cat result",function (result) {
    console.log("recive cat data,starting display") ;
    console.log(result) ;
    let data = result.this,
        arr = result.bro,
        brr = result.combo ;
    displayCatData(data,arr,brr) ;
  });
  socket.on("search result",function (data) {
    console.log("recive search result");
    console.log(data);
    $("#selected").empty();
    $("#selected").scrollTop(0);
    $("#selected").append(condenseCatName(data));
    $(".button_group").css('display','flex');
  });
  function displayCatData(data,arr,brr) {
    let html = "" ;
    html += setting.display_id ? "<tr><th>Id</th><td id='id'>"+data.id+"</td></tr>" : "" ;

    html += screen.width > 768 ?
    "<tr>"+
    "<th style='height:80px;padding:0'><img src='"+
    (image_list.indexOf("u"+data.id+".png") != -1 ? image_local+data.id+".png" : image_url+data.id+'.png')
    +"' style='height:100%'></th>"+
    "<th colspan=3 rarity='"+data.稀有度+"' id='全名'>"+data.全名+"</th>"+
    "<th colspan=2>"+Thisbro(arr)+"</th>"+
    "</tr>" :
    "<tr>"+
    "<th colspan='6' style='height:80px;padding:0;background-color:transparent'><img src='"+
    (image_list.indexOf("u"+data.id+".png") != -1 ? image_local+data.id+".png" : image_url+data.id+'.png')
    +"' style='height:100%'>"+Thisbro(arr)+"</th>"+
    "</tr><tr>"+
    "<th colspan='6' rarity='"+data.稀有度+"' id='全名'>"+data.全名+"</th>"+
    "</tr>" ;


    $(".dataTable").empty();
    $('.compareTable').empty();
    $(".dataTable").append(
      html+
      "<tr>"+
      "<th colspan='1'>等級</th>"+
      "<td colspan='4' class='level'>"+
      "<div id='level' class='slider'></div>"+
      "</td>"+
      "<td colspan='"+(screen.width < 768 ? 5 : 1)+"' >"+
      "<span id='level_num'>30</span>"+
      "</td >"+
      "<tr>"+
      "<th>體力</th><td id='體力' original='"+data.lv1體力+"'>"+
      "<span class='editable' rarity='"+data.稀有度+"'>"+
      levelToValue(data.lv1體力,data.稀有度,30).toFixed(0)+
      "</span></td>"+
      "<th>KB</th><td id='KB'>"+data.kb+"</td>"+
      "<th>硬度</th><td id='硬度' original='"+data.lv1硬度+"'>"+
      "<span class='editable' rarity='"+data.稀有度+"'>"+
      levelToValue(data.lv1硬度,data.稀有度,30).toFixed(0)+
      "</span></td>"+
      "</tr><tr>"+
      "<th>攻擊力</th><td id='攻擊力' original='"+data.lv1攻擊+"'>"+
      "<span class='editable' rarity='"+data.稀有度+"'>"+
      levelToValue(data.lv1攻擊,data.稀有度,30).toFixed(0)+
      "</span></td>"+
      "<th>DPS</th><td id='DPS' original='"+data.lv1dps+"'>"+
      "<span class='editable' rarity='"+data.稀有度+"'>"+
      levelToValue(data.lv1dps,data.稀有度,30).toFixed(0)+
      "</span></td>"+
      "<th>射程</th><td id='射程'>"+data.射程+"</td>"+
      "</tr><tr>"+
      "<th>攻頻</th><td id='攻頻'>"+data.攻頻.toFixed(1)+" s</td>"+
      "<th>跑速</th><td id='跑速'>"+data.速度+"</td>"+
      "<td colspan='2' rowspan='2' id='範圍'>"+data.範圍+"</td>"+
      "</tr><tr>"+
      "<th>花費</th><td id='花費'>"+data.花費+"</td>"+
      "<th>再生産</th><td id='再生産'>"+data.再生産.toFixed(1)+" s</td>"+
      "</tr><tr>"+
      "<td colspan='6' id='特性' "+(
      data.特性.indexOf("連續攻擊") != -1 ?
      "original='"+data.特性+"'>"+
      serialATK(data.特性,levelToValue(data.lv1攻擊,data.稀有度,30)) :
      ">"+data.特性)+
      "</td>"+
      "</tr><tr>"+
      "<th colspan='6'>發動聯組</th>"+
      AddCombo(brr)+
      "</tr>"
    );
    initialSlider(data);
    scroll_to_class("display",0) ;
  }
  function AddCombo(arr) {
    if(arr.length == 0){
      return "</tr><tr><td colspan=6>無可用聯組</td>"
    }
    let html = "",
        pic_html  ;
    for(let i in arr){
      pic_html = "<div style='display:flex'>" ;
      for(let j in arr[i].cat){
        // console.log(arr[i].cat[j])
        if(arr[i].cat[j] != "-"){
          pic_html +=
          '<span class="card" value="'+arr[i].cat[j]+'" '+
          'style="background-image:url('+
          (image_list.indexOf("u"+arr[i].cat[j]+".png") != -1 ? image_local+arr[i].cat[j]+".png" : image_url+arr[i].cat[j]+'.png')
          +');'+
          (screen.width > 768 ? "width:90;height:60;margin:5px" : "width:75;height:50;margin:0px")
          +'">'+name+'</span>' ;
        }
      }
      pic_html += "</div>" ;
      html += screen.width > 768 ?
              ("</tr><tr>"+
              "<th val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
              "<td>"+arr[i].name+"</td>"+
              "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
              "</tr><tr>"+
              "<td colspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>") :
              ("</tr><tr>"+
              "<th colspan=2 val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
              "<td colspan=4 rowspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>"+
              "</tr><tr>"+
              "<td colspan=2 >"+arr[i].name+"</td>"+
              "</tr><tr>"+
              "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
              "</tr><tr>"
            );

    }
    // console.log(html);
    return html
  }
  function Thisbro(arr) {
    let html = "<div style='display:flex;justify-content: center;"+(screen.width > 768 ? "" : "padding:10px")+"'>" ;
    for(let i in arr) {
      html +=
      '<span class="card" value="'+arr[i]+'" '+
      'style="background-image:url('+
      (image_list.indexOf("u"+arr[i]+".png") != -1 ? image_local+arr[i]+".png" : image_url+arr[i]+'.png')
      +');'+
      (screen.width > 768 ? "width:90;height:60;margin:5px" : "width:75;height:50;margin:5px")
      +'">'+name+'</span>'  ;
    }
    html += "</div>" ;
    return html
  }
  function initialSlider(data) {
    $("#level").slider({
      max: 100,
      min: 1,
      value: 30,
    });
    $("#level").on("slide", function(e,ui) {
      $("#level_num").html(ui.value);
      updateState(ui.value);
    });
    $("#level").on("slidechange", function(e,ui) {
      $("#level_num").html(ui.value);
      updateState(ui.value);
    });
    function updateState(level) {
      let rarity = data.稀有度;
      let change = ['體力','硬度','攻擊力','DPS'] ;
      for(let i in change){
        let target = $('.dataTable').find('#'+change[i]) ;
        let original = target.attr('original');
        target.html("<span class='editable' rarity='"+data.稀有度+"'>"+
                levelToValue(original,rarity,level).toFixed(0)+
                "</span>").css('background-color',' rgba(242, 213, 167, 0.93)');
        setTimeout(function () {
          target.css('background-color','rgba(255, 255, 255, .9)');
        },500);
      }
      if(data.特性.indexOf("連續攻擊") != -1){
        let target = $('.dataTable').find('#特性');
        target.html(serialATK(data.特性,levelToValue(data.lv1攻擊,data.稀有度,level)));
      }
    }
  }
  function search() {
    let rarity = $(".select_rarity [value=1]"),
    color = $(".select_color [value=1]"),
    ability = $(".select_ability [value=1]");
    let rFilter = [], cFilter = [], aFilter = [] ;
    for(let i = 0;i<rarity.length;i++) rFilter.push(rarity.eq(i).attr('name')) ;
    for(let i = 0;i<color.length;i++) cFilter.push(color.eq(i).attr('name')) ;
    for(let i = 0;i<ability.length;i++) aFilter.push(ability.eq(i).attr('name')) ;

    let  filterObj = [] ;
    $(".filter_option[active='true']").each(function () {
      let name = $(this).attr('id'),
          reverse = $(this).attr('reverse') == 'true' ? true : false ,
          limit = $(this).attr('value') ,
          level_bind = $(this).attr('lv-bind') == 'true' ? true : false ,
          bufferObj = {
            "name" : name,
            "reverse" : reverse,
            "limit" : limit,
            "level_bind" : level_bind
          } ;
      filterObj.push(bufferObj);
    });
    socket.emit("search",{rFilter,cFilter,aFilter,filterObj,type:"cat"});

    scroll_to_div('selected');
  }
  function condenseCatName(data) {
    console.log('condensing....');
    let now = '000' ;

    let html = '<span class="card-group" hidden>' ;
    for(let i in data){
      let name = data[i].name;
      let id = data[i].id ;
      let current = id.substring(0,3) ;
      if(current == now){
        html += '<span class="card" value="'+id+'" '+
        'style="background-image:url('+
        (image_list.indexOf("u"+id+".png") != -1 ? image_local+id+".png" : image_url+id+'.png')
        +');display:none">'+
        name+'</span>' ;
      }
      else{
        html += '</span>' ;
        html += '<span class="card-group" value="'+current+'">'+
        '<span class="glyphicon glyphicon-refresh"></span>'+
        '<span class="card" value="'+id+'" '+
        'style="background-image:url('+
        (image_list.indexOf("u"+id+".png") != -1 ? image_local+id+".png" : image_url+id+'.png')
        +')">'+
        name+'</span>' ;
        now = current ;
      }
    }
    return html ;
  }
  function compareCat() {
    compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
    console.log(compare);
    scroll_to_class("display",0);
    $(".compareTable").empty();
    $(".dataTable").empty();
    if(compare.length == 1) displayCatData(compare[0]);
    else{
      $(".compareTable").append(
        "<div style='flex:1' class='comparedatahead'>"+
        "<table>"+
        (setting.display_id ? "<tr><th>ID</th></tr>" : "") +
        "<tr>"+
        "<th>Level</th>"+
        "</tr><tr>"+
        "<th style='height:80px;'>Picture</th>"+
        "</tr><tr>"+
        "<th>全名</th>"+
        "</tr><tr>"+
        "<th>體力</th>"+
        "</tr><tr>"+
        "<th>KB</th>"+
        "</tr><tr>"+
        "<th>硬度</th>"+
        "</tr><tr>"+
        "<th>攻擊力</th>"+
        "</tr><tr>"+
        "<th>DPS</th>"+
        "</tr><tr>"+
        "<th>射程</th"+
        "</tr><tr>"+
        "<th>攻頻</th>"+
        "</tr><tr>"+
        "<th>跑速</th>"+
        "</tr><tr>"+
        "<th>範圍</th>"+
        "</tr><tr>"+
        "<th>花費</th>"+
        "</tr><tr>"+
        "<th>再生産</th>"+
        "</tr><tr>"+
        "<th>特性</th>"+
        "</tr>"+
        "</table>"+
        "</div>"
      );
      for(let i in compare){
        let data = catdata[compare[i]];

        console.log(data);
        $(".compareTable").append(
          "<div style='flex:1' class='comparedata' id='"+data.id+"'>"+
          "<table>"+
          (setting.display_id ? "<tr><th id='id'>"+data.id+"</th></tr>" : "") +
          "<tr>"+
          "<th id='level' rarity='"+data.稀有度+"'>30</th>"+
          "</tr><tr>"+
          "<th style='height:80px;padding:0'><img src='"+
          (image_list.indexOf("u"+compare[i]+".png") != -1 ? image_local+compare[i]+".png" : image_url+compare[i]+'.png')
          +"' style='height:100%'></th>"+
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
    }
    highlightTheBest();
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
      // console.log(max);
      // console.log(min);
      if(name == '再生産' || name == '攻頻' || name == '花費') {
        for(let i in min) $(".compareTable").children("#"+min[i].id).find("#"+name).attr('class','best');
      }
      else for(let i in max) $(".compareTable").children("#"+max[i].id).find("#"+name).attr('class','best');
      // $(".compareTable").children("#"+min.id).find("#"+name).css('color','rgb(82, 174, 219)');
    });
  }
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
          $(".compareTable").children('#'+arr[i].id).before( $(".compareTable").children('#'+arr[j].id));
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
            $(".compareTable").children('#'+arr[i].id).before( $(".compareTable").children('#'+arr[j].id));
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
        if(original.indexOf("連續攻擊") != -1) target.html(serialATK(original,levelToValue(atk,rarity,level)))
        highlightTheBest();
        $('.comparedatahead').find('th').css('border-left','0px solid');
      }
      else $(this).parent().html(input_org);
  }
  function filterSlider() {
    $("#slider_holder").show();
    $(this).css('border-bottom','5px solid rgb(241, 166, 67)').siblings().css('border-bottom','0px solid');
    filter_name = $(this).attr('id') ;
    let value = Number($(this).attr('value')) ;
    let reverse = $(this).attr('reverse') ;
    let range = JSON.parse($(this).attr('range'));
    let step = Number($(this).attr('step')) ;
    let active = $(this).attr('active') ;

    $("#slider_holder").find('.slider').slider('option',{
      'min': range[0],
      'max': range[1],
      'step': step,
      'value': value
    }).parent().siblings('.active').html(active=='true'?'<i class="material-icons">&#xe837;</i>':'<i class="material-icons">&#xe836;</i>')
    .siblings('.reverse').html(reverse=='true'?'以下':'以上');
  }
  $('#slider_holder').children('.active').click(function () {
    let target = $("#"+filter_name+".filter_option");
    target.attr('active',target.attr('active')=='true'?'false':'true');
    $(this).html(target.attr('active')=='true'?'<i class="material-icons">&#xe837;</i>':'<i class="material-icons">&#xe836;</i>');
  });
  $('#slider_holder').children('.reverse').click(function () {
    let target = $("#"+filter_name+".filter_option");
    target.attr('reverse',target.attr('reverse')=='true'?'false':'true');
    $(this).html(target.attr('reverse')=='true'?'以下':'以上');
  });
  $('#slider_holder').find('.slider').on("slidechange",function (e,ui) {
    $("#lower_table").find("#"+filter_name).attr('value',ui.value);
  });
  $("#lower_table").find("#selectAll").click(function () {
    if($(this).text().trim() == '全選') {
      $(".filter_option").attr('active','true');
      $(this).text('全部清除');
      $('.active').html('<i class="material-icons">&#xe837;</i>');
    }
    else{
      filter_name = "" ;
      $(".filter_option").attr('active','false');
      $(this).text('全選');
      $('.active').html('<i class="material-icons">&#xe836;</i>');
      $("#slider_holder").hide().siblings().children('.filter_option').css('border-bottom','0px solid');
    }
  });
  $(".filter_option").hover(
    function () {
      let position = $(this).offset(),
          value = $(this).attr('value'),
          width = $(this).outerWidth()-10,
          active = $(this).attr('active') == 'true' ? true : false ,
          reverse = $(this).attr('reverse') == 'true' ? '以下' : '以上';

      // alert(JSON.stringify(position));
      position.top -= 30 ;
        if(active && screen.width > 768){
          $("#TOOLTIP").finish().fadeIn();
          $("#TOOLTIP").offset(position).width(width).text(value+reverse) ;
        }

    },function () {
      $("#TOOLTIP").fadeOut();
  });


  $('#test').click(function () {
    html2canvas($('.display').get(), {
      onrendered: function(canvas) {
        // document.body.appendChild(canvas);
        var link=document.createElement("a");
        link.href=canvas.toDataURL('image/jpg');   //function blocks CORS
        link.download = 'screenshot.jpg';
        link.click();
      },
    });
    // let width = $('.compareTable').width(),
    //     height = $('.compareTable').height() ;
    // html2canvas($('.compareTable').get(), {
    //     onrendered: function (canvas) {
    //         var tempcanvas=document.createElement('canvas');
    //         console.log(width+":"+height)
    //         tempcanvas.width = width;
    //         tempcanvas.height = height ;
    //         var context=tempcanvas.getContext('2d');
    //         context.drawImage(canvas,0,0);
    //         var link=document.createElement("a");
    //         link.href=tempcanvas.toDataURL('image/jpg');   //function blocks CORS
    //         link.download = 'screenshot.jpg';
    //         link.click();
    //     }
    // });
  });

  $(".sortable").sortable({
    scroll:false,
    delay:150
  });
  $(".slider").slider();

  $('#selected').sortable('option',{
    item: '> .card-group',
    connectWith: ".compareTarget"
  });
  $('.compareTarget').sortable('option',{
    item: '> comparedata'
  });
  $(".slider").on("slide", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });
  $(".slider").on("slidechange", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });
  $('.compareTarget').on('sortover',function (e,ui) {
    $("#compare").show();
    // scroll_to_class('compareTarget',0);
    let input = ui.item.children('.card:visible') ;
    compare = $('.compareTarget').sortable('toArray',{attribute:'value'});
    if(compare.indexOf(input.attr('value')) != -1){
      let repeat = $(this).find('[value='+input.attr('value')+']') ;
      repeat.css('border-color','rgb(237, 179, 66)');
      setTimeout(function () {
        repeat.css('border-color','white');
      },1000);
      $("#selected").sortable('cancel');
    }
    else if(compare.length > setting.compare_max-1){
      alert('啊 塞滿了') ;
      $("#selected").sortable('cancel');
    }
    else if(ui.sender.is('#selected')){
      input.clone().appendTo(this);
      $("#selected").sortable('cancel');
    }
    else $("#selected").sortable('cancel');
  });
  $('.compareTarget').on('sortout',function (e,ui) {
    let x1 = $(this).position().left,
        x2 = x1 + $(this).width(),
        y1 = $(this).position().top,
        y2 = y1 + $(this).height(),
        x = ui.position.left,
        y = ui.position.top ;
    if(x<x1||x>x2||y<y1||y>y2) if(ui.sender.is('.compareTarget')) ui.item.remove();

  });
  $('.compareTable').on('sort',function (e,ui) {
    $('.comparedatahead').find('th').css('border-left','0px solid');
  });

  function scroll_to_div(div_id){
    $('html,body').animate(
      {scrollTop: $("#"+div_id).offset().top},
      1000,'easeInOutCubic');
  }
  function scroll_to_class(class_name,n) {
    $('html,body').animate(
      {scrollTop: $("."+class_name).eq(n).offset().top},
      1000,'easeInOutCubic');
  }

  function toggleCatStage() {
    let current = $(this).parent().children(".card:visible").next().attr('value');
    if(current != undefined){
      $(this).parent().children(".card:visible").hide().next().show();
    }
    else{
      $(this).parent().children(".card:visible").hide().parent().children().eq(1).show();
    }
  }
  function turnPage(n) {
    let current = $("#selected").scrollTop();
    let offset = screen.width > 768 ? 348 : 264 ;
    $("#selected").animate(
      {scrollTop: current+offset*n},
      100,'easeInOutCubic');
  }
  function levelToValue(origin,rarity,lv) {
    let limit ;
    switch (rarity) {
      case '稀有':
      limit = 70 ;
      break;
      case '激稀有狂亂':
      limit = 20 ;
      break;
      default:
      limit = 60 ;
    }
    return lv<limit ? (0.8+0.2*lv)*origin : origin*(0.8+0.2*limit)+origin*0.1*(lv-limit) ;
  }
  function changeSlider() {
    let target = $("#"+filter_name+".filter_option");
    let range = JSON.parse(target.attr('range')),
        step = Number(target.attr('step')),
        value = Number($(this).val()) ;

    value = Math.round(value/step)*step ;

    if(value && value<range[1] && value>range[0]) $("#slider_holder").find('.slider').slider('option','value',value);
    else $("#slider_holder").find('.slider').slider('option','value',filter_org);
  }
  function serialATK(prop,atk) {
      let b = prop.split("（")[0];
      let arr = prop.split("（")[1].split("）")[0].split(","),
          c = prop.split("（")[1].split("）")[1];
      // console.log(b+"("+arr.join()+")")
      for(let i in arr) arr[i] = (atk*Number(arr[i])).toFixed(0) ;
      return b+"（"+arr.join(' ')+"）"+c ;

  }
  function showSetting() {
    let modal = $("#settingModal") ;
    modal.find("#compare_max").children('#value').text(setting.compare_max);
    modal.find("#display_id").text(setting.display_id?"yes":"no");

    let val = Number(modal.find("#compare_max").children('#value').text()) ;
    modal.find("#compare_max").children('.glyphicon').click(function () {
      if(val>3 && $(this).is('.glyphicon-minus')) val -- ;
      else if(val<7 && $(this).is('.glyphicon-plus')) val++ ;
      $(this).siblings("#value").text(val) ;
    });
    modal.find("#display_id").click(function () {
      let val = $(this).text();
      $(this).text(val == "yes"?"no":"yes");
    });
  }
  function changeSetting() {
    let modal = $("#settingModal") ;
    setting.compare_max = Number(modal.find("#compare_max").children('#value').text());
    setting.display_id = modal.find("#display_id").text() == "yes" ? true : false ;
    modal.modal("hide");
  }
  function calculateLV() {
    let val = Number($(this).val()),
        rarity = $(this).parent().attr('rarity'),
        ori = Number($(this).parents('td').attr('original')),
        lv;
    if(!val){
      $(this).parent().html(input_org);
      return
    }
    let limit ;
    switch (rarity) {
      case '稀有':
      limit = 70 ;
      break;
      case '激稀有狂亂':
      limit = 20 ;
      break;
      default:
      limit = 60 ;
    }
    console.log(val+","+rarity+","+ori+","+limit);
    lv = val/ori*10-8 ;
    lv = lv/2 > limit ? lv-limit : lv/2 ;
    lv = Math.ceil(lv) ;
    console.log(lv);
    if(lv > 100){
      alert("超出範圍!!!");
      $('#level').slider('option','value',100);
      $(this).parent().html(levelToValue(ori,rarity,100));
    } else if(lv <1){
      alert("超出範圍!!!");
      $('#level').slider('option','value',1);
      $(this).parent().html(levelToValue(ori,rarity,1));
    }
    else{
      $('#level').slider('option','value',lv);
      $(this).parent().html(levelToValue(ori,rarity,lv));
    }

  }

  var xmlhttp = new XMLHttpRequest() ;
  var url = "public/css/footage/cat/dir.txt";
  var image_list ;

    xmlhttp.open("GET", url, true);
    xmlhttp.send();

  xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        console.log(this.responseURL);
        if(this.responseURL.indexOf("cat/dir.txt") != -1){
              var data = this.responseText;
              // console.log(data.split("\n")) ;
              let nowtime =  new Date().getTime();
              console.log(nowtime-timer) ;
              image_list = data ;
        }
      }
    }

});
