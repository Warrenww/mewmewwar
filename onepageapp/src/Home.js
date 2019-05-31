import React,{Component} from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

class Block extends Component {
  constructor(props) {
    super(props);
  }
  render(){
    return(
      <div className='HomePageBlock'>
        <h2>{this.props.name}</h2>
        <div>
          {this.props.firstChild}
          {this.props.secondChild}
        </div>
      </div>
    );
  }
}

class LegendBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

  render(){
    return(
      <div className='LegendBoard'>
        {this.props.data.map((data,index)=>{ return(
          <div className='LegendCard'>
            <div style={{backgroundImage:`url("${data.img}")`,backgroundSize:"cover"}}></div>
            <span>{data.name}</span>
            <span>{data.data[0].key}:{data.data[0].value}</span>
            <span><Link to={data.redirect}>more</Link></span>
          </div>
        );})}
      </div>
    );
  }
}

class Home extends Component {
  constructor(props) {
    super(props);
    this.state={
      catLegend:[
        {img:null,name:"cat_001",data:[{key:"hp",value:1000}],redirect:"/cat/001"},
        {img:null,name:"cat_002",data:[{key:"hp",value:2000}],redirect:"/cat/002"},
        {img:null,name:"cat_003",data:[{key:"hp",value:3000}],redirect:"/cat/003"},
      ],
      stageLegend:[
        {img:null,name:"stage_001",data:[{key:"searchTimes",value:100}],redirect:"/stage/001"},
        {img:null,name:"stage_002",data:[{key:"searchTimes",value:200}],redirect:"/stage/002"},
        {img:null,name:"stage_003",data:[{key:"searchTimes",value:300}],redirect:"/stage/003"},
      ]
    }
  }

  article_cat(){
    return(
      <div className="article">
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
          to='/cat/'>前往貓咪資料庫</Link>
        </div>
      </div>
    );
  }
  article_stage(){
    return(
      <div className="article">
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
  new_event(){
    return(
      <div className='flex_col'style={{width:"100%"}}>
        選擇日期 : <select id="event_date" style={{color:"black"}}></select>
        <iframe id="event_iframe"></iframe>
        <div id="alt_text"style={{display:"none"}}></div>
        <div style={{marginTop:20}}>
        <a target="_blank" style={{marginRight:20}}>在新分頁開啟</a>
        <a onClick="reloadEventIframe()">重新整理</a>
        <a onClick="switchPureText()" style={{marginLeft:20}}>切換純文字顯示</a>
        </div>
      </div>
    );
  }

  render(){
    return(
      <div className='Home subApp NoScrollBar'>
        <Block name='貓咪資料庫' firstChild={<LegendBoard data={this.state.catLegend} />} secondChild={this.article_cat()}  />
        <Block name='關卡資料庫' firstChild={this.article_stage()} secondChild={<LegendBoard data={this.state.stageLegend} />}/>
        <Block name='最新消息' firstChild={this.new_event()}/>
      </div>
    );
  }
}


export default Home;
