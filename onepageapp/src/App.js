import React, {Component} from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import logo from './logo_text.png';
import './App.css';
import Home from './Home.js';
import Cat from './Cat.js';
import io from 'socket.io-client';

class TreeView extends Component {
  constructor(props) {
    super(props);
    this.state = {expand:0}
    this.clickRoot = this.clickRoot.bind(this);
    this.clickNode = this.clickNode.bind(this);
  }

  clickRoot(){
    this.setState({expand: (this.state.expand+1)%2 })
  }

  clickNode(){
    if(this.props.clickNodeEvent) this.props.clickNodeEvent();
  }

  render(){
    return(
      <div className='TreeView' onClick={this.clickRoot}>
        <div className='Root'style={{cursor:"pointer"}}>{this.props.rootName}</div>
        <div className='NodeCollection' expand={this.state.expand}>
          {this.props.nodes.map((x,key) => {
            return <span className='Node' key={key} onClick={this.clickNode}>{x}</span>
          })}
        </div>
      </div>
    );
  }
}

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
      <Link  to="/cat/">貓咪資料</Link>,
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
            <Link onClick={this.clickNodeEvent} to="/setting/"><i className="material-icons">settings</i> <span>設定</span> </Link>
            <Link onClick={this.clickNodeEvent} to="/history/"><i className="material-icons">history</i> <span>歷程記錄</span> </Link>
          </div>
        </div>
      </div>
    );
  }
}
class Navigation extends Component{
  constructor(prop) {
    super(prop);
    this.state = {active: 0};
    this.clickMenu = this.clickMenu.bind(this);
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
        <div className='NavBG' onClick={this.clickMenu}></div>
      </nav>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const socket = io.connect();
    console.log(socket);
  }

  render(){
    return(
      <Router>
        <Navigation />
        <Route path="/" exact component={Home} />
        <Route path="/cat/" component={Cat} />
      </Router>
    );
  }
}

export default App;
