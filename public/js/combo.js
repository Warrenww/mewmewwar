var CurrentUserID;
var moreComboData;
$(document).ready(function () {
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      window.parent.location.assign("/");
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

  $('#search_combo').click(function () {
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
    console.log(arr);
    $(".display .dataTable").empty();
    for(let i in arr) $(".display .dataTable").append(comboTR(arr[i]));
    scroll_to_class("display",0) ;
  }) ;
  $(document).on("click",".dataTable i[func='more']",function () {
    let catArr = [];
    let active = Number($(this).attr("value"));
    $("#more_combo").remove();
    $(".dataTable tbody tr").attr("dark",false);

    if(!active){
      $(this).siblings('.card').each(function () {
        catArr.push($(this).attr('value'));
      });
      // alert(catArr);
      socket.emit("more combo",catArr);
      $("<tr id='more_combo'><td colspan='6'><table></table></td></tr>").insertAfter($(this).parents('tr').next());
      var endOfMore = false;
      $(".dataTable:first tbody tr").each(function () {
        if(endOfMore) $(this).attr("dark",true);
        if($(this).attr('id') == "more_combo") endOfMore = true;
      });
      $(this).attr("value",1).parents('tr').siblings().each(function () {
        $(this).find("i").attr("value",0);
      });
    } else {
      $(this).attr("value",0);
    }
  });

  socket.on("more combo",function (data) {
    console.log(data);
    moreComboData = data;
    var target = data[5];
    if(target.length == 5){
      $("#more_combo td table").html(
        "<b style='color:#f16060;font-size:20'>"+
        "已達上限!!!</b>"
      );
      return
    }
    for(let i=data.length-2;i>0;i--) {
      if(data[i].length) $("#more_combo td table").append("<tr><th colspan='6'>重複"+i+"隻貓</th></tr>");
      for(let j in data[i]) {
        if(data[i][j].amount == i) mergeCombo(null,data[i][j]);
        else $("#more_combo td table").append(comboTR(data[i][j],true));
      }
    }
     $("#more_combo td table").append(
       "<tr id='moreSelector'><th>查看其他聯組</th><th colspan=5>"+
       '請選擇類別: <select>'+
         "<option value='0'>角色性能</option>"+
         "<option value='1'>角色特殊能力</option>"+
         "<option value='2'>貓咪城</option>"+
         "<option value='3'>持有金額．工作狂貓</option>"+
         "<option value='4'>戰鬥效果</option>"+
       "</select><select>"+
         "<option value='none'>請選擇效果</option>"+
         "<option value='C0E0'>角色攻擊力UP</option>"+
         "<option value='C0E1'>角色體力UP</option>"+
         "<option value='C0E2'>角色移動速度UP</option>"+
       "</select></th></tr>"
     );
    $("#more_combo").find(".comboPic").each(function () {
      $(this).find('.card').each(function () {
        if(checkList(target,$(this).attr("value"))) $(this).css('border-color','#e78a52');
      });
    });
  });
  $(document).on('change','#more_combo select:first',function () {
    var val = $(this).find(":selected").val();
    $("#more_combo select:last").empty();
    $("#more_combo select:last").append("<option value='none'>請選擇效果</option>");
    $(".select_effect").eq(val).children().each(function () {
      var text = $(this).text();
      $("#more_combo select:last").append("<option value='"+$(this).attr("name")+"'>"+text+"</option>");
    });
  });
  $(document).on('change','#more_combo select:last',function () {
    var val = $(this).find(":selected").val(),clear=false;
    if(val != 'none'){
      $("#more_combo").find("tr").each(function () {
        if(clear) $(this).remove();
        if($(this).attr("id") == "moreSelector") clear = true;
      });
      for(let i in moreComboData[0]){
        if(moreComboData[0][i].id.split("-")[0] == val){
          $("#more_combo td table").append(comboTR(moreComboData[0][i],true));
        }
      }
    }
  });
  $(document).on('click','#more_combo i[func="merge"]',function () {
    mergeCombo($(this));
  });

  $(document).on('click',".searchCombo",function () {
    var target = $(this).attr('val').split(","),
        exist = [];
    for(let i in target){
      if(exist.indexOf(target[i]) != -1) {target.splice(i,1);continue}
      $("#upper_table").find(".button[name='"+target[i]+"']").attr("value",1);
      exist.push(target[i]);
    }
    socket.emit("combo search",{
      uid:CurrentUserID,
      id:target
    }) ;
  });

});
function mergeCombo(This,data=null) {
  var exist = moreComboData[5],
      target = $("#more_combo").prev().prev(),
      outter = This?This.parents("td"):null,
      name = data?data.name:outter.prev().text(),
      catagory = data?data.catagory:outter.prev().prev().text(),
      effect = data?data.effect:outter.parent().next().children("td:last").text(),
      effectId = data?data.id.substring(0,4):outter.parent().next().children("td:last").attr("val");

  if(target.children("td:first").text().indexOf(name) != -1) return
  target.children("td:first").append("</br>"+name);
  if(target.find("th").text().indexOf(catagory) ==-1)
    target.find("th").append("</br>"+catagory);
  target = target.next();
  target.find(".searchCombo").attr("val",function () {
    return $(this).attr("val")+","+effectId
  }).append("</br>"+effect);
  target = target.prev().children(".comboPic").children("div");
  if(!This) return
  This.siblings(".card").each(function () {
    var id = $(this).attr('value').split("-"),flag=true;
    for(let i in exist){
      var temp = exist[i].split("-");
      if(temp[0] == id[0]){
        if(temp[1] >= id[1]) return
        else{
          flag = false;
          target.find('.card[value='+exist[i]+']').remove();
        }
      }
    }
    if(flag) target.find(".seat:last").remove();
    $(this).css("border-color","white").clone().prependTo(target);
  });
  target.find("i").click().click();
}

function checkList(list,id) {
  for(let i in list) if(list[i].substring(0,3) == id.substring(0,3)) return Number(i)+1
  return false
}
function comboTR(item,more=false) {
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
  if(more){
    pic_html += "<i class='material-icons' func='merge' value='0'>merge_type</i></div>" ;
  } else {
    pic_html += "<i class='material-icons' func='more' value='0'>playlist_add</i></div>" ;
  }
  html = screen.width > 768 ?
  ("</tr><tr>"+
  "<th val='"+item.id.substring(0,2)+"'>"+item.catagory+"</th>"+
  "<td>"+item.name+"</td>"+
  "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
  "</tr><tr>"+
  "<td colspan=2 class='searchCombo' val='"+item.id.substring(0,4)+"'>"+item.effect+"</td>") :
  ("</tr><tr>"+
  "<th colspan=2 val='"+item.id.substring(0,2)+"'>"+item.catagory+"</th>"+
  "<td colspan=4 rowspan=2 class='searchCombo' val='"+item.id.substring(0,4)+"'>"+item.effect+"</td>"+
  "</tr><tr>"+
  "<td colspan=2 >"+item.name+"</td>"+
  "</tr><tr>"+
  "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
  "</tr><tr>");
  return html
}
