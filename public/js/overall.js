const image_url_cat =  "/css/footage/cat/u" ;
const image_url_enemy =  "/css/footage/enemy/e" ;
const image_url_icon =  "/css/footage/gameIcon/" ;
const image_url_gacha =  "/css/footage/gacha/" ;
const VERSION = "10.29.3"
var is_mobile = screen.width < 768;
var _browser = navigator.userAgent;
var is_ios = _browser.indexOf("iPad") != -1 || _browser.indexOf("iPhone") != -1;
var openInNew = localStorage.openInNewWindow == "true";
console.log("mobile : ",is_mobile);
console.log("ios : ",is_ios);
var showcomparetarget = 1 ;
var filterObj = {};
const tutorial_version = {
  expCalculator: 1,
  compareCat: 1,
  compareEnemy: 1,
  stage: 1,
  combo: 1
}
var socket;
$(document).ready(function () {
  socket = io.connect();
  var facebook_provider = new firebase.auth.FacebookAuthProvider();
  var filter_name = '';

  $(document).on('click','#more_option #top',function () { scroll_to_class("content",1); });


  var today = new Date();

  if(screen.width <= 768){
    $("#lower_table .value_display").attr("colspan",7);
    $("#dataTable").find("#level_num").parent().attr("colspan",7);
  }

  //input reaction
  $(document).on('keypress', 'input', function(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      $(this).blur();
    }
  });
  $(document).on('click', 'input',function (e) {
    e.stopPropagation();
  });

  //button reaction
  $(document).on('click',".button",toggleButton);
  function toggleButton() {
    let val = Number($(this).attr('value')) ;
    $(this).attr('value',function () {
      val = val ? 0 : 1 ;
      return val ;
    });
    $(this).find("i").css("background-blend-mode",function () {
      let type = val ? 'normal' : 'multiply';
      return type
    })
  }

  //change page reaction
  $(document).on('click','#next_sel_pg',function () {turnPage(1);}) ;
  $(document).on('click','#pre_sel_pg',function () {turnPage(-1);}) ;
  function turnPage(n) {
    $('#selected').unbind('mousewheel', scroll_select);
    $(window).bind('mousewheel', false);
    let current = $("#selected").scrollTop(),
        offset = $("#selected").height(),
        current_page = Number((current/offset).toFixed(0))+Number(n) ;

    $("#selected").animate(
      {scrollTop: current+offset*n},
      100*Math.sqrt(Math.abs(n)),'easeInOutCubic');

    $("#page_dot").find("span[value='"+Number(current_page)+"']")
      .css('background-color','rgb(254, 168, 74)')
      .siblings().css('background-color','white')

    setTimeout(function(){
      $('#selected').bind('mousewheel', scroll_select);
      $(window).unbind('mousewheel', false);
    }, 300);
  }
  var scroll_select = function (e) {
    if(e.originalEvent.wheelDelta < 0) {
      if( $(this).scrollTop()+$(this).height() > $(this)[0].scrollHeight-2
      &&  $(this).scrollTop()+$(this).height() < $(this)[0].scrollHeight+2
      ) return true
      turnPage(1);
        //scroll down
    }else {
      if($(this).scrollTop() == 0) return true
      turnPage(-1);
        //scroll up
        // alert('Up');
    }
    //prevent page fom scrolling
    return false;
  };
  $('#selected').bind('mousewheel', scroll_select);
  $(document).on('click','#page_dot span',function () {
    let current = $("#selected").scrollTop(),
        offset = $("#selected").height(),
        current_page = current/offset,
        goto = $(this).attr('value') ;
    // console.log(current_page+","+goto);
    let n = current_page-goto;
    // console.log(n);
    turnPage(-n);
    // $(this).css('background-color','rgb(254, 168, 74)')
    //   .siblings().css('background-color','white');
    // $(this).attr('active',true).siblings().attr('active',false);
  });

  //snapshot
  $(document).on("click","#snapshot",function () {
    let target = $(".dataTable")[0];
    if(!target) return
    snapshot(target);
    $(document).bind("keydown",controlByKey);
  });
  $("#canvas_holder").click(function () {
    $(this).fadeOut().children(".picture").empty();
    $(document).unbind("keydown",controlByKey);
  });
  var controlByKey = function (e) {
    var pic = $("#canvas_holder .picture");
    // console.log(pic.css("transform"));
    if(e.keyCode == 38){
      $("#canvas_holder canvas").css("transform",function () {
        var matrix = $("#canvas_holder canvas").css('transform');
        matrix = matrix.split("(")[1].split(")")[0].split(",");
        matrix[5] = Number(matrix[5])+100;
        return "matrix("+matrix.toString()+")"
      });
    } else if(e.keyCode == 40){
      $("#canvas_holder canvas").css("transform",function () {
        var matrix = $("#canvas_holder canvas").css('transform');
        matrix = matrix.split("(")[1].split(")")[0].split(",");
        matrix[5] = Number(matrix[5])-100;
        return "matrix("+matrix.toString()+")"
      });
    }
    return false
  }
  if(typeof(Storage)){
    var page = location.pathname.split("/")[1],
        ver = localStorage["tutorial_"+page];
    if(ver != tutorial_version[page]){
      $(".tutorial").attr("show","true");
    }
  } else {
    console.log("browser don't support local storage");
  }

  $(".tutorial button[action='known']").click(function (e) {
    $(".tutorial").fadeOut();
    var page = location.pathname.split("/")[1];
    localStorage["tutorial_"+page] = tutorial_version[page];
  });
  checkVersion();
  function checkVersion(){
    socket.emit("check version");
    setTimeout(checkVersion,600000);
  }
  var countDown = 5;
  socket.on("check version",(version)=>{
    console.log(version,VERSION);
    $("#Version_display span").text(version);
    if(invalidVersion(version)) {
      $("body").append(
      '<div id="version_alert">'+
        '<div class="content">'+
          '<div class="main">'+
            '資料庫已更新至<span id="version_new">'+version+'</span>版,'+
            '但本頁面還停留在<span id="version_old">'+VERSION+'</span>版,'+
            '為避免非預期錯誤，請重新整理網頁。<br />'+
            '(5秒後將自動重新整理)'+
            '<span id="countDown">5<span>'+
          '</div>'+
          '<span>'+
            '<button id="ok">立即重新整理</button>'+
          '</span>'+
        '</div>'+
      '</div>'
      );
      $("#version_alert").show();
      countDownReload();
    }
  });
  function invalidVersion(version) {
    var newVer = version.split("."),
        oldVer = VERSION.split(".");
    for(let i in oldVer){
      if(Number(oldVer[i]) > Number(newVer[i])) return false
      else if(Number(oldVer[i]) < Number(newVer[i])) return true
    }
    return false
  }
  function countDownReload() {
    if(countDown <= 0) location.reload();
    else{
      countDown -= 1;
      $("#countDown").text(countDown);
      setTimeout(countDownReload,1000);
    }
  }
  $("#version_alert #ok").click(function () { location.reload(); });
});

