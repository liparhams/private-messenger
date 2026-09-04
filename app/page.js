import "./utino-home.css";

const features = [
  ["✦", "ساده و سریع", "گفت‌وگوها، فایل‌ها و پیام‌ها را بدون شلوغی در یک فضای روان مدیریت کن."],
  ["⌁", "همگام و همیشه در دسترس", "رابط وب برای ادامه‌دادن گفتگوها در هر دستگاه طراحی شده است."],
  ["◉", "خصوصی و امن", "ساختار پیام‌رسان برای حساب‌های شخصی و گفتگوهای خصوصی طراحی شده است."],
  ["↗", "قدرتمند و باز", "جست‌وجو، گروه‌ها، کانال‌ها، فایل و ابزارهای مدیریتی در یک تجربه یکپارچه."],
];

export default function HomePage() {
  return (
    <main className="utino-home" dir="rtl">
      <section className="utino-hero">
        <div className="utino-hero-copy">
          <div className="utino-logo" aria-label="utino chat">U</div>
          <p className="utino-kicker">پیام‌رسان وب utino</p>
          <h1>یک جای ساده برای<br /><span>حرف‌زدن، ساختن و ماندن.</span></h1>
          <p className="utino-lead">utino chat یک پیام‌رسان مدرن و خصوصی برای گفتگوهای روزمره، گروه‌ها، کانال‌ها و فایل‌هاست. سریع، تمیز و ساخته‌شده برای وب.</p>
          <div className="utino-actions">
            <a className="utino-primary" href="/messenger">باز کردن utino chat <span>←</span></a>
            <a className="utino-secondary" href="/login">ورود به حساب</a>
          </div>
        </div>
        <div className="utino-device" aria-label="پیش‌نمایش utino chat">
          <div className="utino-device-bar"><span></span><span></span><span></span><b>utino chat</b></div>
          <div className="utino-device-body">
            <aside><div className="mini-avatar">U</div><div className="mini-line long"></div><div className="mini-line"></div><div className="mini-line"></div><div className="mini-line short"></div></aside>
            <div className="mini-chat"><div className="mini-head"><i></i><div><strong>گفتگوی خصوصی</strong><small>آنلاین</small></div></div><div className="bubble bubble-a">سلام! 👋</div><div className="bubble bubble-b">خوش اومدی به utino chat</div><div className="bubble bubble-a">ساده، سریع و مرتب.</div><div className="mini-compose">پیام بنویس… <span>➤</span></div></div>
          </div>
        </div>
      </section>

      <section className="utino-features">
        <div className="utino-section-title"><span>چرا utino chat؟</span><h2>پیام‌رسانی، بدون اصطکاک.</h2></div>
        <div className="utino-feature-grid">{features.map(([icon, title, text]) => <article key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="utino-banner">
        <div><span className="utino-kicker">برای گفت‌وگوهای واقعی</span><h2>گفتگو را شروع کن.<br />بقیه‌اش را utino انجام می‌دهد.</h2></div>
        <a className="utino-primary" href="/register">ساخت حساب <span>←</span></a>
      </section>

      <footer className="utino-footer">
        <div className="footer-brand"><span className="footer-mark">U</span><div><strong>utino chat</strong><small>پیام‌رسان وب</small></div></div>
        <nav aria-label="پیوندهای برند"><a href="https://wdner.co" target="_blank" rel="noreferrer">ودنر <small>wdner.co</small></a><a href="https://iparham.com" target="_blank" rel="noreferrer">پرهام سلیمانی <small>iparham.com</small></a><a href="https://utino.org" target="_blank" rel="noreferrer">یوتینو <small>utino.org</small></a></nav>
        <span className="footer-copy">© 2026 utino chat</span>
      </footer>
    </main>
  );
}
