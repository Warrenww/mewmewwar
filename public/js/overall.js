const image_url_cat =  "../public/css/footage/cat/u" ;
const image_url_enemy =  "../public/css/footage/enemy/e" ;
const image_url_icon =  "../public/css/footage/gameIcon/" ;
var showcomparetarget = 1 ;
$(document).ready(function () {
  var socket = io.connect();
  var facebook_provider = new firebase.auth.FacebookAuthProvider();
  var filter_name = '';


//coustomer service
  $(document).on("click","#service",function () {
    let url = "https://docs.google.com/forms/d/e/1FAIpQLScz-YlVxBGPGsxWKSMqdBzpRZiDm3BOrmNihRnWZJlHlpGxag/viewform";
    let time = new Date().getTime();
    // window.open(url,"_blank");
    $("body").append(
      "<div id='service_window_holder'>"+
      "<iframe src='"+url+"' id='service_window'></iframe>"+
      "</div>"
    );
  });

  var today = new Date();

  if(screen.width < 769){
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

//compare tag for cat and enemy
  $(document).on('click','#compareTarget_tag',showhidecomparetarget);



  //navigation bar append
  var nav_site_1 = ["cat","enemy","combo","stage"],
      nav_text_1 = ["貓咪資料","敵人資料","查詢聯組","關卡資訊"];
  var nav_site_2 = ["compareCat","calender","event","gacha","intro"/*,"fight"*/],
      nav_text_2 = ["比較貓咪","活動日程","最新消息","轉蛋模擬器","新手專區"/*,"對戰"*/];

  var nav_html_panel = "" ,
      nav_html = '';

  var setting_html = '<a class="current_user_name"></a><div style="display:flex;justify-content:center">'+
      '<i class="material-icons" data-toggle="modal" data-target="#helpModal">info</i>'+
      '<a href="'+(location.pathname == "/"?"/view/":"")+
      'setting.html"><i class="material-icons" id="setting">settings</i></a></div>' ;



  socket.on("connet",function (data) {
    console.log("server ready")
  }) ;


});

$(window).load(function () {
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
      position.top -= 30 ;
        if(active && screen.width > 768){
          $("#TOOLTIP").finish().fadeIn().css("display","flex");
          $("#TOOLTIP").offset(position).width(width).text(value+reverse) ;
        }

    },function () {
      $("#TOOLTIP").fadeOut();
  });
  $(".slider").slider();
  $(".slider").on("slide", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });
  $(".slider").on("slidechange", function(e,ui) {
    $(this).parent().siblings('td.value_display').html(ui.value);
  });
  $(document).on("click","#service_window_holder",function () {
    $(this).fadeOut();
    setTimeout(function () {$(this).remove()},500);
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
function showhidecomparetarget() {
  $('.compare_panel').css('height',0);
  if(showcomparetarget){
    $('.compareTarget_holder').css('left',0);
    $('#compareTarget_tag').css('left',180).children('i').css({"transform":"rotate(180deg)"});
  } else {
    $('.compareTarget_holder').css('left',-180);
    $('#compareTarget_tag').css('left',0).children('i').css({"transform":"rotate(0deg)"});
  }
  showcomparetarget = showcomparetarget ? 0 : 1 ;
}
function scroll_to_div(div_id){
  $('html,body').animate(
    {scrollTop: $("#"+div_id).offset().top-100},
    1000,'easeInOutCubic');
}
function scroll_to_class(class_name,n) {
  $('html,body').animate(
    {scrollTop: $("."+class_name).eq(n).offset().top},
    1000,'easeInOutCubic');
}
function AddZero(n) {
  return n<10 ? "0"+n : n
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
