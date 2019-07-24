import React, {Component} from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import logo from '../logo_text.png';
import Home from './Home.js';
import Cat from './Cat.js';
import Enemy from './Enemy.js';
import Display from './Display.js';
import Setting from './Setting.js';
import NotFound from './NotFound.js';
import Login from './Login.js';
import io from 'socket.io-client';
import firebase from 'firebase/app';
import 'firebase/auth';
import {TreeView, FunctionButton} from "./Utility.js";
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
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

class HamburgerMenu extends Component {
  constructor(props) {
    super(props);
    this.clickEvent = this.clickEvent.bind(this);
  }
  clickEvent(){
    this.props.clickEvent();
  }
  render(){
    return(
      <div className="menu" onClick={this.clickEvent} active={this.props.active}>
        <span></span> <span></span> <span></span>
      </div>
    );
  }
}
class NavigationSideColumn extends Component {
  constructor(prop) {
    super(prop);
    this.clickNodeEvent = this.clickNodeEvent.bind(this);
  }

  clickNodeEvent(){
    this.props.clickNodeEvent()
  }

  render(){
    var
    arr_1 = [
      <Link  to="/cat">貓咪資料</Link>,
      <Link  to="/enemy/">敵人資料</Link>,
      <Link  to="/combo/">查詢聯組</Link>,
      <Link  to="/stage/">關卡資訊</Link>,
      <Link  to="/rank/">等級排行</Link>,
      <Link  to="/treasure/">寶物圖鑑</Link>
    ],
    arr_2 = [
      <Link  to="/compare/">比較器</Link>,
      <Link  to="/expCalculator/">經驗計算機</Link>,
      <Link  to="/book/">我的貓咪圖鑑</Link>
    ],
    arr_3 = [
      <Link  to="/gacha/">轉蛋模擬器</Link>,
      <Link  to="/game/">釣魚小遊戲</Link>
    ];

    return(
      <div className="NavigationSideColumn NoScrollBar">
        <div className="navLinkBox">
          <TreeView rootName='資料庫' nodes={arr_1} clickNodeEvent={this.clickNodeEvent} />
          <TreeView rootName='更多功能' nodes={arr_2} clickNodeEvent={this.clickNodeEvent} />
          <TreeView rootName='打發時間' nodes={arr_3} clickNodeEvent={this.clickNodeEvent} />
          <div style={{display:"flex",flexDirection:"column",paddingLeft:"10px"}}>
            <Link onClick={this.clickNodeEvent} to="/calendar/">活動日程</Link>
            <Link onClick={this.clickNodeEvent} to="/document/"><i className="material-icons">help</i> <span>使用教學</span> </Link>
            <Link onClick={this.clickNodeEvent} to="/history/"><i className="material-icons">history</i> <span>歷程記錄</span> </Link>
          </div>
        </div>
      </div>
    );
  }
}
class AuthArea extends Component{
  constructor(props) {
    super(props);
    this.state = {
      AnchorEl: null
    }
    this.logout = this.logout.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }
  logout(){
    firebase.auth().signOut().then(function() {
      window.location.reload(); // Sign-out successful.
    }, function(error) {
      console.log(error); alert("登出錯誤，請重試"); // An error happened.
    });
  }

  handleClick(e) {
    this.setState({AnchorEl:this.button});
  }

  handleClose() {
    this.setState({AnchorEl:null});
  }
  render(){
    return(
      <div className='AuthArea flex'>
        <div className='flex' aria-controls="AuthAreaMenu" aria-haspopup="true" ref={el => this.button = el} onClick={this.handleClick}>
          <span className="userPhoto flex">
            {this.props.user?
              <img src={this.props.user.photoURL} alt=''/>:
              <i className="material-icons" style={{width: "30px", textAlign: "center",padding: "2px"}}>person</i>
            }
          </span>
          <span className="current_user_name flex">{this.props.user?this.props.user.displayName:""}</span>
        </div>
        <Menu
          id="AuthAreaMenu"
          anchorEl={this.state.AnchorEl}
          keepMounted
          open={Boolean(this.state.AnchorEl)}
          onClose={this.handleClose}
        >
          { this.props.user? <MenuItem onClick={this.handleClose}><Link to='/setting'><i className="material-icons">settings</i>設定</Link></MenuItem>:null }
          {
            this.props.user?
            <MenuItem onClick={this.handleClose}><Link to='/' onClick={this.logout}><i className="material-icons">exit_to_app</i>登出</Link></MenuItem>:
            <MenuItem onClick={this.handleClose}><Link to='/login'><i className="material-icons">person</i>登入</Link></MenuItem>
          }
        </Menu>
      </div>
    );
  }
}
class Navigation extends Component{
  constructor(props) {
    super(props);
    this.state = { active: 0,user: null};
    this.clickMenu = this.clickMenu.bind(this);
  }
  componentDidMount(){
    this.props.socket.on("login complete",(data)=>{
      console.log(data);
      this.setState({user:{displayName:data.name, photoURL: data.photo?data.photo:"./css/footage/cat/u001-1.png"}})
    });
  }
  clickMenu(){
    this.setState({active: (this.state.active+1)%2 });
  }

  render(){
    return(
      <nav>
        <HamburgerMenu active={this.state.active} clickEvent={this.clickMenu}/>
        <NavigationSideColumn clickNodeEvent={this.clickMenu} />
        <Link to="/"><img src={logo} alt='Logo'/></Link>
        <AuthArea user={this.state.user?this.state.user:this.props.user} />
        <div className='NavBG' onClick={this.clickMenu}></div>
      </nav>
    );
  }
}
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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      socket: io.connect(),
      ready: false
    };
  }

  componentDidMount(){
    const auth = firebase.auth(),
          socket = this.state.socket;
    auth.onAuthStateChanged((user) => {
      if (user){
        this.setState({user: user});
      }
      else  {
        console.log('did not sign in');
      }
      this.setState({ready:true});
    });
  }

  render(){
    return(
      <Router>
        <Navigation user={this.state.user} socket={this.state.socket}/>
        <Switch>
          <Route path="/" exact render={() => <Home socket={this.state.socket} /> } />
          <Route path="/cat" exact component={Cat} />
          <Route path="/enemy" exact component={Enemy} />
          <Route path="/cat/:id" render={(props) => <Display {...props} ready={this.state.ready} user={this.state.user} socket={this.state.socket} displayType="cat"/>} />
          <Route path="/enemy/:id" render={(props) => <Display {...props} ready={this.state.ready} user={this.state.user} socket={this.state.socket} displayType="enemy"/>} />
          <Route path="/setting" component={Setting} />
          <Route path="/login" render={() => <Login socket={this.state.socket} firebase={firebase} user={this.state.user}/> } />
          <Route component={NotFound} />
        </Switch>
        <SnapshotHolder />
      </Router>
    );
  }
}

export default App;
