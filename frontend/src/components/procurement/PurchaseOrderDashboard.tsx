"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  usePurchaseOrders,
} from "@/hooks/usePurchaseOrders";

import {
  PurchaseOrderStatusBadge,
} from "./PurchaseOrderStatusBadge";

import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderStatus,
} from "@/types/purchaseOrder";

const STATUSES:
  PurchaseOrderStatus[] = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "ISSUED",
    "ACKNOWLEDGED",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CLOSED",
    "CANCELLED",
  ];

export function PurchaseOrderDashboard() {
  const {
    loading,
    error,
    listPurchaseOrders,
  } = usePurchaseOrders();

  const [
    orders,
    setOrders,
  ] = useState<
    PurchaseOrder[]
  >([]);

  const [
    filters,
    setFilters,
  ] =
    useState<PurchaseOrderFilters>({
      search: "",
      status: "",
    });

  const load = useCallback(
    async () => {
      setOrders(
        await listPurchaseOrders(
          filters,
        ),
      );
    },
    [
      filters,
      listPurchaseOrders,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  const totalValue =
    orders.reduce(
      (
        total,
        order,
      ) =>
        total +
        Number(
          order.totalAmount ||
          0,
        ),
      0,
    );

  const pendingApproval =
    orders.filter(
      (order) =>
        order.status ===
        "PENDING_APPROVAL",
    ).length;

  const active =
    orders.filter(
      (order) =>
        [
          "APPROVED",
          "ISSUED",
          "ACKNOWLEDGED",
          "PARTIALLY_RECEIVED",
        ].includes(
          order.status,
        ),
    ).length;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement
          </p>

          <h1>
            Purchase Orders
          </h1>

          <p className="muted">
            Create, approve, issue,
            receive, and close vendor
            Purchase Orders.
          </p>
        </div>

        <Link
          className="button"
          href="/procurement/purchase-orders/new"
        >
          New Purchase Order
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Purchase Orders
          </span>

          <strong>
            {orders.length}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Pending approval
          </span>

          <strong>
            {pendingApproval}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Active orders
          </span>

          <strong>
            {active}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Listed value
          </span>

          <strong>
            INR{" "}
            {totalValue.toLocaleString()}
          </strong>
        </div>
      </div>

      <section className="panel">
        <div className="form-grid">
          <label>
            Search

            <input
              value={
                filters.search ||
                ""
              }
              placeholder="PO number or title"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    search:
                      event.target
                        .value,
                  }),
                )
              }
            />
          </label>

          <label>
            Status

            <select
              value={
                filters.status ||
                ""
              }
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    status:
                      event.target
                        .value as
                        PurchaseOrderFilters["status"],
                  }),
                )
              }
            >
              <option value="">
                All statuses
              </option>

              {STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status.replaceAll(
                      "_",
                      " ",
                    )}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <section className="panel table-scroll">
        {loading ? (
          <p>
            Loading Purchase Orders…
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Purchase Order
                </th>

                <th>
                  Vendor
                </th>

                <th>
                  Status
                </th>

                <th>
                  Order date
                </th>

                <th>
                  Expected delivery
                </th>

                <th>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map(
                (order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/procurement/purchase-orders/${order.id}`}
                      >
                        {
                          order.purchaseOrderNumber
                        }
                      </Link>

                      <div className="muted">
                        {order.title}
                      </div>
                    </td>

                    <td>
                      {order.vendorId}
                    </td>

                    <td>
                      <PurchaseOrderStatusBadge
                        status={
                          order.status
                        }
                      />
                    </td>

                    <td>
                      {new Date(
                        order.orderDate,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {order.expectedDeliveryDate
                        ? new Date(
                            order.expectedDeliveryDate,
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      {order.currency}{" "}
                      {Number(
                        order.totalAmount,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ),
              )}

              {!orders.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="muted"
                  >
                    No Purchase Orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
