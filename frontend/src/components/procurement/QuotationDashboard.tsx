"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useQuotations,
} from "@/hooks/useQuotations";

import {
  QuotationStatusBadge,
} from "./QuotationStatusBadge";

import type {
  ProcurementQuotation,
  QuotationFilters,
  QuotationStatus,
} from "@/types/quotation";

const STATUSES: QuotationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_EVALUATION",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
];

export function QuotationDashboard() {
  const {
    loading,
    error,
    listQuotations,
  } = useQuotations();

  const [
    quotations,
    setQuotations,
  ] = useState<ProcurementQuotation[]>(
    [],
  );

  const [
    filters,
    setFilters,
  ] = useState<QuotationFilters>({
    search: "",
    status: "",
  });

  const load = useCallback(
    async () => {
      setQuotations(
        await listQuotations(filters),
      );
    },
    [
      filters,
      listQuotations,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  const totalValue =
    quotations.reduce(
      (
        total,
        quotation,
      ) =>
        total +
        Number(
          quotation.totalAmount || 0,
        ),
      0,
    );

  const submitted =
    quotations.filter(
      (quotation) =>
        quotation.status ===
          "SUBMITTED" ||
        quotation.status ===
          "UNDER_EVALUATION",
    ).length;

  const selected =
    quotations.filter(
      (quotation) =>
        quotation.status ===
        "SELECTED",
    ).length;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement
          </p>

          <h1>
            Vendor Quotations
          </h1>

          <p className="muted">
            Capture, submit, evaluate,
            and award vendor quotations.
          </p>
        </div>

        <Link
          className="button"
          href="/procurement/quotations/new"
        >
          New quotation
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Quotations
          </span>

          <strong>
            {quotations.length}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Under evaluation
          </span>

          <strong>
            {submitted}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Selected
          </span>

          <strong>
            {selected}
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
                filters.search || ""
              }
              placeholder="Quotation number or reference"
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
                filters.status || ""
              }
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    status:
                      event.target
                        .value as
                        QuotationFilters["status"],
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
            Loading quotations…
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Quotation
                </th>

                <th>
                  Vendor
                </th>

                <th>
                  RFQ
                </th>

                <th>
                  Status
                </th>

                <th>
                  Valid until
                </th>

                <th>
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {quotations.map(
                (quotation) => (
                  <tr
                    key={
                      quotation.id
                    }
                  >
                    <td>
                      <Link
                        href={`/procurement/quotations/${quotation.id}`}
                      >
                        {
                          quotation.quotationNumber
                        }
                      </Link>

                      {quotation.vendorReference ? (
                        <div className="muted">
                          {
                            quotation.vendorReference
                          }
                        </div>
                      ) : null}
                    </td>

                    <td>
                      {
                        quotation.vendorId
                      }
                    </td>

                    <td>
                      {
                        quotation.rfqId
                      }
                    </td>

                    <td>
                      <QuotationStatusBadge
                        status={
                          quotation.status
                        }
                      />
                    </td>

                    <td>
                      {new Date(
                        quotation.validUntil,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {
                        quotation.currency
                      }{" "}
                      {Number(
                        quotation.totalAmount,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ),
              )}

              {!quotations.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="muted"
                  >
                    No quotations found.
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
