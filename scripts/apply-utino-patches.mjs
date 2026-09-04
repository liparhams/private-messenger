import fs from 'node:fs';

function replaceOnce(file, find, replacement, label) {
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes(replacement)) return false;
  if (!source.includes(find)) {
    console.log(`Skipping unavailable patch: ${label}`);
    return false;
  }
  source = source.replace(find, replacement);
  fs.writeFileSync(file, source);
  return true;
}

const chat = 'app/messenger/ChatWorkspace.js';
replaceOnce(chat, 'import "./v1.css";', 'import "./v1.css";\nimport "./utino-enhancements.css";\nimport SupportChat from "./SupportChat";', 'chat css');
replaceOnce(chat, '  const [groupOpen, setGroupName] = useState("");', '  const [groupOpen, setGroupName] = useState("");', 'noop');
replaceOnce(chat, '  const [groupOpen, setGroupName] = useState("");', '  const [groupOpen, setGroupName] = useState("");', 'noop2');
replaceOnce(chat, '  const [groupOpen, setGroupName] = useState("");', '  const [groupOpen, setGroupName] = useState("");', 'noop3');
replaceOnce(chat, 'db.from("conversations").select("id,type,title,created_by,created_at")', 'db.from("conversations").select("id,type,title,created_by,created_at,is_channel,description,channel_username,is_public")', 'conversation fields');
replaceOnce(chat, '  async function addMember(user) {', `  async function createChannel() {
    const title = channelName.trim();
    if (!title || busy) return;
    setBusy(true); setError("");
    const { data, error: e } = await db.rpc("create_channel_conversation", { channel_title: title, channel_description: channelDescription.trim(), channel_username: channelUsername.trim() || null, channel_public: channelPublic });
    setBusy(false);
    if (e || !data) { setError(e?.message || t.error); return; }
    setChannelOpen(false); setChannelName(""); setChannelDescription(""); setChannelUsername(""); setChannelPublic(true);
    await loadConversations(); setSelectedId(data); setMobileSidebar(false);
  }

  async function addMember(user) {`, 'create channel');
replaceOnce(chat, '<div className="uc-sidebar-tools"><button className="uc-new-group" onClick={() => setGroupOpen(true)}><Icon name="plus" size={17}/>{t.newGroup}</button></div>', `<div className="uc-sidebar-tools uc-create-tools"><button className="uc-new-group uc-create-trigger" onClick={() => setCreateMenuOpen(v => !v)} aria-expanded={createMenuOpen}><Icon name="plus" size={16}/><span>جدید</span></button>{createMenuOpen && <div className="uc-create-menu"><button type="button" onClick={() => { setCreateMenuOpen(false); document.querySelector(".uc-search-wrap input")?.focus(); }}>افزودن کاربر / شروع گفتگو</button><button type="button" onClick={() => { setCreateMenuOpen(false); setGroupOpen(true); }}>ساخت گروه</button><button type="button" onClick={() => { setCreateMenuOpen(false); setChannelOpen(true); }}>ساخت کانال</button></div>}</div>`, 'create menu');
replaceOnce(chat, '{groupOpen && <Modal onClose={() => { setGroupOpen(false); setGroupSelection([]); }} title={t.create}>', `{channelOpen && <Modal onClose={() => setChannelOpen(false)} title="ساخت کانال"><div className="uc-channel-form"><label>نام کانال<input value={channelName} onChange={e => setChannelName(e.target.value)} maxLength={80} autoFocus placeholder="مثلاً Utino News" /></label><label>شناسه کانال<input value={channelUsername} onChange={e => setChannelUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())} maxLength={32} placeholder="utino_news" dir="ltr" /></label><label>توضیحات<textarea value={channelDescription} onChange={e => setChannelDescription(e.target.value)} maxLength={500} placeholder="درباره کانال..." /></label><label className="uc-channel-check"><input type="checkbox" checked={channelPublic} onChange={e => setChannelPublic(e.target.checked)} /><span>کانال عمومی باشد</span></label><div className="uc-modal-actions"><button type="button" onClick={() => setChannelOpen(false)}>لغو</button><button type="button" className="primary" onClick={createChannel} disabled={busy || !channelName.trim()}>{busy ? "در حال ساخت…" : "ساخت کانال"}</button></div></div></Modal>}{groupOpen && <Modal onClose={() => { setGroupOpen(false); setGroupSelection([]); }} title={t.create}>`, 'channel modal');
replaceOnce(chat, '  return (<>{<button type="button" className="uc-support-float" onClick={() => setDirectSupportOpen(true)} aria-label="پشتیبانی">پشتیبانی</button>}{directSupportOpen && <SupportChat onClose={() => setDirectSupportOpen(false)} />}', '  return (/*support-launcher-removed*/', 'remove inline support launcher');

const auth = 'app/page.js';
replaceOnce(auth, '  const [supportOpen, setSupportOpen] = useState(false);\n  const t = TEXT[lang];', '  const [supportOpen, setSupportOpen] = useState(false);\n  const [registrationEnabled, setRegistrationEnabled] = useState(false);\n  const t = TEXT[lang];', 'registration state');
replaceOnce(auth, '  useEffect(() => {\n    try {\n      const savedLang = localStorage.getItem("messenger-language");', '  useEffect(() => {\n    let active = true;\n    supabase.from("app_settings").select("value").eq("key","registration_enabled").maybeSingle().then(({ data }) => { if (active) setRegistrationEnabled(data?.value === true); });\n    return () => { active = false; };\n  }, []);\n\n  useEffect(() => {\n    try {\n      const savedLang = localStorage.getItem("messenger-language");', 'registration loader');
replaceOnce(auth, '        <div style={{ marginTop: 18, textAlign: "center", color: colors.muted, fontSize: 10 }}>Username access · Messenger</div>', '        {registrationEnabled && <div style={{ marginTop: 16, textAlign: "center" }}><a href="/register/" style={{ color: "#60a5fa", fontWeight: 750, fontSize: 13, textDecoration: "none" }}>ساخت حساب جدید</a></div>}\n        <div style={{ marginTop: 12, textAlign: "center", color: colors.muted, fontSize: 10 }}>Username access · Messenger</div>', 'registration link');

const admin = 'app/admin/page.js';
replaceOnce(admin, 'import "./admin.css";', 'import "./admin.css";\nimport SupportTickets from "./SupportTickets";\nimport SupportChat from "./SupportChat";', 'admin support imports');
replaceOnce(admin, '{tab==="messages"&&<div className="admin-card">', '{tab==="tickets"&&<SupportTickets/>}\n{tab==="tickets"&&<SupportChat/>}\n{tab==="messages"&&<div className="admin-card">', 'admin support panels');

console.log('Utino patches completed');
