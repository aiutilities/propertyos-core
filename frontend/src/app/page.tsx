import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <section>
        <p className="eyebrow">PropertyOS</p>
        <h1>Open-source operating system for properties and shared spaces.</h1>
        <p>
          Manage properties, people, workflows, plugins and operations through an extensible admin platform.
        </p>
        <div className="actions">
          <Link href="/login">Open Admin Console</Link>
          <Link href="/dashboard">Go to Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
