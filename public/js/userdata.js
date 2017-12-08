$(document).ready(function () {
  var socket = io.connect();
  var current_user = {
    'name' : '',
    'uid' : ''
  };
  auth.onAuthStateChanged(function(user) {
    if (user) {
      current_user.name = user.displayName;
      current_user.uid = user.uid;
      console.log(current_user.uid) ;
      socket.emit("history",current_user.uid);
    } else {
      console.log('did not sign in');
    }
  });
  socket.on("return history",function (history) {
    console.log(history);
    for(let i in history.cat)
      $("#history_cat").append(
        '<span class="card" value="'+history.cat[i].id+'" '+
        'style="background-image:url('+
        image_url_cat+history.cat[i].id+'.png);">'+
        history.cat[i].name+'</span>');
    for(let i in history.enemy)
      $("#history_ene").append(
        '<span class="card" value="'+history.enemy[i].id+'" '+
        'style="background-image:url('+
        image_url_enemy+history.enemy[i].id+'.png);">'+
        history.enemy[i].name+'</span>');
  });


});
