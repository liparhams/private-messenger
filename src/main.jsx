import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Archive, ArrowLeft, Bell, Check, CheckCheck, ChevronDown, Edit3, Hash,
  LogOut, Menu, MessageCircle, MoreVertical, Moon, Paperclip, Phone,
  Plus, Search, Send, Settings, Smile, Sun, Users, Video, X, Zap
} from 'lucide-react';
import { supabase } from './lib/supabase.js';
import './styles.css';

const FEATURES = [
  ['سریع', 'پیام‌رسانی لحظه‌ای و سبک'],
  ['ساده', 'رابط تمیز و آشنا'],
  ['همگام', 'گفت‌وگوها روی همه دستگاه‌ها'],
  ['خصوصی', 'داده‌ها با Supabase محافظت می‌شوند']
];

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [dark, setDark] = useState(() => localStorage.getItem('utino-theme') === 'dark');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('chats');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composerBusy, setComposerBusy] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [communityResults, setCommunityResults] = useState([]);
  const [contactResults, setContactResults] = useState([]);
  const [createKind, setCreateKind] = useState('group');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [notice, setNotice] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session); setBooting(false); }
    }).catch((e) => { if (active) { setError(e.message); setBooting(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setBooting(false);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('utino-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function prepare() {
      const { data: p } = await supabase.rpc('get_my_profile');
      if (!cancelled) setProfile(p?.[0] || p || null);
      await loadChats();
    }
    prepare();
    const channel = supabase.channel('utinochat-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new;
        if (!row?.id) return;
        if (selected?.id && row.conversation_id === selected.id) {
          setMessages((old) => old.some((m) => m.id === row.id) ? old : [...old, row]);
          requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
        }
        setChats((old) => old.map((c) => c.id === row.conversation_id ? { ...c, last: row.content || 'فایل', time: formatTime(row.created_at) } : c));
      }).subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [session, selected?.id]);

  useEffect(() => {
    if (!selected?.id || !session) return;
    loadMessages(selected.id);
  }, [selected?.id, session]);

  useEffect(() => {
    if (!query.trim()) { setCommunityResults([]); setContactResults([]); return; }
    const timer = setTimeout(async () => {
      const [{ data: people }, { data: communities }] = await Promise.all([
        supabase.rpc('search_user_directory', { search_text: query.trim(), result_limit: 20 }),
        supabase.rpc('search_public_channels', { search_text: query.trim() })
      ]);
      setContactResults(people || []);
      setCommunityResults(communities || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function loadChats() {
    const { data: memberships } = await supabase.from('conversation_members')
      .select('conversation_id, role, joined_at, left_at').eq('user_id', session.user.id).is('left_at', null);
    const ids = (memberships || []).map((m) => m.conversation_id);
    if (!ids.length) { setChats([]); setSelected(null); return; }
    const { data: conversations } = await supabase.from('conversations').select('*').in('id', ids).order('created_at', { ascending: false });
    const list = (conversations || []).map((c) => ({
      ...c,
      avatar: c.is_channel ? '#' : c.type === 'group' ? 'G' : (c.title || 'U').slice(0, 1).toUpperCase(),
      last: c.description || (c.is_channel ? 'کانال' : c.type === 'group' ? 'گروه' : 'گفت‌وگو'),
      time: formatTime(c.created_at),
      unread: 0
    }));
    setChats(list);
    setSelected((current) => current && list.some((c) => c.id === current.id) ? current : list[0] || null);
  }

  async function loadMessages(conversationId) {
    setLoadingMessages(true);
    const { data, error: readError } = await supabase.from('messages').select('*')
      .eq('conversation_id', conversationId).is('deleted_at', null)
      .order('created_at', { ascending: true }).limit(200);
    if (readError) setError(readError.message); else setMessages(data || []);
    setLoadingMessages(false);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
  }

  async function authenticate(e) {
    e.preventDefault(); setError(''); setBooting(true);
    try {
      if (authMode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password, options: { data: { display_name: displayName, username } }
        });
        if (authError) throw authError;
        if (data.user && data.session) await supabase.rpc('update_my_profile', { new_display_name: displayName, new_bio: '' });
        if (!data.session) setNotice('ثبت‌نام انجام شد. اگر تأیید ایمیل فعال است، ایمیل خود را بررسی کن.');
      }
    } catch (e2) { setError(e2.message || 'عملیات ناموفق بود'); }
    finally { setBooting(false); }
  }

  async function logout() { await supabase.auth.signOut(); setProfile(null); setChats([]); setSelected(null); setMessages([]); }

  async function sendMessage(e) {
    e?.preventDefault();
    const text = message.trim();
    if (!text || !session || !selected || composerBusy) return;
    setComposerBusy(true); setMessage(''); setError('');
    const { data, error: sendError } = await supabase.from('messages').insert({
      sender_id: session.user.id, conversation_id: selected.id, content: text, message_type: 'text'
    }).select().single();
    if (sendError) { setMessage(text); setError(sendError.message); }
    else if (data) setMessages((old) => old.some((m) => m.id === data.id) ? old : [...old, data]);
    setComposerBusy(false);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }

  async function createConversation(e) {
    e.preventDefault(); if (!createTitle.trim()) return;
    setError('');
    const { data, error: createError } = await supabase.rpc('create_conversation', {
      p_kind: createKind, p_title: createTitle.trim(), p_description: createDescription.trim(),
      p_is_public: createKind === 'channel', p_username: createKind === 'channel' ? createUsername.trim() || null : null,
      p_member_ids: []
    });
    if (createError) { setError(createError.message); return; }
    setShowCreate(false); setCreateTitle(''); setCreateDescription(''); setCreateUsername('');
    await loadChats();
    const createdId = Array.isArray(data) ? data[0] : data;
    if (createdId) {
      const found = chats.find((c) => c.id === createdId);
      if (found) { setSelected(found); setMobileOpen(true); }
    }
    setNotice(createKind === 'channel' ? 'کانال ساخته شد.' : 'گروه ساخته شد.');
  }

  async function openPerson(person) {
    const { data, error: directError } = await supabase.rpc('get_or_create_direct_conversation', { other_user_id: person.id });
    if (directError) { setError(directError.message); return; }
    await loadChats();
    const id = Array.isArray(data) ? data[0] : data;
    const next = chats.find((c) => c.id === id);
    if (next) setSelected(next); else await loadChats();
    setTab('chats'); setMobileOpen(true); setQuery('');
  }

  async function joinCommunity(id) {
    const { error: joinError } = await supabase.rpc('join_conversation', { p_conversation_id: id });
    if (joinError) setError(joinError.message); else { setNotice('به جامعه پیوستی.'); await loadChats(); }
  }

  async function markSeen() {
    const ids = messages.filter((m) => m.sender_id !== session.user.id).map((m) => m.id);
    if (ids.length) await supabase.rpc('mark_messages_seen', { message_ids: ids });
  }

  const visibleChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => `${c.title || ''} ${c.description || ''}`.toLowerCase().includes(q));
  }, [chats, query]);

  useEffect(() => { if (selected?.id) markSeen(); }, [selected?.id, messages.length]);

  if (booting) return <Splash />;
  if (!session) return <LandingAuth {...{ authMode, setAuthMode, email, setEmail, password, setPassword, displayName, setDisplayName, username, setUsername, authenticate, error, notice, booting }} />;

  return <div className={`shell ${mobileOpen ? 'mobile-chat-open' : ''}`}>
    <aside className="sidebar">
      <header className="sidebar-head">
        <button className="icon-btn" aria-label="منو" onClick={() => setShowMenu((v) => !v)}><Menu size={21}/></button>
        <div className="wordmark"><span className="logo-mark">U</span><span>utino</span></div>
        <button className="icon-btn" aria-label="حالت رنگ" onClick={() => setDark((v) => !v)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
      </header>
      {showMenu && <div className="popover menu-pop">
        <button onClick={() => { setTab('contacts'); setShowMenu(false); }}><Users size={17}/> مخاطبین</button>
        <button onClick={() => { setShowSettings(true); setShowMenu(false); }}><Settings size={17}/> تنظیمات</button>
        <button onClick={() => { logout(); setShowMenu(false); }}><LogOut size={17}/> خروج</button>
      </div>}
      <div className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجو"/></div>
      <div className="sidebar-tabs">
        <button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>همه</button>
        <button className={tab === 'contacts' ? 'active' : ''} onClick={() => setTab('contacts')}>مخاطبین</button>
        <button className={tab === 'communities' ? 'active' : ''} onClick={() => setTab('communities')}>کانال‌ها</button>
      </div>
      <div className="list-scroll">
        {tab === 'chats' && <>
          {visibleChats.length ? visibleChats.map((chat) => <ChatRow key={chat.id} chat={chat} selected={selected?.id === chat.id} onClick={() => { setSelected(chat); setMobileOpen(true); }}/>) : <EmptyList icon={<MessageCircle/>} title="هنوز گفت‌وگویی نیست" text="از جست‌وجو یک کاربر پیدا کن و گفتگو را شروع کن."/>}
        </>}
        {tab === 'contacts' && <>
          {(contactResults.length ? contactResults : []).map((person) => <button className="contact-row" key={person.id} onClick={() => openPerson(person)}><Avatar text={person.display_name || person.username}/><span><b>{person.display_name || person.username}</b><small>@{person.username}</small></span></button>)}
          {!contactResults.length && <EmptyList icon={<Users/>} title="مخاطب پیدا کن" text="در جست‌وجو نام یا نام کاربری را بنویس."/>}
        </>}
        {tab === 'communities' && <>
          {communityResults.map((community) => <button className="contact-row" key={community.id} onClick={() => joinCommunity(community.id)}><Avatar text="#"/><span><b>{community.title}</b><small>@{community.channel_username || 'community'} · {community.member_count || 0} عضو</small></span></button>)}
          {!communityResults.length && <EmptyList icon={<Hash/>} title="کانال‌ها" text="نام کانال را در جست‌وجو بنویس."/>}
        </>}
      </div>
      <button className="new-chat" onClick={() => setShowCreate(true)}><Plus size={19}/><span>گفت‌وگوی جدید</span></button>
      <div className="profile-mini"><Avatar text={profile?.display_name || profile?.username || 'U'}/><div><b>{profile?.display_name || profile?.username || 'کاربر'}</b><small>@{profile?.username || 'user'}</small></div><button className="icon-btn" onClick={() => setShowSettings(true)}><Settings size={18}/></button></div>
    </aside>

    <main className="chat-pane">
      {selected ? <>
        <header className="chat-head">
          <button className="icon-btn back-btn" onClick={() => setMobileOpen(false)}><ArrowLeft size={21}/></button>
          <Avatar text={selected.avatar || selected.title}/>
          <div className="chat-title"><b>{selected.title || 'گفت‌وگو'}</b><span>{selected.is_channel ? 'کانال' : selected.type === 'group' ? 'گروه' : 'آنلاین'}</span></div>
          <div className="head-tools"><button className="icon-btn"><Search size={19}/></button><button className="icon-btn"><Phone size={19}/></button><button className="icon-btn"><Video size={19}/></button><button className="icon-btn"><MoreVertical size={19}/></button></div>
        </header>
        <div className="message-stage" onClick={() => showMenu && setShowMenu(false)}>
          <div className="day-pill">امروز</div>
          {loadingMessages ? <div className="stage-center"><div className="spinner"/></div> : messages.length ? messages.map((m) => <MessageBubble key={m.id} message={m} own={m.sender_id === session.user.id}/>) : <div className="stage-center"><div className="welcome-icon"><Zap size={27}/></div><b>گفت‌وگو را شروع کن</b><span>اولین پیام اینجا نمایش داده می‌شود.</span></div>}
          <div ref={bottomRef}/>
        </div>
        {error && <div className="inline-error"><span>{error}</span><button onClick={() => setError('')}><X size={15}/></button></div>}
        <form className="composer" onSubmit={sendMessage}>
          <button type="button" className="icon-btn"><Paperclip size={21}/></button>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="پیام بنویسید…" autoComplete="off"/>
          <button type="button" className="icon-btn"><Smile size={21}/></button>
          <button className="send-btn" disabled={!message.trim() || composerBusy} type="submit"><Send size={19}/></button>
        </form>
      </> : <Welcome />}
    </main>

    {showCreate && <Modal title="ساخت فضای جدید" onClose={() => setShowCreate(false)}><form className="modal-form" onSubmit={createConversation}><div className="segmented"><button type="button" className={createKind === 'group' ? 'selected' : ''} onClick={() => setCreateKind('group')}>گروه</button><button type="button" className={createKind === 'channel' ? 'selected' : ''} onClick={() => setCreateKind('channel')}>کانال</button></div><label>نام<input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} required maxLength={80}/></label><label>توضیح<input value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} maxLength={160}/></label>{createKind === 'channel' && <label>نام کاربری کانال<input value={createUsername} onChange={(e) => setCreateUsername(e.target.value.toLowerCase())} placeholder="mychannel" pattern="[a-z0-9_]{3,20}"/></label>}<button className="primary-btn">ساخت</button></form></Modal>}
    {showSettings && <Modal title="تنظیمات" onClose={() => setShowSettings(false)}><div className="settings-list"><div className="setting-item"><span><Moon size={18}/> حالت تاریک</span><button className={`switch ${dark ? 'on' : ''}`} onClick={() => setDark((v) => !v)}><i/></button></div><div className="setting-item"><span><Bell size={18}/> اعلان‌ها</span><span className="muted">به‌زودی</span></div><div className="setting-item"><span><Archive size={18}/> آرشیو</span><span className="muted">به‌زودی</span></div></div></Modal>}
    {notice && <div className="toast" onAnimationEnd={() => setNotice('')}>{notice}<Check size={16}/></div>}
  </div>;
}

