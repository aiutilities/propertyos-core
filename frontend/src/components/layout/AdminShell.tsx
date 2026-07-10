"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getSessionUser } from "@/lib/session";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    label: "Property Operations",
    items: [
      { label: "Properties", href: "/properties" },
      { label: "Tenants", href: "/tenants" },
      { label: "Leases", href: "/leases" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Rent Ledgers", href: "/rent-ledgers" },
      { label: "Receipts", href: "/receipts" },
      { label: "Invoices", href: "/invoices" },
      { label: "Reports", href: "/reports" },
    ],
  },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getSectionTitle(pathname: string) {
  const sections = [
    { prefix: "/properties", title: "Properties" },
    { prefix: "/tenants", title: "Tenants" },
    { prefix: "/leases", title: "Leases" },
    { prefix: "/rent-ledgers", title: "Rent Ledgers" },
    { prefix: "/receipts", title: "Receipts" },
    { prefix: "/invoices", title: "Invoices" },
    { prefix: "/reports", title: "Reports" },
    { prefix: "/dashboard", title: "Dashboard" },
  ];

  return (
    sections.find((section) => pathname.startsWith(section.prefix))?.title ??
    "Admin Console"
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();
  const user = getSessionUser();
  const sectionTitle = getSectionTitle(pathname);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <strong>PropertyOS</strong>
          <span>Admin Console</span>
        </Link>

        <nav aria-label="Primary navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>

              <div className="nav-group-items">
                {group.items.map((item) => {
                  const active = isActiveRoute(pathname, item.href);

                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={active ? "nav-link active" : "nav-link"}
                      href={item.href}
                      key={item.href}
                    >
                      <span>{item.label}</span>
                      <span className="nav-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>Open Core Platform</span>
          <small>PropertyOS v1</small>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">PropertyOS Administration</p>
            <h1>{sectionTitle}</h1>
          </div>

          <div className="user-menu">
            <div className="user-identity">
              <strong>{user?.email ?? "Admin"}</strong>
              <span>Administrator</span>
            </div>

            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
