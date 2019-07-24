import React,{Component} from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import {Tools} from './Utility.js';
import uniqueId from 'lodash/uniqueId';
import Slider from '@material-ui/lab/Slider';
import Input from '@material-ui/core/Input';
import '../Style/Display.css';

class DisplayControl extends Component {
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <div className="DisplayControl flex">

      </div>
    )
  }
}

class DisplayTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeStage: this.props.dataPackage.currentStage,
      id: (this.props.dataPackage.data || {id:null}).id,
      lv: this.props.dataPackage.lv || 1,
      rarity: this.props.dataPackage.data.rarity || "",
      displayType: this.props.displayType,
      combo: this.props.dataPackage.combo
    }
    this.createTitle = this.createTitle.bind(this);
    this.switchStage = this.switchStage.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.processData = this.processData.bind(this);
    this.createCondition = this.createCondition.bind(this);
    this.createCharHtml = this.createCharHtml.bind(this);
  }
  createTitle(){
    var data = this.props.dataPackage.data,
        image = null,
        name = null;
    if(this.state.displayType === 'cat'){
        image = data.data.map((x,i) => {
          if(x){
            return (
              <div  className="img"
                    key={i}
                    style={{backgroundImage:`url("${Tools.imageURL('cat',this.state.id+"-"+i)}")`}}
                    stage={i}
                    active={(i === this.state.activeStage).toString()}
                    onClick={this.switchStage}>
              </div>
            );
          }
          else return null;
      });
      name = <div className="name">{data.data[this.state.activeStage].name || data.data[this.state.activeStage].jp_name}</div>;
    } else if (this.state.displayType === 'enemy'){
      image = <div className="img" active="true" style={{backgroundImage:`url("${Tools.imageURL('enemy',this.state.id)}")`}}></div>;
      name = <div className="name">{data.name || data.jp_name}</div>;
    }
    return (
      <div className="Title">
        {image}
        {name}
      </div>
    )
  }
  createCondition(){
    var condition,
        content = this.props.dataPackage.data.data[this.state.activeStage].condition;

    condition =
    <div className="condition">
      <div>{content.lv?"合併等級"+content.lv+"以上":null}</div>
      <div>{content.xp?"XP "+content.xp:null}</div>
      <div>{content.can?"貓罐頭"+content.can+"個":null}</div>
      <div className="stage">{content.stage?<span><span stage-id={content.stage.id}>{content.stage.name}</span>通關後機率獲得</span>:null}</div>
      <div className="gacha flex_col">{content.gacha?
        ( content.gacha === 'any'?"再任意稀有轉蛋中獲得":
          content.gacha.map((x,i) => <span key={i}>在<span gacha-id={x.id}>{x.name}</span>轉蛋中獲得</span>)):null}</div>
      <div>{content.other?content.other:null}</div>
      <div className="fruit">{content.fruit?
        content.fruit.map((x,i) => {return x ? <span><img src={Tools.imageURL('fruit',{id:(i+1),seed:x.seed})} alt="貓薄荷" />x{x.number}</span>:
        null}):null}</div>
    </div>;

    return (
      <tr>
        <th><div className="header">取得方法</div></th>
        <td colSpan="5">{condition}</td>
      </tr>
    );
  }
  createCharHtml(){
    var content = [],
        data = this.props.dataPackage.data,
        char;

    if(this.state.displayType === 'cat') data = data.data[this.state.activeStage];
    char = data.char;

    if(char === '無' || !char) content = ['-'];
    else{
      for(let k in char){
        if(char[k].type=='波動'){
          content.push(
            <div>
              {char[k].chance}%的機率 發出Lv{char[k].percent}的<span id ='type'>{char[k].type}</span>
              (射程:{132.5+200*char[k].percent})
            </div>
          );
        }else{
          content.push(
            <div>
              {char[k].against?<span>對
                {char[k].against.map((x,i) => {return(<span key={i} char-id='color'>{x}<img src={Tools.imageURL("smallIcon",x)} alt='' /></span>)})}
                </span>:null}
              {char[k].chance?char[k].chance+"%的機率":null}
              {char[k].lower?"體力小於"+char[k].lower+"%時":null}
              <span>{char[k].type}<img src={Tools.imageURL("smallIcon",char[k].type.split(" ")[0])} alt='' /></span>
              {char[k].percent?char[k].percent+"%":null}
              {char[k].range?" "+char[k].range.join("~"):null}
              {char[k].period?"持續"+char[k].period.toFixed(1)+"秒":null}
              {char[k].arr?<span char-id='serial'>(
                {char[k].arr.map(x => (Tools.level_to_value(this.state.rarity,data.atk,this.state.lv)*x).toFixed(0)).join("/")}) </span>
                :null}
            </div>
          );
        }
      }
    }
    return <div className="characteristic">{content.map((x,i) => {return <div key={i}>{x}</div>})}</div>;
  }
  processData(){
    var data = this.props.dataPackage.data,
        displayType = (this.props || this.state).displayType,
        stage = this.state.activeStage,
        level = this.state.lv,
        rarity = this.state.rarity || displayType,
        result = {};
    if(displayType === 'cat') data = data.data[stage];

    for(let prop in data){
      let content = data[prop],
          precision = 0;

      if(Tools.is_level_Bind(prop)) content = Tools.level_to_value(rarity, content, level, this.state.id);
      if(["atk_period","atk_speed","freq","cd"].indexOf(prop) !== -1) precision = 1;
      if(prop === "aoe") content = content?"範圍":"單體";

      if(typeof(content) === "number") content = content.toFixed(precision);
      result[prop] = content;
    }
    return result;
  }
  switchStage(e){
    let stage = Number(e.target.getAttribute("stage"));
    if(Number.isNaN(stage)) stage = 1;
    this.setState({activeStage:stage});
  }
  handleSliderChange(e, value){
    this.setState({lv: value})
  }
  handleInputChange(e){
    this.setState({lv: e.target.value});
  }
  handleBlur(e){
    let value = e.target.value;
    if(value < 1) value = 1;
    else if(value > 100) value = 100;
    this.setState({lv: value});
  }
  componentWillReceiveProps(newProps){
    if(newProps){
      this.setState({
        id:newProps.dataPackage.data.id,
        combo:newProps.dataPackage.combo,
        activeStage:1
      });
    }
  }

  render(){
    var data = this.processData();
    return(
      <div className="DisplayTable flex_col">
        {this.createTitle()}
        <table>
          <tbody>
            <tr>
              <th><div className="header">等級</div></th>
              <td colSpan='4'>
                <div style={{padding:"0 20px"}}>
                  <Slider
                  value={this.state.lv}
                  onChange={this.handleSliderChange}
                  aria-labelledby="input-slider"
                  valueLabelDisplay="auto"
                  />
                </div>
              </td>
              <td>
                <Input
                value={this.state.lv}
                onChange={this.handleInputChange}
                onBlur={this.handleBlur}
                inputProps={{
                  step: 1,
                  min: 1,
                  max: 100,
                  type: 'number',
                  'aria-labelledby': 'input-slider',
                }}
                />
              </td>
            </tr>
            <tr>
              <th><div className="header">體力</div></th>
              <td><span>{data.hp}</span></td>
              <th><div className="header">KB</div></th>
              <td><span>{data.kb}</span></td>
              <th><div className="header">硬度</div></th>
              <td><span>{data.hardness}</span></td>
            </tr>
            <tr>
              <th><div className="header">攻擊力</div></th>
              <td><span>{data.atk}</span></td>
              <th><div className="header">DPS</div></th>
              <td><span>{data.dps}</span></td>
              <th><div className="header">射程</div></th>
              <td><span>{data.range}</span></td>
            </tr>
            <tr>
              <th><div className="header">攻頻</div></th>
              <td><span>{data.freq}</span></td>
              <th><div className="header">跑速</div></th>
              <td><span>{data.speed}</span></td>
              <th><div className="header">範圍攻擊</div></th>
              <td><span>{data.aoe}</span></td>
            </tr>
            <tr>
              {
                this.state.displayType === 'cat'?
                  <th><div className="header">攻發時間</div></th>
                : null
              }
              {
                this.state.displayType === 'cat'?
                  <td><span>{data.atk_speed}</span></td>
                : null
              }
              <th><div className="header">{this.state.displayType === 'cat'?"花費":"獲得金錢"}</div></th>
              <td><span>{this.state.displayType === 'cat'?data.cost:data.reward}</span></td>
              <th><div className="header">{this.state.displayType === 'cat'?"再生産":"屬性"}</div></th>
              <td colSpan={this.state.displayType === 'cat'?1:3}><span>{this.state.displayType === 'cat'?data.cd:data.color}</span></td>
            </tr>
            { this.state.displayType === "cat"? this.createCondition() : null }
            <tr>
              <th><div className="header">特性</div></th>
              <td colSpan='5'>{this.createCharHtml()}</td>
            </tr>

          </tbody>
        </table>
        {this.state.displayType === 'cat' ? <ComboTable combo={this.state.combo}/> : null}
      </div>
    )
  }
}

class ComboTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true,
      Tableheight: props.combo?props.combo.length*150:0
    }
    this.toggleTable = this.toggleTable.bind(this);
  }

  toggleTable(){
    this.setState({show: !this.state.show});
  }
  componentWillReceiveProps(newProps){
    if(newProps){
      this.setState({Tableheight: newProps.combo?newProps.combo.length*150:0});
    }
  }

  render(){
    return(
      <div className="ComboTable flex_col">
        <div className="TableHead flex" onClick={this.toggleTable}>發動聯組</div>
        {
          this.props.combo?
          <div className="TableHolder" style={{maxHeight:this.state.show?this.state.Tableheight:0+"px",padding:this.state.show?null:'0px'}}>
            {this.props.combo.map((x,i) => {
              return(
                <div key={i} className="comboRow">
                  <div className="flex" combo-id={x.id}>
                    <span style={{width:"150px",backgroundColor:"var(--lightorange)"}}>{x.catagory}</span>
                    <span style={{flex:1}}>{x.name}</span>
                    <span style={{flex:2}}>{x.effect}</span>
                  </div>
                  <div className="flex cardHolder">
                    {x.cat.map((id,index) => {
                      return (<Link key={index} disabled={id === '-'} to={"/cat/"+id.split("-")[0]}><div className="card" style={{backgroundImage:`url("${Tools.imageURL('cat',id)}")`}}></div></Link>);
                    })}
                  </div>
                </div>
              );
            })}
          </div>:
          <table>
            <tr><td>無可用聯組</td></tr>
          </table>
        }
      </div>
    );
  }
}

