const image_url_icon =  "/css/footage/gameIcon/" ;
const image_url_gacha =  "/css/footage/gacha/" ;
const image_url_stage =  "/css/footage/stage/" ;
const VERSION = "10.37.3"
var is_mobile = screen.width < 768;
var _browser = navigator.userAgent;
var is_ios = _browser.indexOf("iPad") != -1 || _browser.indexOf("iPhone") != -1;
console.log("mobile : ",is_mobile);
console.log("ios : ",is_ios);
const Page = location.pathname.split("/")[1];
const tutorial_version = {
  expCalculator: 1,
  compare: 1,
  stage: 1,
  combo: 1,
  cat: 1
}
const localStore = (function(){
      if(Storage){
        this.storage = {}
        if(localStorage.mewmewwar == undefined){
          localStorage.mewmewwar = "{}";
          localStorage.removeItem("tutorial_stage");
        } else this.storage = JSON.parse(localStorage.mewmewwar)
        this.get = (key) => {return this.storage[key]}
        this.set = (key,value) => {
          this.storage[key] = value;
          localStorage.mewmewwar = JSON.stringify(this.storage)
        }
      } else {
        console.warn("Storage Not Support");
        this.get = (k)=>{}
        this.set = (k,v)=>{}
      }
      return this
    })();

