"use client";

import Link from "next/link";
import StatCard from "./StatCard";
import { useDashboard } from "@/hooks/useDashboard";

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DashboardOverview() {
  const { data, loading, error } = useDashboard();

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!data) {
    return <p>Dashboard data is unavailable.</p>;
  }

  const cards = [
    {
      title: "Properties",
      value: String(data.business.properties),
      href: "/properties",
    },
    {
      title: "Tenants",
      value: String(data.business.tenants),
      href: "/tenants",
    },
    {
      title: "Active Leases",
      value: String(data.business.activeLeases),
      href: "/leases",
    },
    {
      title: "Rent Ledgers",
      value: String(data.business.rentLedgers),
      href: "/rent-ledgers",
    },
    {
      title: "Outstanding Rent",
      value: formatAmount(data.business.outstandingRent),
      href: "/rent-ledgers",
    },
    {
      title: "Receipts",
      value: String(data.business.receipts),
      href: "/receipts",
    },
    {
      title: "Invoices",
      value: String(data.business.invoices),
      href: "/invoices",
    },
    {
      title: "Overdue Invoices",
      value: String(data.business.overdueInvoices),
      href: "/invoices",
    },
  ];

  return (
    <>
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Business Overview</p>
            <h2>Property operations</h2>
          </div>
        </div>

        <div className="dashboard-grid">
          {cards.map((card) => (
            <Link
              className="dashboard-card-link"
              href={card.href}
              key={card.title}
            >
              <StatCard title={card.title} value={card.value} />
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Platform Health</p>
            <h2>Core services</h2>
          </div>
        </div>

        <div className="dashboard-grid">
          <StatCard
            title="Platform"
            value={`${data.platform.name} ${data.platform.version}`}
          />
          <StatCard title="Status" value={data.platform.status} />
          <StatCard
            title="Installed Plugins"
            value={String(data.plugins.installed)}
          />
          <StatCard
            title="Active Plugins"
            value={String(data.plugins.active)}
          />
          <StatCard
            title="Workflows"
            value={data.workflows.enabled ? "Enabled" : "Disabled"}
          />
          <StatCard
            title="Notifications"
            value={data.notifications.enabled ? "Enabled" : "Disabled"}
          />
        </div>
      </section>
    </>
  );
}
