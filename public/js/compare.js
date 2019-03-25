var CurrentUserID;
var RowData = {cat:{},enemy:{}};
var displayType = 'cat',NondisplayFiled = [];
var custom_format_arr=[];
$(document).ready(function () {
  // initial swapper
  if(Storage){
    if(localStorage.compareType == 'enemy') swapType();
    if(localStorage.compareFiled) NondisplayFiled = JSON.parse(localStorage.compareFiled);
    for(let i in NondisplayFiled){
      $(".checkbox[name='"+NondisplayFiled[i]+"'] input").removeAttr("checked");
    }
  }

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
    CurrentUserID = data.uid;
    for(let type in data.compare){
      var temp = [];
      for(let j in data.compare[type]) temp.push(data.compare[type][j].id);
      socket.emit("required data",{
        uid:data.uid,
        type:type,
        target:temp,
        record:false
      });
    }
  });
  socket.on("required data",(data)=>{
    data.buffer.map(x=>{RowData[data.type][x.data.id] = x});
    if(displayType == data.type){
      $(".display tbody").empty();
      for(let i in RowData[data.type]){
        appendData(RowData[data.type][i],data.type);
      }
    }
    highlightTheBest();
  });
  function appendData(data,type) {
    var _data,
        lv = data.lv,
        stage = Number(data.currentStage),
        rarity = data.data.rarity
        id = data.data.id;
    if(type == 'cat')  _data = new Cat(data.data.data[stage]);
    else  _data = new Enemy(data.data);
    $(".display tbody").append(AddCompareData(_data,lv,rarity));
    for(let i in NondisplayFiled){
      $("thead").find("."+NondisplayFiled[i]).hide();
      $("tbody").find("."+NondisplayFiled[i]).parent().hide();
    }
  }
  // switch display type
  $(".swapper").click(swapType);
  function swapType() {
    $(".swapper").find('h1 span').toggle();
    $(".swapper").find(".icon").each(function () {
      let temp = Number($(this).attr("active"));
      $(this).attr("active",(temp+1)%2);
    });
    displayType = displayType=='cat'?'enemy':'cat';
    $(".display").attr("displayType",displayType);
    if(Storage) localStorage.compareType = displayType;

    $(".display tbody").empty();
    for(let i in RowData[displayType]){
      appendData(RowData[displayType][i],displayType);
    }
    highlightTheBest();
    $("thead th[reverse]").attr("reverse","");
  }
  // scroll reaction
  $(".display").on('scroll',function () {
    var pos_y = $(".display").scrollTop(),
        pos_x = $(".display").scrollLeft();
    if(pos_y > 30){ $(".float_thead").css("opacity",100); }
    else { $(".float_thead").css("opacity",0); }
    if(pos_x > 10){ $(".display").attr("offsetX",true); }
    else { $(".display").attr("offsetX",false); }
    $(".func[active='1']").attr("active",0);
    $(".panel").attr("active",0)
  });
  // function area
  $(document).on("click",".func",function () {$(this).attr("active",(Number($(this).attr("active"))+1)%2);});
  $(document).on("click",".func .functionArea i",function (e) {
    var func = $(this).attr("id"),id = $(this).parents(".comparedata").attr("id");
    if(func == 'lv'){
      var org = $(this).attr("text").match(/\d+/)[0],
          lv = prompt(`輸入欲調整的${displayType=='cat'?"等級":"倍率"}:`,org);
      if(lv!=null)
        if(validationLevel(lv)) {
          $(this).attr("text",displayType=='cat'?"lv."+lv:lv+"%")
          changeCompareLevel(lv,id);
        } else alert("錯誤值!");
    }
    else if(func == "del"){
      if(confirm("確定移除?")){
        var temp=[];
        $(this).parents('.comparedata').remove();
        delete RowData[displayType][id];
        for(let i in RowData[displayType]) temp.push(i);
        socket.emit("Set Compare",{type:displayType,id:CurrentUserID,target:temp});
      }
    }
    else if(func == "hide") $(this).parents('.comparedata').hide(400);
    else if(func == "swap"){
      var stage = RowData.cat[id].currentStage,
          total_stage = RowData.cat[id].data.data.length,
          new_stage = (stage+1)%total_stage||1,
          new_data = new Cat(RowData.cat[id].data.data[new_stage]),
          target = $(".comparedata[id='"+id+"']"),
          lv = RowData.cat[id].lv,
          rarity = RowData.cat[id].data.rarity;
      $(AddCompareData(new_data,lv,rarity)).insertBefore(target);
      target.remove();
      RowData.cat[id].currentStage = new_stage;
      socket.emit("store stage",{
        uid : CurrentUserID,
        id : id,
        stage : new_stage-1
      });
      highlightTheBest();
    }
  });
  // field toggle
  $(".field_toggle .checkbox input").click(function (e) {
    var name = $(this).parent().attr("name"),
        val = $(this).prop("checked");
    // console.log(name,val);

    if(NondisplayFiled.indexOf(name) == -1) NondisplayFiled.push(name);
    else NondisplayFiled.splice(NondisplayFiled.indexOf(name),1);
    localStorage.compareFiled = JSON.stringify(NondisplayFiled);

    if(displayType == 'cat') {if(name == 'color' || name == 'reward') return;}
    else if(displayType == 'enemy') {if(name == 'rarity' || name == 'cost' || name == 'cd') return;}
    if(val){
      $("thead").find("."+name).show();
      $("tbody").find("."+name).parent().show();
    }
    else{
      $("thead").find("."+name).hide();
      $("tbody").find("."+name).parent().hide();
    }
  });
  $(document).on('click','.display tbody .picture',function () {
    let id = $(this).parents('.comparedata').attr('id');
    socket.emit("set history",{
      type:displayType,
      target:id,
      uid:CurrentUserID
    });
    switchIframe(displayType);
  });

  function changeCompareLevel(level,id) {
    var data = RowData[displayType][id].data;
    if (displayType == 'enemy'){
      level /= 100;
      data = new Enemy(data);
    } else {
      data = new Cat(data.data[RowData[displayType][id].currentStage]);
    }
    RowData[displayType][id].lv = level;
    ['hp','hardness','atk','dps'].map(x =>{
      let target = $('.comparedata[id="'+id+'"]').find('.'+x) ;
      target.html(data.Tovalue(x,level)).parent().addClass('changed');
      setTimeout(() => { target.parent().removeClass("changed"); },500);
    })
    if(char_detail) $('.comparedata[id="'+id+'"]').find('.char').html(data.CharHtml(level));
    highlightTheBest();
    $('.comparedatahead tr').attr("reverse","");
    socket.emit("store level",{
      uid : CurrentUserID,
      id : id,
      lv : level,
      type : displayType
    });
  }
  $(document).on('click','.display thead th',sortCompare);
  var char_detail = 0 ;
  function sortCompare() {
    let name = $(this).attr("class"),
        arr = [],
        flag = $(this).attr("reverse") ;
    if(!name || name == null || name in {'picture':'','name':'','multi':'','rarity':''}) return;
    if(name == 'char'){
      $(".comparedata").each(function () {
        // console.log(char_detail);
        let id = $(this).attr('id'),
            data = RowData[displayType][id],
            lv = data.lv;
        if (displayType == 'cat') data = new Cat(data.data.data[data.currentStage]);
        else data = new Enemy(data.data)
        let char = data.CharHtml(lv),
            tag = data.tag?data.tag.join("/"):"無";
        $(this).find(".char").html(char_detail?tag:char);
      });
      char_detail = char_detail?0:1;
      return
    }

    $(".comparedata").each(function () {
      let obj = {};
      obj = {
        id:$(this).attr('id'),
        item:Number($(this).find("."+name).text())
      }
      arr.push(obj);
    });
    arr = quickSort(arr,'item');
    // console.log(arr);
    if(flag != 'increase'){
      for(let i=arr.length-1;i>=0;i--) $(".display tbody").append($(".comparedata[id='"+arr[i].id+"']"));
      $(".display thead th[class='"+name+"']").attr('reverse','increase').siblings().attr('reverse','');
    } else {
      for(let i=0;i<arr.length;i++) $(".display tbody").append($(".comparedata[id='"+arr[i].id+"']"));
      $(".display thead th[class='"+name+"']").attr('reverse','decrease').siblings().attr('reverse','');
    }
  }
  function AddCompareData(data,lv,rarity) {
    var html;
    html =
      createHtml("th",
        createHtml("div",
          createHtml("span",
            createHtml("i",(displayType == 'cat'?"Lv":"倍"),{id:"lv",class:"cir_but",text:(displayType == 'cat'?"Lv."+lv:lv*100+"%")})+
            createHtml("i","delete",{class:"material-icons cir_but",id:"del",text:"刪除"})+
            createHtml("i","desktop_access_disabled",{class:"material-icons cir_but",id:"hide",text:"隱藏"})+
            createHtml("i","swap_vert",{class:"material-icons cir_but",id:"swap",text:"切換階級",catonly:""}),
          {class:"functionArea"})+
          createHtml("span",
          createHtml("span","",{class:"img",style:`background-image:url('${data.image}')`})+
          createHtml("span",data.Name),
          {class:"dataArea"})+
          createHtml("i","arrow_right",{class:"material-icons"}),
        {class:'func',active:0}))+
      createHtml("th",
        createHtml("div","",
        {style:`background-image:url('${data.image}')`,class:'picture'}),
        {style:"padding:0;border-radius:10px"})+
      createHtml("th",createHtml("div",data.Name,{class:'name'}))+
      (displayType == 'cat'?
        createHtml("td",createHtml("div",(Cat.parseRarity(rarity)),{class:"rarity"})):
        createHtml("td",createHtml("div",(data.color),{class:"color"})));
      ['hp','kb','hardness','atk','dps','range','freq','speed'].map(x=>{
        html += createHtml("td",createHtml("div",data.Tovalue(x,lv),{class:x}))
      });
      html +=
      createHtml("td",createHtml("div",data.Aoe,{class:'multi'}))+
      (displayType == 'cat'?
      createHtml("td",createHtml("div",data.cost,{class:'cost'}))+
      createHtml("td",createHtml("div",data.cd,{class:'cd'})):
      createHtml("td",createHtml("div",data.reward,{class:'cost'})))+
      createHtml("td",createHtml("div",char_detail?data.CharHtml(lv):(data.tag?data.tag.join("/"):"無"),{class:'char'}));
      html = createHtml("tr",html,{
        class:'comparedata',
        id:data.id.toString().substring(0,3)
      });
    return html
  }

  $(document).on("click","#custom_format td",function () {
    var type = $(this).attr("type");
    switch (type) {
      case "del":
        $(this).parent().remove();
        break;
      case "add_column":
        $(this).attr("type","column").html(createHtml("input","",{list:"col_list",placeholder:"新增欄位"}));
        $(this).children().focus();
        break;
      case "add_format":
        $(this).empty().attr("type","format");
        $(this).append(createHtml("span",createHtml("i","format_size",{class:"material-icons"})));
        $(this).append(createHtml("span",createHtml("i","format_color_text",{class:"material-icons"})+createHtml("input","",{class:"jscolor",type:"text"})));
        $(this).append(createHtml("span",createHtml("i","format_color_fill",{class:"material-icons"})+createHtml("input","",{class:"jscolor",type:"bg"})));
        $(this).append(createHtml("span",createHtml("i","format_bold",{class:"material-icons"})));
        jscolor.installByClassName("jscolor");
        break;
      case "add_query":
        $(this).attr("type","query").html(
          createHtml("input","",{type:"number",value:0})+
          createHtml("span","~")+
          createHtml("input","",{type:"number",value:0})
        );
        $(this).children().eq(0).focus();
        break;
      case "query":
        var temp = Number($(this).attr("relation"));
        if(Number.isNaN(temp)) temp = 0;
        $(this).attr("relation",(temp+1)%3).children().eq(0).focus();
        break;
      default:
    }
  });
  $(document).on("blur","#custom_format td[type='column'] input",function () {
    var val = Unit.propertiesName($(this).val(),true),list = $(this).parent().attr("list");
    if(list) list = JSON.parse(list);
    else list = [];
    if(val) if(list.indexOf(val) == -1) list.push(val);
    $(this).parent().attr({"type":"add_column","list":JSON.stringify(list)});
    for(let i in list) list[i] = Unit.propertiesName(list[i]);
    $(this).parent().html(list.join());
  });
  $(document).on("blur","#custom_format td[type='query'] input",function () {
    var val = [];
    $(this).parent().find("input").each(function () {
      val.push($(this).val());
    });
    $(this).parent().attr("value",JSON.stringify(val));
  });
  $(document).on("click","#custom_format td[type='format'] span",function () {
    switch ($(this).text()) {
      case "format_size":
        var temp = Number($(this).attr("size"));
        if(Number.isNaN(temp)) temp = 1;
        $(this).attr("size",(temp+1)%3);
        break;
      case "format_bold":
        var temp = Number($(this).attr("weight"));
        if(Number.isNaN(temp)) temp = 0;
        $(this).attr("weight",(temp+1)%3);
        break;
      default:

    }
  });

});
function highlightTheBest() {
  var levelmap = {};
  $(".best").removeClass('best');
  $(".comparedata").each(function () {
    // console.log($(this).attr("id"));
    levelmap[$(this).attr("id")] = $(this).find("#level span").text();
    if(displayType == 'enemy') levelmap[$(this).attr("id")] = $(this).find("#level span").text().split("%")[0]/100
  });
  $('.float_thead th').each(function () {
    let name = $(this).attr("class");
    if(!name||name==undefined) return ;

    var max = -1e10, min = 1e10, temp = [];
    $(".comparedata").each(function () {
      var val = $(this).find("."+name).text(),
          id = $(this).attr("id");

      if(name == 'multi') {if(val == '範圍') $(this).find("."+name).addClass('best') ;}
      else if(name == 'cd' || name == 'freq' || name == 'cost'){
        if(Number(val) < min) {temp = [id];min = Number(val);}
        else if(Number(val) == min) temp.push(id);
      } else {
        if(Number(val) > max) {temp = [id];max = Number(val)}
        else if(Number(val) == max) temp.push(id);
      }
    });

    for(let i in temp) $(".comparedata[id='"+temp[i]+"']").find("."+name).addClass('best');
  });
}
function validationLevel(lv) {
  lv = Number(lv);
  if (!lv || lv <0 || Number.isNaN(lv)) return false
  if (displayType == 'cat' && lv > 100) return false
  return true
}
function showAll() {
  $("thead th").removeAttr("style");
  $("tbody tr,tbody tr th,tbody tr td").show();
  NondisplayFiled = [];
  localStorage.removeItem("compareFiled");
  $(".field_toggle").find("input").prop("checked",true);
}
function add_row() {
  var flag = validateRow($("#custom_format tbody tr:last td"));
  if( !flag && $("#custom_format tbody tr:last td").length) return;
  $(createHtml("tr",
    createHtml("td","新增套用欄位",{type:"add_column"})+
    createHtml("td","新增格式",{type:"add_format"})+
    createHtml("td","新增條件",{type:"add_query"})+
    createHtml("td",createHtml("i","delete",{class:"material-icons"}),{type:"del"})
  )).appendTo("#custom_format table tbody");

}
function validateRow(dom) {
  var flag = [false,false,false];
  dom.each(function () {
    if($(this).attr("list")&&$(this).attr("list")!="[]") flag[0] = true;
    if($(this).attr("type") == "format") flag[1] = true;
    if($(this).attr("type") == "query" ) flag[2] = true;
  });
  return (flag[0]&&flag[1]&&flag[2])
}
function colorChange() {
  var target = $(".jscolor-active").attr("type"),
      val = $(".jscolor-active").val();
  if(target == 'bg'){
    $(".jscolor-active").parent().css("background-color",val);
  }
  else if (target == "text") {
    $(".jscolor-active").siblings().css("color",val).parent().css("color",val);
  }
}
function commit_customFormat() {
  var format = [];
  $("#custom_format table tbody tr").each(function () {
    if(!validateRow($(this).find("td"))) return;
    var obj = {
      target : JSON.parse($(this).children().eq(0).attr("list")),
      format : {
        font_size : (Number($(this).children().eq(1).children().eq(0).attr('size'))-1)*4+16,
        text_color : parseColor($(this).children().eq(1).children().eq(1).attr("style")),
        bg_color : parseColor($(this).children().eq(1).children().eq(2).attr("style")),
        font_weight : Number($(this).children().eq(1).children().eq(3).attr("weight"))
      },
      query : {
        mode : Number($(this).children().eq(2).attr('relation')),
        arr : JSON.parse($(this).children().eq(2).attr('value'))
      }
    };
    if(Number.isNaN(obj.format.font_size)) obj.format.font_size = 16;
    if(Number.isNaN(obj.format.font_weight)) obj.format.font_weight = 0;
    if(Number.isNaN(obj.query.mode)) obj.query.mode = 0;
    format.push(obj);
  });
  // console.log(format);
  for(let i=0 ;i < custom_format_arr.length;i++) $(".custom-style-"+i).removeClass("custom-style-"+i);
  $(".best").removeClass("best");
  custom_format_arr = format;
  if(format.length == 0) return;
  $("#custom_format").click();
  var stylesheet = ""
  for(let i in format){
    var target = format[i].target,style = format[i].format,query = format[i].query;
    for(let j in target){
      $("tbody ."+target[j]).each(function () {
        var val = Number($(this).text());
        if(Number.isNaN(val)) val = 0;
        if(query.mode == 0 && val <= query.arr[0]) $(this).parent().addClass("custom-style-"+i);
        if(query.mode == 1 && val >= query.arr[0]) $(this).parent().addClass("custom-style-"+i);
        if(query.mode == 2 && val >= query.arr[0] && val <= query.arr[1])
          $(this).parent().addClass("custom-style-"+i);
      });
    }
    stylesheet +=  `.custom-style-${i}{
      font-size:${style.font_size};
      font-weight:${['normal','bold','lighter'][style.font_weight]};
      color:${style.text_color?style.text_color:'black'} !important;
      ${style.bg_color?`background-color:${style.bg_color} !important;`:""}
    }`
  }
  $("#custom-style-sheet").remove();
  $(createHtml("style",stylesheet,{type:"text/css",id:"custom-style-sheet"})).appendTo("head");
}
function parseColor(rgb){
  if(!rgb) return null;
  if(rgb.match(/rgb/).length == 0) return null;
  rgb = rgb.split(")")[0].split("(")[1].split(",");
  // console.log(rgb);
  rgb = rgb.map(x => {return AddZero(Number(x).toString(16))});
  return "#"+rgb.join("");
}
function clear_customFormat() {
  $(".modal-body table tbody").empty();
  for(let i=0 ;i < custom_format_arr.length;i++) $(".custom-style-"+i).removeClass("custom-style-"+i);
  custom_format_arr = [];
  $("#custom-style-sheet").remove();
  highlightTheBest();
}
