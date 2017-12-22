$(document).ready(function () {
  var timer = new Date().getTime();
  var compare = [] ;
  var setting = {
        compare_max : 4 ,
        display_id : false
      } ;
  var filter_name = '' ;
  const image_url =  "../public/css/footage/cat/u" ;
  var socket = io.connect();
  var current_user_data = {
    setting:{show_cat_id:false,default_cat_lv:30,show_cat_count:false}
  };

  // auth.onAuthStateChanged(function(user) {
  //   if (user) {
  //     socket.emit("user connet",user);
  //   } else {
  //     console.log('did not sign in');
  //   }
  // });

  socket.on("current_user_data",function (data) {
    console.log(data);
    current_user_data = data ;
  });

  var chapter = ['世界篇','未來篇','宇宙篇','傳說故事','極難關','月間關','開眼關','貓咪</br>風雲塔'] ;
  var chapter_id = ['world','future','universe','story','hard','month','openEye','tower'] ;
  for(let i in chapter) $(".select_chapter").append("<button id='"+chapter_id[i]+"'>"+chapter[i]+"</button>") ;




});
