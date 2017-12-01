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
  socket.on("return history",function (arr) {
    for(let i in arr)   $("#history").append(arr[i]+"</br>");
  });


});
