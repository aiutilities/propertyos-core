"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useProcurementDashboard,
} from "@/hooks/useProcurementDashboard";

import type {
  MonthlySpendSummary,
  ProcurementActivity,
  ProcurementDashboardData,
  VendorSpendSummary,
} from "@/types/procurementDashboard";

const EMPTY_DATA: ProcurementDashboardData = {
  purchaseRequests: [],
  rfqs: [],
  quotations: [],
  purchaseOrders: [],
  goodsReceipts: [],
  invoiceMatches: [],
  paymentRequests: [],
};

const ACTIVE_PAYMENT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
];

const ACTIVE_PO_STATUSES = [
  "APPROVED",
  "ISSUED",
  "ACKNOWLEDGED",
  "PARTIALLY_RECEIVED",
];

function amount(
  value: number | undefined,
) {
  return Number(
    value || 0,
  );
}

function timestamp(
  value: string | undefined,
) {
  if (!value) {
    return 0;
  }

  return new Date(value).getTime();
}

function formatMoney(
  value: number,
  currency = "INR",
) {
  return `${currency} ${value.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    },
  )}`;
}

function monthKey(
  value: string,
) {
  const date = new Date(value);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

export function ProcurementExecutiveDashboard() {
  const {
    loading,
    error,
    loadDashboard,
  } = useProcurementDashboard();

  const [
    data,
    setData,
  ] =
    useState<ProcurementDashboardData>(
      EMPTY_DATA,
    );

  const load = useCallback(
    async () => {
      setData(
        await loadDashboard(),
      );
    },
    [
      loadDashboard,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  const now = new Date();

  const startOfMonth =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

  const startOfYear =
    new Date(
      now.getFullYear(),
      0,
      1,
    );

  const openRfqs =
    data.rfqs.filter(
      (rfq) =>
        [
          "ISSUED",
          "OPEN",
        ].includes(
          rfq.status,
        ),
    );

  const awaitingQuotationRfqs =
    openRfqs.filter(
      (rfq) =>
        !data.quotations.some(
          (quotation) =>
            quotation.status !==
              "DRAFT" &&
            quotation.id &&
            quotation.createdAt &&
            timestamp(
              quotation.createdAt,
            ) >=
              timestamp(
                rfq.createdAt,
              ),
        ),
    );

  const pendingPurchaseOrders =
    data.purchaseOrders.filter(
      (order) =>
        order.status ===
        "PENDING_APPROVAL",
    );

  const goodsPendingReceipt =
    data.purchaseOrders.filter(
      (order) =>
        ACTIVE_PO_STATUSES.includes(
          order.status,
        ),
    );

  const pendingInvoiceMatches =
    data.invoiceMatches.filter(
      (match) =>
        [
          "PENDING",
          "MATCHED",
        ].includes(
          match.status,
        ),
    );

  const pendingPayments =
    data.paymentRequests.filter(
      (request) =>
        [
          "SUBMITTED",
          "APPROVED",
        ].includes(
          request.status,
        ),
    );

  const overduePayments =
    data.paymentRequests.filter(
      (request) =>
        ACTIVE_PAYMENT_STATUSES.includes(
          request.status,
        ) &&
        request.dueDate &&
        new Date(
          request.dueDate,
        ).getTime() <
          now.getTime(),
    );

  const paidThisMonth =
    data.paymentRequests
      .filter(
        (request) =>
          request.status ===
            "PAID" &&
          timestamp(
            request.updatedAt ||
            request.createdAt,
          ) >=
            startOfMonth.getTime(),
      )
      .reduce(
        (
          total,
          request,
        ) =>
          total +
          amount(
            request.paidAmount,
          ),
        0,
      );

  const paidThisYear =
    data.paymentRequests
      .filter(
        (request) =>
          request.status ===
            "PAID" &&
          timestamp(
            request.updatedAt ||
            request.createdAt,
          ) >=
            startOfYear.getTime(),
      )
      .reduce(
        (
          total,
          request,
        ) =>
          total +
          amount(
            request.paidAmount,
          ),
        0,
      );

  const committedSpend =
    data.purchaseOrders
      .filter(
        (order) =>
          order.status !==
          "CANCELLED",
      )
      .reduce(
        (
          total,
          order,
        ) =>
          total +
          amount(
            order.totalAmount,
          ),
        0,
      );

  const vendorSpend =
    useMemo<
      VendorSpendSummary[]
    >(
      () => {
        const grouped =
          new Map<
            string,
            {
              totalSpend: number;
              orderCount: number;
            }
          >();

        data.purchaseOrders
          .filter(
            (order) =>
              order.status !==
              "CANCELLED",
          )
          .forEach(
            (order) => {
              const current =
                grouped.get(
                  order.vendorId,
                ) || {
                  totalSpend: 0,
                  orderCount: 0,
                };

              current.totalSpend +=
                amount(
                  order.totalAmount,
                );

              current.orderCount += 1;

              grouped.set(
                order.vendorId,
                current,
              );
            },
          );

        return Array.from(
          grouped.entries(),
        )
          .map(
            (
              [
                vendorId,
                summary,
              ],
            ) => ({
              vendorId,
              totalSpend:
                summary.totalSpend,
              orderCount:
                summary.orderCount,
              averageOrderValue:
                summary.orderCount
                  ? summary.totalSpend /
                    summary.orderCount
                  : 0,
            }),
          )
          .sort(
            (
              first,
              second,
            ) =>
              second.totalSpend -
              first.totalSpend,
          )
          .slice(
            0,
            8,
          );
      },
      [
        data.purchaseOrders,
      ],
    );

  const monthlySpend =
    useMemo<
      MonthlySpendSummary[]
    >(
      () => {
        const months =
          new Map<
            string,
            number
          >();

        data.paymentRequests
          .filter(
            (request) =>
              request.status ===
              "PAID",
          )
          .forEach(
            (request) => {
              const key =
                monthKey(
                  request.updatedAt ||
                  request.createdAt,
                );

              months.set(
                key,
                (
                  months.get(
                    key,
                  ) || 0
                ) +
                  amount(
                    request.paidAmount,
                  ),
              );
            },
          );

        return Array.from(
          months.entries(),
        )
          .sort(
            (
              first,
              second,
            ) =>
              first[0].localeCompare(
                second[0],
              ),
          )
          .slice(
            -12,
          )
          .map(
            (
              [
                month,
                spend,
              ],
            ) => ({
              month,
              amount: spend,
            }),
          );
      },
      [
        data.paymentRequests,
      ],
    );

  const maximumMonthlySpend =
    Math.max(
      ...monthlySpend.map(
        (entry) =>
          entry.amount,
      ),
      1,
    );

  const poStatusCounts =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();

        data.purchaseOrders.forEach(
          (order) => {
            counts.set(
              order.status,
              (
                counts.get(
                  order.status,
                ) || 0
              ) + 1,
            );
          },
        );

        return Array.from(
          counts.entries(),
        ).sort(
          (
            first,
            second,
          ) =>
            second[1] -
            first[1],
        );
      },
      [
        data.purchaseOrders,
      ],
    );

  const activities =
    useMemo<
      ProcurementActivity[]
    >(
      () => {
        const rows:
          ProcurementActivity[] = [
          ...data.purchaseOrders.map(
            (order) => ({
              id: `po-${order.id}`,
              type: "Purchase Order",
              title:
                order.purchaseOrderNumber,
              description:
                `${order.title} — ${order.status}`,
              occurredAt:
                order.updatedAt ||
                order.createdAt,
              href:
                `/procurement/purchase-orders/${order.id}`,
            }),
          ),
          ...data.goodsReceipts.map(
            (receipt) => ({
              id: `grn-${receipt.id}`,
              type: "Goods Receipt",
              title:
                receipt.goodsReceiptNumber,
              description:
                `Vendor ${receipt.vendorId} — ${receipt.status}`,
              occurredAt:
                receipt.updatedAt ||
                receipt.createdAt,
              href:
                `/procurement/goods-receipts/${receipt.id}`,
            }),
          ),
          ...data.invoiceMatches.map(
            (match) => ({
              id: `im-${match.id}`,
              type: "Invoice Match",
              title:
                match.invoiceMatchNumber,
              description:
                `${match.currency} ${amount(
                  match.invoiceAmount,
                ).toLocaleString()} — ${match.status}`,
              occurredAt:
                match.updatedAt ||
                match.createdAt,
              href:
                `/procurement/invoice-matches/${match.id}`,
            }),
          ),
          ...data.paymentRequests.map(
            (request) => ({
              id: `pay-${request.id}`,
              type: "Payment Request",
              title:
                request.paymentRequestNumber,
              description:
                `${request.currency} ${amount(
                  request.paidAmount ??
                  request.approvedAmount ??
                  request.requestedAmount,
                ).toLocaleString()} — ${request.status}`,
              occurredAt:
                request.updatedAt ||
                request.createdAt,
              href:
                `/procurement/payment-requests/${request.id}`,
            }),
          ),
        ];

        return rows
          .sort(
            (
              first,
              second,
            ) =>
              timestamp(
                second.occurredAt,
              ) -
              timestamp(
                first.occurredAt,
              ),
          )
          .slice(
            0,
            12,
          );
      },
      [
        data.goodsReceipts,
        data.invoiceMatches,
        data.paymentRequests,
        data.purchaseOrders,
      ],
    );

  const approvalQueue = [
    {
      label:
        "Purchase Requests",
      count:
        data.purchaseRequests.filter(
          (request) =>
            request.status ===
            "SUBMITTED",
        ).length,
      href:
        "/procurement/requests?status=SUBMITTED",
    },
    {
      label:
        "Purchase Orders",
      count:
        pendingPurchaseOrders.length,
      href:
        "/procurement/purchase-orders?status=PENDING_APPROVAL",
    },
    {
      label:
        "Payment Requests",
      count:
        data.paymentRequests.filter(
          (request) =>
            request.status ===
            "SUBMITTED",
        ).length,
      href:
        "/procurement/payment-requests?status=SUBMITTED",
    },
  ];

  const totalFunnel = [
    {
      label:
        "Purchase Requests",
      value:
        data.purchaseRequests.length,
    },
    {
      label:
        "RFQs",
      value:
        data.rfqs.length,
    },
    {
      label:
        "Quotations",
      value:
        data.quotations.length,
    },
    {
      label:
        "Purchase Orders",
      value:
        data.purchaseOrders.length,
    },
    {
      label:
        "Goods Receipts",
      value:
        data.goodsReceipts.length,
    },
    {
      label:
        "Invoice Matches",
      value:
        data.invoiceMatches.length,
    },
    {
      label:
        "Payments",
      value:
        data.paymentRequests.filter(
          (request) =>
            request.status ===
            "PAID",
        ).length,
    },
  ];

  const maximumFunnel =
    Math.max(
      ...totalFunnel.map(
        (row) =>
          row.value,
      ),
      1,
    );

  if (loading && !data.purchaseRequests.length) {
    return (
      <div className="panel">
        Loading Procurement dashboard…
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement
          </p>

          <h1>
            Executive Dashboard
          </h1>

          <p className="muted">
            End-to-end visibility from
            Purchase Request through
            vendor payment.
          </p>
        </div>

        <button
          className="button button-secondary"
          disabled={loading}
          onClick={() =>
            void load()
          }
        >
          {loading
            ? "Refreshing…"
            : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <section className="panel stack">
        <h2>
          Quick actions
        </h2>

        <div className="button-row">
          <Link
            className="button"
            href="/procurement/requests/new"
          >
            New Purchase Request
          </Link>

          <Link
            className="button button-secondary"
            href="/procurement/rfqs/new"
          >
            New RFQ
          </Link>

          <Link
            className="button button-secondary"
            href="/procurement/quotations/new"
          >
            New Quotation
          </Link>

          <Link
            className="button button-secondary"
            href="/procurement/purchase-orders/new"
          >
            New Purchase Order
          </Link>

          <Link
            className="button button-secondary"
            href="/procurement/goods-receipts/new"
          >
            New Goods Receipt
          </Link>

          <Link
            className="button button-secondary"
            href="/procurement/invoice-matches/new"
          >
            New Invoice Match
          </Link>

          <Link
            className="button button-secondary"
            href="/procurement/payment-requests/new"
          >
            New Payment Request
          </Link>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Purchase Requests
          </span>

          <strong>
            {
              data.purchaseRequests.length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Open RFQs
          </span>

          <strong>
            {openRfqs.length}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Awaiting quotations
          </span>

          <strong>
            {
              awaitingQuotationRfqs.length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            POs pending approval
          </span>

          <strong>
            {
              pendingPurchaseOrders.length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Goods pending receipt
          </span>

          <strong>
            {
              goodsPendingReceipt.length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Pending Invoice Matches
          </span>

          <strong>
            {
              pendingInvoiceMatches.length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Payments awaiting action
          </span>

          <strong>
            {pendingPayments.length}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Overdue payments
          </span>

          <strong>
            {
              overduePayments.length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Paid this month
          </span>

          <strong>
            {formatMoney(
              paidThisMonth,
            )}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Paid this year
          </span>

          <strong>
            {formatMoney(
              paidThisYear,
            )}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Committed PO spend
          </span>

          <strong>
            {formatMoney(
              committedSpend,
            )}
          </strong>
        </div>
      </div>

      <div className="form-grid">
        <section className="panel stack">
          <h2>
            Approval queue
          </h2>

          {approvalQueue.map(
            (queue) => (
              <Link
                key={
                  queue.label
                }
                href={queue.href}
              >
                <div className="details-grid">
                  <span>
                    {queue.label}
                  </span>

                  <strong>
                    {queue.count}
                  </strong>
                </div>
              </Link>
            ),
          )}
        </section>

        <section className="panel stack">
          <h2>
            Attention required
          </h2>

          <Link
            href="/procurement/payment-requests?overdue=true"
          >
            <div className="details-grid">
              <span>
                Overdue payments
              </span>

              <strong>
                {
                  overduePayments.length
                }
              </strong>
            </div>
          </Link>

          <Link
            href="/procurement/purchase-orders"
          >
            <div className="details-grid">
              <span>
                Goods pending receipt
              </span>

              <strong>
                {
                  goodsPendingReceipt.length
                }
              </strong>
            </div>
          </Link>

          <Link
            href="/procurement/invoice-matches"
          >
            <div className="details-grid">
              <span>
                Invoice Matches pending
              </span>

              <strong>
                {
                  pendingInvoiceMatches.length
                }
              </strong>
            </div>
          </Link>
        </section>
      </div>

      <section className="panel stack">
        <h2>
          Purchase-to-pay funnel
        </h2>

        {totalFunnel.map(
          (row) => (
            <div
              key={row.label}
              className="stack"
            >
              <div className="details-grid">
                <span>
                  {row.label}
                </span>

                <strong>
                  {row.value}
                </strong>
              </div>

              <div
                style={{
                  height: "10px",
                  borderRadius: "999px",
                  background:
                    "var(--surface-muted, #e5e7eb)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.max(
                      (
                        row.value /
                        maximumFunnel
                      ) *
                        100,
                      row.value
                        ? 4
                        : 0,
                    )}%`,
                    height:
                      "100%",
                    background:
                      "currentColor",
                  }}
                />
              </div>
            </div>
          ),
        )}
      </section>

      <div className="form-grid">
        <section className="panel table-scroll">
          <h2>
            Monthly paid spend
          </h2>

          {monthlySpend.length ? (
            <table>
              <thead>
                <tr>
                  <th>
                    Month
                  </th>

                  <th>
                    Spend
                  </th>

                  <th>
                    Trend
                  </th>
                </tr>
              </thead>

              <tbody>
                {monthlySpend.map(
                  (entry) => (
                    <tr
                      key={
                        entry.month
                      }
                    >
                      <td>
                        {
                          entry.month
                        }
                      </td>

                      <td>
                        {formatMoney(
                          entry.amount,
                        )}
                      </td>

                      <td
                        style={{
                          minWidth:
                            "180px",
                        }}
                      >
                        <div
                          style={{
                            height:
                              "10px",
                            borderRadius:
                              "999px",
                            background:
                              "var(--surface-muted, #e5e7eb)",
                            overflow:
                              "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(
                                (
                                  entry.amount /
                                  maximumMonthlySpend
                                ) *
                                  100,
                                2,
                              )}%`,
                              height:
                                "100%",
                              background:
                                "currentColor",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          ) : (
            <p className="muted">
              No paid Payment Requests
              are available yet.
            </p>
          )}
        </section>

        <section className="panel table-scroll">
          <h2>
            Purchase Order status
          </h2>

          <table>
            <thead>
              <tr>
                <th>
                  Status
                </th>

                <th>
                  Count
                </th>
              </tr>
            </thead>

            <tbody>
              {poStatusCounts.map(
                (
                  [
                    status,
                    count,
                  ],
                ) => (
                  <tr key={status}>
                    <td>
                      {status.replaceAll(
                        "_",
                        " ",
                      )}
                    </td>

                    <td>
                      {count}
                    </td>
                  </tr>
                ),
              )}

              {!poStatusCounts.length ? (
                <tr>
                  <td
                    colSpan={2}
                    className="muted"
                  >
                    No Purchase Orders
                    available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel table-scroll">
        <h2>
          Top vendors by committed spend
        </h2>

        <table>
          <thead>
            <tr>
              <th>
                Vendor
              </th>

              <th>
                Orders
              </th>

              <th>
                Total spend
              </th>

              <th>
                Average order
              </th>
            </tr>
          </thead>

          <tbody>
            {vendorSpend.map(
              (vendor) => (
                <tr
                  key={
                    vendor.vendorId
                  }
                >
                  <td>
                    {vendor.vendorId}
                  </td>

                  <td>
                    {vendor.orderCount}
                  </td>

                  <td>
                    {formatMoney(
                      vendor.totalSpend,
                    )}
                  </td>

                  <td>
                    {formatMoney(
                      vendor.averageOrderValue,
                    )}
                  </td>
                </tr>
              ),
            )}

            {!vendorSpend.length ? (
              <tr>
                <td
                  colSpan={4}
                  className="muted"
                >
                  No vendor spend
                  available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="panel table-scroll">
        <h2>
          Recent Procurement activity
        </h2>

        <table>
          <thead>
            <tr>
              <th>
                Time
              </th>

              <th>
                Type
              </th>

              <th>
                Record
              </th>

              <th>
                Details
              </th>
            </tr>
          </thead>

          <tbody>
            {activities.map(
              (activity) => (
                <tr
                  key={
                    activity.id
                  }
                >
                  <td>
                    {new Date(
                      activity.occurredAt,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {activity.type}
                  </td>

                  <td>
                    <Link
                      href={
                        activity.href
                      }
                    >
                      {
                        activity.title
                      }
                    </Link>
                  </td>

                  <td>
                    {
                      activity.description
                    }
                  </td>
                </tr>
              ),
            )}

            {!activities.length ? (
              <tr>
                <td
                  colSpan={4}
                  className="muted"
                >
                  No recent Procurement
                  activity available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