class Display extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayType : this.props.displayType,
      unitId: Tools.AddZero(this.props.match.params.id,2),
      uid: "",
      dataPackage: {},
      ready: false
    }
    this.requireData = this.requireData.bind(this);
  }

  componentDidMount(){
    const socket = this.props.socket;
    if(this.props.ready) this.requireData(this.props);

    socket.on("required data", (response) => {
      console.log(response);
      if(response.type === this.state.displayType && response.buffer[0].data.id){
        this.setState({
          dataPackage: response.buffer[0],
          ready: true
        });
      }
    });
  }

  componentWillReceiveProps(newProps){
    if(newProps.ready){
      this.requireData(newProps);
    }
  }

  requireData(prop){
    const socket = this.props.socket,
          uid = prop.user?prop.user.uid:null,
          unitId = Tools.AddZero(prop.match.params.id,2);
    this.setState({
      uid:uid,
      unitId: unitId
    });
    socket.emit("required data",{
        type : this.state.displayType,
        target : [{id:unitId,lv:'user'}],
        record : true,
        uid : uid
      });
  }

  render(){
    console.log(this.props);
    return(
      <div className="Display subApp NoScrollBar">
        <div className="content flex_col">
          <DisplayControl />
          {
            this.state.ready?
            <DisplayTable dataPackage={this.state.dataPackage} displayType={this.state.displayType}/> :
            <div className="Loading"><span></span><span></span><span></span><span></span></div>
          }
        </div>
      </div>
    )
  }
}

export default Display;
