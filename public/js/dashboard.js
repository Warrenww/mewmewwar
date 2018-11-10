$(document).ready(function () {
  UpdateData();
  setInterval(function () {
    UpdateData();
  }, 60000);
  socket.on('dashboard',(data)=>{
    console.log(data);
    for(let i in data){
      $("#"+i).text(data[i]);
    }
  });
  $("#fetchUnit select").on('change',()=>{
    $("#fetchUnit button").attr("type",$("#fetchUnit select :selected").text());
  });
  $("#fetchUnit input").on('keypress',(e)=>{
    if(e.keyCode == 13){
      fetchUnitdata();
    }
  });

  var stageName;
  socket.on("loadStage",(data)=>{
    console.log(data);
    stageName = data;
    for(let i in data)
      $("#renameStageSelec").append("<option>"+i+"</option>");
  });
  $("#renameStageSelec").on("change",()=>{
    var chapter = $("#renameStageSelec :selected").val();
    $(".renameStagetable").empty();
    var html = "",count=0;
    for(let i in stageName[chapter]){
      html += "<tr><th class='editable' type='name' path='"+
              ["stagedata",chapter,i].join()+"'colspan='8'>"+
              stageName[chapter][i].name+"</th></tr><tr>";
      count = 0;
      for(let j in stageName[chapter][i]){
        if(j == 'name') continue
        html += "<td class='editable' type='name' path='"+
                ["stagedata",chapter,i,j].join()+"'>"+
                stageName[chapter][i][j]+"</td>"
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
  var catName;
  socket.on("loadCat",(data)=>{
    console.log(data);
    catName = data;
  });
  $("#renameCatSelec").on("change",()=>{
    var range = Number($("#renameCatSelec :selected").val().split("~")[0]);
    $(".renameCattable").empty();
    var html = "";
    for(let i = range;i<range+50;i++){
      var grossID = AddZero(i,2);
      if(!catName[grossID+"-1"]) continue;
      html += "<tr>";
      for(let j=1;j<4;j++){
        var id = grossID+"-"+j;
        if(catName[id]){
          html += "<th><img src='"+image_url_cat+id+".png'/></th>"+
                  "<th>"+id+"</th>"+
                  "<td class='editable' type='name' path='"+
                  ["newCatData",id].join()+"'>"+
                  (catName[id].name?catName[id].name:catName[id].jp_name);
        } else {
          html += "<th></th><th></th><td></td>";
        }
      }
      html += "</td><td id='"+grossID+"' class='region'>"+catName[grossID+"-1"].region+"</td><tr>";
    }
    $(".renameCattable").append(html);
  });
  $(document).on('click','.region',function () {
    var id = $(this).attr("id"),
        text = $(this).text();
    text = text == "[JP]"?"[TW][JP]":"[JP]";
    for(let i=1;i<4; i++){
      if(catName[id+"-"+i]){
        socket.emit("DashboardUpdateData",{
          path:"newCatData,"+id+"-"+i,
          type:"region",val:text
        });
      }
    }
    $(this).text(text);
  });
});

function UpdateData() { socket.emit("dashboard"); }
function fetchUnitdata() {
  var type = $("#fetchUnit button").attr("type");
  var id = $("#fetchUnit input").val();
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
  socket.emit("fetch data",{type,arr});
}
function fetchStagedata() {
  var chapter = $("#fetchStage input").eq(0).val();
  var id = $("#fetchStage input").eq(1).val();
  socket.emit("fetch data",{type:'stage',chapter,id});
}
function loadData(type) { socket.emit("load"+type); }
function reloadAllData() { socket.emit("reloadAllData"); }
var noclick=function (e) {
  return false
}
