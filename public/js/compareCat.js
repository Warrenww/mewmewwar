$(document).ready(function () {
  const image_url =  "public/css/footage/cat/u" ;
  var compare = [] ;
  var socket = io.connect();
  var current_user_data = {};

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connet",user);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    if(data.compare_c2c) {
      let buffer = [] ;
      for(let i in data.compare_c2c){
        let id = data.compare_c2c[i].id ;
        buffer.push(id);
      }
      socket.emit("start compare c2c",buffer);
    }
  });


  socket.on("c2c compare", function (compare){
    $(".compareTable").append(
      "<div class='comparedatahead'>"+
      "<table>"+
      "<tr>"+"<th>Level</th>"+
      "</tr><tr>"+"<th style='height:80px;'>Picture</th>"+
      "</tr><tr>"+"<th>全名</th>"+
      "</tr><tr>"+"<th>體力</th>"+
      "</tr><tr>"+"<th>KB</th>"+
      "</tr><tr>"+"<th>硬度</th>"+
      "</tr><tr>"+"<th>攻擊力</th>"+
      "</tr><tr>"+"<th>DPS</th>"+
      "</tr><tr>"+"<th>射程</th"+
      "</tr><tr>"+"<th>攻頻</th>"+
      "</tr><tr>"+"<th>跑速</th>"+
      "</tr><tr>"+"<th>範圍</th>"+
      "</tr><tr>"+"<th>花費</th>"+
      "</tr><tr>"+"<th>再生産</th>"+
      "</tr><tr>"+"<th>特性</th>"+
      "</tr>"+"</table>"+"</div>"+
      "<div class='comparedataholder'>"+
      "<div style='display:flex' class='comparedatabody'></div>"
      +"</div>"

    );
    for(let i in compare){
      let data = compare[i];
      // console.log(data);
      $(".comparedatabody").append(
        "<div style='flex:1' class='comparedata' id='"+data.id+"'>"+
        "<table>"+
        "<tr>"+
        "<th id='level' rarity='"+data.稀有度+"'>30</th>"+
        "</tr><tr>"+
        "<th style='height:80px;padding:0'><img src='"+
        image_url+compare[i].id+'.png'+
        "' style='height:100%'></th>"+
        "</tr><tr>"+
        "<th id='全名'>"+data.全名+"</th>"+
        "</tr><tr>"+
        "<td id='體力' original='"+data.lv1體力+"'>"+levelToValue(data.lv1體力,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='KB'>"+data.kb+"</td>"+
        "</tr><tr>"+
        "<td id='硬度' original='"+data.lv1硬度+"'>"+levelToValue(data.lv1硬度,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='攻擊力' original='"+data.lv1攻擊+"'>"+levelToValue(data.lv1攻擊,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='DPS' original='"+data.lv1dps+"'>"+levelToValue(data.lv1dps,data.稀有度,30).toFixed(0)+"</td>"+
        "</tr><tr>"+
        "<td id='射程'>"+data.射程+"</td>"+
        "</tr><tr>"+
        "<td id='攻頻'>"+data.攻頻.toFixed(1)+"</td>"+
        "</tr><tr>"+
        "<td id='跑速'>"+data.速度+"</td>"+
        "</tr><tr>"+
        "<td id='範圍'>"+data.範圍+"</td>"+
        "</tr><tr>"+
        "<td id='花費'>"+data.花費+"</td>"+
        "</tr><tr>"+
        "<td id='再生産'>"+data.再生産.toFixed(1)+"</td>"+
        "</tr><tr>"+
        "<td id='特性' "+
        (data.特性.indexOf("連續攻擊") != -1 ?
        "original='"+data.特性+"' atk='"+data.lv1攻擊+"'>"+
        serialATK(data.特性,levelToValue(data.lv1攻擊,data.稀有度,30)) :
        ">"+data.特性
        )+
        "</td>"+
        "</tr>"+
        "</table>"+
        "</div>"
      );
    }
  });




});
