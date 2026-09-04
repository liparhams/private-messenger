import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, Bell, CheckCheck, ChevronDown, Hash, LogOut, Menu, MessageCircle,
  Moon, MoreVertical, Paperclip, Plus, Search, Send, Settings, Smile, Sun,
  Users, Video, Phone, X, Archive, Edit3, Zap
} from 'lucide-react';
import { supabase } from './lib/supabase.js';
import './styles.css';

const FEATURE_CARDS = [
  ['سریع', 'پیام‌ها با رابطی سبک و روان'],
  ['همگام', 'گفت‌وگوها روی دستگاه‌های شما'],
  ['قدرتمند', 'گروه، کانال و رسانه در یک فضا'],
  ['باز', 'ساخته‌شده با فناوری‌های متن‌باز']
];

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(new Date(value));
}

function initials(value) {
  const text = String(value || 'U').trim();
  return text.slice(0, 1).toUpperCase() || 'U';
}

function Avatar({ text, small = false, className = '' }) {
  return <div className={`avatar ${small ? 'avatar-small' : ''} ${className}`}>{initials(text)}</div>;
}

function Splash() {
  return <div className="splash"><div className="splash-logo">U</div><div className="loader"/><strong>utino</strong></div>;
}

function Landing({ onStart, onLogin }) {
  return <main className="landing">
    <nav className="landing-nav">
      <div className="brand"><span className="brand-logo">U</span><span>utino</span></div>
      <div className="landing-actions"><button className="nav-link" onClick={onLogin}>ورود</button><button className="nav-button" onClick={onStart}>شروع</button></div>
    </nav>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><Zap size={15}/> پیام‌رسان مدرن برای همه دستگاه‌ها</div>
        <h1>پیام‌رسانی،<br/><span>ساده و سریع.</span></h1>
        <p>utino یک پیام‌رسان ابری، سریع و چندسکویی است. گفت‌وگوهای شخصی، گروه‌ها و کانال‌ها را در یک تجربه تمیز و آشنا داشته باش.</p>
        <div className="hero-actions"><button className="primary-cta" onClick={onStart}>شروع کنید <ArrowLeft size={18}/></button><button className="secondary-cta" onClick={onLogin}>ورود به utino</button></div>
        <div className="hero-note"><span className="pulse-dot"/> ساخته‌شده برای وب، موبایل و دسکتاپ</div>
      </div>
      <div className="hero-visual">
        <div className="phone-glow"/>
        <div className="preview-window">
          <div className="preview-head"><Avatar text="U" small/><div><b>utino</b><small>آنلاین</small></div><MoreVertical size={18}/></div>
          <div className="preview-body">
            <div className="bubble incoming">سلام 👋<span>12:41</span></div>
            <div className="bubble outgoing">خوش اومدی به utino <span>12:42 ✓✓</span></div>
            <div className="bubble incoming">ساده، سریع و مرتب.</div>
            <div className="typing"><i/><i/><i/></div>
          </div>
          <div className="preview-composer"><Smile size={18}/><span>پیام...</span><Send size={18}/></div>
        </div>
      </div>
    </section>
    <section className="features">
      {FEATURE_CARDS.map(([title, text]) => <article key={title}><div className="feature-icon"><CheckCheck size={19}/></div><div><b>{title}</b><p>{text}</p></div></article>)}
    </section>
    <section className="platform-section"><div><span className="eyebrow">یک حساب، همه‌جا</span><h2>همه‌چیز همان‌جایی است که رهایش کردی.</h2><p>رابط واکنش‌گرا، حالت تاریک، جست‌وجو، گروه‌ها و کانال‌ها، پیام‌رسانی زنده و تجربه‌ای طراحی‌شده برای صفحه‌های کوچک و بزرگ.</p></div><div className="platform-grid"><span>Web</span><span>Desktop</span><span>Mobile</span><span>PWA</span></div></section>
    <footer className="landing-footer"><span>© utino</span><span>سریع · ساده · همگام</span></footer>
  </main>;
}

