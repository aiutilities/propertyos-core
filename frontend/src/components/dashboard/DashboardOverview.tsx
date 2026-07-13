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

  const portfolioCards = [
    {
      title: "Properties",
      value: String(data.business.properties),
      href: "/properties",
    },
    {
      title: "Zones",
      value: String(data.business.zones),
      href: "/properties",
    },
    {
      title: "Total Spaces",
      value: String(data.business.spaces),
      href: "/properties",
    },
    {
      title: "Occupied Spaces",
      value: String(data.business.occupiedSpaces),
      href: "/tenants",
    },
    {
      title: "Vacant Spaces",
      value: String(data.business.vacantSpaces),
      href: "/properties",
    },
    {
      title: "Occupancy",
      value: `${data.business.occupancyPercentage.toFixed(2)}%`,
      href: "/properties",
    },
    {
      title: "Active Tenants",
      value: String(data.business.activeTenants),
      href: "/tenants",
    },
    {
      title: "Active Leases",
      value: String(data.business.activeLeases),
      href: "/leases",
    },
  ];

  const financeCards = [
    {
      title: "Expected Rent This Month",
      value: formatAmount(data.business.currentMonthExpectedRent),
      href: "/rent-ledgers",
    },
    {
      title: "Collected This Month",
      value: formatAmount(data.business.currentMonthCollectedRent),
      href: "/rent-ledgers",
    },
    {
      title: "Collection Rate",
      value: `${data.business.collectionPercentage.toFixed(2)}%`,
      href: "/reports/rent-collection",
    },
    {
      title: "Outstanding Rent",
      value: formatAmount(data.business.outstandingRent),
      href: "/reports/outstanding-rent",
    },
    {
      title: "Rent Ledgers",
      value: String(data.business.rentLedgers),
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
          {portfolioCards.map((card) => (
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
            <p className="eyebrow">Financial Overview</p>
            <h2>Rent and collections</h2>
          </div>
        </div>

        <div className="dashboard-grid">
          {financeCards.map((card) => (
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
