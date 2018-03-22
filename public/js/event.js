
$(document).ready(function () {
  let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
  var site ;
  var socket = io.connect();
  var colorSet=[ '#95CC85', '#EDDB8A', '#FF5959', '#FF9259', '#4ABABB' ];
  createCalendar();
  socket.emit('get event date');
  socket.on('true event date',function (data) {
    // console.log(data);
    let now;
    for(let i in data){
      if (i == 'now'||i == 'prev'||i == 'prediction') continue
      if(data[i]) {
        $('#calendar').find("#"+Number(i.substring(6,8)))
          .addClass('event')
        now = i ;
      }
    }
    appendIframe(now);
    createPredictionQueue(data.prediction);
    // console.log(src,now);

  });

  function createCalendar() {
    var today = new Date(),
        month = today.getMonth()+1,
        year = today.getFullYear(),
        firstDay = Date.parse(month+" 1,"+year),
        start = new Date(firstDay).getDay(),
        totalDay = TotalDay(month,year) ;
    var table = "<tr><td colspan='"+start+"'></td>"
    for(i=start;i<=totalDay+start-1;i++){
      let a = i-start+1;
      if(i%7) table += "<td id='"+a+"'>"+a+"</td>";
      else table +=  "</tr><tr><td id='"+a+"'>"+a+"</td>";
    }
    if((totalDay-start+1)%7) table += "<td colspan='"+((totalDay-start+1)%7)+"'></td>";
    $('#calendar').find("th").eq(0).text(year+"年"+month+"月");
    $("#calendar").append(table).attr("value",year+addZero(month))
      .find("#"+today.getDate()).css("border",'5px solid rgb(240, 89, 59)')
  }
  function appendIframe(day) {
    var arr = [],src = url+day+'.html';
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
    var start = data.start.substring(4,8),
        end = data.end.substring(4,8),
        month = start.substring(0,2),
        maxDay = TotalDay(Number(month),data.start.substring(0,4));
    var table_head='<tr>';
    // console.log(start,end,maxDay,month);
    for(i=Number(start);i<=Number(end);i++) {
      if(i>Number(month+maxDay)&&i<(Number(month)+1)*100+1) continue
      table_head+="<th id='"+i+"'>"+todate(i)+"</th>";
      emptyObj[i]=null;
    }
    var map = [];
    for(let i in data.gachaP){
      let row = 0;
      let a = data.gachaP[i],
          d = a.date,n = a.name,s = a.sure;
      d[0] = Number(d[0].split("/").join(""));
      d[1] = Number(d[1].split("/").join(""));
      let day = d[1]-d[0];
      n += s?" (必中)":"";
      updateMap(map,0,d[0],day,n);
    }
    for(let i in data.eventP){
      let row = 0;
      let a = data.eventP[i],
          d = a.date,n = a.name;
      d[0] = Number(d[0].split("/").join(""));
      d[1] = Number(d[1].split("/").join(""));
      let day = d[1]-d[0]+1;
      updateMap(map,0,d[0],day,n);
    }
    // console.log(map);
    $("#prediction").append(table_head);
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
    $("#prediction").append(table_body);
    $('.prediction_holder').find('a').attr('href',data.source);
  }
  function todate(n) {
    a = n.toString();
    return n<1000?(a[0]+"/"+a[1]+a[2]):(a[0]+a[1]+"/"+a[2]+a[3])
  }
  function updateMap(map,i,d0,day,n) {
    var bb = Object.assign({},emptyObj);
    if(!map[i]) map.push(bb);
    for(j=0;j<day;j++){
      if(map[i][(d0+j)]) { i++;updateMap(map,i,d0,day,n);return }
    }
    for(j=0;j<day;j++){
      map[i][(d0+j)] = {name:n,day:day};
    }
  }

  $('.calendar_holder,.prediction_holder').click(function () { $(this).fadeOut(400); });
  $('#calendar td').click(function (e) {
    e.stopPropagation();
    var date = $('#calendar').attr('value')+addZero($(this).attr("id"));
    if($(this).attr("class") == 'event'){
      // console.log(date);
      appendIframe(date);
      $('.calendar_holder').fadeOut(400);
    }
  });
  $(document).on("click",'#function_tag div',function () {
    let type = $(this).attr('id');
    if(type == 'cal'){
      $('.calendar_holder').fadeIn(400).css("display",'flex');
    } else if(type == 'pre'){
      $('.prediction_holder').fadeIn(400).css("display",'flex');
    }
  });
  $('#function_tag div').hover(function () {
    $(this).children('.tag').show(400);
  },function () {
    $(this).children('.tag').hide(400);
  });


  function addZero(n) {
    n = Number(n) ;
    return n < 10 ? "0"+n : n ;
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

});
