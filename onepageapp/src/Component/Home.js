import React,{Component} from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import {FunctionButton, StateButtonGroup, Button, SnapshotButton, Select} from './Utility.js';
import uniqueId from 'lodash/uniqueId';
import '../Style/Home.css';

const Is_ios = navigator.userAgent.indexOf("iPad") !== -1 || navigator.userAgent.indexOf("iPhone") !== -1;
const WeekArr=['Sun.','Mon.','Tue.','Wed','Thu.','Fri','Sat'];

class Block extends Component {

  render(){
    return(
      <div className='HomePageBlock' style={this.props.style}>
        <h2>{this.props.name}</h2>
        <div>
          {this.props.Child?this.props.Child.map(x=>x):null}
        </div>
      </div>
    );
  }
}

class LegendBoard extends Component {

  render(){
    return(
      <div className='LegendBoard'>
        {this.props.data.map((data,index)=>{
          return(
            <div className='LegendCard' key={uniqueId()}>
              <div style={{backgroundImage:`url("${data.img}")`,backgroundSize:"cover",height: "100px"}}></div>
              <span>{data.name}</span>
              {data.data.map((x,i)=>{return <span key={uniqueId()}>{x.key} : {x.value}</span>})}
              <span><Link to={data.redirect}>more</Link></span>
            </div>
          );
        })}

      </div>
    );
  }
}

class EventIframe extends Component{
  constructor(props) {
    super(props);
    this.state = {
      active_date: this.props.event[0],
      active_text:0,
      eventURL: "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/"
    };
    this.handleChange = this.handleChange.bind(this);
    this.switchPureText = this.switchPureText.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if(!this.state.active_date)
      this.setState({active_date:newProps.event[0]})
  }

