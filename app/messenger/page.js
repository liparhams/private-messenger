"use client";

import {useEffect,useState} from "react";
import "./ux-polish.css";
import ChatWorkspace from "./ChatWorkspace";
import SupportLauncher from "./SupportLauncher";

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
  return <>
    <button className="uc-theme-toggle" type="button" onClick={()=>setDark(v=>!v)} aria-label={dark?"فعال کردن حالت روشن":"فعال کردن حالت تاریک"}>{dark?"☼":"◐"}</button>
    <ChatWorkspace/>
    <SupportLauncher/>
  </>;
}

export default function MessengerPage(){return <MessengerChrome/>}
