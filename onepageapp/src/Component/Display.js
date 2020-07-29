import React,{Component, useState, useEffect} from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import {Tools} from './Utility.js';
import uniqueId from 'lodash/uniqueId';
import Slider from '@material-ui/lab/Slider';
import Slide from '@material-ui/core/Slide';
import Grow from '@material-ui/core/Grow';
import Input from '@material-ui/core/Input';
import '../Style/Display.css';

const DisplayControl = props => {

  return(
    <div className="DisplayControl flex">

    </div>
  )
}

const DisplayTitles = props => {
  useEffect(()=>{
    document.title = (props.displayType == 'cat' ? "貓咪" : "敵人") + "資料 - " + (props.displayType == 'cat' ? props.data.data[props.activeStage].name || props.data.data[props.activeStage].jp_name : props.data.name || props.data.jp_name);
  });
  return (
    <div className="Title">
      {
        props.displayType == 'cat' ?
          props.data.data.map((x,i) => {
            if(x){
              return (
                <div
                  className="img"
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
      <th><div className="header">{props.displayType === 'cat' ? "等級" : "倍率"}</div></th>
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
    let value = props.displayType === 'cat' ? props.data[stage][p] : props.data[p],
        precision = 0;

    if(Tools.is_level_Bind(p)) value = Tools.level_to_value(props.rarity, value, props.level, props.data.id);
    if(["atk_period","atk_speed","freq","cd"].includes(p)) precision = 1;
    if(p === "aoe") value = value?"範圍":"單體";

    if(typeof(value) === "number") value = value.toFixed(precision);

    content.push(<th key={p+'_head'}><div className="header">{Tools.ParseProperties(p)}</div></th>);
    content.push(<td key={p+'_data'} colSpan={p === 'color' ? 3 : 1}><span>{value}</span></td>);
  });

  return(
    <tr> { content.map(x => x) } </tr>
  )
}
const DisplayCondition = props => {
  return (
    <tr>
      <th><div className="header">取得方法</div></th>
      <td colSpan="5">
        <div className="condition">
          <div>{props.content.lv?"合併等級"+props.content.lv+"以上":null}</div>
          <div>{props.content.xp?"XP "+props.content.xp:null}</div>
          <div>{props.content.can?"貓罐頭"+props.content.can+"個":null}</div>
          <div className="stage">{props.content.stage?<span><span stage-id={props.content.stage.id}>{props.content.stage.name}</span>通關後機率獲得</span>:null}</div>
          <div className="gacha flex_col">{props.content.gacha?
            ( props.content.gacha === 'any'?"再任意稀有轉蛋中獲得":
              props.content.gacha.map((x,i) => <span key={i}>在<span gacha-id={x.id}>{x.name}</span>轉蛋中獲得</span>)):null}</div>
          <div>{props.content.other?props.content.other:null}</div>
          <div className="fruit">{props.content.fruit?
            props.content.fruit.map((x,i) => {return x ? <span><img src={Tools.imageURL('fruit',{id:(i+1),seed:x.seed})} alt="貓薄荷" />x{x.number}</span>:
            null}):null}</div>
        </div>
      </td>
    </tr>
  );
}
const DisplayCharacter = props => {
  let content = [],
      char = props.data.char;

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
              {char[k].arr.map(x => (Tools.level_to_value(props.rarity,props.data.atk,props.level)*x).toFixed(0)).join("/")}) </span>
              :null}
          </div>
        );
      }
    }
  }
  return (
    <tr>
      <th><div className="header">特性</div></th>
      <td colSpan='5'><div className="characteristic">{content.map((x,i) => {return <div key={i}>{x}</div>})}</div></td>
    </tr>);
}

