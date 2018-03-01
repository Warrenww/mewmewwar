$(document).ready(function () {
  var socket = io.connect();
  const image_url =  "../public/css/footage/cat/u" ;
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
    if(data.last_combo)  socket.emit("search combo",{uid:data.uid,id:data.last_combo}) ;
    for(let i in data.last_combo){
      $(".button[name~='"+data.last_combo[i]+"']").attr('value',1);
    }
  });

  var effect = {
        '角色性能' : ['角色攻擊力UP','角色體力UP','角色移動速度UP'],
        '角色特殊能力' : ['「善於攻擊」的效果UP','「超大傷害」的效果UP','「很耐打」 的效果UP','「打飛敵人」的效果UP','「使動作變慢」的時間UP','「使動作停止」的時間UP','「攻擊力下降」的時間UP','「攻擊力上升」的效果UP'],
        '貓咪城' : ['初期貓咪砲能量值UP','貓咪砲玫擊力UP','貓咪砲充電速度UP','城堡耐久力UP'],
        '持有金額．工作狂貓' : ['初期所持金額UP','初期工作狂貓等級UP','工作狂貓錢包UP'],
        '戰鬥效果' : ['研究力UP','會計能力UP','學習力UP']
      };
  var eff_count = 0 ;
  for(let i in effect) {
    let effect_html = "" ;
    for(let j in effect[i]) effect_html += "<span class='button' name='C"+eff_count+"E"+j+"' value='0'>"+effect[i][j]+"</span>" ;
    $("#upper_table").append(
      "<tr>"+
      "<th colspan='2' id='C"+eff_count+"'>"+i+"</th>"+
      "<td colspan='4' class='select_effect' >"+effect_html+"</td>"+
      "</tr>"
    ) ;
    eff_count ++ ;
  }

  $(document).on('click','#search_combo',function () {
    let A_search = [] ;
    $("#upper_table td").each(function () {
      $(this).children('[value=1]').each(function () {
        A_search.push($(this).attr('name'));
      });
    }) ;
    console.log(A_search);
    socket.emit("search combo",{
      uid:current_user_data.uid,
      id:A_search
    }) ;
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'combo',
      id : A_search
    });
  });
  socket.on("combo result",function (arr) {
    console.log(arr);
    searchCombo(arr);
  }) ;

  $(document).on('click','.card',function () {
    socket.emit("display cat",{
      uid : current_user_data.uid,
      cat : $(this).attr('value'),
      history:true
    });
    // location.assign("/view/cat.html");
    window.parent.changeIframe('cat');
    window.parent.reloadIframe('cat');
  });

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
            image_url+arr[i].cat[j]+'.png);'+
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

    scroll_to_class("display",0) ;
  }
});