function Auth({ mode, setMode, email, setEmail, password, setPassword, displayName, setDisplayName, username, setUsername, onSubmit, error, notice, busy }) {
  return <main className="auth-page">
    <div className="auth-brand"><span className="brand-logo">U</span><span>utino</span></div>
    <section className="auth-card">
      <div className="auth-mark">{mode === 'login' ? '↗' : '+'}</div>
      <h1>{mode === 'login' ? 'خوش برگشتی' : 'ساخت حساب'}</h1>
      <p>{mode === 'login' ? 'برای ادامه وارد حساب utino شو.' : 'چند ثانیه تا ورود به utino فاصله داری.'}</p>
      <form onSubmit={onSubmit}>
        {mode === 'signup' && <>
          <label>نام نمایشی<input required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="نام شما" autoComplete="name"/></label>
          <label>نام کاربری<input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" autoComplete="username"/></label>
        </>}
        <label>ایمیل<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
        <label>رمز عبور<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/></label>
        {error && <div className="form-error">{error}</div>}
        {notice && <div className="form-notice">{notice}</div>}
        <button className="auth-submit" disabled={busy}>{busy ? <span className="button-loader"/> : mode === 'login' ? 'ورود' : 'ثبت‌نام'}</button>
      </form>
      <button className="switch-auth" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'حساب نداری؟ ثبت‌نام کن' : 'قبلاً حساب ساخته‌ای؟ وارد شو'}</button>
    </section>
    <button className="back-home" onClick={() => history.pushState({}, '', '/')}><ArrowLeft size={16}/> صفحه اصلی</button>
  </main>;
}

function EmptyList({ icon, title, text }) {
  return <div className="empty-list"><div className="empty-icon">{icon}</div><b>{title}</b><p>{text}</p></div>;
}

function ChatRow({ chat, selected, onClick }) {
  return <button className={`chat-row ${selected ? 'selected' : ''}`} onClick={onClick}>
    <Avatar text={chat.avatar || chat.title}/><span className="chat-row-main"><b>{chat.title || 'گفت‌وگو'}</b><small>{chat.last || 'پیام جدید'}</small></span><span className="chat-row-meta"><small>{chat.time}</small>{chat.unread > 0 && <em>{chat.unread}</em>}</span>
  </button>;
}

