export default function Loading() {
  return (
    <main className="auth-page" dir="rtl" aria-busy="true" aria-live="polite">
      <section className="auth-card" style={{ textAlign: "center" }}>
        <div className="brand-mark" style={{ margin: "0 auto 18px" }}>U</div>
        <div className="auth-title" style={{ marginBottom: 0 }}>
          <span>UTINOCHATV1</span>
          <h1>در حال بارگذاری…</h1>
        </div>
      </section>
    </main>
  );
}
