import "./home-footer.css";

export default function IntroPage() {
  return (
    <main className="utino-home-footer-page">
      <footer className="utino-home-footer" aria-label="UTINO links">
        <div className="utino-footer-brand">
          <span className="utino-footer-mark" aria-hidden="true">U</span>
          <div>
            <strong>utino chat</strong>
            <span>پیام‌رسان وب</span>
          </div>
        </div>
        <nav className="utino-footer-links" aria-label="Brands">
          <a href="https://wdner.co" target="_blank" rel="noreferrer">ودنر <small>wdner.co</small></a>
          <a href="https://iparham.com" target="_blank" rel="noreferrer">پرهام سلیمانی <small>iparham.com</small></a>
          <a href="https://utino.org" target="_blank" rel="noreferrer">یوتینو <small>utino.org</small></a>
        </nav>
        <div className="utino-footer-meta">© 2026 utino chat</div>
      </footer>
    </main>
  );
}
