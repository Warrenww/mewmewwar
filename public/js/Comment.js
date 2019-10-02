// const Page = location.href.split("/").pop();
$(document).on('click','#nickname span',function () {
  var type = $(this).attr("id"),
      queue = current_cat_statistic.nickname?current_cat_statistic.nickname:[],
      org = [];
  for(let i in queue) org.push(queue[i]);
  if(type) type = type.split("_nick")[0];

  if(type == 'add'){
    $(this).hide().siblings('span').show();
    $(this).siblings('div')
    .html('<input type="text" maxlength="30" placeholder="請輸入暱稱" />')
    .find('input').focus();
    return;
  }
  else if(type == 'confirm'){
    let val = $('#nickname').find("input").val();
    update_nickname(val,queue,org);
  }
  else if(type == 'cancel') {
    appendNickname(org);
    $("#add_nick").show().siblings('span').hide();
  }
  else{
    let conf;
    if($(this).parent().is(".panel")) conf = confirm("確定要刪除此暱稱?");
    else conf = false;

    if(!conf) return;
    update_nickname($(this).parent().prev().text().trim(),queue,org,true);
  }
});
$(document).on('keypress','#nickname div input',function (e) {
  if(e.keyCode!=13) return
  var val = $(this).val(),
      queue = current_cat_statistic.nickname?current_cat_statistic.nickname:[],
      org = [];
  for(let i in queue) org.push(queue[i]);
  update_nickname(val,queue,org);
});
$(document).on('click',".survey #rank span i,.rank_respec span i",function () {
  let a = $(this).attr("no"),
  New = $(this).parents('span').attr('new'),
  type = $(this).parents('span').attr('type');
  $(this).parent().children('i').each(function () {
    let b = $(this).attr("no");
    if (b>a) $(this).attr('value',0);
    else $(this).attr('value',1);
  });
  // console.log(type,a,New);
  if(New == 'true'){
    if(!current_cat_statistic.rank)
    current_cat_statistic.rank = {
      atk:{1:0,2:0,3:0,4:0,5:0},
      control:{1:0,2:0,3:0,4:0,5:0},
      cost:{1:0,2:0,3:0,4:0,5:0},
      hp:{1:0,2:0,3:0,4:0,5:0},
      range:{1:0,2:0,3:0,4:0,5:0},
      speed:{1:0,2:0,3:0,4:0,5:0},
      total:{1:0,2:0,3:0,4:0,5:0}
    };
    current_cat_statistic.rank[type][a]++;
    if(!current_cat_survey.rank)
    current_cat_survey.rank = {
      atk:{1:0,2:0,3:0,4:0,5:0},
      control:{1:0,2:0,3:0,4:0,5:0},
      cost:{1:0,2:0,3:0,4:0,5:0},
      hp:{1:0,2:0,3:0,4:0,5:0},
      range:{1:0,2:0,3:0,4:0,5:0},
      speed:{1:0,2:0,3:0,4:0,5:0},
      total:{1:0,2:0,3:0,4:0,5:0}
    };
    current_cat_survey.rank[type][a] = 1;
  }
  else{
    let org = 0;
    for(let i in current_cat_survey.rank[type])
    if(current_cat_survey.rank[type][i]) org = i;
    if (org == a) return
    current_cat_survey.rank[type][a] = 1;
    current_cat_survey.rank[type][org] = 0;
    current_cat_statistic.rank[type][a]++;
    current_cat_statistic.rank[type][org]--;
  }
  update_total_rank(current_cat_statistic.rank);
  update_respect_rank(current_cat_statistic.rank);
  ga('send', 'event', 'survey_cat', 'rank',CurrentCatID);
  socket.emit("cat survey",{
    uid : CurrentUserID,
    cat : CurrentCatID.substring(0,3),
    type : 'rank',
    add : current_cat_survey.rank,
    all : current_cat_statistic.rank
  });
  $(this).parents('span').attr('new',false);

});
$(document).on('click','.application i',function () {
  let active = Number($(this).parent().attr('value')),
  type = $(this).parent().attr('type');
  $(this).hide().siblings().show().parent().attr('value',function () {
    return active?0:1
  });
  if(!current_cat_statistic.application)
  current_cat_statistic.application = {
    ash:0,attack:0,control:0,fastatk:0,shield:0,tank:0
  }
  if(!current_cat_survey.application)
  current_cat_survey.application = {
    ash:0,attack:0,control:0,fastatk:0,shield:0,tank:0
  }
  current_cat_statistic.application[type] += (active?(-1):1);
  current_cat_survey.application[type] = (active?0:1);
  update_application(current_cat_statistic.application);
  ga('send', 'event', 'survey_cat', 'application',CurrentCatID);
  socket.emit("cat survey",{
    uid : CurrentUserID,
    cat : CurrentCatID.substring(0,3),
    type : 'application',
    add : current_cat_survey.application,
    all : current_cat_statistic.application
  });
});


