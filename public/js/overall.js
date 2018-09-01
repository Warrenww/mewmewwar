const image_url_cat =  "../public/css/footage/cat/u" ;
const image_url_enemy =  "../public/css/footage/enemy/e" ;
const image_url_icon =  "../public/css/footage/gameIcon/" ;
const image_url_gacha =  "../public/css/footage/gacha/" ;
var is_mobile = screen.width < 768;
console.log("mobile : ",is_mobile);
var showcomparetarget = 1 ;
var filterObj = {};
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

  //table th reaction
  $(document).on('click','#upper_table th',function () {
    let on = $(this).siblings().children('[value=1]') ;
    if(on.length > 0) on.each(function () {$(this).click();});
    else $(this).siblings().children().each(function () {
      $(this).click();
    });
  });

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
  });
  $("#canvas_holder").click(function () {
    $(this).fadeOut().children(".picture").empty();
  });

  if(typeof(Storage)){
    var page = location.pathname!="/"?location.pathname.split("/")[2].split(".")[0]:"";
    if(!localStorage["tutorial_"+page]){
      $(".tutorial").attr("show","true");
    }
  } else {
    console.log("browser don't support local storage");
  }

  $(".tutorial button").click(function (e) {
    $(".tutorial").fadeOut();
    var page = location.pathname.split("/")[2].split(".")[0];
    localStorage["tutorial_"+page] = true;
  });

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
      $("#canvas_holder canvas").css("transform",'scale(0.75,0.75)');
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
      $("#canvas_holder canvas").css("transform",'scale('+scale+','+scale+')');
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
    default:
      s = s
  }
  return s
}
function levelToValue(origin,rarity,lv) {
  let limit ;
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
  return lv<limit ? (0.8+0.2*lv)*origin : origin*(0.8+0.2*limit)+origin*0.1*(lv-limit) ;
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
  if(n == 0){
    for(let i = e; i>0; i--) s = "0"+s;
    return s
  }
  for(let i = e; i >= 0; i--){
    if (n < 10**(i)) s = "0"+s;
    else return s
  }
}

//temp
function yearevent() {
  let today = new Date(),
      day = today.getDate(),
      hr = today.getHours();
  let html = '<h1 style="text-align:center;color:white">1/'+day+' 年初活動</h1><table>';
  let obj = {"1":{},"2":{},"3":{},"4":{},"5":{},"6":{},"7":{},"8":{},"9":{}};
  for(let i in obj){
    for(let j=7;j<24;j++) obj[i][j] = '';
    let time = [7,8,12,13,19,20],
        time_2 = [11,12,13],
        time_3 = [19,20,21];
    for(let j in time) obj[i][time[j]] += "傳奇關卡統率力減半,";

    if(i%2 == 0) {
      obj[i].allday = "世界篇寶物嘉年華,";
      for(let j in time_2) obj[i][time_2[j]] += "游擊戰經驗值喵,";
      for(let j in time_3) obj[i][time_3[j]] += "超級游擊經驗值喵,";

    }
    else {
      obj[i].allday = "未來篇寶物嘉年華,";
      for(let j in time_2) obj[i][time_2[j]] += "超級游擊經驗值喵,";
      for(let j in time_3) obj[i][time_3[j]] += "游擊戰經驗值喵,";
    }
    if(i==3||i==6||i==9) obj[i].allday += "宇宙篇寶物嘉年華,";

    if(i%3 == 1){
      obj[i][16] += "終極游擊經驗值喵,"
      obj[i][22] += "超終極游擊經驗值喵,"
    } else if(i%3 == 2){
      obj[i][22] += "終極游擊經驗值喵,"
      obj[i][8] += "超終極游擊經驗值喵,"
    } else {
      obj[i][8] += "終極游擊經驗值喵,"
      obj[i][16] += "超終極游擊經驗值喵,"
    }

  }
  // console.log(obj);
  // console.log(day+","+hr);
  // console.log(obj[day]);
  html += "<tr><th>全天</th><td>"+turn(obj[day].allday)+"</td></tr>";
  for(let i in obj[day]){
    if(i=='allday') continue
    html += "<tr id='"+i+"'><th>"+AddZero(i)+":00</th>"+
    "<td style='border:"+
    (i==hr?'3px solid rgb(255, 77, 77)':'0px')+
    "'>"+turn(obj[day][i])+"</td></tr>"
  }
  html += "</table>";
  return html
}
function turn(s) {
  let arr = s.split(",");
  let ww = '';
  for(let i in arr) ww += arr[i]+"</br>";
  return ww
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
function parseRarity(r) {
  let arr = ['基本','EX','稀有','激稀有','激稀有狂亂','超激稀有'],
      brr = ['B','EX','R','SR','SR_alt','SSR'];

  return arr[brr.indexOf(r)]
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
