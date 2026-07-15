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
  PurchaseOrderDetails as PurchaseOrderDetailsType,
} from "@/types/purchaseOrder";

export function PurchaseOrderDetails({
  id,
}: {
  id: string;
}) {
  const {
    loading,
    error,
    getPurchaseOrder,
    transitionPurchaseOrder,
  } = usePurchaseOrders();

  const [
    order,
    setOrder,
  ] =
    useState<PurchaseOrderDetailsType | null>(
      null,
    );

  const [
    actor,
    setActor,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const load = useCallback(
    async () => {
      setOrder(
        await getPurchaseOrder(
          id,
        ),
      );
    },
    [
      getPurchaseOrder,
      id,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  async function act(
    action:
      | "submit"
      | "approve"
      | "issue"
      | "acknowledge"
      | "received"
      | "close"
      | "cancel",
  ) {
    if (!actor.trim()) {
      return;
    }

    const updated =
      await transitionPurchaseOrder(
        id,
        action,
        actor.trim(),
        remarks.trim(),
      );

    setOrder(updated);
    setRemarks("");
  }

  if (!order) {
    return (
      <div className="panel">
        {loading
          ? "Loading Purchase Order…"
          : error ||
            "Purchase Order not found."}
      </div>
    );
  }

  const cancellable =
    [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "ISSUED",
      "ACKNOWLEDGED",
      "PARTIALLY_RECEIVED",
    ].includes(
      order.status,
    );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {
              order.purchaseOrderNumber
            }
          </p>

          <h1>
            {order.title}
          </h1>

          <PurchaseOrderStatusBadge
            status={order.status}
          />
        </div>

        <Link
          className="button button-secondary"
          href={`/procurement/quotations/${order.quotationId}`}
        >
          View quotation
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          <div>
            <span className="muted">
              Vendor
            </span>

            <strong>
              {order.vendorId}
            </strong>
          </div>

          <div>
            <span className="muted">
              RFQ
            </span>

            <strong>
              {order.rfqId}
            </strong>
          </div>

          <div>
            <span className="muted">
              Order date
            </span>

            <strong>
              {new Date(
                order.orderDate,
              ).toLocaleDateString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Expected delivery
            </span>

            <strong>
              {order.expectedDeliveryDate
                ? new Date(
                    order.expectedDeliveryDate,
                  ).toLocaleDateString()
                : "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Subtotal
            </span>

            <strong>
              {order.currency}{" "}
              {Number(
                order.subtotal,
              ).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Discount
            </span>

            <strong>
              {order.currency}{" "}
              {Number(
                order.discountAmount,
              ).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Tax
            </span>

            <strong>
              {order.currency}{" "}
              {Number(
                order.taxAmount,
              ).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Freight
            </span>

            <strong>
              {order.currency}{" "}
              {Number(
                order.freightAmount,
              ).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Total
            </span>

            <strong>
              {order.currency}{" "}
              {Number(
                order.totalAmount,
              ).toLocaleString()}
            </strong>
          </div>
        </div>
      </section>

      {order.description ? (
        <section className="panel">
          <h2>
            Description
          </h2>

          <p>
            {order.description}
          </p>
        </section>
      ) : null}

      <section className="panel table-scroll">
        <h2>
          Order items
        </h2>

        <table>
          <thead>
            <tr>
              <th>
                #
              </th>

              <th>
                Description
              </th>

              <th>
                Ordered
              </th>

              <th>
                Received
              </th>

              <th>
                Unit price
              </th>

              <th>
                Discount
              </th>

              <th>
                Tax
              </th>

              <th>
                Line total
              </th>
            </tr>
          </thead>

          <tbody>
            {order.items.map(
              (item) => (
                <tr key={item.id}>
                  <td>
                    {
                      item.lineNumber
                    }
                  </td>

                  <td>
                    {
                      item.description
                    }
                  </td>

                  <td>
                    {
                      item.orderedQuantity
                    }{" "}
                    {item.unit}
                  </td>

                  <td>
                    {
                      item.receivedQuantity
                    }{" "}
                    {item.unit}
                  </td>

                  <td>
                    {order.currency}{" "}
                    {Number(
                      item.unitPrice,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {order.currency}{" "}
                    {Number(
                      item.discountAmount,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {item.taxRate}% —{" "}
                    {order.currency}{" "}
                    {Number(
                      item.taxAmount,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {order.currency}{" "}
                    {Number(
                      item.lineTotal,
                    ).toLocaleString()}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      <section className="panel stack">
        <h2>
          Workflow action
        </h2>

        <div className="form-grid">
          <label>
            Changed by person ID

            <input
              value={actor}
              onChange={(event) =>
                setActor(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Remarks

            <input
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <div className="button-row">
          {order.status ===
          "DRAFT" ? (
            <button
              className="button"
              disabled={
                loading ||
                !actor.trim()
              }
              onClick={() =>
                void act("submit")
              }
            >
              Submit for approval
            </button>
          ) : null}

          {order.status ===
          "PENDING_APPROVAL" ? (
            <button
              className="button"
              disabled={
                loading ||
                !actor.trim()
              }
              onClick={() =>
                void act("approve")
              }
            >
              Approve
            </button>
          ) : null}

          {order.status ===
          "APPROVED" ? (
            <button
              className="button"
              disabled={
                loading ||
                !actor.trim()
              }
              onClick={() =>
                void act("issue")
              }
            >
              Issue to vendor
            </button>
          ) : null}

          {order.status ===
          "ISSUED" ? (
            <button
              className="button"
              disabled={
                loading ||
                !actor.trim()
              }
              onClick={() =>
                void act(
                  "acknowledge",
                )
              }
            >
              Acknowledge
            </button>
          ) : null}

          {[
            "ISSUED",
            "ACKNOWLEDGED",
            "PARTIALLY_RECEIVED",
          ].includes(
            order.status,
          ) ? (
            <button
              className="button button-secondary"
              disabled={
                loading ||
                !actor.trim()
              }
              onClick={() =>
                void act(
                  "received",
                )
              }
            >
              Mark received
            </button>
          ) : null}

          {order.status ===
          "RECEIVED" ? (
            <button
              className="button"
              disabled={
                loading ||
                !actor.trim()
              }
              onClick={() =>
                void act("close")
              }
            >
              Close Purchase Order
            </button>
          ) : null}

          {cancellable ? (
            <button
              className="button button-danger"
              disabled={
                loading ||
                !actor.trim()
              }
              onClick={() =>
                void act("cancel")
              }
            >
              Cancel
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="alert alert-danger">
            {error}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>
          Status history
        </h2>

        {order.history.length ? (
          <ul>
            {order.history.map(
              (entry) => (
                <li key={entry.id}>
                  {entry.toStatus.replaceAll(
                    "_",
                    " ",
                  )}{" "}
                  —{" "}
                  {new Date(
                    entry.createdAt,
                  ).toLocaleString()}
                  {entry.remarks
                    ? ` — ${entry.remarks}`
                    : ""}
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="muted">
            No history available.
          </p>
        )}
      </section>
    </div>
  );
}
