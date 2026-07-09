"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getSessionUser } from "@/lib/session";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Properties", "/dashboard#properties"],
  ["People", "/dashboard#people"],
  ["Plugins", "/dashboard#plugins"],
  ["Workflows", "/dashboard#workflows"],
  ["Notifications", "/dashboard#notifications"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = getSessionUser();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>PropertyOS</strong>
          <span>Admin Console</span>
        </div>

        <nav>
          {navItems.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Open Core Platform</p>
            <h1>Admin Dashboard</h1>
          </div>

          <div className="user-menu">
            <span>{user?.email ?? "Admin"}</span>
            <button onClick={logout}>Logout</button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