var socket;
$(document).ready(function () {
  socket = io.connect();
  var today = new Date();

  socket.on("cloud message",data=>{alert(data);})

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
    $(this).find("i").css("filter",function () {
      let type = val ? 'brightness(1)' : 'brightness(0.5)';
      return type
    })
  }

  // copy reaction
  $(document).on("click",".copiable",function (e) {
    var text = $(this).text(),
        temp = document.createElement("input");
    document.body.appendChild(temp);
    temp.value = text;
    temp.select();
    document.execCommand('copy');
    setTimeout(()=>{temp.remove();},500);
  });

  // table title reaction
  $('.tableTitle').click(function () {
    let temp = Number($(this).attr("active"));
    if(Number.isNaN(temp)) temp= 0;
    temp = (temp+1)%2;
    $(this).attr('active',temp).next().toggle();
  });

  // left side column reaction
  $(".left-side-active").click(toggle_side_column);

  // panel toggle reaction
  $(document).on("click",".toggle_next",function (e) {
    var temp = Number($(this).next().attr("active")),
        pos = $(this).attr("pos"),
        offsetY = Number($(this).attr("offsetY"));
    if(Number.isNaN(temp)) temp = 0;
    if(Number.isNaN(offsetY)) offsetY = 0;
    temp = (temp+1)%2;
    $(this).next().attr("active",temp);
    $(this).next().css("top",($(this).offset().top - $(document).scrollTop() + offsetY));
    if(pos == "right") $(this).next().css("right",window.innerWidth - $(this).offset().left - 20) ;
    else $(this).next().css("left",$(this).offset().left) ;

    if(temp){
      $("body").append("<div id='panelBG'></div>");
      $("#panelBG").bind("wheel",noWheel);
    } else {
      $("#panelBG").remove();
      $("#panelBG").unbind("wheel",noWheel);
    }
    e.stopPropagation();
  });
  var noWheel = function (e) {
    var isUp = e.originalEvent.deltaY < 0;
    var element = e.target;
    // var element = $(".panel[active='1']")[0];
    // console.log(element.scrollHeight,element.scrollTop,element.clientHeight,isUp);
    // if((element.scrollHeight - element.scrollTop === element.clientHeight) && (!isUp)){
    //   e.preventDefault();
    //   e.stopPropagation();
    //   return false;
    // } else if(element.scrollTop == 0 && isUp){
    //   e.preventDefault();
    //   e.stopPropagation();
    //   return false;
    // }
    if(e.target == $("#panelBG")[0]){
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
  $(document).on("click","#panelBG",function () {
    $(".panel").attr("active",0);
    $(this).remove();
    $(document).unbind("wheel",noWheel);
  });

  // Scroll Reaction
  $(document).on('scroll',function () {
    var pos_y = window.scrollY;
    // console.log(pos_y);
    if($(".display").length){
      var display_y = $(".display").offset().top ;
      if(pos_y > display_y){ $(".displayControl").attr("float",true); }
      else { $(".displayControl").attr("float",false); }
    }
  });

  // tutorial
  var  ver = localStore.get("tutorial") || {};
  if(ver[Page] != tutorial_version[Page]){
    $("body").append( `
      <div class='tutorial'>
        <div class='article'>
          <h2><b>本頁面有新的使用說明囉!</b></h2>
          <div style='display:flex;justify-content:center'>
            <button onclick="switchIframe('document?${Page}')">前往察看</button>
            <button >稍後再看</button>
          </div>
        </div>
      </div>
      `);
    }

  $(document).on("click",".tutorial button",function (e) {
    $(".tutorial").remove();
    var page = location.pathname.split("/")[1],
        temp = localStore.get("tutorial") || {};

    temp[page] = tutorial_version[page];
    localStore.set("tutorial",temp);
  });

  // version check
  checkVersion();
  function checkVersion(){
    socket.emit("check version");
    setTimeout(checkVersion,600000);
  }
  var countDown = 5;
  socket.on("check version",(version)=>{
    // console.log(version,VERSION);
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
            '<span id="countDown" class="flex">5<span>'+
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
    var newVer = version?version.split("."):[Infinity,0,0],
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

//google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-111466284-1');

var snapshotMutex = true;
function snapshot(selector,bgc = "#60e6f9") {
  return new Promise(function(resolve, reject) {
    if(!snapshotMutex) reject();
    snapshotMutex = false;
    var target = $(selector);
    if(target.length == 0) target = $(".display")[0];
    else target = target[0];

    html2canvas(target,{
      backgroundColor:bgc,
      allowTaint:true
    }).then(function(canvas) {
      snapshotMutex = true;
      $('#canvas_holder').css("display",'flex');
      $('#canvas_holder .picture').append(canvas);
      $("#canvas_holder .picture canvas").css("transform",'scale(0,0)');
      setTimeout(function () {
        $("#canvas_holder canvas").css("transform",'matrix(0.75,0,0,0.75,0,0)');
      },100);
      $('#canvas_holder .picture').append("<a class='flex'><i class='material-icons'>cloud_download</i></a>")
      $('#canvas_holder .picture').append("<span id='zoom_in' class='flex'><i class='material-icons'>zoom_in</i></span>")
      $('#canvas_holder .picture').append("<span id='zoom_out' class='flex'><i class='material-icons'>zoom_out</i></span>")
      $('#canvas_holder a').bind("click",function () {
        try {
          canvas.toBlob(blob => {
            // console.log(blob);
            var a = document.createElement('a');
            a.download = 'download.png';
            a.href = URL.createObjectURL(blob);
            console.log(a.href);
            a.click();
          });
        } catch (e) {
          console.log(e);
        }
      });
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
      resolve();
    });
  });
}
$("#canvas_holder").click(function () {
  $(this).hide();
  $(this).children(".picture").empty();
});

function switchIframe(target) {
  if(!target) return;
  var openMethod = "iframe";
  if(Storage){ if(localStorage.openMethod) openMethod = localStorage.openMethod; }
  if((is_ios && openMethod == 'iframe')|| (openMethod == 'iframe' && window.parent.reloadIframe == undefined)) openMethod='_top';
  if(openMethod == "iframe"){
    window.parent.reloadIframe(target);
    window.parent.changeIframe(target);
    return true;
  } else {
    window.open("/"+target,openMethod);
    return false;
  }
}

var openedTable = localStore.get("openedTable");
if(!openedTable) openedTable = {cat:"",enemy:"",stage:""};
if(openedTable[Page] && openedTable[Page] != ""){
  openTable(openedTable[Page]);
}
function openTable(tableName) {
  if(!tableName) return ;
  var target = $(".chooser").find("."+tableName);
  if(!target.length) return;
  target.attr('active',1).siblings('[class*="Table"]').attr('active',0);
  $(".search_type span[onclick*='"+tableName+"']").attr("value",1).siblings().attr("value",0);
  openedTable[Page] = tableName;
  localStore.set("openedTable",openedTable);
}

function scroll_to_div(div,container=null,offset=0){
  if($(container).length == 0) container = $('html,body');
  else container = $(container);
  if(!/\#|\./.test(div)) div = "#"+div;
  container.animate(
    {scrollTop: container.scrollTop()+$(div).offset().top+offset},
    600,'easeInOutCubic');
}
function scroll_to_class(class_name,n=0) {
  $('html,body').animate(
    {scrollTop: $("."+class_name).eq(n).offset().top-100},
    600,'easeInOutCubic');
}
function AddZero(n,e=1) {
  var s = Number(n);
  if(Number.isNaN(s)) return n;
  if(n == 0) e--;
  for(let i = e; i >= 0; i--){
    if (n < 10**(i)) s = "0"+s;
    else return s
  }
  return s
}
function toggle_side_column(e = null,toggle = null,bind = 1) {
  var temp = Number($(".left-side-active").attr('active'));
  if(Number.isNaN(temp)) temp = 0;
  temp = (temp+1)%2;
  if(toggle != null) temp = toggle;
  $(".left-side-column").attr('active',temp);
  $(".left-side-active").attr("active",temp);
  if(temp&&bind) setTimeout(function () {
    $(".left-side-active").parent().append("<div class='side-column-bg'></div>");
    $(".side-column-bg").css({position:"fixed",width:"100%",height:"100%",left:0,top:0,"z-index":2})
    .bind('click',hide_side_column);
  },100);
  else $(".side-column-bg").remove();
}
var hide_side_column = function (e) {
  $(".left-side-column,.left-side-active").attr("active",0);
  $(".side-column-bg").remove();
  return false;
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

  var pivot_index = 1,
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

function createHtml(tag,content=null,attr=null) {
  var attribute="";
  if(typeof(attr)=='object'){
    for(let i in attr){
      attribute += ` ${i}="${attr[i].toString()}"`
    }
  }
  tag = tag.toLowerCase();
  if (tag == 'img') return `<${tag}${attribute}/>` ;
  else return `<${tag}${attribute}>${content}</${tag}>` ;
}
