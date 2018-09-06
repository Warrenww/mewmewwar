var CurrentUserID;
$(document).ready(function () {

  var own_data = [];

  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });

  socket.on("current_user_data",function (data) {
    CurrentUserID = data.uid ;
    if(data.folder.owned)
      socket.emit("required owned",{uid:data.uid,owned:data.folder.owned});
  });
  socket.on("owned data",function (data) {
    own_data = data ;
    let arrange = {};
    for(let i in data){
      let rarity = data[i].rarity;
      if(!arrange[rarity]){
        arrange[rarity] = {name:parseRarity(rarity),arr:[data[i]]}
      } else {
        arrange[rarity].arr.push(data[i]);
      }
    }
    // console.log(arrange);
    appendArrange(arrange);
  });
  $(document).on("click","#reload",function () {
    location.assign("/view/book.html");
  });
  $(document).on("click",".section_snapshot",function () {
    let target = $(this).parent()[0];
    snapshot(target);
  });

  $(document).on("click",'.select .button',function () {
    $(this).attr('value',1).siblings().attr("value",0);
    $(".action").fadeOut();
    let type = $(this).attr("id"),
        arrange = {},buffer = {};
    for(let i in own_data){
      if(type == 'rarity'){
        let rarity = own_data[i].rarity;
        if(!arrange[rarity]){
          arrange[rarity] = {name:parseRarity(rarity),arr:[own_data[i]]}
        } else {
          arrange[rarity].arr.push(own_data[i]);
        }
      } else if(type == 'id'){
        let id = Number(own_data[i].id.substring(0,3));
        buffer[id] = own_data[i];
      } else {
        let flag = true ,exist = [];
        for(let j in own_data[i].tag){
          let tag = own_data[i].tag[j];
          if(!tag) continue
          else if(type == 'color'&&tag.indexOf("對") == -1) continue
          else if(type == 'ability'&&tag.indexOf("對") != -1) continue
          else if(exist.indexOf(tag)!=-1) continue
          flag = false;
          exist.push(tag);
          if(!arrange[tag]){
            arrange[tag] = {name:tag,arr:[own_data[i]]}
          } else {
            arrange[tag].arr.push(own_data[i]);
          }
        }
        if(flag) buffer[i] = own_data[i];
      }
    }
    if(type == 'id'){
      arrange = {0:{name:"",arr:[]}};
      arrange[0].name = '依ID排序';
      for(let i in buffer) arrange[0].arr.push(buffer[i]);
    } else if(type != 'rarity'){
      arrange[0] = {name:"",arr:[]};
      arrange[0].name = '無';
      for(let i in buffer) arrange[0].arr.push(buffer[i]);
    }
    console.log(arrange);
    appendArrange(arrange);
  });
  $(document).on("click",'.name',function () {
    $(this).siblings(".item").toggle(400);
  });

  $(document).on('click','#searchBut',function () {
    let keyword = $(this).siblings().val();
    if(keyword) textSearch(keyword);
  });
  $(document).on('keypress','#searchBox',function (e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
      let keyword = $(this).val();
      if(keyword) textSearch(keyword);
    }
  });
  var position = [],pos = 0;
  function textSearch(k) {
    let result = [];
    position = [];
    pos = 0 ;
    $(".dataTable").find(".card").removeClass('blink');
    for(let i in own_data){
      let name = own_data[i].name;
      if(name.indexOf(k)!=-1) result.push(own_data[i].id);
    }
    // console.log(result);
    for(let i in result){
        let target = $(".dataTable").find(".card[value='"+result[i]+"']");
        target.addClass('blink');
        for(let j=0;j<target.length;j++){
          position.push(target[j].offsetTop);
        }
    }
    for(let i=0;i<position.length;i++){
      for(let j=i+1;j<position.length;j++){
        let r = '';
        if(position[j] == position[i])
          position.splice(j,1);
        if(position[j]<position[i]){
          r = position[j];
          position[j] = position[i];
          position[i] = r ;
        }
      }
    }
    console.log(position);
    $(".action").fadeIn();
    gotoPos();
  }
  $(document).on("click","#left,#right",function () {
    if($(this).attr("id")=='right') pos ++;
    else pos -- ;
    gotoPos();
  });
  $(document).on("click","#clear",function () {
    $("#searchBox").val("");
    $(".action").fadeOut();
    $(".dataTable").find(".card").removeClass('blink');
  });
  function gotoPos() {
    if(pos<0) pos = position.length-1;
    if(pos>position.length-1) pos = 0;
    $("body").animate({
      scrollTop : position[pos]-screen.height/4
    },600);
  }

  var editOn = 0 ;
  $("#edit").click(function () {
    editOn = Number($("#edit").attr("value"));
    if(!editOn) {
      // $(this).css("position",'fixed');
      $("body").find(".card").each(function () {
        $(this).addClass("edit")
      });
    } else {
      // $(this).css("position",'absolute');
      $("body").find(".card").each(function () {
        $(this).removeClass("edit");
      });
    }
  });
  $(document).on("click",'.card',function () {
    editOn = Number($("#edit").attr("value"));
    if(editOn){
      let name = $(this).text(),
          cat = $(this).attr("value").substring(0,3),
          r = confirm("確定要將"+name+"從'我擁有的貓咪'中移除?");
      if(r){
        $(this).remove();
        socket.emit("mark own",{
          uid:CurrentUserID,
          cat:cat,
          mark:false
        });
      }
    }
  });

});
function appendArrange(obj) {
  let html = ''
  for(let i in obj){
    html +=
      "<div class='section'><span class='name'>"+obj[i].name+"</span>"+
      "<span class='section_snapshot'><i class='material-icons'>&#xe439;</i></span>"+
      "<span class='item'>";
    for(let j in obj[i].arr){
      html += '<span class="card cat" type="cat" value="'+obj[i].arr[j].id+'" '+
      'style="background-image:url('+
      image_url_cat+obj[i].arr[j].id+'.png);" name>'+
      obj[i].arr[j].name+'</span>'
    }
    html += "</span></div>"
  }
  $(".display .dataTable").empty();
  $(".display .dataTable").append(html);
}