function initial_survey() {
  $(".survey #nickname div").text("暫無暱稱");
  $("#rank i").attr('value',0);
  $('#rank span').attr("new",'true');
  $("#rank_c").find("path").remove();
  d3.select("#rank_c").select('text').text('尚無評分')
    .attr({
      x:"26,46,26,46",y:"40",dy:'0,0,20',
      style:"font-size:14px;font-weight:normal"
    });
  $('#rank_detail .detail').each(function () {
    $(this).find(".char").css('width',"0%")
      .siblings(".num").text(0);
  });
  var rank_respec_name = ['atk','control','cost','hp','range','speed'],
      index=0;
  $('.rank_respec').each(function () {
    $(this).html('<span new="true" type="'+rank_respec_name[index]+'">'+
      '<i class="material-icons" value="0" no="1">&#xe885;</i>'+
      '<i class="material-icons" value="0" no="2">&#xe885;</i>'+
      '<i class="material-icons" value="0" no="3">&#xe885;</i>'+
      '<i class="material-icons" value="0" no="4">&#xe885;</i>'+
      '<i class="material-icons" value="0" no="5">&#xe885;</i>'+
      '</span>'
    );
    index++;
  });
  $("#rank_respec").find("path[id='char']").remove();
  var application_name = ['ash','attack','control','fastatk','shield','tank'];
  index = 0;
  $(".survey").find('.application').each(function () {
    $(this).html(
      '<i class="material-icons">&#xe836;</i>'+
      '<i class="material-icons" style="display:none">&#xe837;</i>'
    ).attr({'type':application_name[index],'value':0})
      .prev('.num').text('0票');
    index ++;
  });
}

function addSurvey(data,survey) {
  current_cat_survey = survey?survey:{};
  current_cat_statistic = data?data:current_cat_statistic;
  if(!data) return
  if(data.nickname) appendNickname(data.nickname);
  update_total_rank(data.rank);
  update_respect_rank(data.rank);
  update_application(data.application);
  if(survey.rank){
    for(let type in survey.rank){
      if(survey.rank[type]){
        let star =  $(".survey").find("span[type='"+type+"']").children("i"),
            flag = false;
        star.attr('value',1);
        for(let i=5;i>0;i--){
          if(survey.rank[type][i]) {flag=true;break}
          star.eq(i-1).attr("value",0);
        }
        if(flag) star.parent().attr("new",'false');
      }
    }
  }
  if(survey.application){
    for(let i in survey.application)
      if(survey.application[i])
        $('.survey .application[type="'+i+'"]').attr("value",1).children().toggle();
  }
}
function update_total_rank(rank) {
  if(!rank) return
  let total_rank = rank.total;
  let count = sum = max = 0;
  for(let i in total_rank){
    count += total_rank[i];
    sum += i*total_rank[i];
    max = total_rank[i]>max?total_rank[i]:max;
  }
  let angle = 2*Math.PI*sum/count/5;
  let arc = d3.svg.arc()
              .innerRadius(37)
              .outerRadius(43)
              .startAngle(0)
              .endAngle(angle);
  $('#rank_c').find('path').remove();
  d3.select("#rank_c").append('path').attr({
    'd':arc,
    'fill':'rgb(83, 245, 162)',
    'style':'transform:translate(43px,43px)'
  });
  if(Number(sum/count))
    d3.select("#rank_c").select('text')
      .text((sum/count).toFixed(1))
      .attr({
        x:22,y:53,dy:0,
        style:'font-size:30px;font-weight:bold'
      });
  let i = 5;
  $('#rank_detail .detail').each(function () {
    $(this).find(".char").css('width',function () {
      return (total_rank[i]/max*100)+"%"
    }).siblings(".num").text(total_rank[i]);
    i -- ;
  });
}
function update_respect_rank(rank) {
  let eq = 0,pos=[];
  for(let i in rank){
    let sum = count = 0;
    if(i == 'total') continue
    for(let j in rank[i]){
      sum += rank[i][j]*j;
      count += rank[i][j];
    }
    // console.log(i,sum,count);
    let a = Math.PI/3*eq+Math.PI/2,r = count?80*sum/count/5:0;
    pos.push({x:r*Math.cos(a)+119.28,y:-r*Math.sin(a)+100})
    eq++;
  }
  // console.log(pos);
  var line = d3.svg.line()
   .x(function(d) {return d.x;})
   .y(function(d) {return d.y;})
   .interpolate('linear-closed');
  $("#rank_respec").find("path[id='char']").remove();
  d3.select("#rank_respec").append('path')
    .attr({
      'd': line(pos),
      'y': 0,
      'stroke': '#ff8a11',
      'stroke-width': '3px',
      'fill': 'rgba(232, 185, 146, 0.6)',
      'id':'char'
    });
}
function update_application(app) {
  let max = -1e10,maxapp = null ;
  for(let i in app) {
    if(Number(app[i])>max) {max = app[i];maxapp = [i]}
    else if(Number(app[i])==max) {max = app[i];maxapp.push(i);}
    $('.survey .application[type="'+i+'"]').prev(".num").text(app[i]+"票");
  }
  $('.survey .application').prev(".num").css({"color":"black","font-weight":"normal"});
  for(let i in maxapp)
  $('.survey .application[type="'+maxapp[i]+'"]').prev(".num")
  .css({"color":"#f79942","font-weight":'bold'})
}

