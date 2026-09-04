"use client";

const paths = {
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  send: <><path d="m21 3-7.3 18-3.8-8.1L2 9.1 21 3Z" /><path d="m9.9 12.9 5.3-5.3" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  settings: <><circle cx="12" cy="12" r="3.5" /><path d="M19.4 15a2 2 0 0 0 .4 2.2l.1.1-2.1 2.1-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8v.2h-3v-.2a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1-2.1-2.1.1-.1A2 2 0 0 0 6.2 15 2 2 0 0 0 4.4 14H4v-3h.4a2 2 0 0 0 1.8-1.2 2 2 0 0 0-.4-2.2l-.1-.1 2.1-2.1.1.1a2 2 0 0 0 2.2.4A2 2 0 0 0 11.3 4v-.2h3V4a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1 2.1 2.1-.1.1a2 2 0 0 0-.4 2.2 2 2 0 0 0 1.8 1.2h.2v3h-.2a2 2 0 0 0-1.8 1.1Z" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5" /></>,
  chat: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-4-.9L4 20l1.2-3.6A7.4 7.4 0 0 1 4 12a7.5 7.5 0 1 1 16-.5Z" />,
  group: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19c.7-3 2.5-4.5 5.5-4.5S13.8 16 14.5 19" /><circle cx="17" cy="10" r="2.4" /><path d="M16 14.7c2.5.2 4 1.6 4.5 4" /></>,
  channel: <><path d="m8 8 8-3v14l-8-3V8Z" /><path d="M8 8 4 6v12l4-1.5M11 7v10" /></>,
  shield: <><path d="M12 3 19 6v5.2c0 4.5-2.7 7.5-7 9.8-4.3-2.3-7-5.3-7-9.8V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  bolt: <path d="m13 2-8 11h6l-2 9 8-12h-6l2-8Z" />,
  devices: <><rect x="3" y="5" width="12" height="10" rx="1.5" /><path d="M7 19h4M8 15v4" /><rect x="16" y="8" width="5" height="10" rx="1" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.8 9h16.4M3.8 15h16.4M12 3.5c2 2.3 3 5.1 3 8.5s-1 6.2-3 8.5c-2-2.3-3-5.1-3-8.5s1-6.2 3-8.5Z" /></>,
  moon: <path d="M19 15.2A7.5 7.5 0 0 1 8.8 5a7.5 7.5 0 1 0 10.2 10.2Z" />,
  sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  download: <><path d="M12 3v11" /><path d="m7 10 5 5 5-5M5 20h14" /></>,
  heart: <path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8.8 2.3Z" />,
  play: <path d="m9 6 9 6-9 6V6Z" />,
  support: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.5c.8 1.2 2 1.8 3.5 1.8s2.7-.6 3.5-1.8M9 9.5h.01M15 9.5h.01" /></>,
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = "", title }) {
  return (
    <svg className={`uc-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      {paths[name] || paths.chat}
    </svg>
  );
}
