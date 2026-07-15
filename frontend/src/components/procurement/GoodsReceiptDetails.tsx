"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useGoodsReceipts,
} from "@/hooks/useGoodsReceipts";

import {
  GoodsReceiptStatusBadge,
} from "./GoodsReceiptStatusBadge";

import type {
  GoodsReceiptDetails as GoodsReceiptDetailsType,
} from "@/types/goodsReceipt";

export function GoodsReceiptDetails({
  id,
}: {
  id: string;
}) {
  const {
    loading,
    error,
    getGoodsReceipt,
    postGoodsReceipt,
  } = useGoodsReceipts();

  const [
    receipt,
    setReceipt,
  ] =
    useState<GoodsReceiptDetailsType | null>(
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
      setReceipt(
        await getGoodsReceipt(id),
      );
    },
    [
      getGoodsReceipt,
      id,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  async function postReceipt() {
    if (!actor.trim()) {
      return;
    }

    const updated =
      await postGoodsReceipt(
        id,
        actor.trim(),
        remarks.trim(),
      );

    setReceipt(updated);
    setRemarks("");
  }

  if (!receipt) {
    return (
      <div className="panel">
        {loading
          ? "Loading Goods Receipt…"
          : error ||
            "Goods Receipt not found."}
      </div>
    );
  }

  const totalReceived =
    receipt.items.reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item.receivedQuantity,
        ),
      0,
    );

  const totalAccepted =
    receipt.items.reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item.acceptedQuantity,
        ),
      0,
    );

  const totalRejected =
    receipt.items.reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item.rejectedQuantity,
        ),
      0,
    );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {
              receipt.goodsReceiptNumber
            }
          </p>

          <h1>
            Goods Receipt
          </h1>

          <GoodsReceiptStatusBadge
            status={
              receipt.status
            }
          />
        </div>

        <Link
          className="button button-secondary"
          href={`/procurement/purchase-orders/${receipt.purchaseOrderId}`}
        >
          View Purchase Order
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Received
          </span>

          <strong>
            {totalReceived}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Accepted
          </span>

          <strong>
            {totalAccepted}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Rejected
          </span>

          <strong>
            {totalRejected}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Receipt date
          </span>

          <strong>
            {new Date(
              receipt.receiptDate,
            ).toLocaleDateString()}
          </strong>
        </div>
      </div>

      <section className="panel">
        <div className="details-grid">
          <div>
            <span className="muted">
              Vendor
            </span>

            <strong>
              {receipt.vendorId}
            </strong>
          </div>

          <div>
            <span className="muted">
              Received by
            </span>

            <strong>
              {
                receipt.receivedByPersonId
              }
            </strong>
          </div>

          <div>
            <span className="muted">
              Delivery note
            </span>

            <strong>
              {receipt.deliveryNoteNumber ||
                "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Invoice number
            </span>

            <strong>
              {receipt.invoiceNumber ||
                "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Posted at
            </span>

            <strong>
              {receipt.postedAt
                ? new Date(
                    receipt.postedAt,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel table-scroll">
        <h2>
          Receipt items
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
                Previous
              </th>

              <th>
                Received
              </th>

              <th>
                Accepted
              </th>

              <th>
                Rejected
              </th>

              <th>
                Notes
              </th>
            </tr>
          </thead>

          <tbody>
            {receipt.items.map(
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
                      item.previouslyReceivedQuantity
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
                      item.acceptedQuantity
                    }{" "}
                    {item.unit}
                  </td>

                  <td>
                    {
                      item.rejectedQuantity
                    }{" "}
                    {item.unit}
                  </td>

                  <td>
                    {item.inspectionNotes ||
                      item.rejectionReason ||
                      "—"}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      {receipt.status ===
      "DRAFT" ? (
        <section className="panel stack">
          <h2>
            Post Goods Receipt
          </h2>

          <div className="form-grid">
            <label>
              Posted by person ID

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

          <button
            className="button"
            disabled={
              loading ||
              !actor.trim()
            }
            onClick={() =>
              void postReceipt()
            }
          >
            Post Goods Receipt
          </button>
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

        {receipt.history.length ? (
          <ul>
            {receipt.history.map(
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