function update_nickname(val,queue,org,del = false) {
  var r, flag = false;

  if(!del) r = confirm('確定加入暱稱 : '+val+" ?");
  if(!r) flag = true;

  if((val == ''||!val) && !del){
    alert("請輸入暱稱!");
    flag = true;
  }
  for(let i in queue)
    if(queue[i]){
      if(queue[i].nickname == val && !del){
        alert("暱稱已存在!");
        flag = true;
      }
    }
  if(!flag || del){
    var obj = {
      owner:CurrentUserID,
      nickname:val
    }
    if(del){
      for(let i in queue) if(queue[i]) if(queue[i].owner == obj.owner && queue[i].nickname == obj.nickname) delete queue[i];
      for(let i in org) if(org[i]) if(org[i].owner == obj.owner && org[i].nickname == obj.nickname) delete org[i];
    }
    else{
      queue.push(obj);
      org.push(obj);
    }
    socket.emit("cat survey",{
      uid : CurrentUserID,
      cat : CurrentCatID.substring(0,3),
      type : 'nickname',
      add : obj,
      all : queue,
    });
  }
  appendNickname(org);
  $("#add_nick").show().siblings('span').hide();
}
function appendNickname(array) {
  $(".survey #nickname div").empty();
  for(let i in array){
    if(array[i] == null) continue;
    $(".survey #nickname>div").append(
      ` <span id='${i}' class='${array[i].owner == CurrentUserID?"own toggle_next":""}'offsetY='24'>
          ${array[i].nickname}
        </span>
        ${array[i].owner == CurrentUserID?"<div class='panel'><span>刪除</span></div>":""}
      `);
  }
}

$(document).on("click","#comment_submit",submitComment);
$(document).on('keypress','.comment_input textarea',function (e) {
  if(e.keyCode == '13' && !e.shiftKey) {submitComment();return false}
});
function submitComment() {
  var comment = $(".comment_input").find('textarea').val();
  // console.log(comment);
  if(!comment||!comment.trim()) return;


  var targetId;
  if(Page === 'cat') targetId = CurrentCatID;
  else if (Page === 'enemy') targetId = current_enemy_data.id;
  else if (Page === 'stage'){
    targetId = current_level_data.data.id;
    targetId = targetId.split("-");
    targetId = [targetId[1],targetId[2]].join("-");
  }
  else return;

  socket.emit('submit comment',{
    type:Page,
    id:targetId,
    owner:CurrentUserID,
    comment:comment,
    time:new Date().getTime()
  });
  $(".comment_input").find('textarea').val('');
  $(".Nocomment").remove();
}
function append_comment(comment) {
  $(".commentTable .comment,.commentTable .Nocomment").remove();
  if(!comment||comment == "-"){
    $(".commentTable").append("<tr class='Nocomment'><td colspan='6'>尚無評論</td></tr>");
    return;
  }
  var html = '';
  for(let i in comment)
    html += commentHtml(i,comment[i],comment[i].userInfo.photo,comment[i].userInfo.name);

  $(".commentTable tbody").append(html);
}
function commentHtml(id,comment,photo = null,name = null) {
  photo = photo || Unit.imageURL('cat','001-1');
  name = name || '某個離去的使用者';
  if(comment.report)
    if(comment.report.count > 3)
      return createHtml('tr',createHtml('td',createHtml('div',"<span>此留言已被多人檢舉，正在處理中</span>",{class:"comment_content"}),{colspan:6}),{class:'comment'});
  for(let i in comment.report)
    if(i === CurrentUserID)
      return createHtml('tr',createHtml('td',createHtml('div',"<span>你已檢舉此留言</span>",{class:"comment_content"}),{colspan:6}),{class:'comment'});
  return `
    <tr class="comment">
      <td colspan="6" class="${comment.owner == CurrentUserID?"own":""}">
        <div class="comment_content">
          <span class="photo" style="background-image:url('${photo?photo:""}')"></span>
          <span class='name'>${name?name:""}</span>
          <div id='${id}'>
            <span class='bubble'>${comment.comment.split("\n").join("</br>")}</span>
            <span class='function'>
              <span class='time'>${commentTime(comment.time)}</span>
              <span class='like'>${likeOrEdit(comment.owner,comment.like)}</span>
            </span>
          </div>
        </div>
      </td>
    </tr>
  `
}
function commentTime(date) {
  var now = new Date().getTime(),
      d = now-date,
      b = new Date(date);
  if(d<60000) return (d/1000).toFixed(0)+"秒前"
  else if(d<3600000) return (d/60000).toFixed(0)+"分鐘前"
  else if(d<86400000) return (d/3600000).toFixed(0)+"小時前"
  else if(d<86400000*7) return (d/86400000).toFixed(0)+"天前"
  else return b.getFullYear()+"/"+(b.getMonth()+1)+"/"+b.getDate()
}
function likeOrEdit(uid,like) {
  var html = '',me = CurrentUserID,count = 0;
  for(let i in like) count++;
  html+='<i class="material-icons" id="like" value='+
        (like?(like[me]?1:0):0) +'>thumb_up_alt</i>'+
        '<span id="num_like">'+count+'</span>'+
        '<i class="material-icons" id="report">report</i>';
  if(uid == me){
    html+='<i class="material-icons" id="edit">edit</i>';
    html+='<i class="material-icons" id="del">delete</i>';
  }
  return html
}

