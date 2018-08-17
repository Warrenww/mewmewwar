var CurrentUserID;
$(document).ready(function () {
  var socket = io.connect();
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    // console.log(data);
    CurrentUserID = data.uid ;
    if(data.last_combo)  socket.emit("combo search",{uid:data.uid,id:data.last_combo}) ;
    for(let i in data.last_combo){
      $(".button[name~='"+data.last_combo[i]+"']").attr('value',1);
    }
  });

  $(document).on('click','#search_combo',function () {
    let A_search = [] ;
    $("#upper_table td").each(function () {
      $(this).children('[value=1]').each(function () {
        A_search.push($(this).attr('name'));
      });
    }) ;
    // console.log(A_search);
    socket.emit("combo search",{
      uid:CurrentUserID,
      id:A_search
    }) ;
  });
  socket.on("combo result",function (arr) {
    // console.log(arr);
    searchCombo(arr);
  }) ;
  $(document).on("click",".dataTable i",function () {
    let catArr = [];
    let active = Number($(this).attr("value"));
    $("#more_combo").remove();
    if(!active){
      $(this).siblings('.card').each(function () {
        catArr.push($(this).attr('value'));
      });
      // alert(catArr);
      socket.emit("more combo",catArr);
      $("<tr id='more_combo'></tr>").insertAfter($(this).parents('tr').next())
      $(this).attr("value",1).parents('tr').siblings().each(function () {
        $(this).find("i").attr("value",0);
      });
    } else {
      $(this).attr("value",0);
    }
  });
  socket.on("more combo",function (data) {
    let target = data.pop();
    // console.log(data);
    // console.log(target);
    if(data.length) $("#more_combo").append("<td colspan='6'><table></table></td>");
    else  $("#more_combo").append("<td colspan='6'><b>此聯組中的所有貓咪皆無出現於其他聯組或數量超過上限</b></td>");
    for(let i in data) $("#more_combo td table").append(comboTR(data[i]));
    $("#more_combo").find(".comboPic").each(function () {
      $(this).find('.card').each(function () {
        if(checkList(target,$(this).attr("value"))) $(this).css('border-color','#e78a52');
      });
    });
  });
  function checkList(list,id) {
    for(let i in list) if(list[i].substring(0,3) == id.substring(0,3)) return Number(i)+1
    return false
  }
  function searchCombo(arr) {
    $(".display .dataTable").empty();
    for(let i in arr) $(".display .dataTable").append(comboTR(arr[i]));
    scroll_to_class("display",0) ;
  }
  function comboTR(item) {
    let html = '',
        pic_html = "<div style='display:flex;position:relative'>" ;
    for(let j in item.cat){
      if(item.cat[j] != "-"){
        pic_html +=
        '<span class="card cat" value="'+item.cat[j]+'" '+
        'style="background-image:url('+
        image_url_cat+item.cat[j]+'.png);'+
        (screen.width > 768 ? "width:90;height:60;margin:5px" : "width:75;height:50;margin:5px")
        +'"></span>' ;
      } else  pic_html += "<span class='seat'>-</span>";
    }
    pic_html += "<i class='material-icons' value='0'>playlist_add</i></div>" ;
    html = screen.width > 768 ?
    ("</tr><tr>"+
    "<th class='searchCombo' val='"+item.id.substring(0,2)+"'>"+item.catagory+"</th>"+
    "<td>"+item.name+"</td>"+
    "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
    "</tr><tr>"+
    "<td colspan=2 class='searchCombo' val='"+item.id.substring(0,4)+"'>"+item.effect+"</td>") :
    ("</tr><tr>"+
    "<th colspan=2 class='searchCombo' val='"+item.id.substring(0,2)+"'>"+item.catagory+"</th>"+
    "<td colspan=4 rowspan=2 class='searchCombo' val='"+item.id.substring(0,4)+"'>"+item.effect+"</td>"+
    "</tr><tr>"+
    "<td colspan=2 >"+item.name+"</td>"+
    "</tr><tr>"+
    "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
    "</tr><tr>");
    return html
  }
});
