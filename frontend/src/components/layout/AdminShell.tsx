"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  clearSession,
  getSessionUser,
} from "@/lib/session";

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
      {
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        label: "Resident Portal",
        href: "/resident",
      },
      {
        label: "My Bookings",
        href: "/resident/reservations",
      },
      {
        label: "Community Notices",
        href: "/resident/notices",
      },
      {
        label: "My Helpdesk",
        href: "/resident/helpdesk",
      },
      {
        label: "My Maintenance",
        href: "/resident/maintenance",
      },
      {
        label: "My Vehicles",
        href: "/resident/vehicles",
      },
    ],
  },
  {
    label: "Property Operations",
    items: [
      {
        label: "Properties",
        href: "/properties",
      },
      {
        label: "Tenants",
        href: "/tenants",
      },
      {
        label: "Leases",
        href: "/leases",
      },
      {
        label: "Visitors",
        href: "/visitors",
      },
      {
        label: "Helpdesk",
        href: "/helpdesk",
      },
      {
        label: "Maintenance",
        href: "/maintenance",
      },
      {
        label: "Purchase Requests",
        href: "/procurement/requests",
      },
      {
        label: "RFQs",
        href: "/procurement/rfqs",
      },
      {
        label: "Quotations",
        href: "/procurement/quotations",
      },
      {
        label: "Comparison",
        href: "/procurement/comparison",
      },
      {
        label: "Vendors",
        href: "/vendors",
      },
      {
        label: "Vendor Contracts",
        href: "/vendors/contracts",
      },
      {
        label: "Vendor Work Orders",
        href: "/vendors/work-orders",
      },
      {
        label: "Vendor Categories",
        href: "/vendors/categories",
      },
      {
        label: "Facilities & Assets",
        href: "/facilities",
      },
      {
        label: "Vehicles",
        href: "/vehicles",
      },
      {
        label: "Reservations",
        href: "/reservations",
      },
      {
        label: "Booking Calendar",
        href: "/reservations/calendar",
      },
      {
        label: "Reservation Resources",
        href: "/reservations/resources",
      },
      {
        label: "Reservation Approvals",
        href: "/reservations/approvals",
      },
    ],
  },
  {
    label: "Community Operations",
    items: [
      {
        label: "Communications",
        href: "/communications",
      },
      {
        label: "Security Dashboard",
        href: "/security",
      },
      {
        label: "Vehicle Gate",
        href: "/security/vehicles",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Rent Ledgers",
        href: "/rent-ledgers",
      },
      {
        label: "Receipts",
        href: "/receipts",
      },
      {
        label: "Invoices",
        href: "/invoices",
      },
      {
        label: "Reports",
        href: "/reports",
      },
    ],
  },
  {
    label: "Automation",
    items: [
      {
        label: "Operations Center",
        href: "/operations",
      },
      {
        label: "Workflows",
        href: "/workflows",
      },
      {
        label: "Notifications",
        href: "/notifications",
      },
      {
        label: "Scheduler",
        href: "/scheduler",
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        label: "Plugins",
        href: "/plugins",
      },
      {
        label: "Install Plugin",
        href: "/plugins/install",
      },
      {
        label: "Plugin Marketplace",
        href: "/plugins/marketplace",
      },
      {
        label: "Themes",
        href: "/themes",
      },
      {
        label: "Theme Packages",
        href: "/themes/packages",
      },
      {
        label: "Register Theme",
        href: "/themes/packages/new",
      },
    ],
  },
];

function isActiveRoute(
  pathname: string,
  href: string,
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

function getSectionTitle(
  pathname: string,
) {
  const sections = [
    {
      prefix:
        "/resident/reservations",
      title: "My Bookings",
    },
    {
      prefix:
        "/resident/vehicles",
      title: "My Vehicles",
    },
    {
      prefix:
        "/resident/maintenance",
      title: "My Maintenance",
    },
    {
      prefix: "/resident",
      title: "Resident Portal",
    },
    {
      prefix:
        "/reservations/approvals",
      title:
        "Reservation Approvals",
    },
    {
      prefix:
        "/reservations/calendar",
      title:
        "Reservation Calendar",
    },
    {
      prefix:
        "/reservations/resources",
      title:
        "Reservation Resources",
    },
    {
      prefix: "/reservations",
      title:
        "Booking & Reservations",
    },
    {
      prefix: "/properties",
      title: "Properties",
    },
    {
      prefix: "/tenants",
      title: "Tenants",
    },
    {
      prefix: "/leases",
      title: "Leases",
    },
    {
      prefix: "/visitors",
      title: "Visitors",
    },
    {
      prefix: "/maintenance",
      title: "Maintenance",
    },
    {
      prefix: "/facilities",
      title:
        "Facilities & Assets",
    },
    {
      prefix: "/vehicles",
      title:
        "Vehicle Registry",
    },
    {
      prefix:
        "/security/vehicles",
      title: "Vehicle Gate",
    },
    {
      prefix: "/security",
      title:
        "Security Dashboard",
    },
    {
      prefix:
        "/rent-ledgers",
      title: "Rent Ledgers",
    },
    {
      prefix: "/receipts",
      title: "Receipts",
    },
    {
      prefix: "/invoices",
      title: "Invoices",
    },
    {
      prefix: "/reports",
      title: "Reports",
    },
    {
      prefix: "/operations",
      title:
        "Operations Center",
    },
    {
      prefix: "/workflows",
      title:
        "Workflow Center",
    },
    {
      prefix:
        "/notifications",
      title:
        "Notification Center",
    },
    {
      prefix: "/scheduler",
      title:
        "Scheduler Center",
    },
    {
      prefix: "/plugins",
      title: "Plugins",
    },
    {
      prefix: "/themes",
      title: "Themes",
    },
    {
      prefix: "/dashboard",
      title: "Dashboard",
    },
  ];

  return (
    sections.find(
      (section) =>
        pathname.startsWith(
          section.prefix,
        ),
    )?.title ??
    "Admin Console"
  );
}

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname =
    usePathname() ??
    "/dashboard";

  const router =
    useRouter();

  const user =
    getSessionUser();

  const sectionTitle =
    getSectionTitle(pathname);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link
          className="brand"
          href="/dashboard"
        >
          <strong>
            PropertyOS
          </strong>
          <span>
            Admin Console
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
        >
          {navGroups.map(
            (group) => (
              <div
                className="nav-group"
                key={group.label}
              >
                <p className="nav-group-label">
                  {group.label}
                </p>

                <div className="nav-group-items">
                  {group.items.map(
                    (item) => {
                      const active =
                        isActiveRoute(
                          pathname,
                          item.href,
                        );

                      return (
                        <Link
                          aria-current={
                            active
                              ? "page"
                              : undefined
                          }
                          className={
                            active
                              ? "nav-link active"
                              : "nav-link"
                          }
                          href={
                            item.href
                          }
                          key={
                            item.href
                          }
                        >
                          <span>
                            {
                              item.label
                            }
                          </span>

                          <span
                            aria-hidden="true"
                            className="nav-arrow"
                          >
                            →
                          </span>
                        </Link>
                      );
                    },
                  )}
                </div>
              </div>
            ),
          )}
        </nav>

        <div className="sidebar-footer">
          <span>
            Open Core Platform
          </span>
          <small>
            PropertyOS v1
          </small>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              PropertyOS
              Administration
            </p>
            <h1>
              {sectionTitle}
            </h1>
          </div>

          <div className="user-menu">
            <div className="user-identity">
              <strong>
                {user?.email ??
                  "Admin"}
              </strong>
              <span>
                Administrator
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
