import React, {Component} from 'react';
import html2canvas from 'html2canvas';

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

class CoustomAlert extends Component {
  constructor(props) {
    super(props);
    this.state = {show: true}
  }
  componentDidMount(){
    setTimeout(()=>{this.setState({show: false})},5000);
  }

  render(){
    if(this.state.show)
      return(
        <div className="CoustomAlert">
          {this.props.content}
        </div>
      );
    else return null ;
  }
}

class Copiable extends Component {
  constructor(props) {
    super(props);
    this.state = {finish: false};
    this.copy = this.copy.bind(this);
  }
  copy(e){
    var content = e.target.textContent,
        temp = document.createElement("input");
    document.body.appendChild(temp);
    temp.value = content;
    temp.select();
    document.execCommand('copy');
    setTimeout(()=>{temp.remove(); this.setState({finish: true})},500);
  }

  render(){
    return(
      <div className='Copiable' style={{cursor:"pointer"}} onClick={this.copy}>
       {this.props.content}
       {this.state.finish? <CoustomAlert content={<div>已複製到剪貼簿 <i class="material-icons">check_circle</i></div>} />:null}
     </div>
    );
  }
}

class FunctionButton extends Component {

  render(){
    return(
      <span className="FunctionButton flex" onClick={this.props.onClick} style={this.props.style}>
        {this.props.text?<span pos={this.props.spanPos?this.props.spanPos:"top"}>{this.props.text}</span>:null}
        <i className="material-icons">{this.props.icon}</i>
      </span>
    );
  }
}
class Button extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(){
    if(this.props.args) this.props.onClick(this.props.args);
    else this.props.onClick();
  }

  render(){
    return(
      <button onClick={this.handleClick}>{this.props.text}</button>
    );
  }
}
class StateButtonGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allowedMultiple: this.props.allowedMultiple?true:false,
      allowedTurnOff: this.props.allowedTurnOff?true:false,
      default: this.props.default,
      stateArray: this.createStateArray(this.props.buttons.length,this.props.default),
    }
    this.changeState = this.changeState.bind(this);
  }
  createStateArray(n,d){
    var array = [];
    array.length = n;
    array.fill(0);
    if(d) d.map(x => array[x] = 1);
    return array;
  }
  changeState(event){
    var index = Number(event.target.parentNode.getAttribute("index")),
        state = Number(event.target.active),
        array = this.state.stateArray;
    console.log(event.target.parentNode,index);
    if(state){
      if(!this.state.allowedTurnOff) array[index] = 0
    } else {
      if(!this.state.allowedMultiple) array.fill(0);
      array[index] = 1;
    }
    this.setState({stateArray:array})
  }
  render(){
    return(
      <div className="StateButtonGroup">
        {this.props.buttons.map((x,i)=>{
          return <div key={i} index={i} className="ButtonState" onClick={this.changeState} active={this.state.stateArray[i]}>{x}</div>;
        })}
      </div>
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
    document.querySelector("#SnapshotHolder canvas").style.transform = `scale(${this.state.scale})`
  }
  scaleDown(e){
    e.stopPropagation();
    if(this.state.scale === 0.25) return;
    this.setState({scale:this.state.scale - .25})
    document.querySelector("#SnapshotHolder canvas").style.transform = `scale(${this.state.scale})`
  }
  render(){
    return(
      <div id="SnapshotHolder" show={this.state.show}>
        <div className='picture NoScrollBar'></div>
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
class SnapshotButton extends Component {
  constructor(props) {
    super(props);
    this.snapshot = this.snapshot.bind(this);
    this.state = { mutex: false }
    this.snapshot = this.snapshot.bind(this);

  }
  snapshot(){
    if(this.state.mutex) return;
    this.setState({mutex:true});
    var target = document.querySelector(this.props.target),
        bgc = this.props.backgroundColor?this.props.backgroundColor:null,
        downloadName = this.props.downloadName?this.props.downloadName:"download";
    if(!target) return;
    const SnapshotHolder = document.querySelector('#SnapshotHolder');
    SnapshotHolder.setAttribute("show",1);
    SnapshotHolder.getElementsByClassName("picture")[0].innerHTML = '<div class="loading"><span></span><span></span><span></span><span></span></div>';

    html2canvas(target,{
      backgroundColor:bgc,
      allowTaint:true,
      logging:false,
    }).then((canvas) => {
        SnapshotHolder.getElementsByClassName("picture")[0].innerHTML = "";
        SnapshotHolder.getElementsByClassName("picture")[0].append(canvas);
        this.setState({mutex:false});
        try {
          canvas.toBlob(blob => {
            SnapshotHolder.getElementsByTagName("a")[0].href = URL.createObjectURL(blob);
            SnapshotHolder.getElementsByTagName("a")[0].download = downloadName;
          });
        } catch (e) { console.log(e); }
      });
  }

  render(){
    return(
      <div>
        <FunctionButton text="截圖" icon="add_a_photo" onClick={this.snapshot}/>
      </div>
    );
  }
}

class Select extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value
    }
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  handleClick(e){
    console.log(this.select);
    this.select.click();
  }
  handleChange(e){
    this.props.handleChange(e);
    this.setState({value: e.target.value})
  }
  render(){
    return(
      <div className="Select" disabled={this.props.disabled} onClick={this.handleClick}>
        {this.state.value}
        <select {...this.props} options={null} onChange={this.handleChange} ref={el => this.select = el}>
          {this.props.options.map((x,i)=>{
            return <option key={x} value={x}> {x} </option>
          })}
        </select>
      </div>
    );
  }
}

class Chooser extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <div className="Chooser">
      </div>
    );
  }
}

export {
  TreeView,
  Copiable,
  CoustomAlert,
  FunctionButton,
  Button,
  StateButtonGroup,
  SnapshotButton,
  SnapshotHolder,
  Chooser,
  Select
};
