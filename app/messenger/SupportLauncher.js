"use client";
import { useState } from "react";
import SupportChat from "./SupportChat";

export default function SupportLauncher(){
 const [open,setOpen]=useState(false);
 return <>{!open&&<button type="button" className="uc-support-float" onClick={()=>setOpen(true)} aria-label="باز کردن پشتیبانی رسمی"><span className="uc-support-float-icon">?</span><span>پشتیبانی</span></button>}{open&&<SupportChat onClose={()=>setOpen(false)}/>}</>;
}
