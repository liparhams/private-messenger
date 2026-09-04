"use client";
import { useState } from "react";
import SupportChat from "./SupportChat";
export default function SupportLauncher(){
 const[open,setOpen]=useState(false);
 return <>{!open&&<button type="button" className="uc-support-float" onClick={()=>setOpen(true)}>پشتیبانی</button>}{open&&<SupportChat onClose={()=>setOpen(false)}/>}</>;
}