var commentOrg;
$(document).on('click','.function .like i',function () {
  var func = $(this).attr('id'),
      num = Number($(this).next('span').text()),
      val = Number($(this).attr('value')),
      key = $(this).parents('div').attr("id"),
      inverse = false;
  // console.log(func);
  if(func == 'like'){
    if(!val) $(this).next('span').text(num+1);
    else {
      $(this).next('span').text(num-1);
      inverse = true;
    }
  }
  else if(func == 'del'){
    let r = confirm('確定刪除?!');
    if(r) $(this).parents(".comment").remove();
  }
  else if(func == 'edit'){
    a = $(this).parents(".function").siblings(".bubble");
    commentOrg = a.html().split("<br>").join("\n");
    a.html(`<textarea rows='1' maxlength='100' style='width:${($(".comment").innerWidth() - $(".photo").innerWidth())*0.75}'></textarea>`)
      .find("textarea").val(commentOrg).select();
    return;
  }
  else if(func == 'report'){
    if(!confirm("確定檢舉此留言?")) return;
    $(this).parents(".comment_content").html("<span>你已檢舉此留言</span>");
  }

  var targetId;
  if(Page === 'cat') targetId = CurrentCatID;
  else if (Page === 'enemy') targetId = current_enemy_data.id;
  else if (Page === 'stage'){
    targetId = current_level_data.data.id;
    targetId = targetId.split("-");
    targetId = [targetId[1],targetId[2]].join("-");
  }
  else return;

  socket.emit('comment function',{
    uid: CurrentUserID,
    key: key,
    type: Page,
    id: targetId,
    func: func,
    inverse: inverse
  });
  $(this).attr('value',function () { return val?0:1 });
});
$(document).on('keypress','.comment_content textarea',function (e) {
  if(e.keyCode == '13' && !e.shiftKey) {$(this).blur();return false}
});
$(document).on('blur','.comment_content textarea',editComment);
function editComment() {
  var r = confirm("確定修改?");
  var val = $('.comment_content textarea').val(),
      key = $(this).parents('div').attr("id"),
      b = val.split("\n").join("<br>");
  if(r){
     $(this).parent().html(b);

     var targetId;
     if(Page === 'cat') targetId = CurrentCatID;
     else if (Page === 'enemy') targetId = current_enemy_data.id;
     else if (Page === 'stage'){
       targetId = current_level_data.data.id;
       targetId = targetId.split("-");
       targetId = [targetId[1],targetId[2]].join("-");
     }
     else return;

     socket.emit('comment function',{
       uid: CurrentUserID,
       key: key,
       id: targetId,
       type: Page,
       func: 'edit',
       val: val,
       inverse: false
     });
   }
  else $(this).parent().html(commentOrg.split("\n").join("<br>"));
}

$(document).ready(function () {
  socket.on('comment push',function (data) {
    // console.log(data);
    if(!data) alert("發生未知錯誤!");
    else if(data === 'Anonymous') alert("匿名使用者無法發布評論!");
    else $(".commentTable tbody").append(commentHtml(data.key,data,data.photo,data.name));
  });
  socket.on("required comment",(data) => {
    // console.log(data);
    append_comment(data);
  });
});
