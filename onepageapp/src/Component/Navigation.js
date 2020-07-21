import React, {Component, useState, useEffect} from 'react';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import {TreeView} from "./Utility.js";
import logo from '../logo_text.png';
import SettingsIcon from '@material-ui/icons/Settings';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

const AuthArea = props => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return(
    <div className='AuthArea flex'>
      <div className='flex' aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick} >
        <span className="userPhoto flex">
          {props.user?
            <img src={props.user.photoURL} alt=''/>:
            <i className="material-icons" style={{width: "30px", textAlign: "center",padding: "2px"}}>person</i>
          }
        </span>
        <span className="current_user_name flex">{props.user ? props.user.displayName : "訪客"}</span>
      </div>
      <Menu
        id="AuthAreaMenu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {
          props.user?
          <div>
            <MenuItem onClick={handleClose}><Link to='/settings'>設定<SettingsIcon /></Link></MenuItem>
            <MenuItem onClick={handleClose}><Link to='/' onClick={props.logout}>登出<ExitToAppIcon /></Link></MenuItem>
          </div>
          :
          <MenuItem onClick={handleClose}><Link to='/login'>登入<ExitToAppIcon /></Link></MenuItem>
        }
      </Menu>
    </div>
  );
}
const NavigationSideColumn = props => {
  var
  arr_1 = [
    <Link  to="/cat">貓咪資料</Link>,
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
        <TreeView rootName='資料庫' nodes={arr_1} clickNodeEvent={props.clickNodeEvent} />
        <TreeView rootName='更多功能' nodes={arr_2} clickNodeEvent={props.clickNodeEvent} />
        <TreeView rootName='打發時間' nodes={arr_3} clickNodeEvent={props.clickNodeEvent} />
        <div style={{display:"flex",flexDirection:"column",paddingLeft:"10px"}}>
          <Link onClick={props.clickNodeEvent} to="/calendar/">活動日程</Link>
          <Link onClick={props.clickNodeEvent} to="/document/"><i className="material-icons">help</i> <span>使用教學</span> </Link>
          <Link onClick={props.clickNodeEvent} to="/history/"><i className="material-icons">history</i> <span>歷程記錄</span> </Link>
        </div>
      </div>
    </div>
  );
}
const HamburgerMenu = (props) => {
  return(
    <div className="menu" onClick={props.clickEvent} active={Number(props.active)}>
      <span></span> <span></span> <span></span>
    </div>
  );
}
const Navigation = (props) => {
  const [active, setActive] = useState(false);

  return(
    <nav>
      <HamburgerMenu active={active} clickEvent={() => setActive(!active)}/>
      <NavigationSideColumn clickNodeEvent={() => setActive(!active)} />
      <Link to="/"><img src={logo} alt='Logo'/></Link>
      <AuthArea user={props.user} logout={props.logout}/>
      <div className='NavBG' onClick={() => setActive(!active)}></div>
    </nav>
  );
}

export default Navigation;
