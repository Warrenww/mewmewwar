import React,{Component, useState, useEffect} from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import {Tools} from './Utility.js';
import uniqueId from 'lodash/uniqueId';
import Slider from '@material-ui/lab/Slider';
import Input from '@material-ui/core/Input';
import '../Style/Display.css';

const DisplayControl = props => {

  return(
    <div className="DisplayControl flex">

    </div>
  )
}

const DisplayTitles = props => {

  return (
    <div className="Title">
      {
        props.displayType == 'cat' ?
          props.data.data.map((x,i) => {
            if(x){
              return (
                <div  className="img"
                      key={i}
                      style={{backgroundImage:`url("${Tools.imageURL('cat',x.id)}")`}}
                      stage={i}
                      active={(i === props.activeStage).toString()}
                      onClick={props.switchStage}>
                </div>
              );
            }
            else return null;
        }) :
        <div className="img" active="true" style={{backgroundImage:`url("${Tools.imageURL('enemy',props.data.id)}")`}}></div>
      }
      {
        props.displayType == 'cat' ?
        <div className="name">{props.data.data[props.activeStage].name || props.data.data[props.activeStage].jp_name}</div> :
        <div className="name">{props.data.name || props.data.jp_name}</div>
      }
    </div>
  )
}
const DisplayLevel = props => {
  return(
    <tr>
      <th><div className="header">等級</div></th>
      <td colSpan='4'>
        <div style={{padding:"0 20px"}}>
          <Slider
          value={props.level}
          onChange={(e, value) => props.setLevel(value)}
          aria-labelledby="input-slider"
          valueLabelDisplay="auto"
          />
        </div>
      </td>
      <td>
        <Input
        value={props.level}
        onChange={(e) => props.setLevel(e.target.value)}
        onBlur={(e) => {
          let value = e.target.value;
          if(value < 1) value = 1;
          else if(value > 100) value = 100;
          props.setLevel(value);
        }}
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
  )
}
const DisplayRows = props => {

  let content = [],
      stage = props.activeStage;
  props.properties.map(p => {
    content.push(<th key={p+'_head'}><div className="header">{Tools.ParseProperties(p)}</div></th>);
    content.push(<td key={p+'_data'} colspan={p === 'color' ? 3 : 1}><span>{props.data[p]}</span></td>);
  });

  return(
    <tr> { content.map(x => x) } </tr>
  )
}

const DisplayTable = props => {
  let processData = () => {
      let data = props.dataPackage.data,
          stage = activeStage,
          rare = rarity || displayType,
          result = {};
      if(displayType === 'cat') data = data.data[stage];

      for(let prop in data){
        let content = data[prop],
            precision = 0;

        if(Tools.is_level_Bind(prop)) content = Tools.level_to_value(rare, content, level, id);
        if(["atk_period","atk_speed","freq","cd"].indexOf(prop) !== -1) precision = 1;
        if(prop === "aoe") content = content?"範圍":"單體";

        if(typeof(content) === "number") content = content.toFixed(precision);
        result[prop] = content;
      }
      return result;
    }

  const [activeStage, setActiveStage] = useState(props.dataPackage.currentStage),
        id = props.dataPackage.data.id,
        [level, setLevel] = useState(props.dataPackage.lv),
        rarity = props.dataPackage.data.rarity,
        displayType = props.displayType,
        combo = props.dataPackage.combo,
        [data, setData] = useState(processData());

  let createCondition = () => {
    var condition,
        content = props.dataPackage.data.data[activeStage].condition;

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

  let createCharHtml = () => {
    let content = [],
        data = props.dataPackage.data,
        char;

    if(displayType === 'cat') data = data.data[activeStage];
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
                {char[k].arr.map(x => (Tools.level_to_value(rarity,data.atk,level)*x).toFixed(0)).join("/")}) </span>
                :null}
            </div>
          );
        }
      }
    }
    return <div className="characteristic">{content.map((x,i) => {return <div key={i}>{x}</div>})}</div>;
  }

  let switchStage = (e) => {
    let stage = Number(e.target.getAttribute("stage"));
    if(Number.isNaN(stage)) stage = 1;
    setActiveStage(stage);
  }
  return(
    <div className="DisplayTable flex_col">
      <DisplayTitles data={props.dataPackage.data} activeStage={activeStage} displayType={props.displayType} switchStage={switchStage}/>
      <table>
        <tbody>
          <DisplayLevel setLevel={setLevel} level={level}/>
          <DisplayRows data={data} properties={['hp', 'kb', 'hardness']} />
          <DisplayRows data={data} properties={['atk', 'dps', 'range']} />
          <DisplayRows data={data} properties={['freq', 'speed', 'aoe']} />
          {
            displayType === 'cat'?
            <DisplayRows data={data} properties={['atk_speed', 'cost', 'cd']} />:
            <DisplayRows data={data} properties={['reward', 'color']}  />
          }
          { displayType === "cat"? createCondition() : null }
          <tr>
            <th><div className="header">特性</div></th>
            <td colSpan='5'>{createCharHtml()}</td>
          </tr>

        </tbody>
      </table>
      {displayType === 'cat' ? <ComboTable combo={combo}/> : null}
    </div>
  );

}

const ComboTable = props => {
  const [show, setShow] = useState(true),
        Tableheight = props.combo ? props.combo.length * 150 : 0;


  return(
    <div className="ComboTable flex_col">
      <div className="TableHead flex" onClick={() => setShow(!show)}>發動聯組</div>
      {
        props.combo?
        <div className="TableHolder" style={{maxHeight:show ? Tableheight : 0  , padding: show ? null : 0}}>
          {props.combo.map((x,i) => {
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

const Display = (props) => {
  const socket = props.socket,
        displayType = props.displayType,
        unitId = Tools.AddZero(props.match.params.id,2),
        uid = props.user ? props.user.uid : null,
        [dataPackage, setData] = useState(null);

  useEffect(() =>{
    if(socket) {
      if(!dataPackage){
        socket.emit("required data",{
            type : displayType,
            target : [{id:unitId,lv:'user'}],
            record : true,
            uid : uid
          });
      }
      socket.on("required data", (response) => {
        console.log(response);
        if(response.type === displayType && response.buffer[0].data.id){
          setData(response.buffer[0]);
        }
      });
    }
  });

  return(
    <div className="Display subApp NoScrollBar">
      <div className="content flex_col">
        <DisplayControl />
        {
          dataPackage?
          <DisplayTable dataPackage={dataPackage} displayType={displayType}/> :
          <div className="Loading"><span></span><span></span><span></span><span></span></div>
        }
      </div>
    </div>
  );
}

export default Display;
