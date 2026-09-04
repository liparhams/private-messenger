"use client";
import "./v1.css";
import "./platform-polish.css";
import "../telegram-ui.css";
import "./creation-polish.css";
import "./platform-v2.css";
import "./platform-v3.css";
import "./platform-v4.css";
import "./platform-v5.css";
import "./platform-v6.css";
import ProfilePanel from "./ProfilePanel";
import SupportLauncher from "./SupportLauncher";
import ChatWorkspaceImpl from "./ChatWorkspaceImpl";
export default function ChatWorkspace(){return <><ChatWorkspaceImpl/><ProfilePanel/><SupportLauncher/></>}
