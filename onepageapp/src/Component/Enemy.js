import React,{Component} from 'react';
import {Tools} from './Utility.js';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../Style/Cat.css';




class Enemy extends Component {
  constructor(props){
    super(props);
    this.state = {
      currentPage:0
    }
    this.nextpage = this.nextPage.bind(this);
  }
  nextPage(e){
    var page = this.state.currentPage,
        n = Number(e.target.getAttribute("args"));
    if(page + n < 0 || page + n > 10) return;
    this.setState({currentPage:page + n});
  }
  CatList(){
    let arr = [],
        page = this.state.currentPage;
    for(let i=page*50;i<(page+1)*50;i++) arr.push(i);
    return(
      <div className="flex_col">
        {arr.map((x,i) => {
          return(
            <div className="flex" key={i}>
              <Link to={"/enemy/"+x}><span className="card" style={{}}>{Tools.AddZero(x,2)}</span></Link>
              <span className="card" style={{backgroundImage:`url("${Tools.imageURL('enemy',Tools.AddZero(x,2))}")`}}></span>
            </div>
          )
        })}
      </div>
    );
  }
  render(){
    return(
      <div className="Cat subApp NoScrollBar">
        <h1>敵人列表第{this.state.currentPage+1}頁</h1>
        {this.CatList()}
        <span><i className="material-icons ctrl" onClick={this.nextpage} args={-1}>chevron_left</i></span>
        <span><i className="material-icons ctrl" onClick={this.nextpage} args={1} style={{right:0}}>chevron_right</i></span>
      </div>
    );
  }
}

export default Enemy;