$("#PageGoToTop").click(function () {
  $("body").animate({
    scrollTop :0
  },500);
});

$(window).load(function () {
  $('#slider_holder').children('.active').click(function () {
    let target = $("#"+filter_name+".filter_option");
    target.attr('active',target.attr('active')=='true'?'false':'true');
    filterObj[filter_name].active = target.attr('active')=='true';
    $(this).html('<i class="material-icons">&#xe83'+(target.attr('active')=='true'?7:6)+';</i>');
  });
  $('#slider_holder').children('.type').click(function () {
    let target = $("#"+filter_name+".filter_option"),
        value = filterObj[filter_name].value,
        range = JSON.parse(target.attr("range"));
    target.attr('type',Number(target.attr('type'))+1<3?Number(target.attr('type'))+1:0);
    if(Number(target.attr('type'))==2)
      target.attr('value',"["+range[0]*10+","+range[1]*0.9+"]");
    else if(typeof(value) == 'object')
      target.attr('value',(value[0]+value[1])/2);
    filterSlider(target);
  });
  $('#slider_holder').find('.slider').on("slidechange",function (e,ui) {
    setTimeout(function () {
      let target = $("#"+filter_name+".filter_option");
      target.attr('value',Number(target.attr('type'))==2?("["+ui.values+"]"):ui.value);
      if(!filterObj[filter_name]) filterObj[filter_name] = {};
      filterObj[filter_name].value = Number(target.attr("value"))?Number(target.attr("value")):JSON.parse(target.attr("value"));
      $(this).parent().siblings('.value_display').text(filterObj[filter_name].value);
    },300);
  });
  $(".slider").on("slide", function(e,ui) {
    $(this).parent().siblings('.value_display').html(ui.value);
  });
  $(".slider").on("slidechange", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });

});

