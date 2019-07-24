import React, {Component} from 'react';
import html2canvas from 'html2canvas';
import uniqueId from 'lodash/uniqueId';

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
            return <span className='Node' key={uniqueId()} onClick={this.clickNode}>{x}</span>
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
          return <div key={uniqueId()} index={i} className="ButtonState" onClick={this.changeState} active={this.state.stateArray[i]}>{x}</div>;
        })}
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
    SnapshotHolder.setAttribute("loading",1);

    html2canvas(target,{
      backgroundColor:bgc,
      allowTaint:true,
      logging:false,
    }).then((canvas) => {
        SnapshotHolder.getElementsByClassName("canvasHolder")[0].innerHTML = "";
        SnapshotHolder.getElementsByClassName("canvasHolder")[0].append(canvas);
        this.setState({mutex:false});
        SnapshotHolder.setAttribute("loading",0);
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
      active:false,
      selected: this.props.options.find(x => x.value === this.props.defaultValue),
      optionStyle:{}
    }
    this.handleClick = this.handleClick.bind(this);
    this.optionStyle = this.optionStyle.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  handleClick(e){
    this.setState({
      active: !this.state.active ,
      optionStyle: this.optionStyle()
    });
  }
  optionStyle(){
    var rect = {
      width:0,
      left:0,
      maxHeight:0,
      padding:0,
    },
    windowHeight = window.innerHeight;
    if(this.select){
      var select = this.select.getBoundingClientRect();
      rect.width = select.width;
      if(select.top < windowHeight/2) rect.top = select.top;
      else rect.bottom = windowHeight - select.bottom;
      rect.left = select.left;
      if( !this.state.active){
        if(select.top < windowHeight/2) rect.maxHeight = (windowHeight - select.top - 30)+"px";
        else rect.maxHeight = (select.bottom - 30)+"px";
      }
      rect.padding = this.state.active?0:"10px 0px";
    }
    return rect;
  }
  handleChange(e){
    var value = e.target.getAttribute("value");
    this.props.onChange({target:{value:value}});
    this.setState({
      selected: this.props.options.find(x => x.value === value),
      active: false,
      optionStyle: this.optionStyle()
    });
  }
  render(){
    return(
      <div className="Select">
        <div className="display" ref={(el) => this.select = el} onClick={this.handleClick} style={this.props.disabled?{...this.props.style, backgroundColor: "gray", cursor: "not-allowed", pointerEvents:"none"}:{...this.props.style}}>
          {this.state.selected?this.state.selected.text:"請選擇"}
          <span style={{transformOrigin: "left", transform: "rotate(45deg) translateX(-2px)"}}></span>
          <span style={{transformOrigin: "right", transform: "rotate(-45deg) translateX(2px)"}}></span>
        </div>
        <div className='options NoScrollBar' style={{...this.state.optionStyle}}>
            {this.props.options.map((x,i)=>{
              return  <div key={uniqueId()} value={x.value} option-selected={(x.value === this.state.selected.value).toString()} onClick={this.handleChange}>
                        {x.text}
                      </div>
            })}
        </div>
        <div className="optionBG" style={{display:this.state.active?"block":"none"}} onClick={this.handleClick}></div>
      </div>
    );
  }
}

class Tools {
  constructor() {

  }
  static AddZero(n,e=1) {
    var s = Number(n);
    if(Number.isNaN(s)) return n;
    if(n == 0) e--;
    for(let i = e; i >= 0; i--){
      if (n < 10**(i)) s = "0"+s;
      else return s
    }
    return s
  }
  static level_to_value(rarity, originValue, level, id = ''){
    id = Number(id);
    var  limit,result;

    if(rarity === 'enemy') return originValue*level;

    switch (rarity) {
      case 'R':
      limit = 70 ;
      break;
      case 'SR_alt':
      limit = 20 ;
      break;
      default:
      limit = 60 ;
    }
    if(id === 26) limit = 30;
    
    result = (0.8+0.2*level)*originValue;
    if(level>limit) result = result - 0.1*(level-limit)*originValue;
    if(level>limit+20) result = result - 0.05*(level-limit-20)*originValue;
    return result;
  }
  static imageURL(type,id){
    const SmallIconMap = {
      '降攻':'atkdown',
      '增攻':'atkup',
      '免疫降攻':'noatkdown',
      '善於攻擊':'goodat',
      '很耐打':'morehp',
      '超級耐打':'morehp_ex',
      '超大傷害':'bighurt',
      '極度傷害':'bighurt_ex',
      '只能攻擊':'only_atk',
      '會心一擊':'criticalhit',
      '擊退':'goaway',
      '免疫擊退':'nogoaway',
      '3段連續攻擊':'serialatk',
      '2段連續攻擊':'serialatk',
      '不死剋星':'killdeath',
      '緩速':'slow',
      '免疫緩速':'noslow',
      '暫停':'stop',
      '免疫暫停':'nostop',
      '遠方攻擊':'faratk',
      '復活':'surive',
      '波動':'wave',
      '免疫波動':'nowave',
      '抵銷波動':'stopwave',
      '擊倒敵人時，獲得2倍金錢':'2money',
      '對敵城傷害x4':'castle',
      '免疫傳送':'notrans',
      '破盾':'breakshell',
      '一次攻擊':'1atk',
      '鋼鐵':'metal',
      '免疫古代詛咒':'nocurse',
      "紅色敵人":"red_enemy",
      "漂浮敵人":"float_enemy",
      "黑色敵人":"black_enemy",
      "鋼鐵敵人":"metal_enemy",
      "天使敵人":"angle_enemy",
      "外星敵人":"alien_enemy",
      "不死敵人":"death_enemy",
      "古代種":"ancient_enemy",
    }
    if(type === 'cat') return '/css/footage/cat/u'+id+'.png';
    if(type === 'enemy') return '/css/footage/enemy/e'+id+'.png';
    if(type === 'fruit') return `/css/footage/fruit/${id.seed?"seed":"fruit"}_icon0${id.id}.png`;
    if(type === 'smallIcon') return `/css/footage/gameIcon/${SmallIconMap[id] || id}.png`
    return "";
  }
  static is_level_Bind(prop) {
    const List = ['hp','dps','hardness','atk',];
    if(List.find(x => x === prop)) return true;
    else return false;
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
  Select,
  Tools
};
