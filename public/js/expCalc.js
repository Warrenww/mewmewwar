var EXPDATA;
$(document).ready(function () {


});
var xmlhttp = new XMLHttpRequest() ;
var url = "./data/exp.json";

xmlhttp.open("GET", url, true);
xmlhttp.send();
xmlhttp.onreadystatechange = function(){
  if (this.readyState == 4 && this.status == 200){
    EXPDATA = JSON.parse(this.responseText) ;
    var active;
    if(typeof(Storage)){
      if(localStorage.active){
        active = localStorage.active;
      } else {
        active = "R";
        localStorage.active = "R";
      }
    } else {
      console.log("browser don't support local storage");
      active = "R";
    }
    $("#select_rarity span[id='"+active+"']").click();
  }
}
var RarityName = {'R':'稀有','SR':'激稀有','SSR':'超激稀有'}
function changeDataTable(active) {
  $("#select_rarity span[id='"+active+"']").siblings().attr("value",0);
  $(".dataTable tbody").empty();
  $(".dataTable tbody").append(function () {
    var html = '';
    for(let j in EXPDATA[active]){
      html += "<tr><th>"+j+" > "+(Number(j)+1)+"</th>"+
      "<td>"+EXPDATA[active][j].xp+"</td>"+
      "<td>"+EXPDATA[active][j].eye+"</td></tr>";
    }
    return html
  });
  $("h3 span").text(RarityName[active]);
  localStorage.active = active;
}
function Calculate() {
  var lower = Number($("#interval input").eq(0).val()),
      upper = Number($("#interval input").eq(1).val()),
      totalexp = Number($("#xp2lv input").eq(0).val()),
      startLv = Number($("#xp2lv input").eq(1).val()),
      type = Number($("#start").attr("type"))%2,
      active = $("#select_rarity span[value='1']").attr("id");
  if(upper == 0) upper = 50;
  if(upper<lower) [upper,lower] = [lower,upper];
  if(upper > 50) upper = 50;
  if(lower < 0) lower = 0;
  if(totalexp < 0) totalexp = 0;
  else if(totalexp > 1e8-1) totalexp = 1e8-1;
  if(startLv < 0) startLv = 0;
  else if(startLv > 50) startLv = 50;
  upper = Number(upper.toFixed(0));
  lower = Number(lower.toFixed(0));
  totalexp = Number(totalexp.toFixed(0));
  startLv = Number(startLv.toFixed(0));
  $("#interval input").eq(0).val(lower);
  $("#interval input").eq(1).val(upper);
  $("#xp2lv input").eq(0).val(totalexp);
  $("#xp2lv input").eq(1).val(startLv);
  console.log(lower,upper,active,totalexp,startLv,type);
  var data = EXPDATA[active],
      expSum = 0,
      eyeSum = 0;
  if(type){
    while(totalexp - data[startLv].xp > 0){
      totalexp -= data[startLv].xp;
      eyeSum += data[startLv].eye;
      startLv ++;
      if(startLv >= 50) break
    }
    console.log(startLv,totalexp,eyeSum);
    $("#result_2").show().find("td").children().eq(0).text(startLv).next().text(totalexp)
    .next().attr("src",function () {
      return "./css/footage/gameIcon/eye_"+active+".png"
    }).next().text(eyeSum);
    $("#result").hide();
  } else {
    for(let i in data){
      if(i<lower||i>upper-1) {
        $(".dataTable tbody tr").eq(i).hide();
        continue
      }
      $(".dataTable tbody tr").eq(i).show();
      expSum += data[i].xp;
      eyeSum += data[i].eye;
    }
    console.log(eyeSum,expSum);
    $("#result").show().find("td").children().eq(0).attr("src",function () {
      var src = "./css/footage/gameIcon/xp_";
      if (expSum < 5001) src += 5000;
      else if (expSum < 10001) src += 10000;
      else if (expSum < 30001) src += 30000;
      else src += 100000;
      return src+".png"
    }).next().text(expSum).next().attr("src",function () {
      return "./css/footage/gameIcon/eye_"+active+".png"
    }).next().text(eyeSum);
    $("#result_2").hide();
  }
}
function switchCalc() {
  $("#interval").toggle().next("td").toggle();
  $("#start").attr("type",function () {
    return Number($(this).attr("type"))+1
  });
}