//google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-111466284-1');


function snapshot(target) {

  html2canvas(target,{
    backgroundColor:"#60e6f9",
    allowTaint:true
  }).then(function(canvas) {
    $('#canvas_holder').css("display",'flex');
    $('#canvas_holder .picture').append(canvas);
    $("#canvas_holder .picture canvas").css("transform",'scale(0,0)');
    setTimeout(function () {
      $("#canvas_holder canvas").css("transform",'matrix(0.75,0,0,0.75,0,0)');
    },100);
    $('#canvas_holder .picture').append("<a><i class='material-icons'>&#xe2c0;</i></a>")
    $('#canvas_holder .picture').append("<span id='zoom_in'><i class='material-icons'>&#xe145;</i></span>")
    $('#canvas_holder .picture').append("<span id='zoom_out'><i class='material-icons'>&#xe15b;</i></span>")
    let link = canvas.toDataURL('image/jpg');
    $('#canvas_holder .pacture a').attr({'href':link,'download':'screenshot.jpg'});
    if(link.length>1e6){
      $('#canvas_holder a').bind("click",function () {
        alert("圖片過大，請用右鍵>另存圖片");
        return false
      });
    }
    var scale = .75 ;
    $('#canvas_holder span').bind("click",function (e) {
      e.stopPropagation();
      if($(this).attr("id")=='zoom_in') scale = scale<.25?.25:(scale>2?scale:scale+.25);
      else scale = scale<.26?(scale<.1?scale:scale-.05):scale-.25;
      $("#canvas_holder canvas").css("transform",function () {
        var matrix = $("#canvas_holder canvas").css('transform');
        matrix = matrix.split("(")[1].split(")")[0].split(",");
        matrix[0] = matrix[3] = scale;
        return "matrix("+matrix.toString()+")"
      });
    });
    $('#canvas_holder canvas').bind("click",function (e) {e.stopPropagation();});
  });



}
function parseRarity(s) {
  switch (s) {
    case 'B':
      s = '基本'
      break;
    case 'R':
      s = '稀有'
      break;
    case 'SR':
      s = '激稀有'
      break;
    case 'SR_alt':
      s = '激稀有狂亂'
      break;
    case 'SSR':
      s = '超激稀有'
      break;
    case 'SSSR':
      s = '傳說稀有'
      break;
    default:
      s = s
  }
  return s
}
function levelToValue(origin,rarity,lv) {
  var result,limit ;
  switch (rarity) {
    case 'R':
    limit = 70 ;
    break;
    case 'SR_alt':
    limit = 20 ;
    break;
    default:
    limit = 60 ;
  }
  result = (0.8+0.2*lv)*origin;
  if(lv>limit) result = result - 0.1*(lv-limit)*origin;
  if(lv>limit+20) result = result - 0.05*(lv-limit-20)*origin;
  return result
}
function scroll_to_div(div_id){
  $('html,body').animate(
    {scrollTop: $("#"+div_id).offset().top-100},
    600,'easeInOutCubic');
}
function scroll_to_class(class_name,n) {
  $('html,body').animate(
    {scrollTop: $("."+class_name).eq(n).offset().top-100},
    600,'easeInOutCubic');
}
function AddZero(n,e=1) {
  var s = Number(n).toString();
  if(s == "NaN") return s
  if(n == 0) e--;
  for(let i = e; i >= 0; i--){
    if (n < 10**(i)) s = "0"+s;
    else return s
  }
  return s
}


