import React, {Component, useState, useEffect} from 'react';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { BrowserRouter as Router, Route, Link, Switch } from "react-router-dom";
import {TreeView, Tools} from "./Utility.js";
import logo from '../logo_text.png';
import SettingsIcon from '@material-ui/icons/Settings';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import Zoom from '@material-ui/core/Zoom';
import Avatar from '@material-ui/core/Avatar';

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
          [
            <MenuItem onClick={handleClose}><Link to='/settings'>設定<SettingsIcon /></Link></MenuItem>,
            <MenuItem onClick={handleClose}><Link to='/' onClick={props.logout}>登出<ExitToAppIcon /></Link></MenuItem>
          ]
          :
          <MenuItem onClick={handleClose}><Link to='/login'>登入<ExitToAppIcon /></Link></MenuItem>
        }
      </Menu>
    </div>
  );
}
const NavigationSideColumn = props => {
  const links = [
    {link: '/cat/list', name: '貓咪列表', icon: Tools.imageURL('cat','001-1',1), style:{}},
    {link: '/enemy/list', name: '敵人列表', icon: Tools.imageURL('enemy','002'), style:{}},
  ]
  return(
    <div className="NavigationSideColumn NoScrollBar">
      <div className="navLinkBox">
        {
          links.map((link, i) => (
            <Zoom key={i} in={props.active} timeout={(i+2) * 300}>
              <Link to={link.link} onClick={props.clickNodeEvent} style={link.style}>
                <Avatar src={link.icon} />
                <span>{link.name}</span>
              </Link>
            </Zoom>
          ))
        }
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
    <nav style={{maxHeight: active ? '40vh' : '50px'}}>
      <HamburgerMenu active={active} clickEvent={() => setActive(!active)}/>
      <Link to="/"><img src={logo} alt='Logo'/></Link>
      <AuthArea user={props.user} logout={props.logout}/>
      <NavigationSideColumn active={active} clickNodeEvent={() => setActive(!active)} />
    </nav>
  );
}

export default Navigation;