  handleChange(e){
    this.setState({active_date: e.target.value})
  }
  switchPureText(args){
    this.setState({active_text: (this.state.active_text+1)%2 })
  }
  render(){
    return(
      <div className='flex_col EventIframe'style={{width:"100%"}}>
        <div className='flex' style={{alignItems:"center"}}>
          選擇日期 :
          <Select
            onChange={this.handleChange}
            defaultValue={this.state.active_date}
            disabled={this.state.active_text === 1}
            options={this.props.event.map((x,i)=>{return {value:x,text:[x.substring(0,4),x.substring(4,6),x.substring(6,8)].join("/")}})}
            style={{margin:"10px", padding:"3px 30px 3px 20px"}}
          />
        </div>
        <iframe title='EventIframe' src={this.state.active_date?this.state.eventURL+this.state.active_date+".html":null}
          display={(this.state.active_text && !Is_ios)? "false" :"true"}></iframe>
        <div className="alt_text" display={(this.state.active_text && !Is_ios)? "true": "false"}>
          {this.props.text.map((x,i)=>{
            return(
              <div key={i} style={{padding: "20px"}}>
                <h3>{x.title}</h3>
                <div dangerouslySetInnerHTML={{__html:(()=>{
                    let a = document.createElement('div');
                    a.innerHTML = x.content?x.content.split("open-").join("").split("<a").join("<a target='_blank'"):"";
                    return a;
                  })().innerHTML
                }}></div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 20,display: "flex"}}>
          <a target="_blank" rel="noopener noreferrer" href={this.state.eventURL+this.state.active_date+".html"} style={{color:"inherit",textDecoration:"none"}}>
            <FunctionButton icon="launch" text="開啟網頁" spanPos="bottom" />
          </a>
          <FunctionButton icon='swap_vertical_circle' text={<div className="flex" style={{width:"90px"}}>{this.state.active_text?"內嵌顯示":"純文字顯示"}</div>}
            spanPos="bottom" onClick={this.switchPureText} args=""/>
        </div>
      </div>
    );
  }
}

class PredictionTable extends Component {

  render(){
    var data = this.props.data,
        day = [];
        console.log(data);
    const colorSet=[ '#95CC85', '#EDDB8A', '#FF5959', '#FF9259', '#4ABABB' ];
    if(!data) return null;
    for(let i=0;i<data.duration;i++) day.push(data.start+i*86400000);
    return(
      <div className="PredictionTable flex_col" style={{width:60*data.duration+"px",display:this.props.hidden?"none":null}}>
        <div className='head'>{day.map((x,i)=>{return <div className="cell" key={i}><div>{new Date(x).toLocaleDateString().split("/").slice(0,2).join("/")}</div></div>})}</div>
        <div className='head'>{day.map((x,i)=>{return <div className="cell" key={i}><div>{WeekArr[new Date(x).getDay()]}</div></div>})}</div>
        {data.table.map((row,i)=>{
          var temp = [];
          for(let j=0;j<row.length;j++){
            if(!row[j]) temp.push(<div key={j} className="cell"><div></div></div>);
            else if(row[j] !== 1)
              temp.push ( <div key={j} className='cell' style={{flex:row[j].length}}>
                            <div style={{backgroundColor:colorSet[Math.floor(Math.random()*5)]}}>{row[j].content}</div>
                          </div>
                        );
          }
          return <div key={i}> {temp.map((x,i)=>{return x})} </div> ;
        })}
      </div>
    );
  }
}

class EventPrediction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tw:this.props.tw,
      jp:this.props.jp,
      displayTable: "tw"
    }
    this.switchPredict = this.switchPredict.bind(this);
    this.scroll = this.scroll.bind(this);
  }

  createPredictionQueue(obj){
    if(!obj.start) return null;
    var startDate = Date.parse([obj.start.substring(0,4),obj.start.substring(4,6),obj.start.substring(6,8)].join("/")),
        dayPass = 0,
        startRow = 0,
        tableSpace = [[]];
    subRouting(obj.gachaP,startRow);
    startRow = tableSpace.length;
    subRouting(obj.eventP,startRow);

    return {start:startDate,duration:dayPass,table:tableSpace};

    function subRouting(subObj,startRow){
      var year = new Date(startDate).getFullYear();
      for(let i in subObj){
        var date = subObj[i].date,
            name = subObj[i].name,
            sure = subObj[i].sure,
            find = false;
        date = date.map(x => {return Date.parse(year+"/"+x)>=startDate?Date.parse(year+"/"+x):Date.parse((year+1)+"/"+x)});
        if((date[1] - startDate)/86400000 >= dayPass){
          dayPass = (date[1] - startDate)/86400000 + 1;
          tableSpace.map(x => x.length = dayPass);
        }
        date = date.map(x => (x-startDate)/86400000);
        // console.log(name,date);
        for(let j in tableSpace){
          if(find) break;
          if(j < startRow) continue;
          if(tableSpace[j].slice(date[0],(date[1]+1)).every((x)=>{return !x})){
            tableSpace[j].fill(1,date[0],(date[1]+1));
            tableSpace[j][date[0]] = {content: name+(sure?" 必中":""),length: date[1]-date[0]+1};
            find = true;
          }
        }
        if(!find){
          let arr = [];
          arr.length = dayPass;
          arr.fill(1,date[0],date[1]+1);
          arr[date[0]] = {content: name+(sure?" 必中":""),length: date[1]-date[0]+1};
          tableSpace.push(arr);
        }
      }
    }
  }
  switchPredict(table){
    if(table === 'tw' || table === 'jp') this.setState({displayTable:table});
  }
  scroll(pos){
    if(pos!=='left'&&pos!=='right') return;
    var left = document.querySelector(".EventPrediction .NoScrollBar").scrollLeft;
    left += (window.innerWidth*0.9)*(pos==='left'?-1:1)
    document.querySelector(".EventPrediction .NoScrollBar").scrollLeft = left;
  }
  render(){
    return(
      <div className='EventPrediction'>
        <div style={{display:"flex",alignItems:"flex-end"}}>
          <StateButtonGroup buttons={[
              <Button text="台版情報" onClick={this.switchPredict} args="tw" />,
              <Button text="日版情報" onClick={this.switchPredict} args="jp" />]}
              allowedMultiple={false} allowedTurnOff={false} default={[0]} />
          <SnapshotButton target={`.PredictionTable:nth-of-type(${this.state.displayTable === 'tw'?1:2})`}
            backgroundColor="black" downloadName="活動預測"/>
        </div>
        <div className="control">
          <Button text={<i className='material-icons'> chevron_left</i>}  onClick={this.scroll} args="left" />
          <Button text={<i className='material-icons'> chevron_right</i>} onClick={this.scroll} args="right"/>
        </div>
        <div className="NoScrollBar" style={{width:"100%",overflow:"scroll", scrollBehavior: "smooth"}}>
          <PredictionTable data={this.createPredictionQueue(this.state.tw)} hidden={this.state.displayTable !== "tw"}/>
          <PredictionTable data={this.createPredictionQueue(this.state.jp)} hidden={this.state.displayTable !== "jp"}/>
        </div>
        <div style={{textAlign:"end",padding:"5px 20px"}}>資料來源:
          <a href={this.state.tw.source} target="_blank" rel="noopener noreferrer" style={{color:"var(--bluegreen)",margin:"3px 10px"}}>台版</a>
          <a href={this.state.jp.source} target="_blank" rel="noopener noreferrer" style={{color:"var(--bluegreen)",margin:"3px 10px"}}>日版</a>
        </div>
      </div>
    );
  }
}

