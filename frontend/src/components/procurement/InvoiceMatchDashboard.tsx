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
  InvoiceMatch,
  InvoiceMatchFilters,
  InvoiceMatchStatus,
} from "@/types/invoiceMatch";

const STATUSES:
  InvoiceMatchStatus[] = [
    "PENDING",
    "MATCHED",
    "APPROVED",
    "REJECTED",
  ];

export function InvoiceMatchDashboard() {
  const {
    loading,
    error,
    listInvoiceMatches,
  } = useInvoiceMatches();

  const [
    matches,
    setMatches,
  ] = useState<
    InvoiceMatch[]
  >([]);

  const [
    filters,
    setFilters,
  ] =
    useState<InvoiceMatchFilters>({
      search: "",
      status: "",
    });

  const load = useCallback(
    async () => {
      setMatches(
        await listInvoiceMatches(
          filters,
        ),
      );
    },
    [
      filters,
      listInvoiceMatches,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  const pending =
    matches.filter(
      (match) =>
        match.status ===
        "PENDING",
    ).length;

  const matched =
    matches.filter(
      (match) =>
        match.status ===
        "MATCHED",
    ).length;

  const approved =
    matches.filter(
      (match) =>
        match.status ===
        "APPROVED",
    ).length;

  const totalVariance =
    matches.reduce(
      (
        total,
        match,
      ) =>
        total +
        Math.abs(
          Number(
            match.amountVariance ||
            0,
          ),
        ),
      0,
    );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement
          </p>

          <h1>
            Invoice Matching
          </h1>

          <p className="muted">
            Perform three-way matching
            between Purchase Orders,
            Goods Receipts, and vendor
            invoices.
          </p>
        </div>

        <Link
          className="button"
          href="/procurement/invoice-matches/new"
        >
          New Invoice Match
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Pending
          </span>

          <strong>
            {pending}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Matched
          </span>

          <strong>
            {matched}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Approved
          </span>

          <strong>
            {approved}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Absolute variance
          </span>

          <strong>
            INR{" "}
            {totalVariance.toLocaleString()}
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
              placeholder="Match or invoice number"
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
                        InvoiceMatchFilters["status"],
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
                    {status}
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
            Loading Invoice Matches…
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Match
                </th>

                <th>
                  Vendor invoice
                </th>

                <th>
                  Purchase Order
                </th>

                <th>
                  Status
                </th>

                <th>
                  PO amount
                </th>

                <th>
                  Invoice amount
                </th>

                <th>
                  Variance
                </th>
              </tr>
            </thead>

            <tbody>
              {matches.map(
                (match) => (
                  <tr key={match.id}>
                    <td>
                      <Link
                        href={`/procurement/invoice-matches/${match.id}`}
                      >
                        {
                          match.invoiceMatchNumber
                        }
                      </Link>
                    </td>

                    <td>
                      {
                        match.externalInvoiceNumber
                      }
                    </td>

                    <td>
                      <Link
                        href={`/procurement/purchase-orders/${match.purchaseOrderId}`}
                      >
                        {
                          match.purchaseOrderId
                        }
                      </Link>
                    </td>

                    <td>
                      <InvoiceMatchStatusBadge
                        status={
                          match.status
                        }
                      />
                    </td>

                    <td>
                      {match.currency}{" "}
                      {Number(
                        match.purchaseOrderAmount,
                      ).toLocaleString()}
                    </td>

                    <td>
                      {match.currency}{" "}
                      {Number(
                        match.invoiceAmount,
                      ).toLocaleString()}
                    </td>

                    <td>
                      {match.currency}{" "}
                      {Number(
                        match.amountVariance,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ),
              )}

              {!matches.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="muted"
                  >
                    No Invoice Matches found.
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
