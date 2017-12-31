$(document).ready(function () {
  const image_url =  "../public/css/footage/cat/u" ;
  var socket = io.connect();
  $(document).on('click','#test',function () {
    www(1)
  });
  $(document).on('click','#test_2',function () {
    www(11)
  });
  $(document).on('click','#test_3',function () {
    $(".result").empty();
  });
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
  });

  function www(n) {
    let data=[];
    for(let i=0;i<n;i++){
      let result = Math.random();
      if(result<0.05) data.push("SSR");
      if(0.05<result&&result<0.3) data.push("SR");
      if(0.3<result) data.push("R");
    }
    socket.emit("lucky",{
      uid:current_user_data.uid,
      result:data
    });

  }
  socket.on("choose",function (data) {
    // console.log(data);
    for(let i in data){
      $(".result").append('<span class="card" value="'+data[i].id+'" '+
      'style="background-image:url('+
      image_url+data[i].id+'.png);'+
      "width:180;height:120;margin:5px;"+
      "border-color:"+(data[i].rarity == 'SSR' ?"rgb(241, 71, 71)":
      data[i].rarity == 'SR' ?"rgb(231, 184, 63)":"rgb(139, 214, 31)" )
      +'">'+data[i].name+'</span>');
    }
    $('body').animate({
      scrollTop : $('.result')[0].offsetHeight
    },1000,"easeInOutCubic")
  });
  $(document).on('click','.card',function () {
    let id = $(this).attr('value');
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'cat',
      id : id
    });
    location.assign("/view/cat.html");
  });

});
