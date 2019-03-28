$(document).ready(function () {
  UpdateData();
  // socket.on('dashboard',(data)=>{
  //   console.log(data);
  //   for(let i in data){
  //     $("#"+i).text(data[i]);
  //   }
  // });
  $("#fetchUnit input").on('keypress',(e)=>{
    if(e.keyCode == 13){
      fetchUnitdata();
    }
  });
  var catName,stageName,eneName;
  socket.on("dashboard load",(data)=>{
    console.log(data);
    switch (data.type) {
      case 'stage':
        stageName = data.obj;
        for(let i in data.obj) $("#renameStageSelec").append("<option>"+i+"</option>");
      break;
      case 'cat':
        catName = data.obj
      break;
      case 'enemy':
        eneName = data.obj
      break;
      default:
        return;
    }
  })
  $("#renameStageSelec").on("change",()=>{
    var chapter = $("#renameStageSelec :selected").val();
    $(".renameStagetable").empty();
    var html = "",count=0;
    for(let i in stageName[chapter]){
      html += "<tr><th class='editable' type='name' path='"+
              ["stagedata",chapter,i].join()+"'colspan='8'>"+
              (stageName[chapter][i].name?stageName[chapter][i].name.name:"")+"</th></tr><tr>";
      count = 0;
      for(let j in stageName[chapter][i]){
        if(j == 'name') continue
        html += "<td class='editable' type='name' path='"+
                ["stagedata",chapter,i,j].join()+"'>"+
                stageName[chapter][i][j].name+"</td>"
        count++;
        if(count%8 == 0) html += "</tr><tr>";
      }
      html += "</tr>";
    }
    $(".renameStagetable").append(html);
  });
  var input_org ;
  $(document).on('click',".editable",function () {
    input_org = $(this).text();
    $(this).html('<input type="text" value="' +input_org+ '"></input>');
    $(this).find('input').select();
    $(this).bind('click',noclick);
  });
  $(document).on('blur', '.editable input', function () {
    $(this).parent().unbind('click',noclick);
    var val = $(this).val(),
        path = $(this).parent().attr("path"),
        type = $(this).parent().attr("type");
    if(!val){
      $(this).parent().html(input_org);
      val = input_org;
      return
    }else{
      $(this).parent().html(val);
    }
    socket.emit("DashboardUpdateData",{path:path,type:type,val:val});
    return
  });
  $(document).on("keyup",".editable input",function (e) {
    if(e.keyCode == 27){
      $(this).val(input_org).parent().unbind('click',noclick);
    }
  });
  $("#renameCatSelec").on("change",()=>{
    var range = Number($("#renameCatSelec :selected").val().split("~")[0]);
    $(".renameCattable").empty();
    var html = "";
    for(let i = range;i<range+50;i++){
      var id = AddZero(i,2);
      if(!catName[id]) continue;
      html += "<tr>";
      html += "<td id='"+id+"' class='rarity'>"+catName[id][1].rarity+"</td>";
      for(let j=1;j<4;j++){
        var sid = id+"-"+j;
        if(!catName[id]) continue
        if(catName[id][j]){
          html += "<th><img src='../"+Unit.imageURL('cat',sid)+"'/></th>"+
                  "<th>"+sid+"</th>"+
                  "<td class='editable' type='name' path='"+
                  ["CatData",id,"data",j].join()+"'>"+
                  (catName[id][j].name?catName[id][j].name:catName[id][j].jp_name);
        } else {
          html += "<th></th><th></th><td></td>";
        }
      }
      html += "<td id='"+id+"' class='region'>"+catName[id][1].region+"</td></tr>";
    }
    $(".renameCattable").append(html);
  });
  $(document).on('click','.region',function () {
    var id = $(this).attr("id"),
        text = $(this).text();
    text = text == "[JP]"?"[TW][JP]":"[JP]";
    socket.emit("DashboardUpdateData",{
      path:"CatData,"+id,
      type:"region",val:text
    });
    $(this).text(text);
  });
  $("#renameEneSelec").on("change",()=>{
    var range = Number($("#renameEneSelec :selected").val().split("~")[0]);
    $(".renameEnetable").empty();
    var html = "<tr>",count = 0
    for(let i = range;i<range+50;i++){
      var id = AddZero(i,2);
      if(eneName[id]){
        html += "<th><img src='../"+Unit.imageURL('enemy',id)+"'/></th>"+
        "<th>"+id+"</th>"+
        "<td class='editable' type='name' path='"+
        ["enemydata",id].join()+"'>"+
        (eneName[id].name?eneName[id].name:eneName[id].jp_name);
      } else {
        html += "<th></th><th></th><td></td>";
      }
      count ++;
      if(count%3 == 0)html += "</tr><tr>";
    }
    $(".renameEnetable").append(html);
  });
  socket.on("console",(buffer)=>{
    $("#result").append(`<div>${buffer}</div>`);
    var y1 = $("#result").offset().top,
        h1 = $("#result").innerHeight(),
        y2 = $("#result div:last").offset().top,
        h2 = $("#result div:last").innerHeight();
    $("#result").scrollTop($("#result").scrollTop()+(y2-y1-h1+h2+20));
  })
});

function UpdateData() { socket.emit("dashboard"); }
function fetchUnitdata() {
  var type = $("#fetchUnit").find("select").val();
  var id = $("#fetchUnit").find("input").val();
  console.log(id);
  id = id.split(",");
  var arr = [];
  for(i in id){
    if(id[i].indexOf("~") != -1){
      a = id[i].split("~");
      for(j=Number(a[0]);j<Number(a[1])+1;j++) if(id.indexOf(j) == -1) arr.push(j);
    } else if(Number(id[i])){
      if(arr.indexOf(Number(id[i])) == -1) arr.push(Number(id[i]));
    }
  }
  console.log(type,arr);
  socket.emit("fetch data",{type,arr});
}
function fetchStagedata() {
  var chapter = $("#fetchStage input").eq(0).val(),
      id = $("#fetchStage input").eq(1).val(),
      correction = $("#fetchStage input").eq(2).prop('checked');
  socket.emit("fetch data",{type:'stage',chapter,id,correction});
}
function loadData(type) { socket.emit("dashboard load",{type:type});}
function reloadAllData() { socket.emit("reloadAllData"); }
var noclick=function (e) {
  return false
}
function fetch(type) {
  socket.emit("fetch variable",{type:type});
}