function Messenger({ session, profile, setProfile, dark, setDark, onLogout }) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('chats');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState('group');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [people, setPeople] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadChats = async () => {
    const { data: members, error: memberError } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', session.user.id).is('left_at', null);
    if (memberError) { setError(memberError.message); return []; }
    const ids = [...new Set((members || []).map(x => x.conversation_id))];
    if (!ids.length) { setChats([]); setSelected(null); return []; }
    const { data, error: chatError } = await supabase.from('conversations').select('*').in('id', ids).order('created_at', { ascending: false });
    if (chatError) { setError(chatError.message); return []; }
    const list = (data || []).map(c => ({ ...c, avatar: c.is_channel ? '#' : c.type === 'group' ? 'G' : c.title, last: c.description || (c.is_channel ? 'کانال' : c.type === 'group' ? 'گروه' : 'گفت‌وگوی خصوصی'), time: formatTime(c.created_at), unread: 0 }));
    setChats(list);
    setSelected(current => current && list.some(c => c.id === current.id) ? list.find(c => c.id === current.id) : list[0] || null);
    return list;
  };

  const loadMessages = async (id) => {
    setLoading(true); setError('');
    const { data, error: readError } = await supabase.from('messages').select('*').eq('conversation_id', id).is('deleted_at', null).order('created_at', { ascending: true }).limit(300);
    if (readError) setError(readError.message); else setMessages(data || []);
    setLoading(false);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  useEffect(() => { loadChats(); }, [session.user.id]);
  useEffect(() => { if (selected?.id) loadMessages(selected.id); else setMessages([]); }, [selected?.id]);

  useEffect(() => {
    const channel = supabase.channel(`utino-messages-${session.user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      const row = payload.new;
      if (!row?.id) return;
      if (row.conversation_id === selected?.id) {
        setMessages(old => old.some(m => m.id === row.id) ? old : [...old, row]);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      }
      setChats(old => old.map(c => c.id === row.conversation_id ? { ...c, last: row.content || 'رسانه', time: formatTime(row.created_at) } : c));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session.user.id, selected?.id]);

  useEffect(() => {
    if (!query.trim()) { setPeople([]); setCommunities([]); return; }
    const timer = setTimeout(async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.rpc('search_user_directory', { search_text: query.trim(), result_limit: 20 }),
        supabase.rpc('search_public_channels', { search_text: query.trim() })
      ]);
      setPeople(p || []); setCommunities(c || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(t);
  }, [notice]);

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? chats.filter(c => `${c.title || ''} ${c.description || ''}`.toLowerCase().includes(q)) : chats;
  }, [chats, query]);

  async function sendMessage(e) {
    e?.preventDefault();
    const content = text.trim();
    if (!content || !selected || busy) return;
    setBusy(true); setError(''); setText('');
    const { data, error: sendError } = await supabase.from('messages').insert({ sender_id: session.user.id, conversation_id: selected.id, content, message_type: 'text' }).select().single();
    if (sendError) { setError(sendError.message); setText(content); } else if (data) setMessages(old => old.some(m => m.id === data.id) ? old : [...old, data]);
    setBusy(false);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }

  async function openPerson(person) {
    setError('');
    const { data, error: rpcError } = await supabase.rpc('get_or_create_direct_conversation', { other_user_id: person.id });
    if (rpcError) { setError(rpcError.message); return; }
    const id = Array.isArray(data) ? data[0] : data;
    const list = await loadChats();
    const next = list.find(c => c.id === id);
    if (next) setSelected(next);
    setTab('chats'); setQuery(''); setMobileOpen(true);
  }

  async function createConversation(e) {
    e.preventDefault();
    if (!createTitle.trim()) return;
    setError('');
    const { data, error: createError } = await supabase.rpc('create_conversation', {
      p_kind: createKind,
      p_title: createTitle.trim(),
      p_description: createDescription.trim(),
      p_is_public: createKind === 'channel',
      p_username: createKind === 'channel' ? createUsername.trim() || null : null,
      p_member_ids: []
    });
    if (createError) { setError(createError.message); return; }
    const createdId = Array.isArray(data) ? data[0] : data;
    const list = await loadChats();
    const created = list.find(c => c.id === createdId);
    if (created) { setSelected(created); setMobileOpen(true); }
    setCreateOpen(false); setCreateTitle(''); setCreateDescription(''); setCreateUsername(''); setNotice(createKind === 'channel' ? 'کانال ساخته شد.' : 'گروه ساخته شد.');
  }

  async function joinCommunity(id) {
    const { error: joinError } = await supabase.rpc('join_conversation', { p_conversation_id: id });
    if (joinError) setError(joinError.message); else { const list = await loadChats(); const joined = list.find(c => c.id === id); if (joined) { setSelected(joined); setMobileOpen(true); } setTab('chats'); setQuery(''); setNotice('به کانال پیوستی.'); }
  }

  return <div className={`messenger-shell ${mobileOpen ? 'mobile-open' : ''}`}>
    <aside className="chat-sidebar">
      <header className="chat-sidebar-head">
        <button className="round-icon" onClick={() => setMenuOpen(v => !v)} aria-label="منو"><Menu size={20}/></button>
        <div className="brand compact"><span className="brand-logo">U</span><span>utino</span></div>
        <button className="round-icon" onClick={() => setDark(v => !v)} aria-label="تم">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
      </header>
      {menuOpen && <div className="menu-card">
        <button onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}><Settings size={17}/> تنظیمات</button>
        <button onClick={() => { setTab('contacts'); setMenuOpen(false); }}><Users size={17}/> مخاطبین</button>
        <button onClick={() => { setTab('communities'); setMenuOpen(false); }}><Hash size={17}/> کانال‌ها</button>
        <button onClick={onLogout}><LogOut size={17}/> خروج</button>
      </div>}
      <div className="search-field"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجو"/></div>
      <div className="tabs"><button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>همه</button><button className={tab === 'contacts' ? 'active' : ''} onClick={() => setTab('contacts')}>مخاطبین</button><button className={tab === 'communities' ? 'active' : ''} onClick={() => setTab('communities')}>کانال‌ها</button></div>
      <div className="rows">
        {tab === 'chats' && (filteredChats.length ? filteredChats.map(c => <ChatRow key={c.id} chat={c} selected={selected?.id === c.id} onClick={() => { setSelected(c); setMobileOpen(true); }}/>) : <EmptyList icon={<MessageCircle size={22}/>} title="هنوز گفت‌وگویی نیست" text="یک کاربر را جست‌وجو کن و گفتگو را شروع کن."/>)}
        {tab === 'contacts' && (people.length ? people.map(p => <button className="result-row" key={p.id} onClick={() => openPerson(p)}><Avatar text={p.display_name || p.username}/><span><b>{p.display_name || p.username}</b><small>@{p.username}</small></span></button>) : <EmptyList icon={<Users size={22}/>} title="مخاطبین" text="برای پیدا کردن افراد، نام یا نام کاربری را جست‌وجو کن."/>)}
        {tab === 'communities' && (communities.length ? communities.map(c => <button className="result-row" key={c.id} onClick={() => joinCommunity(c.id)}><Avatar text="#"/><span><b>{c.title}</b><small>@{c.channel_username || 'community'} · {c.member_count || 0} عضو</small></span></button>) : <EmptyList icon={<Hash size={22}/>} title="کانال‌ها" text="نام کانال را در جست‌وجو بنویس."/>)}
      </div>
      <button className="new-chat-btn" onClick={() => setCreateOpen(true)}><Plus size={19}/> گفت‌وگوی جدید</button>
      <div className="mini-profile"><Avatar text={profile?.display_name || profile?.username}/><span><b>{profile?.display_name || profile?.username || 'کاربر'}</b><small>@{profile?.username || 'user'}</small></span><button className="round-icon" onClick={() => setSettingsOpen(true)}><Settings size={17}/></button></div>
    </aside>

    <section className="chat-pane">
      {!selected ? <div className="welcome-pane"><div className="welcome-art"><MessageCircle size={38}/></div><h2>utino</h2><p>یک گفت‌وگو را از فهرست انتخاب کن یا با جست‌وجو شروع کن.</p></div> : <>
        <header className="chat-head">
          <button className="mobile-back" onClick={() => setMobileOpen(false)}><ArrowLeft size={21}/></button>
          <Avatar text={selected.avatar || selected.title}/><div className="chat-head-info"><b>{selected.title || 'گفت‌وگو'}</b><small>{selected.is_channel ? 'کانال' : selected.type === 'group' ? 'گروه' : 'آنلاین'}</small></div>
          <div className="chat-head-actions"><button className="round-icon"><Search size={19}/></button><button className="round-icon"><Phone size={19}/></button><button className="round-icon"><Video size={19}/></button><button className="round-icon"><MoreVertical size={19}/></button></div>
        </header>
        <div className="message-wall">
          {loading ? <div className="messages-loading"><span className="loader"/></div> : messages.length ? messages.map((m, index) => <React.Fragment key={m.id}><div className="date-divider">{index === 0 || formatDate(messages[index - 1]?.created_at) !== formatDate(m.created_at) ? formatDate(m.created_at) : ''}</div><div className={`message-line ${m.sender_id === session.user.id ? 'mine' : ''}`}><div className="message-bubble"><div>{m.content || 'رسانه'}</div><span>{formatTime(m.created_at)} {m.sender_id === session.user.id && <CheckCheck size={14}/>}</span></div></div></React.Fragment>) : <div className="empty-conversation"><div className="empty-icon"><MessageCircle size={25}/></div><b>شروع گفتگو</b><p>اولین پیام را بفرست.</p></div>}
          <div ref={bottomRef}/>
        </div>
        <form className="composer" onSubmit={sendMessage}><button type="button" className="round-icon"><Paperclip size={20}/></button><input value={text} onChange={e => setText(e.target.value)} placeholder="پیام..."/><button type="button" className="round-icon"><Smile size={20}/></button><button className="send-btn" disabled={busy || !text.trim()}><Send size={19}/></button></form>
      </>}
    </section>

    {notice && <div className="toast"><CheckCheck size={17}/>{notice}</div>}
    {error && <button className="error-toast" onClick={() => setError('')}><X size={15}/>{error}</button>}

    {createOpen && <Modal title="ساخت گفت‌وگوی جدید" onClose={() => setCreateOpen(false)}><form className="modal-form" onSubmit={createConversation}><div className="segmented"><button type="button" className={createKind === 'group' ? 'active' : ''} onClick={() => setCreateKind('group')}><Users size={17}/> گروه</button><button type="button" className={createKind === 'channel' ? 'active' : ''} onClick={() => setCreateKind('channel')}><Hash size={17}/> کانال</button></div><label>نام<input required value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder={createKind === 'channel' ? 'نام کانال' : 'نام گروه'}/></label><label>توضیح<input value={createDescription} onChange={e => setCreateDescription(e.target.value)} placeholder="اختیاری"/></label>{createKind === 'channel' && <label>نام کاربری کانال<input value={createUsername} onChange={e => setCreateUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="channel_name"/></label>}<button className="modal-primary">ساختن</button></form></Modal>}
    {settingsOpen && <Modal title="تنظیمات" onClose={() => setSettingsOpen(false)}><div className="settings-list"><div className="settings-user"><Avatar text={profile?.display_name || profile?.username}/><div><b>{profile?.display_name || profile?.username}</b><small>@{profile?.username || 'user'}</small></div></div><button onClick={() => setDark(v => !v)}><span>{dark ? <Sun size={18}/> : <Moon size={18}/>} حالت {dark ? 'روشن' : 'تاریک'}</span><ChevronDown size={16}/></button><button onClick={onLogout}><span><LogOut size={18}/> خروج از حساب</span></button></div></Modal>}
  </div>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal"><header><b>{title}</b><button className="round-icon" onClick={onClose}><X size={18}/></button></header>{children}</section></div>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('utino-theme') === 'dark');

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('utino-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSession(data.session); setBooting(false); } }).catch(e => { if (mounted) { setError(e.message); setBooting(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setBooting(false); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.rpc('get_my_profile').then(({ data, error: profileError }) => { if (profileError) setError(profileError.message); else setProfile(Array.isArray(data) ? data[0] : data); });
  }, [session?.user?.id]);

  async function authenticate(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (authMode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        history.pushState({}, '', '/messenger/'); setPath('/messenger/');
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName.trim(), username: username.trim() } } });
        if (authError) throw authError;
        if (data.session) { await supabase.rpc('update_my_profile', { new_display_name: displayName.trim(), new_bio: '' }); history.pushState({}, '', '/messenger/'); setPath('/messenger/'); }
        else setNotice('ثبت‌نام انجام شد. در صورت فعال بودن تأیید ایمیل، ایمیل خود را بررسی کن.');
      }
    } catch (e2) { setError(e2.message || 'عملیات ناموفق بود'); }
    finally { setBusy(false); }
  }

  async function logout() { await supabase.auth.signOut(); history.pushState({}, '', '/'); setPath('/'); }
  const start = () => { setAuthMode('signup'); history.pushState({}, '', '/login'); setPath('/login'); };
  const login = () => { setAuthMode('login'); history.pushState({}, '', '/login'); setPath('/login'); };

  if (booting) return <Splash/>;
  if (session) return <Messenger session={session} profile={profile} setProfile={setProfile} dark={dark} setDark={setDark} onLogout={logout}/>;
  if (path.startsWith('/login')) return <Auth {...{ mode: authMode, setMode: setAuthMode, email, setEmail, password, setPassword, displayName, setDisplayName, username, setUsername, onSubmit: authenticate, error, notice, busy }}/>;
  return <Landing onStart={start} onLogin={login}/>;
}

createRoot(document.getElementById('root')).render(<App/>);
