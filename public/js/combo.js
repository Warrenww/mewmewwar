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
    current_user_data = data ;
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
      uid:current_user_data.uid,
      id:A_search
    }) ;
  });
  socket.on("combo result",function (arr) {
    // console.log(arr);
    searchCombo(arr);
  }) ;

  $(document).on('click','.card',function () {
    socket.emit("display cat",{
      uid : current_user_data.uid,
      cat : $(this).attr('value'),
      history:true
    });
    // location.assign("/view/cat.html");
    // window.parent.changeIframe('cat');
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

    scroll_to_class("display",0) ;
  }
});
