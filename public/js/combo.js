$(document).ready(function () {
  var catdata ;
  var combodata ;
  const image_url = 'http://imgs-server.com/battlecats/u' ;
  const image_local =  "public/css/footage/cat/u" ;


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
  var q_pos = location.href.indexOf("?q=");
  var query = "";
  if(q_pos != -1) query = location.href.substring(q_pos+3);
  console.log(query);

  $(document).on('click','#search_combo',function () {
    let A_search = [] ;
    $("#upper_table td").each(function () {
      $(this).children('[value=1]').each(function () {
        A_search.push($(this).attr('name'));
      });
    }) ;
    console.log(A_search);
    searchCombo(A_search);
  });
  $(document).on('click','.card',function () {
    let r = confirm("確定要轉移到貓咪查詢頁面?");
    if (!r) return
    let id = $(this).attr('value');
    let ThisSite = location.href ;
    location.href = ThisSite.split("combo.html")[0]+"cat.html?q="+id ;
  });

  function searchCombo(A_search) {
    $(".dataTable").empty();
    let html = "" ;
    for(let i in combodata){
      if(A_search.indexOf(combodata[i].id.substring(0,4)) != -1){
        // console.log(combodata[i].id);
        let pic_html = "<div style='display:flex'>" ;
        for(let j in combodata[i].cat){
          // console.log(combodata[i].cat[j])
          if(combodata[i].cat[j] != "-"){
            pic_html +=
            '<span class="card" value="'+combodata[i].cat[j]+'" '+
            'style="background-image:url('+
            (image_list.indexOf("u"+combodata[i].cat[j]+".png") != -1 ? image_local+combodata[i].cat[j]+".png" : image_url+combodata[i].cat[j]+'.png')
            +');'+
            (screen.width > 768 ? "width:90;height:60;margin:5px" : "width:75;height:50;margin:0px")
            +'">'+name+'</span>' ;
          }
        }
        pic_html += "</div>" ;
        html = screen.width > 768 ?
                ("</tr><tr>"+
                "<th class='searchCombo' val='"+combodata[i].id.substring(0,2)+"'>"+combodata[i].catagory+"</th>"+
                "<td>"+combodata[i].name+"</td>"+
                "<td rowspan=2 colspan=4 class='comboPic'>"+pic_html+"</td>"+
                "</tr><tr>"+
                "<td colspan=2 class='searchCombo' val='"+combodata[i].id.substring(0,4)+"'>"+combodata[i].effect+"</td>") :
                ("</tr><tr>"+
                "<th colspan=2 class='searchCombo' val='"+combodata[i].id.substring(0,2)+"'>"+combodata[i].catagory+"</th>"+
                "<td colspan=4 rowspan=2 class='searchCombo' val='"+combodata[i].id.substring(0,4)+"'>"+combodata[i].effect+"</td>"+
                "</tr><tr>"+
                "<td colspan=2 >"+combodata[i].name+"</td>"+
                "</tr><tr>"+
                "<td colspan=6 class='comboPic'>"+pic_html+"</td>"+
                "</tr><tr>"
              );
          $(".dataTable").append(html);
      }
    }

    scroll_to_class("display",0) ;
  }

  function scroll_to_class(class_name,n) {
    $('.page_1').animate(
      {scrollTop: $("."+class_name).eq(n).offset().top},
      1000,'easeInOutCubic');
  }

  var xmlhttp = new XMLHttpRequest() ;
  var url = [];
  url.push("public/js/Catdata.txt") ;
  url.push("public/css/footage/cat/dir.txt") ;
  url.push("public/js/Combo.txt") ;
  var image_list ;

    xmlhttp.open("GET", url[0], true);
    xmlhttp.send();

  xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        if(this.responseURL.indexOf("Catdata.txt") != -1){
          var data = JSON.parse(this.responseText) ;
          catdata = data ;
          xmlhttp.open("GET", url[1], true);
          xmlhttp.send();
        }
        else if(this.responseURL.indexOf("cat/dir.txt") != -1){
              var data = this.responseText;
              image_list = data ;
              xmlhttp.open("GET", url[2], true);
              xmlhttp.send();
        }
        else if(this.responseURL.indexOf("Combo.txt") != -1){
          var data = JSON.parse(this.responseText) ;
          var obj = {} ;
          for(let i in data[0]){
            var bufferobj = {
              id : data[0][i].id,
              catagory : data[0][i].catagory,
              name : data[0][i].name,
              effect : data[0][i].effect,
              amount : data[0][i].amount,
              cat : [data[0][i].cat_1,data[0][i].cat_2,data[0][i].cat_3,data[0][i].cat_4,data[0][i].cat_5]
            } ;
            obj[i] = bufferobj;
          }
          combodata = obj ;
          if(query){
            searchCombo(query);
            $(window).scrollTop(500);
          }
        }
      }
  }
});