class ContactBlock extends Component {

  render(){
    return(
      <div className="ContactBlock flex_col">
        <img src={this.props.img} alt={this.props.title}/>
        <h3>{this.props.title}</h3>
        <div>{this.props.content}</div>
      </div>
    );
  }
}

class Home extends Component {
  constructor(props) {
    super(props);
    this.state={
      catLegend:[
        {id:1,img:null,name:"cat_000",data:[{key:"**",value:0}],redirect:"/cat/000"},
        {id:2,img:null,name:"cat_000",data:[{key:"**",value:0}],redirect:"/cat/000"},
        {id:3,img:null,name:"cat_000",data:[{key:"**",value:0}],redirect:"/cat/000"},
      ],
      stageLegend:[
        {id:1,img:null,name:"stage_000",data:[{key:"**",value:0}],redirect:"/stage/000"},
        {id:2,img:null,name:"stage_000",data:[{key:"**",value:0}],redirect:"/stage/000"},
        {id:3,img:null,name:"stage_000",data:[{key:"**",value:0}],redirect:"/stage/000"},
      ],
      event:[],
      eventPredict:{},
      eventPredict_jp:{},
      text_event:[]
    }
  }

  componentDidMount(){
    const socket = this.props.socket;
    socket.emit("public data",['index']);
    socket.on("public data",(data)=>{
      var mostSearchCat = data.index.legend.mostSearchCat,
          mostSearchStage = data.index.legend.mostSearchStage,
          temp = [];

      for(let i in data.index.event){
        if(i === 'prediction' || i === 'prediction_jp' || i === 'text_event') continue;
        if(data.index.event[i]) temp.push(i);
      }
      this.setState({
        event:temp.reverse(),
        eventPredict:data.index.event.prediction,
        eventPredict_jp:data.index.event.prediction_jp,
        text_event: data.index.event.text_event
      });

      temp = [];
      for(let i in mostSearchCat){
        temp.push({
          id: mostSearchCat[i].id,
          img: `./css/footage/cat/u${mostSearchCat[i].id}-1.png`,
          name: mostSearchCat[i].name,
          data:[
            {key: "血量",value: mostSearchCat[i].hp},
            {key: "攻擊力",value: mostSearchCat[i].atk},
            {key: "查詢次數",value: mostSearchCat[i].count},
          ],
          redirect: "/cat/"+mostSearchCat[i].id
        });
      }
      this.setState({catLegend:temp})
      temp = [];
      for(let i in mostSearchStage){
        var id = mostSearchStage[i].id;
        temp.push({
          id: id,
          img: `./css/footage/stage/${id.split("-")[0]}_BG.png`,
          name: mostSearchStage[i].name.find((x,i,a)=>{return x.id === id.split("-")[1]}).name,
          data:[
            {key: "子關卡數",value: mostSearchStage[i].data.length},
            {key: "平均查詢數",value: Math.round(mostSearchStage[i].count)},
          ],
          redirect: "/stage/"+mostSearchStage[i].id.split("-").join("/")
        });
      }
      this.setState({stageLegend:temp});

    });
  }

