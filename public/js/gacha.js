$(document).ready(function () {
  const image_url =  "public/css/footage/cat/u" ;
  var socket = io.connect();
  $(document).on('click','#test',www);
  $(document).on('click','#test_2',function () {
    for(let i = 0;i < 11;i++) www()
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

  function www() {
    let result = Math.random();
    if(result<0.05)socket.emit("lucky","SSR");
    if(0.05<result&&result<0.3)socket.emit("lucky","SR");
    if(0.3<result)socket.emit("lucky","R");
  }
  socket.on("choose",function (data) {
    $(".result").append('<span class="card" value="'+data.id+'" '+
    'style="background-image:url('+
    image_url+data.id+'.png);'+
    "width:180;height:120;margin:5px;"+
    "border-color:"+(data.rarity == 'SSR' ?"rgb(241, 71, 71)":
    data.rarity == 'SR' ?"rgb(231, 184, 63)":"rgb(139, 214, 31)" )
    +'">'+data.name+'</span>');
  });
  $(document).on('click','.card',function () {
    let id = $(this).attr('value');
    socket.emit("user Search",{
      uid : current_user_data.uid,
      type : 'cat',
      id : id
    });
    location.assign("/cat.html");
  });

});
