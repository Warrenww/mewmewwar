import React,{Component} from 'react';
import {Tools} from './Utility.js';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../Style/Cat.css';

// fake data generator
const getItems = (count, offset = 0) =>
    Array.from({ length: count }, (v, k) => k).map(k => ({
        id: `item-${k + offset}`,
        content: `item ${k + offset}`
    }));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: 250
});

class DndExample extends Component {
    state = {
        items: getItems(10),
        selected: getItems(5, 10)
    };

    /**
     * A semi-generic way to handle multiple lists. Matches
     * the IDs of the droppable container to the names of the
     * source arrays stored in the state.
     */
    id2List = {
        droppable: 'items',
        droppable2: 'selected'
    };

    getList = id => this.state[this.id2List[id]];

    onDragEnd = result => {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const items = reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index
            );

            let state = { items };

            if (source.droppableId === 'droppable2') {
                state = { selected: items };
            }

            this.setState(state);
        } else {
            const result = move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );

            this.setState({
                items: result.droppable,
                selected: result.droppable2
            });
        }
    };

    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>
                            {this.state.items.map((item, index) => (
                                <Draggable
                                    key={item.id}
                                    draggableId={item.id}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}>
                                            {item.content}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <Droppable droppableId="droppable2">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>
                            {this.state.selected.map((item, index) => (
                                <Draggable
                                    key={item.id}
                                    draggableId={item.id}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}>
                                            {item.content}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }
}

class Cat extends Component {
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
              <Link to={"/cat/"+x}><span className="card" style={{}}>{Tools.AddZero(x,2)}</span></Link>
              <span className="card" style={{backgroundImage:`url("${Tools.imageURL('cat',Tools.AddZero(x,2)+"-1", 1)}")`}}></span>
              <span className="card" style={{backgroundImage:`url("${Tools.imageURL('cat',Tools.AddZero(x,2)+"-2", 1)}")`}}></span>
              <span className="card" style={{backgroundImage:`url("${Tools.imageURL('cat',Tools.AddZero(x,2)+"-3", 1)}")`}}></span>
            </div>
          )
        })}
      </div>
    );
  }
  render(){
    return(
      <div className="Cat subApp NoScrollBar">
        {this.CatList()}
        <span><i className="material-icons ctrl" onClick={this.nextpage} args={-1}>chevron_left</i></span>
        <span><i className="material-icons ctrl" onClick={this.nextpage} args={1} style={{right:0}}>chevron_right</i></span>
      </div>
    );
  }
}

export default Cat;
