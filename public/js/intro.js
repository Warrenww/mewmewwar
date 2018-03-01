$(document).ready(function () {
  var socket = io.connect();
  var rank_data;
  var current_user_data = {};

  // auth.onAuthStateChanged(function(user) {
  //   if (user) {
  //     socket.emit("user connect",user);
  //   } else {
  //     console.log('did not sign in');
  //   }
  // });
  //
  // socket.on("current_user_data",function (data) {
  //   console.log(data);
  //   current_user_data = data ;
  // });

  socket.emit("rankdata");
  socket.on("recive rank data",function (data) {
    // console.log(data);
    rank_data = data;
    for(let i in data)
      $(".dataTable tbody").append("<tr><th>"+i+"</th><td>"+data[i]+"</td></tr>");
  });
  $("#show_all").click(function () {
    $(".dataTable tbody").empty();
    for(let i in rank_data)
      $(".dataTable tbody").append("<tr><th>"+i+"</th><td>"+rank_data[i]+"</td></tr>");
  });
  $("#clear_all").click(function () {$(".dataTable tbody").empty()});

  $(document).on("click",'.tag',function () {
    let name = $(this).attr("id"),
        target = $("#"+name+"_frame"),
        offset = $(".screen")[0].offsetLeft;
    $(this).attr('value',1).siblings().attr("value",0);
    $(".screen").animate({
      scrollLeft:target[0].offsetLeft-offset
    },800);
  });
  var expand = 0 ;
  $(document).on('click','.choose',function () {
    expand = expand?0:1;
    $(this).siblings().css("height",function () {
      if(expand) return 185
      else return 0
    });
    $(this).find("i").css("transform",function () {
      if(expand) return 'rotate(90deg)'
      else return 'rotate(-90deg)'
    });
  });
  $(document).on('click','.choose_panel span',function () {
    $(this).attr("value",1).siblings().attr("value",0);
    $(this).parent().css('height',0).siblings().find("span").text($(this).text())
      .siblings().css('transform','rotate(-90deg)');
    expand = 0;
    let name = $(this).attr("id"),
        target = $("#"+name+"_frame"),
        offset = $(".screen")[0].offsetLeft;
    $(this).attr('value',1).siblings().attr("value",0);
    $(".screen").animate({
      scrollLeft:target[0].offsetLeft-offset
    },800);

  });


  $(document).on("click","th span",function () {
    let val = Number($(this).parent().siblings("td").find("input").val());
    $(this).attr('value',0).siblings().attr('value',1);
    if(val) query('half-plane',val);
  });
  $(document).on("click","td span",function () {
    let val = $(this).text();
    query('keyword',val);
  });
  $(document).on("click",'input',function () {$(this).select();});
  $(document).on("blur",'input',function () {
    let type = $(this).parent().attr('id'),
        val = Number($(this).val());
    if(val>7000||val<0){
      alert('超出範圍');
      $(this).val("");
      return
    }
    query(type,val);

  });
  function query(type,val) {
    $('.select').find('td[id!="'+type+'"]').find("input").val("");
    $('.dataTable tbody').empty();
    let bors = $("#BorS").children('span[value="1"]').text(),
        interval = $("#interval").find("input"),
        arr = [Number(interval.eq(0).val()),Number(interval.eq(1).val())],
        buffer={};
    console.log(type,val,bors,arr);
    let i ;
    for(i in rank_data){
      if(type == 'exact'){
        if(i < val) continue
        else {
          buffer[i] = rank_data[i];
          break
        }
      }
      else if(type == 'half-plane'){
        if((bors == '大於' && i<val )||(bors == '小於' && i>val )) continue
        else buffer[i] = rank_data[i];
      }
      else if (type == 'keyword') {
        if(rank_data[i].indexOf(val)!=-1) buffer[i] = rank_data[i];
      }
      else if(arr[0]&&arr[1]){
        let bb;
        if(arr[0]>arr[1]) {bb = arr[0];arr[0] = arr[1];arr[1] = bb}
        if(i < arr[0]||i > arr[1]) continue
        else buffer[i] = rank_data[i];
      }
    }
    if(type == 'exact') $("#exact").find("input").val(i);
    for(let i in buffer)
      $(".dataTable tbody").append("<tr><th>"+i+"</th><td>"+rank_data[i]+"</td></tr>");
  }


});
