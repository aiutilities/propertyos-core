"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useInvoiceMatches,
} from "@/hooks/useInvoiceMatches";

import {
  InvoiceMatchStatusBadge,
} from "./InvoiceMatchStatusBadge";

import type {
  InvoiceMatchDetails as InvoiceMatchDetailsType,
} from "@/types/invoiceMatch";

export function InvoiceMatchDetails({
  id,
}: {
  id: string;
}) {
  const {
    loading,
    error,
    getInvoiceMatch,
    completeInvoiceMatch,
    approveInvoiceMatch,
    rejectInvoiceMatch,
  } = useInvoiceMatches();

  const [
    match,
    setMatch,
  ] =
    useState<InvoiceMatchDetailsType | null>(
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
      setMatch(
        await getInvoiceMatch(id),
      );
    },
    [
      getInvoiceMatch,
      id,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  async function complete() {
    if (!actor.trim()) {
      return;
    }

    const updated =
      await completeInvoiceMatch(
        id,
        actor.trim(),
        remarks.trim(),
      );

    setMatch(updated);
    setRemarks("");
  }

  async function approve() {
    if (!actor.trim()) {
      return;
    }

    const updated =
      await approveInvoiceMatch(
        id,
        actor.trim(),
        remarks.trim(),
      );

    setMatch(updated);
    setRemarks("");
  }

  async function reject() {
    if (
      !actor.trim() ||
      !remarks.trim()
    ) {
      return;
    }

    const updated =
      await rejectInvoiceMatch(
        id,
        actor.trim(),
        remarks.trim(),
      );

    setMatch(updated);
    setRemarks("");
  }

  if (!match) {
    return (
      <div className="panel">
        {loading
          ? "Loading Invoice Match…"
          : error ||
            "Invoice Match not found."}
      </div>
    );
  }

  const matchedLines =
    match.items.filter(
      (item) =>
        item.isMatched,
    ).length;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {
              match.invoiceMatchNumber
            }
          </p>

          <h1>
            Invoice Match
          </h1>

          <InvoiceMatchStatusBadge
            status={
              match.status
            }
          />
        </div>

        <div className="button-row">
          <Link
            className="button button-secondary"
            href={`/procurement/purchase-orders/${match.purchaseOrderId}`}
          >
            Purchase Order
          </Link>

          {match.goodsReceiptId ? (
            <Link
              className="button button-secondary"
              href={`/procurement/goods-receipts/${match.goodsReceiptId}`}
            >
              Goods Receipt
            </Link>
          ) : null}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            PO amount
          </span>

          <strong>
            {match.currency}{" "}
            {Number(
              match.purchaseOrderAmount,
            ).toLocaleString()}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Invoice amount
          </span>

          <strong>
            {match.currency}{" "}
            {Number(
              match.invoiceAmount,
            ).toLocaleString()}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Amount variance
          </span>

          <strong>
            {match.currency}{" "}
            {Number(
              match.amountVariance,
            ).toLocaleString()}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Matched lines
          </span>

          <strong>
            {matchedLines}/
            {match.items.length}
          </strong>
        </div>
      </div>

      <section className="panel">
        <div className="details-grid">
          <div>
            <span className="muted">
              Vendor invoice
            </span>

            <strong>
              {
                match.externalInvoiceNumber
              }
            </strong>
          </div>

          <div>
            <span className="muted">
              Invoice date
            </span>

            <strong>
              {match.invoiceDate
                ? new Date(
                    match.invoiceDate,
                  ).toLocaleDateString()
                : "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Vendor
            </span>

            <strong>
              {match.vendorId}
            </strong>
          </div>

          <div>
            <span className="muted">
              Quantity variance
            </span>

            <strong>
              {
                match.quantityVariance
              }
            </strong>
          </div>

          <div>
            <span className="muted">
              Matched at
            </span>

            <strong>
              {match.matchedAt
                ? new Date(
                    match.matchedAt,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Approved at
            </span>

            <strong>
              {match.approvedAt
                ? new Date(
                    match.approvedAt,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel table-scroll">
        <h2>
          Three-way comparison
        </h2>

        <table>
          <thead>
            <tr>
              <th>
                Line
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
                Invoiced
              </th>

              <th>
                PO price
              </th>

              <th>
                Invoice price
              </th>

              <th>
                Quantity variance
              </th>

              <th>
                Price variance
              </th>

              <th>
                Amount variance
              </th>

              <th>
                Result
              </th>
            </tr>
          </thead>

          <tbody>
            {match.items.map(
              (item) => (
                <tr key={item.id}>
                  <td>
                    {
                      item.lineNumber
                    }
                  </td>

                  <td>
                    {item.description ||
                      "—"}
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
                    {
                      item.invoicedQuantity
                    }{" "}
                    {item.unit}
                  </td>

                  <td>
                    {match.currency}{" "}
                    {Number(
                      item.purchaseOrderUnitPrice,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {match.currency}{" "}
                    {Number(
                      item.invoiceUnitPrice,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {
                      item.quantityVariance
                    }
                  </td>

                  <td>
                    {match.currency}{" "}
                    {Number(
                      item.unitPriceVariance,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {match.currency}{" "}
                    {Number(
                      item.amountVariance,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {item.isMatched
                      ? "Matched"
                      : "Variance"}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      {[
        "PENDING",
        "MATCHED",
      ].includes(
        match.status,
      ) ? (
        <section className="panel stack">
          <h2>
            Workflow action
          </h2>

          <div className="form-grid">
            <label>
              Action by person ID

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
              Remarks or rejection reason

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
            {match.status ===
            "PENDING" ? (
              <button
                className="button"
                disabled={
                  loading ||
                  !actor.trim()
                }
                onClick={() =>
                  void complete()
                }
              >
                Complete Match
              </button>
            ) : null}

            {match.status ===
            "MATCHED" ? (
              <button
                className="button"
                disabled={
                  loading ||
                  !actor.trim()
                }
                onClick={() =>
                  void approve()
                }
              >
                Approve for Payment
              </button>
            ) : null}

            <button
              className="button button-danger"
              disabled={
                loading ||
                !actor.trim() ||
                !remarks.trim()
              }
              onClick={() =>
                void reject()
              }
            >
              Reject
            </button>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <section className="panel">
        <h2>
          Status history
        </h2>

        {match.history.length ? (
          <ul>
            {match.history.map(
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
