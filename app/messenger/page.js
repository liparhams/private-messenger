"use client";

import {useEffect,useState} from "react";
import "../utino-system.css";
import "./ux-polish.css";
import "./profile-panel.css";
import "./messenger-menu.css";
import ChatWorkspace from "./ChatWorkspace";

function MessengerMenu(){
  const [open,setOpen]=useState(false);
  const [dark,setDark]=useState(true);

  useEffect(()=>{
    try{
      setDark(localStorage.getItem("utino-theme")!=="light");
    }catch{}
    const sync=e=>setDark(Boolean(e.detail));
    window.addEventListener("utino-theme-change",sync);
    return()=>window.removeEventListener("utino-theme-change",sync);
  },[]);

  function setTheme(nextDark){
    setDark(nextDark);
    try{
      localStorage.setItem("utino-theme",nextDark?"dark":"light");
      document.documentElement.dataset.theme=nextDark?"dark":"light";
    }catch{}
    window.dispatchEvent(new CustomEvent("utino-theme-change",{detail:nextDark}));
  }

  function newChat(){
    setOpen(false);
    const input=document.querySelector(".uc-search-wrap input");
    input?.focus();
    input?.select();
  }

  return <div className="uc-messenger-menu">
    <button
      className="uc-menu-trigger"
      type="button"
      onClick={()=>setOpen(v=>!v)}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label="منوی مسنجر"
      title="منوی مسنجر"
    >
      <span aria-hidden="true">⋮</span>
    </button>
    {open&&<>
      <button className="uc-menu-scrim" type="button" aria-label="بستن منو" onClick={()=>setOpen(false)}/>
      <div className="uc-menu-panel" role="menu" dir="rtl">
        <div className="uc-menu-heading">UTINOCHATV1</div>
        <button className="uc-menu-item uc-menu-primary" type="button" onClick={newChat} role="menuitem">
          <span className="uc-menu-icon" aria-hidden="true">＋</span>
          <span><strong>گفتگوی جدید</strong><small>پیدا کردن کاربر و شروع چت</small></span>
        </button>
        <div className="uc-menu-divider"/>
        <div className="uc-menu-label">ظاهر</div>
        <div className="uc-theme-switch" role="group" aria-label="انتخاب حالت نمایش">
          <button type="button" className={!dark?"active":""} onClick={()=>setTheme(false)} aria-pressed={!dark}>☀️ روشن</button>
          <button type="button" className={dark?"active":""} onClick={()=>setTheme(true)} aria-pressed={dark}>🌙 تاریک</button>
        </div>
      </div>
    </>}
  </div>;
}

function MessengerChrome(){
  const [dark,setDark]=useState(true);
  useEffect(()=>{
    try{
      const saved=localStorage.getItem("utino-theme");
      const next=saved==="light"?false:saved==="dark"?true:true;
      setDark(next);
      document.documentElement.dataset.theme=next?"dark":"light";
    }catch{}
  },[]);
  useEffect(()=>{
    try{
      localStorage.setItem("utino-theme",dark?"dark":"light");
      document.documentElement.dataset.theme=dark?"dark":"light";
    }catch{}
  },[dark]);
  useEffect(()=>{
    const sync=e=>setDark(Boolean(e.detail));
    window.addEventListener("utino-theme-change",sync);
    return()=>window.removeEventListener("utino-theme-change",sync);
  },[]);
  return <>
    <MessengerMenu/>
    <ChatWorkspace/>
  </>;
}

export default function MessengerPage(){return <MessengerChrome/>}
