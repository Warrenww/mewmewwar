$(document).ready(function () {

  var current_user_data = {};
  var resultDataPreview = {};
  var user_photo_url = false;
  if(Storage){
    if(localStorage.openMethod){
      let temp = localStorage.openMethod;
      if($("select[name='openMethod'] option[value='"+temp+"']").length == 0){
        temp = "iframe";
        localStorage.openMethod = temp;
      }
      $("select[name='openMethod'] option[value='"+temp+"']").prop("selected",true);
    }
  }
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
      socket.emit("require setting",user.uid);
      if (!user.isAnonymous) user_photo_url = user.providerData[0].photoURL;
      // console.log(user_photo_url);
    } else {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });

  $(document).on('blur','#default_cat_lv',function () {
    let val = Number($(this).val()) ;
    if(val>100||val<1){
      alert("超出範圍!!!");
      $(this).val(current_user_data.setting.default_cat_lv);
      return
     }
    socket.emit("Set Setting",{uid:current_user_data.uid,target:'default_cat_lv',value:val})
  });
  $(document).on('blur','#userName',function () {
    let val = $(this).val() ;
    if(!confirm("確定要將名字改為"+val+"嗎?")) return
    $("#current_user_name").text("Hi, "+val);
    socket.emit("rename",{uid:current_user_data.uid,name:val});
  });
  $(document).on("click","#reset_cat_lv",function () {
    let r = confirm("所有貓咪等級將重設為"+current_user_data.setting.default_cat_lv+"等");
    if(!r) return
    socket.emit("reset cat level",current_user_data.uid);
    if(window.parent.reloadIframe) window.parent.reloadIframe('all');
  });
  var owned;
  $("#reset_own_cat").click(function () {
    socket.emit("cat list",current_user_data.uid);
    $("#own_setting").fadeIn(300);
  });
  $("#own_setting .wrapper .progress span").click(function () {
    $(this).attr("active",true).siblings().attr("active",null);
    $("#own_setting .wrapper .display").css("left",Number($(this).attr("pos"))*(-100)+"%");
    $("#own_setting .wrapper .display").scrollTop(0);
  });
  socket.on("cat list",res => {
    var map = res.map,total = 0;
    owned = res.owned;
    for(let i in map){
      let count = 0;
      $(`#own_setting .wrapper .display div[target='${i}']`).empty();
      $(`#own_setting .wrapper .display div[target='${i}']`).append(
        map[i].map(x => {
          if(Number(owned.indexOf(x) !== -1)) {count ++;total++;}
          return `<span class="card" cat-id=${x} owned=${Number(owned.indexOf(x) !== -1)} style="background-image:url('/css/footage/cat/u${x}-1.png')"></span>`
        }).join("")
      );
      $(`#own_setting .wrapper .progress span[target="${i}"]`).attr("number",count);
    }
    $(`#own_setting .wrapper .control span`).text(total);
    console.log(owned);
  });
  $("#own_setting .wrapper .control i").click(function () {
    var conf = true;
    if($(this).text() === "done"){
      conf = confirm("確定儲存我擁有的貓咪");
      socket.emit("reset owned cat",{uid:current_user_data.uid,arr:owned});
    }
    if(conf) $("#own_setting").fadeOut(300);
  });
  $(document).on("click","#own_setting .wrapper .display .card",function () {
    var cat_id = $(this).attr("cat-id"),
        rarity = $(this).parent().attr("target"),
        count = Number($(`#own_setting .wrapper .progress span[target="${rarity}"]`).attr("number")),
        total = Number($(`#own_setting .wrapper .control span`).text());
    if(Number($(this).attr("owned"))){
      owned.splice(owned.indexOf(cat_id),1);
      count --;
      total --;
    } else {
      owned.push(cat_id);
      count ++;
      total ++;
    }
    $(this).attr("owned",Number(!Number($(this).attr("owned"))));
    $(`#own_setting .wrapper .progress span[target="${rarity}"]`).attr("number",count);
    $(`#own_setting .wrapper .control span`).text(total);
  });

  $(document).on("click","#logout",function () {
    if(!confirm("確定要登出嗎")) return
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
      window.parent.location.assign("/");
    }, function(error) {
      // An error happened.
    });
  });
  $("select[name='openMethod']").change(function () {
    if(Storage){
      var val = $("select[name='openMethod']").val();
      console.log(val);
      localStorage.openMethod = val;
    } else {
      alert("您的瀏覽器無法儲存變更");
    }
    window.parent.location.assign("/");
  });
  $(document).on("click","input[type='checkbox']",function () {
    var type = $(this).attr("id");
    type = type.split("show_")[1];
    socket.emit("change setting",{
      type:type,
      uid:current_user_data.uid,
      state:$(this).prop("checked")
    });
    if(type.indexOf("cat")!=-1 || type == 'ability_text')
      if(window.parent.reloadIframe) window.parent.reloadIframe('cat');
    if(type.indexOf("enemy")!=-1)
      if(window.parent.reloadIframe) window.parent.reloadIframe('enemy');
  });

  socket.on("current_user_data",function (data) {
    // console.log(data);
    current_user_data = data ;
    $("#userName").attr('value',data.name);
  });
  socket.on("user setting",function (data) {
    console.log(data);
    var exp = 0 , dataField = ['hp','atk','range','tag'];
    for(let i in data){
      if(i == "default_cat_lv"){
        $("#default_cat_lv").attr('value',data.default_cat_lv);
      }
      else if(i == 'cat_survey_count') {
        $("#total_survey").text(data[i]);
        exp += 1000*Number(data[i]);
      }
      else if(i == 'photo'){
        $('#photo').css("background-image",'url("'+data[i]+'")');;
      }
      else {
        $("#"+i).prop('checked',data[i]);
      }
    }
    if(data.MoreDataField) dataField = data.MoreDataField;
    for(let i in dataField){
      $("#exclude span[tag='"+dataField[i]+"']").appendTo("#include");
    }
    $("#include,#exclude").sortable({ connectWith:"#include,#exclude" });
    $("#saveField").attr("save",'true');
    if(data.resultDataPreview){
      resultDataPreview = data.resultDataPreview;
      for(let unit in resultDataPreview){
        var target = $(".resultDataPreview[type='"+unit+"']");
        target.children("*:not(:first)").remove();
        for(let i in resultDataPreview[unit]){
          if(target.find("select:last").val()==""){
            target.find("select:last").val(resultDataPreview[unit][i])
          } else {
            target.find("select:last").parent().clone().appendTo(target);
            target.find("select:last").val(resultDataPreview[unit][i])
            .siblings("span").text(target.find("select").length+". ");
          }
        }
        target.attr("data-array",JSON.stringify(resultDataPreview[unit]));
      }
    }
  });

  var fadeOut = e => $('#photo_chooser').fadeOut(400);
  $("#photo span").click(function () {
    $('#photo_chooser').css('display','flex');
    $("#photo_chooser div:first").show();
    $("#photo_chooser div:last").hide();
    $("#photo_chooser").bind('click',fadeOut);
  });
  $("#photo_chooser div div span").click(function (e) {
    e.stopPropagation();
    $("#photo_chooser").unbind('click',fadeOut);
    var type = $(this).attr("type");
    changePhoto(type).then(photo => {
      socket.emit("user photo",{
        uid:current_user_data.uid,
        photo:photo,
        type:'account'
      });
      console.log(photo);
      $('#photo').css({
        "background-image":'url("'+photo+'")',
        "background-position":'0'
      });
      $('#photo_chooser').fadeOut(400);
    }).catch(e => $('#photo_chooser').fadeOut(400));
  });
  function changePhoto(type){
    return new Promise(function(resolve, reject) {
      var photo;
      if(type === 'account'){
        if(!user_photo_url) {
          alert("無法取得照片");
          reject();
        }
        photo = user_photo_url;
        if(window.parent.changePhoto) window.parent.changePhoto(photo);
        resolve(photo);
      } else {
        socket.emit("Game Picture");
        socket.on("Game Picture",(data) => {
          $("#photo_chooser div:first").hide();
          $("#photo_chooser div:last").show().empty();
          for(let i in data){
            let id = data[i].id;
            for(let j=1;j<data[i].data.length;j++){
              $("#photo_chooser div:last").append(`<span class="card" value="${Unit.imageURL('cat',AddZero(id,2)+"-"+j)}" style="background-image:url('${Unit.imageURL('cat',AddZero(id,2)+"-"+j)}')"></span>`);
            }
          }
        });
      }
      $(document).on('click','#photo_chooser div:last .card',function(e){
        e.stopPropagation();
        resolve($(this).attr("value"));
      });
      $(document).on('click','#photo_chooser',function(){
        reject();
      })
    });
  }

  socket.on("random cat photo",function (photo) {
    $('#photo').css({
      "background-image":'url("'+photo+'")',
      "background-position":'-4px 6px'
    });
    if(window.parent.changePhoto) window.parent.changePhoto(photo);
  });
  $(".showNext").click(function () {
    $(this).attr('active',()=>{return (Number($(this).attr('active'))+1)%2}).siblings('i').toggle();
    $(this).parent().next().toggle();
  });
  $("#include").on("sortupdate",()=>{ $("#saveField").attr("save",'false');});
  $("#saveField").click(()=>{
    var arr = $("#include").sortable("toArray",{attribute:"tag"});
    console.log(arr);
    if(arr.length > 4) if(!confirm("超過4個欄位可能造成顯示過於擁擠，是否仍要保存?")) return;
    if(arr.length == 0) {alert("請至少選擇一個欄位!!!");return; }
    $("#saveField").attr("save",'true');
    socket.emit("Set Setting",{
      uid : current_user_data.uid,
      target: 'MoreDataField',
      value : arr
    });
    if(window.parent.reloadIframe) window.parent.reloadIframe('stage');
  });
  $("#restoreField").click(()=>{
    var arr = ['hp','atk','range','tag'];
    $("#include span").appendTo("#exclude");
    socket.emit("Set Setting",{
      uid : current_user_data.uid,
      target: 'MoreDataField',
      value : arr
    });
    arr.map( x => $("#exclude span[tag='"+x+"']").appendTo("#include"));
    $("#saveField").attr("save",'true');
    if(window.parent.reloadIframe) window.parent.reloadIframe('stage');
  });

  $(".cloneSelect").click(function () {
    var next = $(this).parent().next(),
        last = next.children(":last").find("select"),
        length = next.children().length;
    if(last.val() == "") {alert("請先填入最後欄位!");return;}
    if(length>2) if(!confirm("超過3個欄位可能造成顯示過於擁擠，是否仍要繼續?")) return;
    next.children().eq(0).clone().appendTo(next);
    next.children(":last").find("span").text(next.children().length+". ");
  });
  $(document).on("change",".dataPreview",function (e) {
    var type = $(this).parents(".setting_item").attr("type"),
        arr = JSON.parse($(this).parents(".setting_item").attr("data-array"));
    if(arr.indexOf($(this).val()) != -1){
      alert("欄位已存在!");
      console.log(arr);
      arr.map((x,i)=>$(this).parents(".setting_item").find("select").eq(i).val(x));
      if($(this).is($(".setting_item select:last"))) $(this).parents(".setting_item").find("select:last").val("");
      return;
    }
    arr = [];
    $(this).parents(".setting_item").find("select").each(function() {arr.push($(this).val());});
    $(this).parents(".setting_item").attr("data-array",JSON.stringify(arr));
    resultDataPreview[type] = arr;
    socket.emit("Set Setting",{
      uid : current_user_data.uid,
      target: "resultDataPreview",
      value : resultDataPreview
    });
  });
});