function LandingAuth({ authMode, setAuthMode, email, setEmail, password, setPassword, displayName, setDisplayName, username, setUsername, authenticate, error, notice, booting }) {
  return <div className="landing"><header className="landing-nav"><div className="wordmark"><span className="logo-mark">U</span><span>utino</span></div><button className="nav-login" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'ساخت حساب' : 'ورود'}</button></header><section className="hero"><div className="hero-copy"><div className="eyebrow"><Zap size={14}/> پیام‌رسان پلتفرمی</div><h1>پیام‌رسانی ساده.<br/><em>برای همه‌جا.</em></h1><p>گفت‌وگو، گروه و کانال در یک تجربه سریع و تمیز، ساخته‌شده برای وب و دستگاه‌های مختلف.</p><div className="hero-actions"><button className="hero-primary" onClick={() => setAuthMode('signup')}>شروع کنید <ArrowLeft size={18}/></button><button className="hero-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>بیشتر بدانید</button></div></div><div className="auth-card"><div className="auth-logo"><span>U</span></div><h2>{authMode === 'login' ? 'خوش برگشتی' : 'به یوتینو خوش آمدی'}</h2><p>{authMode === 'login' ? 'برای ادامه وارد حساب شو.' : 'حساب خودت را در چند ثانیه بساز.'}</p><form onSubmit={authenticate}>{authMode === 'signup' && <><label>نام نمایشی<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required/></label><label>نام کاربری<input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="username" pattern="[A-Za-z0-9_]{3,20}" required/></label></>}<label>ایمیل<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required/></label><label>رمز عبور<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required/></label>{error && <div className="form-error">{error}</div>}{notice && <div className="form-success">{notice}</div>}<button className="primary-btn" disabled={booting}>{authMode === 'login' ? 'ورود' : 'ثبت‌نام'}</button></form><button className="switch-auth" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'حساب ندارم، ثبت‌نام می‌کنم' : 'قبلاً حساب ساخته‌ام'}</button></div></section><section className="feature-section" id="features"><div className="section-label">UTINO CHAT</div><h2>همه‌چیز سر جای خودش</h2><div className="feature-grid">{FEATURES.map(([title, text]) => <div className="feature-card" key={title}><div className="feature-number">{title[0]}</div><h3>{title}</h3><p>{text}</p></div>)}</div></section><footer className="landing-foot">utino · پیام‌رسان وب پلتفرمی</footer></div>;
}

