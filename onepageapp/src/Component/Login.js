import React, {Component, useState, useEffect} from 'react';
import { Redirect } from 'react-router';
import {Copiable} from './Utility.js';
import '../Style/Login.css'

class LoginButton extends Component {
  constructor(props) {
    super(props);
    this.loginFunction = this.loginFunction.bind(this);
  }

  loginFunction(){
    const firebase = this.props.firebase;
    const auth = firebase.auth();
    const facebook_provider = new firebase.auth.FacebookAuthProvider();
    const google_provider = new firebase.auth.GoogleAuthProvider();
    var provider = this.props.provider;

    if(provider){
      if(provider === 'facebook') provider = facebook_provider;
      else if(provider === 'google') provider = google_provider;
      else alert("未知錯誤，請重新整理");

      auth.signInWithPopup(provider).then((result) => {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        // var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // console.log(user);
        this.props.socket.emit("user login",user) ;
        this.props.update({success:true});
      }).catch((error) => {
        console.log(error);
        // Handle Errors here.
        var errorCode = error.code;
        this.props.update({success:false,error:errorCode});

        // var errorMessage = error.message;
        // The email of the user's account used.
        // var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        // var credential = error.credential;
      });
    }
  }

  render(){
    return(
      <span className="flex"onClick={this.loginFunction}>
        <img src={this.props.img} width={this.props.imgSize} alt="" />
      </span>
    )
  }
}

const Login = props => {
  const [status, setStatus] = useState({loginResult: {}});

  function UpdateState (status) {
    setStatus({loginResult: status});
  }

  var content = (
    <div className='flex_col'>
      <h4>請選擇一種登入方式</h4>
      <div className="login_box flex">
        <LoginButton img="/css/footage/facebook.png" imgSize="50px"firebase={props.firebase} socket={props.socket} provider="facebook" update={UpdateState}/>
        <LoginButton img="/css/footage/google.png" imgSize="30px"firebase={props.firebase} socket={props.socket} provider="google" update={UpdateState}/>
      </div>
    </div>
  );
  if(props.user || status.loginResult.success) return <Redirect to="/" />
  else if(status.loginResult.success === false){
    if(status.loginResult.error === "auth/popup-closed-by-user"){}
    else if(status.loginResult.error === "auth/web-storage-unsupported"){
      content = (
        <div className='flex_col'>
        <h4>登入錯誤</h4>
        <div className="login_box flex_col">
          瀏覽器禁用了第三方cookie，請從設定中啟用第三方cookie<br/>
          若為Chrome瀏覽器，點擊以複製以下連結，並在網址列貼上以前往設定<br/>
          <Copiable content="chrome://settings/content/cookies"/>
          若為新版edge瀏覽器，點擊以複製以下連結，並在網址列貼上以前往設定<br/>
          <Copiable content="edge://settings/content/cookies"/>
        </div>
      </div>
      );
    }
    else if(status.loginResult.error === "auth/network-request-failed"){
      content = (
        <div className='flex_col'>
        <h4>網路錯誤請重新整理再嘗試</h4>
      </div>
      );
    }
    else if(status.loginResult.error === "auth/popup-blocked"){
      content = (
        <div className='flex_col'>
          <h4>登入錯誤</h4>
          <div className="login_box flex">
            瀏覽器阻擋了彈出視窗，請允許彈出視窗後重新整理
          </div>
        </div>
      );
    }
  }
  return(
    <div className="Login subApp flex_col NoScrollBar">
      {content}
    </div>
  );
}

export default Login;