const DisplayTable = props => {
  const [activeStage, setActiveStage] = useState(props.dataPackage.currentStage),
        id = props.dataPackage.data.id,
        [level, setLevel] = useState(props.dataPackage.lv),
        displayType = props.displayType,
        rarity = props.dataPackage.data.rarity || displayType,
        combo = props.dataPackage.combo;

  let switchStage = (e) => {
    let stage = Number(e.target.getAttribute("stage"));
    if(Number.isNaN(stage)) stage = 1;
    setActiveStage(stage);
  }
  return(
    <div className="DisplayTable flex_col">
      <DisplayTitles data={props.dataPackage.data} activeStage={activeStage} displayType={displayType} switchStage={switchStage}/>
      <table>
        <tbody>
          <DisplayLevel setLevel={setLevel} level={level} displayType={displayType}/>
          <DisplayRows
            displayType={displayType}
            activeStage={activeStage}
            rarity={rarity}
            level={level}
            data={displayType === 'cat' ? props.dataPackage.data.data : props.dataPackage.data}
            properties={['hp', 'kb', 'hardness']}
          />
          <DisplayRows
            displayType={displayType}
            activeStage={activeStage}
            rarity={rarity}
            level={level}
            data={displayType === 'cat' ? props.dataPackage.data.data : props.dataPackage.data}
            properties={['atk', 'dps', 'range']}
          />
          <DisplayRows
            displayType={displayType}
            activeStage={activeStage}
            rarity={rarity}
            level={level}
            data={displayType === 'cat' ? props.dataPackage.data.data : props.dataPackage.data}
            properties={['freq', 'speed', 'aoe']}
          />
          {
            displayType === 'cat'?
            <DisplayRows
              displayType={displayType}
              activeStage={activeStage}
              rarity={rarity}
              level={level}
              data={displayType === 'cat' ? props.dataPackage.data.data : props.dataPackage.data}
              properties={['atk_speed', 'cost', 'cd']}
            /> :
            <DisplayRows
              displayType={displayType}
              activeStage={activeStage}
              rarity={rarity}
              level={level}
              data={displayType === 'cat' ? props.dataPackage.data.data : props.dataPackage.data}
              properties={['reward', 'color']}
            />
          }
          {
            displayType === "cat"?
            <DisplayCondition content = {props.dataPackage.data.data[activeStage].condition} /> :
            null
          }
          <DisplayCharacter
            data = {displayType === "cat" ? props.dataPackage.data.data[activeStage] : props.dataPackage.data}
            rarity = {rarity}
            level = {level}
          />
        </tbody>
      </table>
      {
        props.dataPackage.data.data && props.dataPackage.data.data[3].instinct ?
        <InstinctTable arr = {props.dataPackage.data.data[3].instinct} rarity = {rarity} /> :
        null
      }
      {
        displayType === 'cat' ?
        <ComboTable combo={combo}/> :
        null
      }
    </div>
  );

}
const InstinctTable = props => {
  const [show, setShow] = useState(true);
  let contents = [];
  const unit = (s) => {
    if(s.includes("時間") || s.includes("緩速強化") || s.includes("降攻"))s = "F";
    else if(s.includes("金額"))s = "元";
    else if(s.includes("移動"))s = "";
    else s = "%";
    return s;
  }
  props.arr.map((x,i) => {
    let iconname = x.ability,
        temp = "";

    if(x.ability.includes("增攻")) temp = `(體力低於${x.range[2]}%)`;
    if(x.ability.includes("波動") && x.range[2]) temp = `(Lv.${x.range[2]} 波動)`;
    if(x.ability=='緩速能力解放') temp = `(${x.range[2]}% 機率緩速)`;
    if(x.ability=='降攻能力解放') temp = `(${x.range[2]}% 機率降攻${x.range[3]}%)`;

    if(iconname.includes("屬性新增")) iconname = iconname.split("屬性新增")[1];
    iconname = iconname.split("能力解放")[0];
    iconname = iconname.split("強化")[0];
    console.log(iconname);
    contents.push(
      <tr key={2*i}>
        <th rowSpan='2'>
          <div style={{display:"flex", justifyContent: "flex-start", alignItems:"center"}}>
            <img src={Tools.imageURL("smallIcon", iconname)}/>
            <span>{x.ability}</span>
          </div>
          <small>{temp}</small>
        </th>
        <td rowSpan='2'>{x.maxlv}</td>
        <td>{x.range[0]?(x.range[0]+" "+unit(x.ability)):"-"}</td>
        {
          x.maxlv === 1 ?
          <td>-</td> :
          <td>{((x.range[1]-x.range[0])/(x.maxlv-1)).toFixed(0)+" "+unit(x.ability)}</td>
        }
        {
          x.maxlv === 1 ?
          <td>-</td> :
          <td>{((x.range[1]-x.range[0])/(x.maxlv-1)).toFixed(0)+" "+unit(x.ability)}</td>
        }
      </tr>
    );
    contents.push(
      <tr key={2*i + 1}>
        <td>{x.np * {R:2,SR:3,SSR:4}[props.rarity]+" NP"}</td>
        {
          x.maxlv === 1 ?
          <td>-</td> :
          <td>{5 * {R:1,SR:2,SSR:3}[props.rarity]+" NP"}</td>
        }
        {
          x.maxlv === 1 ?
          <td>-</td> :
          <td>{10 * {R:1,SR:2,SSR:3}[props.rarity]+" NP"}</td>
        }
      </tr>
    )
  });

  return (
    <div className="InstinctTable flex_col">
      <div className="TableHead flex" onClick={() => setShow(!show)}>本能(三階開放)</div>
      <Grow in={show} mountOnEnter unmountOnExit>
        <table>
          <thead>
            <tr>
              <th>能力</th>
              <th>等級上限</th>
              <th>等級1加值/花費NP</th>
              <th>等級2-5加值/花費NP</th>
              <th>等級6-10加值/花費NP</th>
            </tr>
          </thead>
          <tbody>
            {
              contents.map(x => x)
            }
          </tbody>
        </table>
      </Grow>
    </div>
  );
}
const ComboTable = props => {
  const [show, setShow] = useState(true);
  return(
    <div className="ComboTable flex_col">
      <div className="TableHead flex" onClick={() => setShow(!show)}>發動聯組</div>
      {
        props.combo?
        <div className="TableHolder">
          {props.combo.map((x,i) => {
            return(
              <Slide key={i} direction="right" in={show} mountOnEnter unmountOnExit timeout={(i+1)*300}>
                <div className="comboRow">
                  <div className="flex" combo-id={x.id}>
                    <span style={{width:"150px",backgroundColor:"var(--lightorange)"}}>{x.catagory}</span>
                    <span style={{flex:1}}>{x.name}</span>
                    <span style={{flex:2}}>{x.effect}</span>
                  </div>
                  <div className="flex cardHolder">
                    {
                      x.cat.map((id,index) => (
                        <Link key={index} disabled={id === '-'} to={"/cat/"+id.split("-")[0]}>
                          <div className="card" style={{backgroundImage:`url("${Tools.imageURL('cat',id,1)}")`}}></div>
                        </Link>
                      ))
                    }
                  </div>
                </div>
              </Slide>
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
      if(!dataPackage || Number(props.match.params.id) !== Number(dataPackage.data.id)){
        setData(null);
        socket.emit("required data",{
            type : displayType,
            target : [{id:unitId,lv:'user'}],
            record : true,
            uid : uid
        });
      }
      socket.on("required data", (response) => {
        // console.log(response);
        if(response.type === displayType && response.buffer[0].data.id){
          setData(response.buffer[0]);
        }
      });
    }
  });

  return(
    <div className="Display subApp NoScrollBar">
      <div className="content flex_col">
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
