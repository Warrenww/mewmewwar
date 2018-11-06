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
});

function UpdateData() {
  socket.emit("dashboard");
}
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
function fetchStage() {
  var chapter = $("#fetchStage input").eq(0).val();
  var id = $("#fetchStage input").eq(1).val();
  socket.emit("fetch data",{type:'stage',chapter,id});
}
