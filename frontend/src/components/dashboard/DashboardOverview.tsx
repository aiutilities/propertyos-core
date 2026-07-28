"use client";

import Link from "next/link";

import { useDashboard } from "@/hooks/useDashboard";

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`;
}

type PriorityTone =
  | "critical"
  | "warning"
  | "information"
  | "success";

type PriorityItem = {
  title: string;
  detail: string;
  href: string;
  tone: PriorityTone;
};

const quickActions = [
  {
    label: "Add tenant",
    detail: "Create a tenant profile",
    href: "/tenants/new",
  },
  {
    label: "Record payment",
    detail: "Create a rent receipt",
    href: "/receipts/new",
  },
  {
    label: "Raise maintenance",
    detail: "Log an operational issue",
    href: "/maintenance/new",
  },
  {
    label: "Create property",
    detail: "Add a property to the portfolio",
    href: "/properties/new",
  },
  {
    label: "Purchase request",
    detail: "Begin the procurement workflow",
    href: "/procurement/requests/new",
  },
  {
    label: "Receive goods",
    detail: "Record an incoming delivery",
    href: "/procurement/goods-receipts/new",
  },
];

export default function DashboardOverview() {
  const {
    data,
    loading,
    error,
  } = useDashboard();

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading dashboard"
        className="command-centre-loading"
      >
        <div className="dashboard-skeleton dashboard-skeleton-hero" />

        <div className="dashboard-skeleton-grid">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              className="dashboard-skeleton"
              key={index}
            />
          ))}
        </div>

        <div className="dashboard-skeleton dashboard-skeleton-panel" />
      </div>
    );
  }

  if (error) {
    return (
      <section
        className="command-centre-error"
        role="alert"
      >
        <p className="eyebrow">
          Dashboard unavailable
        </p>

        <h1>
          We could not load your command centre
        </h1>

        <p>
          {error}
        </p>

        <button
          className="primary-button"
          onClick={() =>
            window.location.reload()
          }
          type="button"
        >
          Retry dashboard
        </button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="command-centre-empty">
        <p className="eyebrow">
          Dashboard unavailable
        </p>

        <h1>
          No operational summary is available
        </h1>

        <p>
          Create the first property to begin
          building the portfolio dashboard.
        </p>

        <Link
          className="primary-button"
          href="/properties/new"
        >
          Create first property
        </Link>
      </section>
    );
  }

  const priorities: PriorityItem[] = [];

  if (
    data.business.outstandingRent > 0
  ) {
    priorities.push({
      title: "Outstanding rent",
      detail:
        `${formatAmount(
          data.business.outstandingRent,
        )} requires collection follow-up.`,
      href: "/reports/outstanding-rent",
      tone: "critical",
    });
  }

  if (
    data.business.overdueInvoices > 0
  ) {
    priorities.push({
      title: "Overdue invoices",
      detail:
        `${data.business.overdueInvoices} invoice${
          data.business.overdueInvoices === 1
            ? ""
            : "s"
        } require attention.`,
      href: "/invoices",
      tone: "warning",
    });
  }

  if (
    data.business.vacantSpaces > 0
  ) {
    priorities.push({
      title: "Vacant spaces",
      detail:
        `${data.business.vacantSpaces} space${
          data.business.vacantSpaces === 1
            ? ""
            : "s"
        } are available across the portfolio.`,
      href: "/properties",
      tone: "information",
    });
  }

  if (
    data.business.collectionPercentage >=
      95 &&
    data.business.outstandingRent === 0
  ) {
    priorities.push({
      title: "Collections on track",
      detail:
        `${formatPercentage(
          data.business.collectionPercentage,
        )} of expected rent has been collected.`,
      href: "/reports/rent-collection",
      tone: "success",
    });
  }

  if (priorities.length === 0) {
    priorities.push({
      title: "No urgent financial exceptions",
      detail:
        "The current portfolio summary has no overdue rent or invoices.",
      href: "/reports",
      tone: "success",
    });
  }

  const portfolioMetrics = [
    {
      label: "Occupancy",
      value: formatPercentage(
        data.business.occupancyPercentage,
      ),
      detail:
        `${data.business.occupiedSpaces} of ${data.business.spaces} spaces occupied`,
      href: "/properties",
    },
    {
      label: "Active tenants",
      value: String(
        data.business.activeTenants,
      ),
      detail:
        `${data.business.activeLeases} active leases`,
      href: "/tenants",
    },
    {
      label: "Vacant spaces",
      value: String(
        data.business.vacantSpaces,
      ),
      detail:
        `${data.business.properties} properties in portfolio`,
      href: "/properties",
    },
    {
      label: "Collection rate",
      value: formatPercentage(
        data.business.collectionPercentage,
      ),
      detail:
        `${formatAmount(
          data.business.currentMonthCollectedRent,
        )} collected this month`,
      href: "/reports/rent-collection",
    },
  ];

  const financeMetrics = [
    {
      label: "Expected this month",
      value: formatAmount(
        data.business.currentMonthExpectedRent,
      ),
      href: "/rent-ledgers",
    },
    {
      label: "Collected this month",
      value: formatAmount(
        data.business.currentMonthCollectedRent,
      ),
      href: "/receipts",
    },
    {
      label: "Outstanding rent",
      value: formatAmount(
        data.business.outstandingRent,
      ),
      href: "/reports/outstanding-rent",
    },
    {
      label: "Overdue invoices",
      value: String(
        data.business.overdueInvoices,
      ),
      href: "/invoices",
    },
  ];

  return (
    <div className="command-centre">
      <header className="command-centre-hero">
        <div>
          <p className="eyebrow">
            Portfolio command centre
          </p>

          <h1>
            What needs attention today?
          </h1>

          <p className="command-centre-intro">
            Review collection exceptions,
            occupancy and the fastest next
            actions across PropertyOS.
          </p>
        </div>

        <div className="command-centre-context">
          <span>
            {data.business.properties}
          </span>

          <p>
            Properties managed
          </p>
        </div>
      </header>

      <section
        aria-labelledby="today-priorities"
        className="command-centre-section"
      >
        <div className="command-centre-section-heading">
          <div>
            <p className="eyebrow">
              Today
            </p>

            <h2 id="today-priorities">
              Priorities and exceptions
            </h2>
          </div>

          <Link
            className="text-link"
            href="/operations"
          >
            Open operations centre
          </Link>
        </div>

        <div className="priority-grid">
          {priorities.map(
            (priority) => (
              <Link
                className={
                  `priority-card priority-${priority.tone}`
                }
                href={priority.href}
                key={priority.title}
              >
                <span
                  aria-hidden="true"
                  className="priority-indicator"
                />

                <div>
                  <strong>
                    {priority.title}
                  </strong>

                  <p>
                    {priority.detail}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="command-card-arrow"
                >
                  →
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      <section
        aria-labelledby="quick-actions"
        className="command-centre-section"
      >
        <div className="command-centre-section-heading">
          <div>
            <p className="eyebrow">
              Start work
            </p>

            <h2 id="quick-actions">
              Quick actions
            </h2>
          </div>
        </div>

        <div className="quick-action-grid">
          {quickActions.map(
            (action) => (
              <Link
                className="quick-action-card"
                href={action.href}
                key={action.href}
              >
                <span
                  aria-hidden="true"
                  className="quick-action-plus"
                >
                  +
                </span>

                <span>
                  <strong>
                    {action.label}
                  </strong>

                  <small>
                    {action.detail}
                  </small>
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      <section
        aria-labelledby="portfolio-health"
        className="command-centre-section"
      >
        <div className="command-centre-section-heading">
          <div>
            <p className="eyebrow">
              Portfolio
            </p>

            <h2 id="portfolio-health">
              Operating health
            </h2>
          </div>
        </div>

        <div className="command-metric-grid">
          {portfolioMetrics.map(
            (metric) => (
              <Link
                className="command-metric-card"
                href={metric.href}
                key={metric.label}
              >
                <span>
                  {metric.label}
                </span>

                <strong>
                  {metric.value}
                </strong>

                <small>
                  {metric.detail}
                </small>
              </Link>
            ),
          )}
        </div>
      </section>

      <div className="command-centre-columns">
        <section
          aria-labelledby="financial-position"
          className="command-panel"
        >
          <div className="command-centre-section-heading">
            <div>
              <p className="eyebrow">
                Finance
              </p>

              <h2 id="financial-position">
                Monthly position
              </h2>
            </div>

            <Link
              className="text-link"
              href="/reports"
            >
              View reports
            </Link>
          </div>

          <div className="finance-command-list">
            {financeMetrics.map(
              (metric) => (
                <Link
                  href={metric.href}
                  key={metric.label}
                >
                  <span>
                    {metric.label}
                  </span>

                  <strong>
                    {metric.value}
                  </strong>
                </Link>
              ),
            )}
          </div>
        </section>

        <section
          aria-labelledby="platform-readiness"
          className="command-panel"
        >
          <div className="command-centre-section-heading">
            <div>
              <p className="eyebrow">
                Platform
              </p>

              <h2 id="platform-readiness">
                Service readiness
              </h2>
            </div>

            <Link
              className="text-link"
              href="/operations"
            >
              Inspect health
            </Link>
          </div>

          <dl className="platform-readiness-list">
            <div>
              <dt>
                Platform
              </dt>

              <dd>
                {data.platform.name}{" "}
                {data.platform.version}
              </dd>
            </div>

            <div>
              <dt>
                Runtime status
              </dt>

              <dd>
                {data.platform.status}
              </dd>
            </div>

            <div>
              <dt>
                Plugins
              </dt>

              <dd>
                {data.plugins.active} active
                of {data.plugins.installed}
              </dd>
            </div>

            <div>
              <dt>
                Workflows
              </dt>

              <dd>
                {data.workflows.enabled
                  ? "Enabled"
                  : "Disabled"}
              </dd>
            </div>

            <div>
              <dt>
                Notifications
              </dt>

              <dd>
                {data.notifications.enabled
                  ? "Enabled"
                  : "Disabled"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
