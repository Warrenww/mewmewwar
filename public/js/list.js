var list = { upper:[],lower:[] };
var current_editing_list = null;
var current_user_id, current_search = [] ;
$(document).ready(function () {

  var tip_fadeOut;
  var changeFunctions_v = 0;
  var removeStageBind = [];

  auth.onAuthStateChanged(function(user) {
    if (user)  socket.emit("user connect",{user:user,page:location.pathname});
    else  console.log('did not sign in');
  });
  socket.on("current_user_data",function (data) {
    // console.log(data);
    current_user_id = data.uid;
      if(data.list){
        $("#display_pannel").find('h1').hide();
        $(".list_display_holder").remove();
        for(let i in data.list){
          AddList(i,data.list[i]);
        }
      }
  });
  $(".slider").slider();

//-----------------------------------------------------------------------------
  $('.filter_option').click(function () {
    $("#slider_holder").show();
    $(this).css('border-bottom','5px solid rgb(241, 166, 67)').siblings().css('border-bottom','0');
    filter_name = $(this).attr('id') ;
    filterSlider($(this));
  });
  var filter_org ;
  $(document).on('click','.value_display,#level_num',function () {
      filter_org = Number($(this).text());
      $(this).html('<input type="number" value="' +filter_org+ '"></input>').find('input').select();
  });
  $(document).on('blur','.value_display input',changeSlider) ;
  $(".select_ability").find(".ability_icon").each(function () {
    let name = $(this).attr("id");
    $(this).css("background-image","url('"+image_url_icon+name+".png')");
  });
  var sortable_item ;

  $(document).on('click','.glyphicon-refresh',toggleCatStage);
  function toggleCatStage() {
    somethingChange();
    let group = $(this).parent(),
        current = group.children(".card:visible").next('.card').attr('value');
    if(group.children(".card").length>1) group.css("transform","rotateY(90deg)");
    setTimeout(function () {
      group.css("transform","rotateY(0)");
      if(current != undefined){
        group.children(".card:visible").hide().next('.card').show();
        group.css('transform','');
      }
      else{
        current = group.children(".card:visible").hide().parent().children('.card').eq(0).show().attr("value");
        group.css('transform','');
      }
      if(checkList(list.upper,current)){
        let n = checkList(list.upper,current)-1;
        $("#list_p1 .card").eq(n).attr('value',current)
        .css('background-image','url(\"'+image_url_cat+current+".png\")");
      }
      if(checkList(list.lower,current)){
        let n = checkList(list.lower,current)-1;
        $("#list_p2 .card").eq(n).attr('value',current)
        .css('background-image','url(\"'+image_url_cat+current+".png\")");
      }
    },300);
  }
  function changeSlider() {
    let target = $("#"+filter_name+".filter_option");
    let range = JSON.parse(target.attr('range')),
        step = Number(target.attr('step')),
        value = Number($(this).val()),
        type = Number(target.attr("type"));

    value = Math.round(value/step)*step ;

    if(value && value<range[1] && value>range[0]) $("#slider_holder").find('.slider').slider('option','value',value);
    else $("#slider_holder").find('.slider').slider('option','value',filter_org);
  }
  socket.on("combo result",function (arr) {
    searchCombo(arr);
  }) ;
  function searchCombo(arr) {
    $(".dataTable").empty();
    let html = "" ;
    for(let i in arr){
        // console.log(arr[i].id);
        let pic_html = "<div style='display:flex'>" ;
        for(let j in arr[i].cat){
          // console.log(arr[i].cat[j])
          if(arr[i].cat[j] != "-"){
            pic_html +=
            '<span class="card" value="'+arr[i].cat[j]+'" '+
            'style="background-image:url('+
            image_url_cat+arr[i].cat[j]+'.png);'+
            (screen.width > 768 ? "width:90;height:60;margin:5px" : "width:75;height:50;margin:0px")
            +'"></span>' ;
          }
        }
        pic_html += "</div>" ;
        html = screen.width > 768 ?
                ("</tr><tr>"+
                "<th class='searchCombo' val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
                "<td>"+arr[i].name+"</td>"+
                "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
                "</tr><tr>"+
                "<td colspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>") :
                ("</tr><tr>"+
                "<th colspan=2 class='searchCombo' val='"+arr[i].id.substring(0,2)+"'>"+arr[i].catagory+"</th>"+
                "<td colspan=4 rowspan=2 class='searchCombo' val='"+arr[i].id.substring(0,4)+"'>"+arr[i].effect+"</td>"+
                "</tr><tr>"+
                "<td colspan=2 >"+arr[i].name+"</td>"+
                "</tr><tr>"+
                "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
                "</tr><tr>");
          $(".dataTable").append(html);

    }
    $(".display").show();
  }
//------------------------------------------------------------------------------

  $(document).on("click",'.display',function () { $(this).hide(); });
  $(document).on('click','.comboPic',function (e) {
    // console.log(e);
    e.stopPropagation();
    let arr = [];
    $(this).find('.card').each(function () { arr.push($(this).attr("value")); });
    let Toomore = list.upper.length+arr.length;
    for(let i in arr){
      let u = checkList(list.upper,arr[i]),
          d = checkList(list.lower,arr[i]);
      // console.log(arr[i],u,d,Toomore&&!u);
      if(u) $("#list_p1 .card").eq(u-1).remove();
      if(d) $("#list_p2 .card").eq(d-1).remove();
      if(Toomore>5&&!u) $("#list_p1 .card:last").remove();
      else if(!u) $("#list_p1 .seat:visible").first().hide();
      $('<span class="card" value="'+arr[i]+'" detail="cost" style="background-image:url('+ image_url_cat+arr[i]+'.png)"></span>')
      .prependTo($("#list_p1"));
      somethingChange()
      Toomore -- ;
    }
    if(!e.ctrlKey) $('.display').hide();
  });

  $(document).on('click','.compareSorce .card',function () {
    let id = $(this).attr('value');
    if(checkList(list.upper,id)||checkList(list.lower,id)) return
    if(list.upper.length<5) {
      $(this).clone().prependTo($("#list_p1"));
      $("#list_p1 .seat:visible").first().hide();
      somethingChange();
    } else if(list.lower.length<5){
      $(this).clone().prependTo($("#list_p2"));
      $("#list_p2 .seat:visible").first().hide();
      somethingChange();
    }
  });
  $('#trash').sortable();
  $('#list_p1,#list_p2').sortable({
    items:'.card',
    opacity:.5,
    connectWith:'#list_p1,#list_p2,#trash',
    update:somethingChange,
    containment:"#edit_pannel",
    scroll:false,
  });
  $('#list_p1,#list_p2').on('sortover',function (e,ui) {$(this).children('.seat:visible').first().css('opacity',.5);});
  $('#list_p1,#list_p2').on('sortout',function (e,ui) {$(this).children('.seat:visible').first().css('opacity',1);});

  $('#list_p1').on('sortreceive',function (e,ui) {
    let id = ui.item.attr("value");
    if(ui.sender.attr("id")!='list_p2'){
       sortable_item.appendTo(ui.sender).show();
       if(checkList(list.upper,id)||checkList(list.upper,id)){ ui.item.remove();  return}
       else if(list.upper.length>=5){
         if(list.lower.length<5) appendCard(2,ui.item);
         else if(ui.item.next().attr('value')) ui.item.next().remove();
         else ui.item.remove();
         list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
         return
       }
       appendCard(1,ui.item);
     }
    else{
     // if(list.upper.length>=5){
       $("#list_p1 .card").last().clone().prependTo($("#list_p2"));
       $("#list_p1 .card").last().remove();
       $('#list_p2').children('.seat:visible').last().hide();
       list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
       list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
       // appendCard(1,ui.item);
     // } else appendCard(2,ui.item);
     return
    }

  });

  $('#list_p2').on('sortreceive',function (e,ui) {
    let id = ui.item.attr("value");
    if(ui.sender.attr("id")!='list_p1'){
      sortable_item.appendTo(ui.sender).show();
      if(checkList(list.upper,id)||checkList(list.lower,id)){ ui.item.remove(); return }
      else if(list.upper.length<5) { appendCard(1,ui.item); return}
      if(list.lower.length>=5){
        if(ui.item.next().attr('value')) ui.item.next().remove();
        else ui.item.remove();
        list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
        return
      }
      appendCard(2,ui.item);
      // else ui.item.remove();
    }
    else {
      if(list.upper.length>=4){
        $("#list_p2 .card").first().clone().appendTo($("#list_p1"));
        $("#list_p2 .card").first().remove();
        $('#list_p1').children('.seat:visible').last().hide();
        list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
        list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
        // appendCard(2,ui.item);
      }else appendCard(1,ui.item);
      return
    }
  });

  $("#trash").on("sortover",function (e,ui) { $(this).find("i").css('color','#e0ad3b') });
  $("#trash").on("sortout",function (e,ui) { $(this).find("i").css('color','#b4b4b4') });
  $('#list_p1,#list_p2').on("sortbeforestop",function () {
    list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
    list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
  });
  $('#list_p1,#list_p2').on("sortstop",somethingChange);
  $('#list_p1,#list_p2').on('sortremove',function (e,ui) {
    $(this).children('.seat:hidden').last().show().css("opacity",1);
  });
  $("#trash").on("sortreceive",function (e,ui) {
    ui.item.remove();
    $(this).find("i").css('color','#b4b4b4') ;
    if(list.upper.length<5 && list.lower.length)
      $("#list_p2").children(".seat:hidden").last().css("opacity",1).show()
          .siblings(".card:first").appendTo($("#list_p1")).siblings(".seat").hide();
    somethingChange();
  });

  function checkList(list,id) {
    for(let i in list) if(list[i].substring(0,3) == id.substring(0,3)) return Number(i)+1
    return false
  }
  function appendCard(n,card) {
    // alert(n)
    if(n == 1) pos = 'upper';
    else pos = 'lower';
    if(list[pos].length) card.insertAfter($('#list_p'+n+' .card').last());
    else card.prependTo($('#list_p'+n));
    $('#list_p'+n).children('.seat:visible').first().hide();
    list[pos] = $("#list_p"+n).sortable("toArray",{attribute:'value'});
    // console.log(list);
  }

  $(document).on('dblclick',"#list_p1 .card,#list_p2 .card",function () {
    let id = $(this).attr("value");
    socket.emit("text search",{key:id.substring(0,3),type:'cat'});
  });

  var org_name = '';
  $("#listname").click(function () {
      org_name = $(this).text();
      $(this).html("<input type='text' style='color:black' id='editListName' value='"+org_name+"' />")
      .find("input").select();
      somethingChange();
  });
  $(document).on('blur','#editListName',function () { $(this).parent().html($(this).val()); });
  $(document).on('keyup','#editListName',function (e) { if(e.keyCode === 27) $(this).val(org_name).blur(); });
  var save_fail;
  $("#save").click(Save);
  function Save() {
    $("#save").attr('state',1);
    let name = $("#listname").text(),
        note = $("#edit_function").find("textarea").val(),
        stageBind = [];
    list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
    list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
    // console.log(name,list,note);
    $(".stageselectholder").each(function () {
      let chapter = $(this).find('select').eq(0).find(":selected"),
          stage = $(this).find('select').eq(1).find(":selected"),
          level = $(this).find('select').eq(2).find(":selected");
      if(chapter.val()!='none'&&stage.val()!='none'&&level.val()!='none'){
        stageBind.push({
          id:[chapter.val(),stage.val(),level.val()].join("-"),
          name:[chapter.text(),stage.text(),level.text()].join("-")
        });
      }
    });
    // console.log(stageBind);
    socket.emit("save list",{
      uid:current_user_id,removeStageBind,
      name, list, note, stageBind,
      'public':$("#public").prop('checked'),
      key : current_editing_list
    });
    removeStageBind = [];
    save_fail = setTimeout(function () { $('#save').attr('state',0); },10000);
  }
  $("#clear").click(function () {
    if(confirm("確定要清空出陣列表?!")){
      $("#list_p1,#list_p2").find('.seat').show().siblings(".card").remove();
      somethingChange();
    }
  });
  $("#sortCost").click(function () {
    $("#list_p1 .card").each(function () {
      let _this = $(this),
          _cost = Number(_this.attr("cost")) ;
      $("#list_p1 .card").each(function () {
        let This = $(this),
            Cost = Number(This.attr("cost")) ;
        if(Cost<_cost) This.insertBefore(_this);
      });
    });
    $("#list_p2 .card").each(function () {
      let _this = $(this),
          _cost = Number(_this.attr("cost")) ;
      $("#list_p2 .card").each(function () {
        let This = $(this),
            Cost = Number(This.attr("cost")) ;
        if(Cost<_cost) This.insertBefore(_this);
      });
    });
    somethingChange();
  });
  $("#up_stage").click(function () {
    $("#list_p1,#list_p2").children(".card").each(function () {
      let cat = $(this).attr("value").split("-")[0],
          bro = $(this).attr("bro");
      // console.log(cat,bro);
      if(!cat) return
      $(this).attr({
        "value":cat+"-"+bro,
        "style":"background-image:url('"+image_url_cat+cat+"-"+bro+".png')"
      });
    });
    somethingChange();
  });
  $("#switchLv").click(function () {
    let show = $(this).prop("checked");
    $(".list_holder .card").attr("detail",function () { return show?'lv':'cost' });
  })
  $("#public").click(somethingChange)
  socket.on("list save complete",function (data) {
    $("#edit_function h3 span.color").css("color",'#62cb26');
    clearTimeout(save_fail);
    $("#combo").empty();
    $(window).unbind("beforeunload", dontload);
    current_editing_list = data.key;
    // console.log(data);
    let combo = data.combo,
        exist_combo = [],
        detail = data.list;
    for(let i in combo){
      $("#combo").append(
        "<li id='"+combo[i].id+"'cat='"+JSON.stringify(combo[i].cat)+"'>"+
        "<span>"+combo[i].catagory+
        "</span><span>"+combo[i].name+
        "</span><span>"+combo[i].effect+
        "</span></li>");
    }
    for (let i in detail.upper)
      for(let j in detail.upper[i])
        $("#list_p1").children('.card').eq(i).attr(j,detail.upper[i][j]);
    for (let i in detail.lower)
      for(let j in detail.lower[i])
        $("#list_p2").children('.card').eq(i).attr(j,detail.lower[i][j]);
    $('#save').attr('state',2);
    $(".list_display_holder[id='"+data.key+"']").remove();
    AddList(data.key,data);
  });
  $("#edit_function textarea").keypress(function () {
    if(Number($("#save").attr("state")) == 2) somethingChange();
  });
  var blinkBorder;
  $(document).on("click","#combo li",function () {
    $("#list_p1 .card").removeClass("find");
    clearTimeout(blinkBorder);
    let target = JSON.parse($(this).attr("cat"));
    // console.log(target);
    for(let i in target)
      if(target[i] != '-')
        $("#list_p1 .card").eq(checkList(list.upper,target[i])-1).addClass("find");
    blinkBorder = setTimeout(function () {
      $("#list_p1 .card").removeClass("find");
    },3000);
  });
  function somethingChange() {
    list.upper = $("#list_p1").sortable("toArray",{attribute:'value'});
    list.lower = $("#list_p2").sortable("toArray",{attribute:'value'});
    $('#save').attr('state',0);
    $(window).bind("beforeunload",dontload);
    $("#edit_function h3 span.color").css("color",'#fb6221');
  }
  $("#close_edit").click(function () {
    if(Number($("#save").attr("state")) == 0) $("#close_alert").show().css("display",'flex');
    else {
      $("#edit_pannel").css("left","-100%").next().css('left',"0");
      $(this).hide().next().show();
      initialEditPannel();
    }
  });
  $("#close_alert button").click(function () {
    let type = $(this).attr("id");
    if(type == 'cancel') {$("#close_alert").hide();return}
    else if(type == 'discard'){ initialEditPannel(); }
    else if(type == 'savechange'){
      Save();
      $("#close_alert").hide();
      setTimeout(initialEditPannel,500);
    }
    $("#edit_pannel").css("left","-100%").next().css('left',"0");
    $("#close_edit").hide().next().show();
  });
  function initialEditPannel(key=null) {
    $("#list_p1 .card,#list_p2 .card").remove();
    $("#list_p1 .seat,#list_p2 .seat").show().css('opacity',1);
    $("#save").attr("state",2); $("#switchLv").prop("checked",0); $("#combo").empty();
    $("#public").prop("checked",1);
    $('#edit_pannel textarea').val("");  $("#listname").text('新出陣列表');
    $(".stageselectholder:not(:last)").remove();
    $(".stageselectholder:last").attr('no',0);
    $(window).unbind("beforeunload", dontload);
    $("#close_alert").hide(); list.upper = []; list.lower = [];
    current_editing_list = key;removeStageBind=[];
  }
  $(document).on('click',".stageselectholder i[function='addnew']",function () {
    $(this).parent().clone().insertAfter($(this).parent()).attr("no",function () {
      return Number($(this).attr("no"))+1;
    });
    $(this).css('transform','rotate(135deg)')
      .attr({"function":"remove"}).next().prop('disabled',false).prev();
    somethingChange();
  });
  $(document).on('click',".stageselectholder i[function='remove']",function () {
    console.log($(this).parent().find("i:last").attr('stage'));
    removeStageBind.push($(this).parent().find("i:last").attr('stage'));
    $(this).parent().remove();
    somethingChange();
  });
  var activeNo = 0;
  $(document).on('change','.selectChapter',function () {
    let chapter = $(this).find(":selected").val();
    activeNo = $(this).parent().attr("no");
    socket.emit("required stage name",chapter);
    somethingChange();
  });
  socket.on("stage name",function (data) {
    let target =  $(".stageselectholder[no='"+activeNo+"']");
    target.find('.selectStage').empty().append("<option value='none'>選擇大關</option>");
    target.find('.selectStage').prop("disabled",false);
    for( let i in data ) target.find('.selectStage').append("<option value='"+ data[i].id+"'>"+data[i].name+"</option>");
  });
  $(document).on('change','.selectStage',function () {
    let chapter = $(this).prev().find(":selected").val();
        stage = $(this).find(":selected").val();
    activeNo = $(this).parent().attr("no");
    socket.emit("required level name",{chapter:chapter,stage:stage});
    somethingChange();
  });
  socket.on("level name",function (data) {
    // console.log(data);
    let target =  $(".stageselectholder[no='"+activeNo+"']");
    target.find('.selectLevel').empty().append("<option value='none'>選擇關卡</option>");
    target.find('.selectLevel').prop("disabled",false);
    for( let i in data.name )
      target.find('.selectLevel').append("<option value='"+ data.name[i].id+"'>"+data.name[i].name+"</option>");
  });
  $(document).on('change','.selectLevel',function () {
    let chapter = $(this).prev().prev().find(":selected").val();
        stage = $(this).prev().find(":selected").val(),
        level = $(this).find(":selected").val();
    $(this).next().attr('stage',[chapter,stage,level].join("-"));
    somethingChange();
  });
  $(document).on("click",".stageselectholder i[function='open']",function () {
    let stage = $(this).attr("stage").split("-");
    socket.emit("required level data",{
      uid: current_user_id,
      chapter:stage[0],
      stage:stage[1],
      level:stage[2]
    });
    window.parent.reloadIframe('stage');
  });
//---------------------------------------------------------------------------------------
  $("#new_list").click(function () {
    $("#edit_pannel").css("left",0).next().css('left',"100%");
    $(this).hide().prev().show();
  });
  function AddList(key,data) {
    // console.log(key,data);
    let list = data.list?data.list:{upper:[],lower:[]};
    $(".display_pannel h1").hide();
    $("#display_pannel .content").prepend(
      "<div id='"+key+"' class='list_display_holder' public='"+data.public+"'>"+
      "<div class='list_display'>"+appendCat(list.upper)+appendCat(list.lower)+"</div>"+
      "<div class='list_data'>"+"<h3>"+data.name+"</h3>"+
      "<div class='list_detail'>"+
      "<span class='combo'>發動聯組 : <b>"+appendCombo(data.combo)+"</b></span>"+
      "<span>連結關卡 : </span>"+
      "<span class='stage'><b>"+appendStage(data.stageBind)+"</b></span>"+
      "<span>備註 : </span>"+
      "<span class='note'><b>"+data.note.split("\n").join("<br>")+"</b></span>"+
      "</div>"+
      "</div>"+
      "<div class='option'>"+
      "<i class=\"material-icons\"id='edit'text='編輯'>create</i>"+
      "<i class=\"material-icons\"id='del'text='刪除'>delete</i>"+
      "<i class=\"material-icons\"id='analyze'text='分析'>pie_chart</i>"+
      "</div>"+
      "</div>"
    )
  }
  function appendCat(list) {
    let html = "<div>",count=0;
    for(let i in list){
      html +=
      '<span class="card" value="'+list[i].id+'"'+
      'style="background-image:url(\''+image_url_cat+list[i].id+'.png\')"'+
      'cost="'+list[i].cost+'"lv="'+list[i].lv+'"bro="'+list[i].bro+'" detail="cost"></span>';
      count++;
    }
    for(let i=count;i<5;i++){
      html += "<span class='seat'>-</span>"
    }
    html += "</div>"
    return html
  }
  function appendCombo(combo) {
    let html = "";
    for(let i in combo) html += "<span data='"+JSON.stringify(combo[i])+"'>"+combo[i].effect+"</span> / ";;
    return html.substring(0,html.length-2)
  }
  function appendStage(stage=[]) {
    let html = "";
    for(let i in stage) html += "<span id='"+stage[i].id+"'>"+stage[i].name+"</span><br>";
    if(stage.length) return html
    else return "無"
  }
  $(document).on('click',".list_display_holder .option #edit",function () {
    let target = $(this).parents('.list_display_holder'),
        key = target.attr("id");
    initialEditPannel(key);
    $("#new_list").click();
    target.find('.list_display div').eq(0).children('.card').each(function () {
      $(this).clone().prependTo('#list_p1');
      $('#list_p1 .seat:visible').first().hide();
      list.upper.push($(this).attr('value'));
    });
    target.find('.list_display div').eq(1).children('.card').each(function () {
      $(this).clone().prependTo('#list_p2');
      $('#list_p2 .seat:visible').first().hide();
      list.lower.push($(this).attr('value'));
    });
    $("#listname").text(target.find("h3").text());
    $("#public").prop("checked",target.attr("public")=='true');
    $("#edit_function textarea").val(target.find('.list_detail .note').children().html().split("<br>").join("\n"));
    target.find(".combo span").each(function () {
      let data = JSON.parse($(this).attr('data'));
      $("#combo").append(
        "<li id='"+data.id+"'cat='"+JSON.stringify(data.cat)+"'>"+
        "<span>"+data.catagory+
        "</span><span>"+data.name+
        "</span><span>"+data.effect+
        "</span></li>");
    });
    target.find(".stage span").each(function () {
      let id = $(this).attr('id').split("-"),
          name = $(this).text().split("-");
      $(".stageselectholder:last").clone().insertAfter($(".stageselectholder:last")).attr("no",function () {
        return Number($(this).attr("no"))+1
      }).prev().find('i').eq(0).attr("function",'remove').css("transform","rotate(135deg)").next()
      .find("option[value='"+id[0]+"']").prop("selected",true).parent().next()
      .prepend("<option value='"+id[1]+"'>"+name[1]+"</option>").val(id[1]).next()
      .prepend("<option value='"+id[2]+"'>"+name[2]+"</option>").val(id[2]).next().attr('stage',id.join("-"));
    });
  });
  $(document).on('click',".list_display_holder .option #del",function () {
    let target = $(this).parents('.list_display_holder'),stageBind=[];
    if(!confirm("確定要刪除這個列表?!")) return
    target.find(".stage span").each(function () { stageBind.push({id:$(this).attr('id')}) });
    target.remove();
    socket.emit('delete list',{uid:current_user_id,key:target.attr('id'),stageBind});
  });
  $(document).on('click',".list_display_holder .option #analyze",function () {
    let target = $(this).parents('.list_display_holder'),
        buffer = [];
    target.find('.list_display .card').each(function () {
      buffer.push($(this).attr('value'));
    });
    socket.emit("start compare c2c",{id:current_user_id,target:buffer});
    $("#analyze_area").remove();
    $("<div id='analyze_area'>"+
    "<i class='material-icons' id='close_analyze' style='position:absolute'>"+
    "close</i></div>").insertAfter(target);
  });
  socket.on("c2c compare",function (data) {
    console.log(data);
    let count=0,cost=[],range=[],cd=[],
        atk={}, dps={}, hp={},ctrl={},def={},
        ene_arr = ['一般','鋼鐵敵人','白色敵人','外星敵人','紅色敵人','天使敵人','不死敵人','黑色敵人','漂浮敵人'],
        abi_arr = ['擊退','暫停','緩速','降攻','波動','傳送'],
        other = {'遠方攻擊':false,'爆擊':false,'抵銷波動':false,'2倍金錢':false,'增攻':false,
        '復活':false,'不死剋星':false,'破盾':false,'只能攻擊':false};
    for(let i in ene_arr){
      atk[ene_arr[i]] = [];
      dps[ene_arr[i]] = [];
      hp[ene_arr[i]] = [];
    }
    for(let i in ene_arr){
      if (ene_arr[i] == '一般') continue
      ctrl[ene_arr[i]] = {};
      for(let j in abi_arr){
        if(abi_arr[j]!='波動'&&abi_arr[j]!='傳送')ctrl[ene_arr[i]][abi_arr[j]] = false;
        def[abi_arr[j]] = false;
      }
    }
    for(let i in data){
      let a = new Cat(data[i].data),lv = data[i].lv;
      count ++;
      cost.push(a.Tovalue('cost',lv));
      cd.push(a.Tovalue('cd',lv));
      if(a.tag){
        if(a.tag.indexOf('遠方攻擊')!=-1){
          for(let j in a.char){
            if(a.char[j].type.indexOf('遠方攻擊')!=-1) range.push(a.char[j].range[1]*1);
          }
        } else range.push(a.Tovalue('range',lv));
        let flag  = false ;

        for(let j in a.char){
          let gatk = a.char[j].type.indexOf('善於攻擊')!=-1,
              batk = a.char[j].type.indexOf('超大傷害')!=-1,
              nd = a.char[j].type.indexOf('很耐打')!=-1;
          if(gatk||batk||nd) {
            for(let k in atk){
              if(a.char[j].against.indexOf(k)!=-1){
                atk[k].push(a.Tovalue('atk',lv)*(gatk?1.5:(batk?3:1)));
                dps[k].push(a.Tovalue('dps',lv)*(gatk?1.5:(batk?3:1)));
                hp[k].push(a.Tovalue('hp',lv)*(gatk?2:(nd?4:1)));
              } else {
                atk[k].push(a.Tovalue('atk',lv)*1);
                dps[k].push(a.Tovalue('dps',lv)*1);
                hp[k].push(a.Tovalue('hp',lv)*1);
              }
            }
            flag = true ;
          }
          for(let k in abi_arr){
            if(a.char[j].type == abi_arr[k]){
              for(let l in a.char[j].against){
                if(a.char[j].against[l] == '全部敵人'){
                  for(let m in ene_arr) if(m>2) ctrl[ene_arr[m]][abi_arr[k]] = true;
                } else ctrl[a.char[j].against[l]][abi_arr[k]] = true;
              }
            }

          }
        }
        for(let k in abi_arr){
          if(a.tag.indexOf('免疫'+abi_arr[k])!=-1){
            def[abi_arr[k]] = true;
          }
        }
        for(let k in other){
          if(a.tag.indexOf(k)!=-1){
            other[k] = true;
          }
        }
        if(!flag){
          for(let k in atk){
            atk[k].push(a.Tovalue('atk',lv)*1);
            dps[k].push(a.Tovalue('dps',lv)*1);
            hp[k].push(a.Tovalue('hp',lv)*1);
          }
          flag = true ;
        }
      }
      else {
        for(let k in atk){
          atk[k].push(a.Tovalue('atk',lv)*1);
          dps[k].push(a.Tovalue('dps',lv)*1);
          hp[k].push(a.Tovalue('hp',lv)*1);
        }
        range.push(a.Tovalue('range',lv)*1);
      }
    }
    // console.log('hp',hp);
    // console.log('dps',dps);
    // console.log('atk',atk);
    // console.log('range',range);
    // console.log('ctrl',ctrl);
    // console.log('def',def);
    // console.log('other',other);
    changeFunctions_v = 0;
    let html = "<div><h3 style='flex:2;padding-left:20'>基本分析</h3>"+
    "<i class=\"material-icons\" id='changeFunctions' text='切換公式'>functions</i>"+
    "<span id='functionName'>總和</span>"+
    "<i class=\"material-icons\" id='moregeneraltable' text='顯示更多'>more_horiz</i>"+
    "<i class=\"material-icons expend\" val='0'>expand_less</i></div>"+
    "<table id='general'><thead><tr><th></th><th>體力</th><th>攻擊力</th>"+
    "<th>DPS</th><th>射程</th><th>花費</th><th>再生產</th></tr></thead>";
    for(let i in ene_arr){
      if(ene_arr[i] =='一般'){
        html += "<tr><th>"+ene_arr[i]+"</th>"+
        "<td data='"+JSON.stringify(hp[ene_arr[i]])+"'>"+sum(hp[ene_arr[i]])+"</td>"+
        "<td data='"+JSON.stringify(atk[ene_arr[i]])+"'>"+sum(atk[ene_arr[i]])+"</td>"+
        "<td data='"+JSON.stringify(dps[ene_arr[i]])+"'>"+sum(dps[ene_arr[i]])+"</td>"+
        "<td rowspan='9' data='"+JSON.stringify(range)+"'>"+sum(range)+"</td>"+
        "<td rowspan='9' data='"+JSON.stringify(cost)+"'>"+sum(cost)+"</td>"+
        "<td rowspan='9' data='"+JSON.stringify(cd)+"'>"+sum(cd)+"</td>"+"</tr>"
      } else {
        html += "<tr style='display:none'><th>"+ene_arr[i]+"</th>"+
        "<td data='"+JSON.stringify(hp[ene_arr[i]])+"'>"+sum(hp[ene_arr[i]])+"</td>"+
        "<td data='"+JSON.stringify(atk[ene_arr[i]])+"'>"+sum(atk[ene_arr[i]])+"</td>"+
        "<td data='"+JSON.stringify(dps[ene_arr[i]])+"'>"+sum(dps[ene_arr[i]])+"</td>"+"</tr>"
      }
    }
    html += "</table>";
    $("#analyze_area").append(html);
    findthebest();
    html = "<div><h3 style='flex:2;padding-left:20'>控場分析</h3>"+
    "<i class=\"material-icons expend\" val='0'>expand_less</i></div>"+
    "<table><thead><tr><th></th><th>擊退</th><th>暫停</th>"+
    "<th>緩速</th><th>降攻</th></tr></thead>";
    for(let i in ctrl){
      html += "<tr><th>"+i+"</th>";
      for(let j in ctrl[i]){
        html += "<td><i class=\"material-icons\" style='color:"+(ctrl[i][j]?'#6bcd23':'#f05656')+";margin:0'>"+
        (ctrl[i][j]?'check_circle_outline':'remove_circle_outline')+"</i></td>"
      }
      html += "</tr>"
    }
    html += "</table>";
    $("#analyze_area").append(html);

    html = "<div><h3 style='flex:2;padding-left:20'>抗性分析</h3>"+
    "<i class=\"material-icons expend\" val='0'>expand_less</i></div>"+
    "<table><thead><tr><th>免疫擊退</th><th>免疫暫停</th>"+
    "<th>免疫緩速</th><th>免疫降攻</th><th>免疫波動</th><th>免疫傳送</th></tr></thead>";
    for(let i in def){
      html +=
      "<td><i class=\"material-icons\" style='color:"+(def[i]?'#6bcd23':'#f05656')+";margin:0'>"+
      (def[i]?'check_circle_outline':'remove_circle_outline')+"</i></td>";
    }
    html += "</table>";
    $("#analyze_area").append(html);

    html = "<div><h3 style='flex:2;padding-left:20'>其他分析</h3>"+
    "<i class=\"material-icons expend\" val='0'>expand_less</i></div>"+
    "<table>";
    let thead='',tbody='';
    for(let i in other){
      thead += "<th>"+i+"</th>";
      tbody +=
      "<td><i class=\"material-icons\" style='color:"+(other[i]?'#6bcd23':'#f05656')+";margin:0'>"+
      (other[i]?'check_circle_outline':'remove_circle_outline')+"</i></td>";
    }
    html += "<tr>"+thead+"</tr><tr>"+tbody+"</tr></table>";
    $("#analyze_area").append(html);

  });
  $(document).on('click','#analyze_area div .expend',function () {
    $(this).css("transform",function () {
      return "rotate("+(Number($(this).attr('val'))+1)*180+"deg)"
    }).attr("val",function () {
      return Number($(this).attr('val'))+1
    }).parent().next().toggle();
  });
  $(document).on('click','#close_analyze',function () {
    $(this).parent().remove();
  });
  $(document).on('click','#changeFunctions',changeFunctions);
  $(document).on('click','#moregeneraltable',function () {
    $("table#general tbody tr:not(:first)").toggle();
  });
  function findthebest() {
    $("table#general tbody td").removeClass("best");
    for(let i=0;i<3;i++){
      let stander = Number($("table#general tbody tr:first td").eq(i).text());
      $("table#general tbody tr").each(function () {
        let value = Number($(this).find('td').eq(i).text());
        if (value > stander) $(this).find('td').eq(i).addClass("best");
      });
    }
  }
  function changeFunctions() {
    let arr = ['sum','avg','max','min','vary','Range'],
    brr = ['總和','平均','最大值','最小值','標準差','全距'];
    changeFunctions_v++;
    if(changeFunctions_v>5)changeFunctions_v = 0 ;
    $("table#general").find("td[class!='nodata']").each(function () {
      let data = JSON.parse($(this).attr("data"));
      $(this).text(window[arr[changeFunctions_v]](data));
    });
    $("#functionName").text(brr[changeFunctions_v]);
    findthebest();
  }
});
function dontload(e) {return true }
function test() {
  return {list,current_editing_list}
}
function hashCode() {
  var s = 0;
  for(let i in list){
    for(let j in list[i]){
      s += Number(list[i][j].split("-")[0]);
      s += Number(list[i][j].split("-")[0])**0.5;
    }
  }
  return s
}
