"use client";

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
  ProcurementQuotationDetails,
} from "@/types/quotation";

export function QuotationDetails({
  id,
}: {
  id: string;
}) {
  const {
    loading,
    error,
    getQuotation,
    transitionQuotation,
  } = useQuotations();

  const [
    quotation,
    setQuotation,
  ] =
    useState<ProcurementQuotationDetails | null>(
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
      setQuotation(
        await getQuotation(id),
      );
    },
    [
      getQuotation,
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
      | "select"
      | "reject"
      | "withdraw"
      | "expire",
  ) {
    if (!actor.trim()) {
      return;
    }

    const updated =
      await transitionQuotation(
        id,
        action,
        actor.trim(),
        remarks.trim(),
      );

    setQuotation(updated);
    setRemarks("");
  }

  if (!quotation) {
    return (
      <div className="panel">
        {loading
          ? "Loading quotation…"
          : error ||
            "Quotation not found."}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {
              quotation.quotationNumber
            }
          </p>

          <h1>
            Vendor Quotation
          </h1>

          <QuotationStatusBadge
            status={
              quotation.status
            }
          />
        </div>
      </div>

      <section className="panel">
        <div className="details-grid">
          <div>
            <span className="muted">
              Vendor
            </span>

            <strong>
              {quotation.vendorId}
            </strong>
          </div>

          <div>
            <span className="muted">
              RFQ
            </span>

            <strong>
              {quotation.rfqId}
            </strong>
          </div>

          <div>
            <span className="muted">
              Valid until
            </span>

            <strong>
              {new Date(
                quotation.validUntil,
              ).toLocaleDateString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Delivery
            </span>

            <strong>
              {quotation.deliveryDays !==
              undefined
                ? `${quotation.deliveryDays} days`
                : "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Subtotal
            </span>

            <strong>
              {quotation.currency}{" "}
              {Number(
                quotation.subtotal,
              ).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Tax
            </span>

            <strong>
              {quotation.currency}{" "}
              {Number(
                quotation.taxAmount,
              ).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Freight
            </span>

            <strong>
              {quotation.currency}{" "}
              {Number(
                quotation.freightAmount,
              ).toLocaleString()}
            </strong>
          </div>

          <div>
            <span className="muted">
              Total
            </span>

            <strong>
              {quotation.currency}{" "}
              {Number(
                quotation.totalAmount,
              ).toLocaleString()}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel table-scroll">
        <h2>
          Quotation items
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
                Quantity
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
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {quotation.items.map(
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
                    {item.quantity}{" "}
                    {item.unit}
                  </td>

                  <td>
                    {quotation.currency}{" "}
                    {Number(
                      item.unitPrice,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {quotation.currency}{" "}
                    {Number(
                      item.discountAmount,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {item.taxRate}% —{" "}
                    {quotation.currency}{" "}
                    {Number(
                      item.taxAmount,
                    ).toLocaleString()}
                  </td>

                  <td>
                    {quotation.currency}{" "}
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
          {quotation.status ===
          "DRAFT" ? (
            <button
              className="button"
              onClick={() =>
                void act("submit")
              }
            >
              Submit quotation
            </button>
          ) : null}

          {[
            "SUBMITTED",
            "UNDER_EVALUATION",
          ].includes(
            quotation.status,
          ) ? (
            <>
              <button
                className="button"
                onClick={() =>
                  void act(
                    "select",
                  )
                }
              >
                Select quotation
              </button>

              <button
                className="button button-danger"
                onClick={() =>
                  void act(
                    "reject",
                  )
                }
              >
                Reject
              </button>

              <button
                className="button button-secondary"
                onClick={() =>
                  void act(
                    "withdraw",
                  )
                }
              >
                Withdraw
              </button>
            </>
          ) : null}

          {![
            "SELECTED",
            "REJECTED",
            "WITHDRAWN",
            "EXPIRED",
          ].includes(
            quotation.status,
          ) ? (
            <button
              className="button button-secondary"
              onClick={() =>
                void act("expire")
              }
            >
              Mark expired
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
          History
        </h2>

        {quotation.history.length ? (
          <ul>
            {quotation.history.map(
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
