const eventURL = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
var colorSet=[ '#95CC85', '#EDDB8A', '#FF5959', '#FF9259', '#4ABABB' ];
var weekArr=['Sun.','Mon.','Tue.','Wed','Thu.','Fri','Sat'];

function createCalendar() {
  var today = new Date(),
      month = today.getMonth()+1,
      year = today.getFullYear(),
      firstDay = Date.parse(month+" 1,"+year),
      start = new Date(firstDay).getDay(),
      totalDay = TotalDay(month,year) ;
  var table = "<tr>"+(start?("<td colspan='"+start+"'></td>"):"");
  for(i=start;i<=totalDay+start-1;i++){
    let a = i-start+1;
    if(i%7) table += "<td id='"+a+"'>"+a+"</td>";
    else table +=  "</tr><tr><td id='"+a+"'>"+a+"</td>";
  }
  if(7-(totalDay+start)%7) table += "<td colspan='"+(7-(totalDay+start)%7)+"'></td>";
  $('#calendar').find("th").eq(0).text(year+"年"+month+"月");
  $("#calendar").append(table).attr("value",year+AddZero(month))
    .find("#"+today.getDate()).css("border",'5px solid rgb(240, 89, 59)')
}
function appendIframe(day) {
  var arr = [],src = eventURL+day+'.html';
  $('.iframe_holder').find('iframe').each(function () { arr.push($(this).attr("id")); });
  if(arr.indexOf(day)==-1){
    $('.iframe_holder').append("<iframe src='"+src+"' id='"+day+"'></iframe>")
      .find('#'+day).css('right','0%').siblings().css('right','-100%');
  } else {
    $('.iframe_holder').find('#'+day).css('right','0%').siblings().css('right','-100%');
  }
}

var emptyObj={};
function createPredictionQueue(data) {
  $("#prediction").empty();
  // console.log(data);
  var start = data.start.substring(4,8),
      end = data.end.substring(4,8),
      month = start.substring(0,2),
      maxDay = TotalDay(Number(month),data.start.substring(0,4)),
      yy = new Date().getFullYear(),
      mm = new Date().getMonth()+1,
      dd = new Date().getDate();
  var table_head='<tr>',
      table_head_2='<tr>';
  start = Number(start);end = Number(end)
  console.log(start,end,maxDay,month);

  // console.log(emptyObj);
  var map = [];
  for(let i in data.gachaP){
    let a = data.gachaP[i],
        d = a.date,n = a.name,s = a.sure;
    for(j in d){
      d[j] = d[j].split("/");
      d[j][0] = AddZero(d[j][0]);
      d[j][1] = AddZero(d[j][1]);
      d[j] = Number(d[j].join(""));
      // console.log(start,end,d[j]);
      if(start > 1200 && d[j]<200) d[j] += 1200;
      if(d[j]>end) end = d[j];
      if(d[j]<start) start = d[j];
    }
    let day = d[1]-d[0];
    if(day>30) day = d[1]-(Number(month)+1)*100+Number(month+maxDay)-d[0];
    n += s?" (必中)":"";
    updateMap(map,0,d[0],day,n,maxDay,month);
  }
  for(let i in data.eventP){
    let a = data.eventP[i],
        d = a.date,n = a.name;
    for(j in d){
      d[j] = d[j].split("/");
      d[j][0] = AddZero(d[j][0]);
      d[j][1] = AddZero(d[j][1]);
      d[j] = Number(d[j].join(""));
      // console.log(start,end,d[j]);
      if(start > 1200 && d[j]<200) d[j] += 1200;
      if(d[j]>end) end = d[j];
      if(d[j]<start) start = d[j];
    }
    let day = d[1]-d[0]+1;
    if(day>30) day = d[1]-(Number(month)+1)*100+Number(month+maxDay)-d[0]+1;
    updateMap(map,0,d[0],day,n,maxDay,month);
  }
  // console.log(start,end);
  month = AddZero(start,3).toString().substring(0,2);
  maxDay = TotalDay(Number(month),data.start.substring(0,4));
  for(let i=start;i<=end;i++) {
    if(i>Number(month+maxDay)&&i<(Number(month)+1)*100+1) continue
    table_head+="<th id='"+i+"'>"+todate(i>1300?i-1200:i)+"</th>";
    table_head_2+="<th>"+toweek(i>1300?i-1200:i,i>1300?yy+1:yy)+"</th>";
    for(let j in map){
      if(!map[j][i]) map[j][i] = null;
    }
  }
  // console.log(start,end);
  // console.log(map);

  var table_body='';
  for(let i in map){
    let html = "<tr>",exist='';
    for(let j in map[i]){
      if(map[i][j]){
        if(map[i][j].name!=exist){
          color = colorSet[Math.floor(Math.random()*5)];
          html += "<td colspan='"+map[i][j].day+"' style='background-color:"+color
                  +"'>"+map[i][j].name+"</td>";
          exist = map[i][j].name;
        }
      } else html += "<td></td>";
    }
    table_body+=html;
  }

  return table_head + table_head_2 + table_body;
}
function todate(n) {
  a = n.toString();
  return n<1000?(a[0]+"/"+a[1]+a[2]):(a[0]+a[1]+"/"+a[2]+a[3])
}
function toweek(n,y) {
  // console.log(n,y);
  n = n>1000?n.toString():"0"+n.toString();
  var w = new Date(Date.parse([n.substring(0,2),n.substring(2,4),y])).getDay();
  return weekArr[w]
}
function updateMap(map,i,d0,day,n,maxDay,month) {
  var bb = Object.assign({},emptyObj);
  if(!map[i]) map.push(bb);
  for(j=0;j<day;j++){
    let aa = d0+j;
    if (aa%100>maxDay){
      aa = aa-Number(month+maxDay)+(Number(month)+1)*100;
    }
    if(map[i][(aa)]) { i++;updateMap(map,i,d0,day,n,maxDay,month);return }
  }
  for(j=0;j<day;j++){
    let aa = d0+j;
    if (aa%100>maxDay){
      aa = aa-Number(month+maxDay)+(Number(month)+1)*100;
    }
    map[i][(aa)] = {name:n,day:day};
  }
}
function TotalDay(m,y) {
  if (m!=2){
    m = m>7?((m+1)%2):(m%2);
    return m?31:30
  } else {
    y = y%400?(y%100?(y%4?0:1):0):1;
    return y?29:28
  }
}
var controlLR = function (e) {
  // console.log(e);
  var holder = $(".prediction_holder");
  if(e.keyCode == 39){ // right
    holder.animate({
      scrollLeft: holder.scrollLeft()+50
    });
  } else if(e.keyCode ==37){ // left
    holder.animate({
      scrollLeft: holder.scrollLeft()-50
    });
  }
  $(document).unbind('keydown',controlLR);
  setTimeout(function () {
    $(document).bind('keydown',controlLR);
  },300);
}
