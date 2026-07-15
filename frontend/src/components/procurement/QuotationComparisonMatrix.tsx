"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useQuotationComparison,
} from "@/hooks/useQuotationComparison";

import {
  QuotationStatusBadge,
} from "./QuotationStatusBadge";

import type {
  ProcurementQuotationComparison,
} from "@/types/quotationComparison";

export function QuotationComparisonMatrix({
  rfqId,
}: {
  rfqId: string;
}) {
  const {
    loading,
    error,
    getComparison,
    decideQuotation,
  } = useQuotationComparison();

  const [
    comparison,
    setComparison,
  ] =
    useState<ProcurementQuotationComparison | null>(
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
      setComparison(
        await getComparison(rfqId),
      );
    },
    [
      getComparison,
      rfqId,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  async function decide(
    quotationId: string,
    action:
      | "select"
      | "reject",
  ) {
    if (!actor.trim()) {
      return;
    }

    await decideQuotation(
      quotationId,
      action,
      actor.trim(),
      remarks,
    );

    setRemarks("");
    await load();
  }

  if (!comparison) {
    return (
      <div className="panel">
        {loading
          ? "Loading quotation comparison…"
          : error ||
            "Quotation comparison is unavailable."}
      </div>
    );
  }

  const lowest =
    comparison.commercialRanking.find(
      (entry) =>
        entry.isLowestCommercialOffer,
    );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {comparison.rfqNumber}
          </p>

          <h1>
            Quotation Comparison
          </h1>

          <p className="muted">
            Generated{" "}
            {new Date(
              comparison.generatedAt,
            ).toLocaleString()}
          </p>
        </div>

        <Link
          className="button button-secondary"
          href={`/procurement/rfqs/${rfqId}`}
        >
          Back to RFQ
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Quotations received
          </span>

          <strong>
            {comparison.quotationCount}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Comparable
          </span>

          <strong>
            {
              comparison.comparableQuotationCount
            }
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Currency
          </span>

          <strong>
            {comparison.currency}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Lowest offer
          </span>

          <strong>
            {lowest
              ? `${comparison.currency} ${Number(
                  lowest.totalAmount,
                ).toLocaleString()}`
              : "—"}
          </strong>
        </div>
      </div>

      <section className="panel stack">
        <h2>
          Award decision
        </h2>

        <div className="form-grid">
          <label>
            Decision by person ID

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

        {!actor.trim() ? (
          <p className="muted">
            Enter the deciding person ID
            to enable award actions.
          </p>
        ) : null}
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <section className="panel table-scroll">
        <h2>
          Commercial ranking
        </h2>

        <table>
          <thead>
            <tr>
              <th>
                Rank
              </th>

              <th>
                Vendor
              </th>

              <th>
                Quotation
              </th>

              <th>
                Status
              </th>

              <th>
                Subtotal
              </th>

              <th>
                Discount
              </th>

              <th>
                Tax
              </th>

              <th>
                Freight
              </th>

              <th>
                Total
              </th>

              <th>
                Delivery
              </th>

              <th>
                Valid until
              </th>

              <th>
                Decision
              </th>
            </tr>
          </thead>

          <tbody>
            {comparison.commercialRanking.map(
              (entry) => (
                <tr
                  key={
                    entry.quotationId
                  }
                >
                  <td>
                    <strong>
                      {entry.commercialRank}
                      {entry.isLowestCommercialOffer
                        ? " — L1"
                        : entry.commercialRank === 2
                          ? " — L2"
                          : ""}
                    </strong>
                  </td>

                  <td>
                    {entry.vendorId}
                  </td>

                  <td>
                    <Link
                      href={`/procurement/quotations/${entry.quotationId}`}
                    >
                      {
                        entry.quotationNumber
                      }
                    </Link>
                  </td>

                  <td>
                    <QuotationStatusBadge
                      status={entry.status}
                    />
                  </td>

                  <td>
                    {entry.currency}{" "}
                    {Number(
                      entry.subtotal,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {entry.currency}{" "}
                    {Number(
                      entry.discountAmount,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {entry.currency}{" "}
                    {Number(
                      entry.taxAmount,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {entry.currency}{" "}
                    {Number(
                      entry.freightAmount,
                    ).toLocaleString()}
                  </td>

                  <td>
                    <strong>
                      {entry.currency}{" "}
                      {Number(
                        entry.totalAmount,
                      ).toLocaleString()}
                    </strong>
                  </td>

                  <td>
                    {entry.deliveryDays !==
                    undefined
                      ? `${entry.deliveryDays} days`
                      : "—"}
                  </td>

                  <td>
                    {new Date(
                      entry.validUntil,
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {[
                      "SUBMITTED",
                      "UNDER_EVALUATION",
                    ].includes(
                      entry.status,
                    ) ? (
                      <div className="button-row">
                        <button
                          className="button"
                          disabled={
                            loading ||
                            !actor.trim()
                          }
                          onClick={() =>
                            void decide(
                              entry.quotationId,
                              "select",
                            )
                          }
                        >
                          Select
                        </button>

                        <button
                          className="button button-danger"
                          disabled={
                            loading ||
                            !actor.trim()
                          }
                          onClick={() =>
                            void decide(
                              entry.quotationId,
                              "reject",
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ),
            )}

            {!comparison.commercialRanking.length ? (
              <tr>
                <td
                  colSpan={12}
                  className="muted"
                >
                  No submitted quotations
                  are available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="panel table-scroll">
        <h2>
          Line-level L1 and L2 comparison
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
                Quantity
              </th>

              <th>
                Vendor
              </th>

              <th>
                Quotation
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

              <th>
                Delivery
              </th>

              <th>
                Rank
              </th>
            </tr>
          </thead>

          <tbody>
            {comparison.itemComparisons.flatMap(
              (item) =>
                item.entries.map(
                  (
                    entry,
                    entryIndex,
                  ) => (
                    <tr
                      key={
                        entry.quotationItemId
                      }
                    >
                      <td>
                        {entryIndex === 0
                          ? entry.lineNumber
                          : ""}
                      </td>

                      <td>
                        {entryIndex === 0
                          ? entry.description ||
                            "—"
                          : ""}
                      </td>

                      <td>
                        {entryIndex === 0
                          ? `${entry.quantity} ${entry.unit}`
                          : ""}
                      </td>

                      <td>
                        {entry.vendorId}
                      </td>

                      <td>
                        <Link
                          href={`/procurement/quotations/${entry.quotationId}`}
                        >
                          {
                            entry.quotationNumber
                          }
                        </Link>
                      </td>

                      <td>
                        {
                          comparison.currency
                        }{" "}
                        {Number(
                          entry.unitPrice,
                        ).toLocaleString()}
                      </td>

                      <td>
                        {
                          comparison.currency
                        }{" "}
                        {Number(
                          entry.discountAmount,
                        ).toLocaleString()}
                      </td>

                      <td>
                        {entry.taxRate}% —{" "}
                        {
                          comparison.currency
                        }{" "}
                        {Number(
                          entry.taxAmount,
                        ).toLocaleString()}
                      </td>

                      <td>
                        {
                          comparison.currency
                        }{" "}
                        {Number(
                          entry.lineTotal,
                        ).toLocaleString()}
                      </td>

                      <td>
                        {entry.deliveryDays !==
                        undefined
                          ? `${entry.deliveryDays} days`
                          : "—"}
                      </td>

                      <td>
                        <strong>
                          {entry.lineRank}
                          {entry.isLowestLineOffer
                            ? " — L1"
                            : entry.lineRank === 2
                              ? " — L2"
                              : ""}
                        </strong>
                      </td>
                    </tr>
                  ),
                ),
            )}

            {!comparison.itemComparisons.length ? (
              <tr>
                <td
                  colSpan={11}
                  className="muted"
                >
                  No line-level offers
                  are available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
