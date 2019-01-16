$(document).ready(function () {

  var current_user_data = {};
  var user_photo_url = false;
  if(Storage){
    if(localStorage.openInNewWindow == "true"){
      $("#openInNewWindow").click();
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
  $(document).on("click","#reset_own_cat",function () {
    let r = confirm("要重置所有擁有的貓咪嗎?");
    if(!r) return
    socket.emit("reset owned cat",current_user_data.uid);
    if(window.parent.reloadIframe) window.parent.reloadIframe('all');
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
  $(document).on("click","input[type='checkbox']",function () {
    var type = $(this).attr("id");
    if(type == "openInNewWindow"){
      if(Storage){
        var temp = localStorage.openInNewWindow;
        temp = temp == "true"?false:true;
        localStorage.openInNewWindow = temp;
      } else {
        alert("您的瀏覽器不支援此功能");
      }
      window.parent.location.assign("/");
      return
    }
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
  $(document).on('click',"#show_miner",function () {
    setTimeout(function () {
      window.parent.location.assign("/");
    },1000);
  });

  socket.on("current_user_data",function (data) {
    // console.log(data);
    current_user_data = data ;
    $("#userName").attr('value',data.name);
  });
  socket.on("user setting",function (data) {
    // console.log(data);
    var exp = 0 , dataField = ['hp','atk','range','tag'];
    for(let i in data){
      if(i == "default_cat_lv"){
        $("#default_cat_lv").attr('value',data.default_cat_lv);
      }
      else if(i == 'mine_alert'){
        console.log(data[i].count);
        let count = data[i].count,ww;
        ww = count>1e5?count/1e6:count/1e3 ;
        exp += count;
        $("#total_hash").text(ww.toFixed(2)+(count>1e5?"MH":"kH"))
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

  });

  $("#photo").hover(function () {
    $(this).children().show(400);
  },function () {
    $(this).children().hide(400);
  });
  $("#photo span").click(function () { $('#photo_chooser').css('display','flex'); });
  $("#photo_chooser").click(function () { $('#photo_chooser').fadeOut(400); });
  $("#photo_chooser div div span").click(function (e) {
    e.stopPropagation();
    var type = $(this).attr("type");
    if(type == 'account'){
      if(!user_photo_url){ alert("無法取得照片"); return }
      $('#photo').css({
        "background-image":'url("'+user_photo_url+'")',
        "background-position":'0'
      });
      if(window.parent.changePhoto) window.parent.changePhoto(user_photo_url);
    }
    socket.emit("user photo",{
      uid:current_user_data.uid,
      photo:user_photo_url,
      type:type
    });
    $('#photo_chooser').fadeOut(400);
  });
  socket.on("random cat photo",function (photo) {
    $('#photo').css({
      "background-image":'url("'+photo+'")',
      "background-position":'-4px 6px'
    });
    if(window.parent.changePhoto) window.parent.changePhoto(photo);
  });
  $(".showNext").click(function () {
    $(this).attr('active',()=>{return (Number($(this).attr('active'))+1)%2})
      .siblings('i').toggle().parent().next().toggle();
  });
  $("#include").on("sortupdate",()=>{ $("#saveField").attr("save",'false');
  });
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
});
