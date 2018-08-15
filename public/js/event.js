
$(document).ready(function () {
  let url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";
  var site ;
  var socket = io.connect();
  var colorSet=[ '#95CC85', '#EDDB8A', '#FF5959', '#FF9259', '#4ABABB' ];
  var weekArr=['Sun.','Mon.','Tue.','Wed','Thu.','Fri','Sat'];
  var show_jp_cat;
  createCalendar();
  auth.onAuthStateChanged(function(user) {
    if (user)  socket.emit("user connect",{user:user,page:location.pathname});
    else  console.log('did not sign in');
  });
  socket.on("current_user_data",function (data) {
    show_jp_cat = data.setting.show_jp_cat;
    socket.emit('get event date');
    // console.log(data);
  });
  socket.on('true event date',function (data) {
    // console.log(data);
    let now;
    for(let i in data){
      if (i == 'now'||i == 'prev'||i.indexOf('prediction')!=-1) continue
      if(data[i]&&Number(i.substring(4,6))==new Date().getMonth()+1) {
        $('#calendar').find("#"+Number(i.substring(6,8)))
          .addClass('event')
        now = i ;
      }
    }
    appendIframe(now);
    var prediction = show_jp_cat?data.prediction_jp:data.prediction;
    createPredictionQueue(prediction);
    // console.log(src,now);

  });

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
    // console.log(start,end,maxDay,month);

    // console.log(emptyObj);
    var map = [];
    for(let i in data.gachaP){
      let a = data.gachaP[i],
          d = a.date,n = a.name,s = a.sure;
      for(j in d){
        d[j] = d[j].split("/");
        d[j][0] = addZero(d[j][0]);
        d[j][1] = addZero(d[j][1]);
        d[j] = Number(d[j].join(""));
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
        d[j][0] = addZero(d[j][0]);
        d[j][1] = addZero(d[j][1]);
        d[j] = Number(d[j].join(""));
        if(d[j]>end) end = d[j];
        if(d[j]<start) start = d[j];
      }
      let day = d[1]-d[0]+1;
      if(day>30) day = d[1]-(Number(month)+1)*100+Number(month+maxDay)-d[0]+1;
      updateMap(map,0,d[0],day,n,maxDay,month);
    }
    for(i=start;i<=end;i++) {
      if(i>Number(month+maxDay)&&i<(Number(month)+1)*100+1) continue
      table_head+="<th id='"+i+"'>"+todate(i)+"</th>";
      table_head_2+="<th>"+toweek(i,yy)+"</th>";
      for(let j in map){
        if(!map[j][i]) map[j][i] = null;
      }
    }
    // console.log(start,end);
    // console.log(map);
    $("#prediction").append(table_head);
    $("#prediction").append(table_head_2);
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
    $("#prediction").find("#"+mm.toString()+dd.toString()).addClass("today");
  }
  function todate(n) {
    a = n.toString();
    return n<1000?(a[0]+"/"+a[1]+a[2]):(a[0]+a[1]+"/"+a[2]+a[3])
  }
  function toweek(n,y) {
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
  $('#function_tag i').click(function () {
    let type = $(this).attr('id');
    if(type == 'cal'){
      $('.calendar_holder').fadeIn(400).css("display",'flex');
    } else if(type == 'pre'){
      $('.prediction_holder').fadeIn(400).css("display",'flex');
      setTimeout(function () {
        var h = $("#prediction").height(),
            w = $("#prediction td").innerWidth(),
            x = $("#prediction").find(".today").offset().left,
            y = $("#prediction").offset().top;
        console.log(h,w);
        $('.prediction_holder .hightlight').animate({
          height:h,
          width:w,
          top:y,
          left:x
        });
      },500);
    }
  });
  var _size = 1;
  $(".prediction_holder .functionArea i").click(function (e) {
    e.stopPropagation();
    var func = $(this).text().split("_")[1];
    if(func == 'in') _size += .1;
    else _size -=.1;
    $("#prediction,.hightlight").css('transform',"scale("+_size+")");
    $(".hightlight").css("left",$("#prediction").find(".today").offset().left);
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
