// Initialize Firebase
var config = {
    apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
    authDomain: "battlecat-smart.firebaseapp.com",
    databaseURL: "https://battlecat-smart.firebaseio.com",
    projectId: "battlecat-smart",
    storageBucket: "battlecat-smart.appspot.com",
    messagingSenderId: "268279710428"
  };

firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database();

auth.onAuthStateChanged(user => {
  if(user){
    console.log('firebase signed in');
  } else {
    console.log('firebase signed in');
  }
});

//
// $(document).ready(function () {
//
//   // log in status
//   if(window.location.pathname == '/'){
//     auth.onAuthStateChanged(user => {
//       if(user){
//         console.log('firebase signed in');
//         socket.emit("user login",user) ;
//       } else {
//         alert('need to sign in');
//       }
//     });
//   } else {
//     auth.onAuthStateChanged(user => {
//       if(user){
//         console.log('firebase signed in');
//         socket.emit("user login",user) ;
//       } else {
//         let r = confirm('need to sign in');
//         if(r) window.location.assign("/");
//       }
//     });
//   }

  // functions
  // function logout(){
  //   auth.signOut()
  //   .then(response => {
  //     window.location.assign("/login");
  //   })
  // }

// });