function filterSlider(target) {
  let value = target.attr('value') ;
  let type = Number(target.attr('type')) ;
  let range = JSON.parse(target.attr('range'));
  let step = Number(target.attr('step')) ;
  let active = target.attr('active') ;
  let Slider = $("#slider_holder").find('.slider');
  Slider.slider("destroy");
  Slider.slider();
  Slider.slider('option','range',type==2);
  Slider.slider('option',{
    'min': range[0],
    'max': range[1],
    'step': step,
  }).parent().siblings('.active').html('<i class="material-icons">&#xe83'+(active=='true'?7:6)+';</i>')
  .siblings('.type').html(type?(type == '1'?'以下':'範圍'):'以上');
  if(type==2)
    Slider.slider("option","values",JSON.parse(value));
  else
    Slider.slider("option","value",Number(value));
  filterObj[filter_name] = {
    type:Number(type),
    active:active=='true',
    value:Number(value)?Number(value):JSON.parse(value),
    lv_bind:target.attr('lv-bind')=='true'
  }
}
function sum(list) {
  let sum = 0 ;
  for(let i in list) sum += Number(list[i])?Number(list[i]):0;
  return sum
}
function avg(list) {
  return (sum(list)/list.length).toFixed(2)
}
function max(list) {
  let max = -1e10 ;
  for(let i in list) if(Number(list[i])>max) max = Number(list[i]);
  return max
}
function min(list) {
  let min = 1e10 ;
  for(let i in list) if(Number(list[i])<min) min = Number(list[i]);
  return min
}
function vary(list) {
  let average = avg(list),
      sum = 0;
  for(let i in list) sum += (Number(list[i])-average)*(Number(list[i])-average);
  return Math.sqrt(sum/(list.length-1)).toFixed(2)
}
function Range(list) {
  return [min(list),max(list)]
}
function quickSort(list,target=null) {
  var length = list.length;
  if (length <= 1) return list

  var pivot_index = Math.ceil(length/2),
      pivot = list[pivot_index],
      pivot_value = target?pivot[target]:pivot,
      smaller=[],
      bigger=[];

  for (let i = 0; i < length; i++){
    if (i == pivot_index) continue
    var compare_value = target?list[i][target]:list[i];
    if (compare_value > pivot_value) bigger.push(list[i]);
    else smaller.push(list[i]);
  }
  smaller = quickSort(smaller,target);
  bigger = quickSort(bigger,target);

  return smaller.concat([list[pivot_index]]).concat(bigger)
}
const ChineseNumber = ["一","二","三","四","五","六","七","八","九"];
const ChineseNumber_10 = ["十","百","千"];
const ChineseNumber_10_alt = ["萬","億","兆"];
function ToChineseNumber(n,m=0) {
  if(n == 0) return ""
  if(n < 10) return ChineseNumber[n-1]
  var org = n;
  if(n<1e4){
    n = Math.floor(n/10);
    m ++;
    return ToChineseNumber(n,m)+ChineseNumber_10[m-1]+ToChineseNumber(org%10)
  } else {
    n = Math.floor(n/1e4);
    m ++;
    return ToChineseNumber(n,m)+ChineseNumber_10_alt[m-1]+ToChineseNumber(org%1e4)
  }
}
