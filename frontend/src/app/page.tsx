export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">PropertyOS Admin Portal</p>
        <h1>Backend v1.0.0 is ready. Frontend development starts here.</h1>
        <p className="summary">
          This admin portal will manage properties, tenants, agreements, rent,
          receipts, invoices, documents, workflows, plugins, and visitor operations.
        </p>
        <div className="actions">
          <a href="/login">Start with Login</a>
          <a href="http://localhost:3001/api/docs">Open API Docs</a>
        </div>
      </section>
    </main>
  );
}