  article_cat(){
    return(
      <div className="article" key={uniqueId()}>
        在這裡你可以查詢到每隻貓咪的基本資料，如:血量、攻擊力甚至是相關的聯組，
        你也可以對每隻貓咪評分或是留下使用感想，這些資訊對新手或是剛抽的這隻貓
        的朋友會十分的有用~<br></br>
        此外你可以用不同的篩選條件，像是:稀有度、特殊能力、對付敵人屬性甚至是數值化的
        血量、生產金額等篩選出符合條件的貓咪，並將他們加入"貓咪購物車"，當開啟
        <Link to='/compare/'>比較器</Link>
        的時候，在購物車中的貓咪就會被列舉出各項數值比較表，讓你一眼就可以看出
        每隻貓咪的優缺點。<br></br>
        左側為貓咪查詢排行榜，點擊"more"來看看這些貓為甚麼大受好評吧!
        <div>
          <Link style={{color: "var(--bluegreen)",fontWeight: "bold",cursor: "pointer",fontSize: 20}}
          to='/cat'>前往貓咪資料庫</Link>
        </div>
      </div>
    );
  }
  article_stage(){
    return(
      <div className="article" key={uniqueId()}>
        在這裡你可以查詢到各個關卡的資訊，像是:敵人出擊限制、我方出擊限制還有關卡獎勵
        與個敵人的強化倍率、出現時間等有用資訊。在出現敵人的列表中，你可以點擊表格上方
        的欄位，來依照出現時間或是強化倍率等排序敵人，也可以點擊敵人圖片來顯示該敵人的
        基本資料，對於攻略關卡十分的有幫助。<br></br>
        另外，資料庫還提供了可以用關卡名稱或是過關獎勵來篩選關卡，對於想要刷素材的朋友
        也很方便，之後也預計加入讓大家撰寫攻略的功能，敬請期待。<br></br>
        右側為上週關卡查詢排行榜，點擊"more"來看看大家都在刷什麼關卡吧!
        <div>
          <Link style={{color: "var(--bluegreen)",fontWeight: "bold",cursor: "pointer",fontSize: 20}}
          to='/stage/'>前往關卡資料庫</Link>
        </div>
      </div>
    );
  }
  table_link_1(){
    return(
      <table style={{flex:1}} key={uniqueId()}>
        <tbody>
          <tr>
            <th><a target="_blank"rel="noopener noreferrer" href="https://battlecats-db.com/">超絕攻略網</a></th><td>日文的攻略網，也是本網站目前主要的資料來源</td>
          </tr>
          <tr>
            <th><a target="_blank"rel="noopener noreferrer" href="https://forum.gamer.com.tw/A.php?bsn=23772">巴哈姆特貓戰版</a></th><td>中文的論壇，是本網站次要的資料來源</td>
          </tr>
          <tr>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://www.youtube.com/channel/UC6UBir4I6o_0dJQa8eoGoDQ">貓咪大戰爭中文版官方YouTube</a></th><td>官方的Youtube頻道</td>
          </tr>
          <tr>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://www.facebook.com/NyankoTW/">貓咪大戰爭中文版官方FB</a></th><td>官方的Facebook粉絲團</td>
          </tr>
        </tbody>
      </table>
    );
  }
  table_link_2(){
    return(
      <table style={{flex:1}} key={uniqueId()}>
        <tbody>
          <tr>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/evolution/tw/index.html"> 貓薄荷介紹 </a> </th>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/combo/tw/index.html"> 聯組介紹 </a> </th>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/zukan/tw/index.html"> 貓咪圖鑑介紹 </a> </th>
          </tr>
          <tr>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/mission/tw/index.html"> 貓咪任務介紹 </a> </th>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/instinct/tw/index.html"> 本能介紹 </a> </th>
            <th> <a target="_blank"rel="noopener noreferrer" href="https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/club/tw/index.html"> 貓咪俱樂部介紹 </a> </th>
          </tr>
        </tbody>
      </table>
    );
  }
  contact(){
    return([
        <a key={uniqueId()} href="https://www.facebook.com/BattleCatStation/"style={{textDecoration:"none"}} target="_blank"rel="noopener noreferrer">
            <ContactBlock img="/css/footage/facebook.png" title="facebook粉絲專頁" content={
              <span>幫我們按個讚，隨時獲得最新的更新消息<br></br>有問題的時候也可以私訊粉專，我們會以最快的速度幫你解決</span>
            }/>
        </a>,
        <a key={uniqueId()} href="https://docs.google.com/forms/d/e/1FAIpQLScz-YlVxBGPGsxWKSMqdBzpRZiDm3BOrmNihRnWZJlHlpGxag/viewform"style={{textDecoration:"none"}} target="_blank"rel="noopener noreferrer">
          <ContactBlock img="/css/footage/googleSheet.png" title="意見表單" content={
            <span>如果有Bug或是希望我們改進、加強的功能<br></br>抑或是有任何的建議與指教，歡迎填寫此google表單回報給我們知道</span>
          }/>
        </a>,
        <ContactBlock key={uniqueId()} img="/css/footage/paypal.png" title="贊助我們" content={
          <div>
            <span>如果我們架設的網站有幫助到你的話，請不吝嗇給我們一點鼓勵，十分的感謝你~~<br></br><b>選擇斗內金額:</b></span>
            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
              <img alt="" border="0"style={{display:"none"}} src="https://www.paypalobjects.com/zh_TW/i/scr/pixel.gif" width="1" height="1" />
              <input type="hidden" name="cmd" value="_s-xclick" />
              <input type="hidden" name="hosted_button_id" value="R8LMUVKC7U5WU" />
              <select name="os0" style={{ padding: "5px 10px", border: 0, borderRadius: "30px", margin: "10px", cursor: "pointer"}}>
                <option value="100">便當+咖啡 NT$100 TWD</option>
                <option value="70">一個便當 NT$70 TWD</option>
                <option value="30">一杯咖啡 NT$30 TWD</option>
              </select>
              <input type="hidden" name="currency_code" value="TWD" />
              <input type="submit" name="submit" value="斗內"/>
            </form>
          </div>
        }/>
      ]);
  }
  head(){
    return(
      <div className="Head" key={uniqueId()}>
        <div className="onLineUser"> 目前線上人數 : <span>0</span> 人 </div>
        <div className="expand" onClick={()=>{document.querySelector(".HomePageBlock:nth-child(3)").scrollIntoView({behavior: 'smooth'})}} >
          <i className="material-icons"> expand_less </i>
        </div>
      </div>
    );
  }

  render(){
    return(
      <div className='Home subApp NoScrollBar'>
        <Block style={{display:"none"}}/>
        <Block style={{backgroundImage:"url('./css/footage/background.png')",height:"80%",boxShadow:"0px -10px 30px 20px black",zIndex:2}} Child={[this.head()]}/>
        <Block name='貓咪資料庫' Child={[<LegendBoard data={this.state.catLegend}  key={uniqueId()}/>, this.article_cat()]}  />
        <Block name='關卡資料庫' style={{backgroundImage:`url(./css/footage/stage/bg009.png)`,backgroundPosition:"bottom"}}
          Child={[this.article_stage(), <LegendBoard data={this.state.stageLegend}  key={uniqueId()}/>]}/>
        <Block />
        <Block name='未來活動預測' Child={[<EventPrediction tw={this.state.eventPredict} jp={this.state.eventPredict_jp} key={uniqueId()}/>]}/>
        <Block name='其他網站連結' Child={[this.table_link_1(), this.table_link_2()]}/>
        <Block name='聯絡我們' Child={this.contact()}/>
      </div>
    );
  }
}


export default Home;
