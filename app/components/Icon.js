"use client";

const paths = {
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  back: <path d="m15 5-7 7 7 7M8 12h12" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  send: <><path d="m21 3-7.3 18-3.8-8.1L2 9.1 21 3Z" /><path d="m9.9 12.9 5.3-5.3" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  plusCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  settings: <><circle cx="12" cy="12" r="3.5" /><path d="M19.4 15a2 2 0 0 0 .4 2.2l.1.1-2.1 2.1-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8v.2h-3v-.2a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1-2.1-2.1.1-.1A2 2 0 0 0 6.2 15 2 2 0 0 0 4.4 14H4v-3h.4a2 2 0 0 0 1.8-1.2 2 2 0 0 0-.4-2.2l-.1-.1 2.1-2.1.1.1a2 2 0 0 0 2.2.4A2 2 0 0 0 11.3 4v-.2h3V4a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1 2.1 2.1-.1.1a2 2 0 0 0-.4 2.2 2 2 0 0 0 1.8 1.2h.2v3h-.2a2 2 0 0 0-1.8 1.1Z" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5" /></>,
  chat: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-4-.9L4 20l1.2-3.6A7.4 7.4 0 0 1 4 12a7.5 7.5 0 1 1 16-.5Z" />,
  group: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19c.7-3 2.5-4.5 5.5-4.5S13.8 16 14.5 19" /><circle cx="17" cy="10" r="2.4" /><path d="M16 14.7c2.5.2 4 1.6 4.5 4" /></>,
  channel: <><path d="m8 8 8-3v14l-8-3V8Z" /><path d="M8 8 4 6v12l4-1.5M11 7v10" /></>,
  shield: <><path d="M12 3 19 6v5.2c0 4.5-2.7 7.5-7 9.8-4.3-2.3-7-5.3-7-9.8V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  bolt: <path d="m13 2-8 11h6l-2 9 8-12h-6l2-8Z" />,
  devices: <><rect x="3" y="5" width="12" height="10" rx="1.5" /><path d="M7 19h4M8 15v4" /><rect x="16" y="8" width="5" height="10" rx="1" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.8 9h16.4M3.8 15h16.4M12 3.5c2 2.3 3 5.1 3 8.5s-1 6.2-3 8.5c-2-2.3-3-5.1-3-8.5s1-6.2 3-8.5Z" /></>,
  moon: <path d="M19 15.2A7.5 7.5 0 0 1 8.8 5a7.5 7.5 0 1 0 10.2 10.2Z" />,
  sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  doubleCheck: <><path d="m3.5 12 4 4L17 6" /><path d="m9.5 12 4 4L23 6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  attach: <path d="m20 11-7.2 7.2a5 5 0 0 1-7.1-7.1l7.7-7.7a3.5 3.5 0 0 1 5 5l-7.7 7.7a2 2 0 0 1-2.8-2.8l7-7" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" /></>,
  smile: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.5c.9 1.3 2.1 1.9 3.5 1.9s2.6-.6 3.5-1.9M9 9.5h.01M15 9.5h.01" /></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13.5" r="3.2" /></>,
  image: <><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="9" cy="9" r="1.2" /><path d="m5 17 4.5-4.5 3 3 2-2 4.5 4.5" /></>,
  file: <><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h4M8 13h8M8 17h6" /></>,
  download: <><path d="M12 3v11" /><path d="m7 10 5 5 5-5M5 20h14" /></>,
  upload: <><path d="M12 21V10" /><path d="m7 14 5-5 5 5M5 4h14" /></>,
  play: <path d="m9 6 9 6-9 6V6Z" />,
  pause: <><path d="M9 6v12M15 6v12" /></>,
  heart: <path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.8 2.3Z" />,
  edit: <path d="m4 20 4.2-1 9.7-9.7a2.1 2.1 0 0 0-3-3L5.2 16 4 20ZM13.8 7.2l3 3" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 14h10l1-14" /></>,
  reply: <><path d="m9 7-6 5 6 5" /><path d="M3 12h9c5 0 7 2 9 6-.5-6-3-9-9-9H3" /></>,
  forward: <><path d="m15 7 6 5-6 5" /><path d="M21 12h-9c-5 0-7 2-9 6 .5-6 3-9 9-9h9" /></>,
  link: <><path d="M10 13.5a4 4 0 0 0 5.7.2l2-2a4 4 0 0 0-5.7-5.7l-1.1 1.1" /><path d="M14 10.5a4 4 0 0 0-5.7-.2l-2 2A4 4 0 0 0 8 18l1.1-1.1" /></>,
  phone: <path d="M7 4h3l1.5 4-2 1.5a14 14 0 0 0 5 5l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C11.4 19 5 12.6 5 6c0-1.1.9-2 2-2Z" />,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  bell: <><path d="M6 10a6 6 0 0 1 12 0c0 6 2 6 2 8H4c0-2 2-2 2-8ZM10 21h4" /></>,
  pin: <><path d="m15 4 5 5-3 2-3 5-1 4-2-2 1-4-5-3-2-3 5-1 2-3Z" /><path d="M12 18 7 23" /></>,
  archive: <><path d="M4 7h16v13H4zM3 4h18v3H3zM9 12h6" /></>,
  bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" />,
  folder: <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />,
  support: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.5c.8 1.2 2 1.8 3.5 1.8s2.7-.6 3.5-1.8M9 9.5h.01M15 9.5h.01" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = "", title, animated = false }) {
  return (
    <svg className={`uc-icon${animated ? " uc-icon-animated" : ""}${className ? ` ${className}` : ""}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      {paths[name] || paths.chat}
    </svg>
  );
}