function Splash() { return <div className="splash"><div className="splash-logo">U</div><b>utino</b><span>در حال آماده‌سازی…</span></div>; }
function Welcome() { return <div className="empty-chat"><div className="welcome-icon"><MessageCircle size={32}/></div><h2>utino</h2><p>یک گفت‌وگو را انتخاب کنید یا گفت‌وگوی جدید بسازید.</p></div>; }
function EmptyList({ icon, title, text }) { return <div className="list-empty"><div>{icon}</div><b>{title}</b><span>{text}</span></div>; }
function Avatar({ text }) { return <div className="avatar">{String(text || 'U').slice(0, 1).toUpperCase()}</div>; }
function ChatRow({ chat, selected, onClick }) { return <button className={`chat-row ${selected ? 'selected' : ''}`} onClick={onClick}><Avatar text={chat.avatar || chat.title}/><span className="chat-row-main"><span><b>{chat.title || 'بدون نام'}</b><time>{chat.time}</time></span><small>{chat.last}</small></span>{chat.unread > 0 && <i className="unread">{chat.unread}</i>}</button>; }
function MessageBubble({ message, own }) { return <div className={`message-line ${own ? 'own' : ''}`}><div className="bubble"><div>{message.content || (message.file_name ? `📎 ${message.file_name}` : 'پیام')}</div><small>{formatTime(message.created_at)} {own && <CheckCheck size={13}/>}</small></div></div>; }
function Modal({ title, onClose, children }) { return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal"><header><b>{title}</b><button className="icon-btn" onClick={onClose}><X size={19}/></button></header>{children}</section></div>; }
function formatTime(value) { if (!value) return ''; try { return new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } }

createRoot(document.getElementById('root')).render(<App />);
