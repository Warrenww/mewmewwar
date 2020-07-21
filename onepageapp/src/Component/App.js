import React, {Component, useState, useEffect} from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import Home from './Home.js';
import Cat from './Cat.js';
import Enemy from './Enemy.js';
import Display from './Display.js';
import Setting from './Setting.js';
import NotFound from './NotFound.js';
import Login from './Login.js';
import Navigation from './Navigation.js';
import io from 'socket.io-client';
import 'firebase/auth';
import firebase from 'firebase/app';
import {FunctionButton} from "./Utility.js";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';


const FireBaseConfig = {
  apiKey: "AIzaSyC-SA6CeULoTRTN10EXqXdgYaoG1pqWhzM",
  authDomain: "battlecat-smart.firebaseapp.com",
  databaseURL: "https://battlecat-smart.firebaseio.com",
  projectId: "battlecat-smart",
  storageBucket: "battlecat-smart.appspot.com",
  messagingSenderId: "268279710428"
};

firebase.initializeApp(FireBaseConfig);

class SnapshotHolder extends Component {
  constructor(props) {
    super(props);
    this.state = {show:0,scale:1}
    this.hide = this.hide.bind(this);
    this.scaleUp = this.scaleUp.bind(this);
    this.scaleDown = this.scaleDown.bind(this);
  }
  hide(){
    document.querySelector("#SnapshotHolder").setAttribute("show",0);
  }
  scaleUp(e){
    e.stopPropagation();
    if(this.state.scale === 3) return;
    this.setState({scale:this.state.scale + .25})
    // document.querySelector("#SnapshotHolder canvas").style.transform = `scale(${this.state.scale})`
  }
  scaleDown(e){
    e.stopPropagation();
    if(this.state.scale === 0.25) return;
    this.setState({scale:this.state.scale - .25})
    // document.querySelector("#SnapshotHolder canvas").style.transform = `scale(${this.state.scale})`
  }
  render(){
    return(
      <div id="SnapshotHolder" show={this.state.show} loading={0}>
        <div className='picture NoScrollBar'>
          <div style={{transform:`scale(${this.state.scale})`,transformOrigin:"left"}} className="canvasHolder"></div>
          <div className="Loading"><span></span><span></span><span></span><span></span></div>
        </div>
        <div style={{position:"absolute",top:0 ,right:"30px", height:"100%"}}>
          <FunctionButton icon='close'  onClick={this.hide}/>
          <div style={{height:"calc(100% - 240px)"}}></div>
          <FunctionButton text='放大' icon='zoom_in'  onClick={this.scaleUp} spanPos="left"/>
          <FunctionButton text='縮小' icon='zoom_out' onClick={this.scaleDown} spanPos="left"/>
          <a style={{textDecoration:"none"}} download>
            <FunctionButton text='下載'icon='cloud_download' spanPos="left"/>
          </a>
        </div>
      </div>
    );
  }
}

const App = () => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(io.connect());
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    if(!socket) setSocket(io.connect());
    else {
      socket.on("login complete", data => {
        console.log(data)
      })
    }
    if(!auth) setAuth(firebase.auth());
    else {
      auth.onAuthStateChanged((usr) => {
        if (usr){
          setUser(usr);
        }
        else  {
          console.log('did not sign in');
        }
      });
    }
  });

  const logout = () => {
    firebase.auth().signOut().then(function() {
      window.location.reload(); // Sign-out successful.
    }, function(error) {
      console.log(error);
      alert("登出錯誤，請重試"); // An error happened.
    });
  }

  return(
    <Router>
      <Navigation user={user} socket={socket} logout={logout}/>
      <Switch>
        <Route path="/" exact render={() => <Home socket={socket} /> } />
        <Route path="/cat" exact component={Cat} />
        <Route path="/enemy" exact component={Enemy} />
        <Route path="/cat/:id" render={(props) => <Display {...props} user={user} socket={socket} displayType="cat"/>} />
        <Route path="/enemy/:id" render={(props) => <Display {...props} user={user} socket={socket} displayType="enemy"/>} />
        <Route path="/setting" component={Setting} />
        <Route path="/login" render={() => <Login socket={socket} firebase={firebase} user={user}/> } />
        <Route component={NotFound} />
      </Switch>
      <SnapshotHolder />
    </Router>
  );
}

export default App;
