"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
        label: "Operations Center",
        href: "/operations",
      },
      {
        label: "Notifications",
        href: "/notifications",
      },
    ],
  },
  {
    label: "Property",
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
        label: "Reservations",
        href: "/reservations",
      },
      {
        label: "Booking Calendar",
        href: "/reservations/calendar",
      },
    ],
  },
  {
    label: "Service Operations",
    items: [
      {
        label: "Maintenance",
        href: "/maintenance",
      },
      {
        label: "Helpdesk",
        href: "/helpdesk",
      },
      {
        label: "Facilities & Assets",
        href: "/facilities",
      },
      {
        label: "Staff",
        href: "/staff",
      },
      {
        label: "Vehicles",
        href: "/vehicles",
      },
      {
        label: "Access Control",
        href: "/access",
      },
      {
        label: "Security",
        href: "/security",
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
    label: "Procurement",
    items: [
      {
        label: "Procurement Dashboard",
        href: "/procurement/dashboard",
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
        label: "Purchase Orders",
        href: "/procurement/purchase-orders",
      },
      {
        label: "Goods Receipts",
        href: "/procurement/goods-receipts",
      },
      {
        label: "Invoice Matching",
        href: "/procurement/invoice-matches",
      },
      {
        label: "Payment Requests",
        href: "/procurement/payment-requests",
      },
      {
        label: "Vendors",
        href: "/vendors",
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Inventory Dashboard",
        href: "/inventory",
      },
      {
        label: "Items",
        href: "/inventory/items",
      },
      {
        label: "Stores & Bins",
        href: "/inventory/stores",
      },
      {
        label: "Stock Balances",
        href: "/inventory/stock",
      },
      {
        label: "Stock Adjustments",
        href: "/inventory/adjustments",
      },
      {
        label: "Stock Reservations",
        href: "/inventory/reservations",
      },
      {
        label: "Stock Transfers",
        href: "/inventory/transfers",
      },
      {
        label: "Stock Ledger",
        href: "/inventory/ledger",
      },
      {
        label: "Categories",
        href: "/inventory/categories",
      },
      {
        label: "Brands",
        href: "/inventory/brands",
      },
      {
        label: "Units",
        href: "/inventory/units",
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        label: "Communications",
        href: "/communications",
      },
      {
        label: "Vehicle Gate",
        href: "/security/vehicles",
      },
    ],
  },
  {
    label: "Automation",
    items: [
      {
        label: "Workflows",
        href: "/workflows",
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
        label: "Plugin Marketplace",
        href: "/plugins/marketplace",
      },
      {
        label: "Themes",
        href: "/themes",
      },
      {
        label: "Documentation",
        href: "/docs",
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
  prefix: "/docs",
  title: "Documentation",
    },
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

  const isLongFormRoute =
    pathname === "/properties/new" ||
    /^\/properties\/[^/]+\/edit$/.test(
      pathname,
    );

  const [expandedGroups, setExpandedGroups] =
    useState<Record<string, boolean>>(
      () =>
        Object.fromEntries(
          navGroups.map((group) => [
            group.label,
            group.label === "Overview" ||
              group.items.some((item) =>
                isActiveRoute(
                  pathname,
                  item.href,
                ),
              ),
          ]),
        ),
    );

  useEffect(() => {
    const activeGroup =
      navGroups.find((group) =>
        group.items.some((item) =>
          isActiveRoute(
            pathname,
            item.href,
          ),
        ),
      );

    if (!activeGroup) {
      return;
    }

    setExpandedGroups(
      (current) => ({
        ...current,
        [activeGroup.label]: true,
      }),
    );
  }, [pathname]);

  function toggleGroup(
    label: string,
  ) {
    setExpandedGroups(
      (current) => ({
        ...current,
        [label]:
          !current[label],
      }),
    );
  }

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
            (group) => {
              const expanded =
                expandedGroups[
                  group.label
                ] ?? false;

              const groupId =
                `navigation-${group.label
                  .toLowerCase()
                  .replace(
                    /[^a-z0-9]+/g,
                    "-",
                  )}`;

              return (
                <section
                  className={
                    expanded
                      ? "nav-group expanded"
                      : "nav-group collapsed"
                  }
                  key={group.label}
                >
                  <button
                    aria-controls={groupId}
                    aria-expanded={expanded}
                    className="nav-group-toggle"
                    onClick={() =>
                      toggleGroup(
                        group.label,
                      )
                    }
                    type="button"
                  >
                    <span>
                      {group.label}
                    </span>

                    <span
                      aria-hidden="true"
                      className="nav-group-chevron"
                    >
                      {expanded
                        ? "−"
                        : "+"}
                    </span>
                  </button>

                  <div
                    className="nav-group-items"
                    hidden={!expanded}
                    id={groupId}
                  >
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
                </section>
              );
            },
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

      <main
        className={
          isLongFormRoute
            ? "admin-main admin-main-long-form"
            : "admin-main"
        }
      >
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
