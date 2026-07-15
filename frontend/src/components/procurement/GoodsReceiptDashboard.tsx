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
  GoodsReceipt,
  GoodsReceiptFilters,
  GoodsReceiptStatus,
} from "@/types/goodsReceipt";

const STATUSES:
  GoodsReceiptStatus[] = [
    "DRAFT",
    "POSTED",
    "CANCELLED",
  ];

export function GoodsReceiptDashboard() {
  const {
    loading,
    error,
    listGoodsReceipts,
  } = useGoodsReceipts();

  const [
    receipts,
    setReceipts,
  ] = useState<
    GoodsReceipt[]
  >([]);

  const [
    filters,
    setFilters,
  ] =
    useState<GoodsReceiptFilters>({
      search: "",
      status: "",
    });

  const load = useCallback(
    async () => {
      setReceipts(
        await listGoodsReceipts(
          filters,
        ),
      );
    },
    [
      filters,
      listGoodsReceipts,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  const drafts =
    receipts.filter(
      (receipt) =>
        receipt.status ===
        "DRAFT",
    ).length;

  const posted =
    receipts.filter(
      (receipt) =>
        receipt.status ===
        "POSTED",
    ).length;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement
          </p>

          <h1>
            Goods Receipts
          </h1>

          <p className="muted">
            Record partial and final
            deliveries against Purchase
            Orders.
          </p>
        </div>

        <Link
          className="button"
          href="/procurement/goods-receipts/new"
        >
          New Goods Receipt
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Receipts
          </span>

          <strong>
            {receipts.length}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Draft
          </span>

          <strong>
            {drafts}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Posted
          </span>

          <strong>
            {posted}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Posting rate
          </span>

          <strong>
            {receipts.length
              ? `${Math.round(
                  (
                    posted /
                    receipts.length
                  ) *
                    100,
                )}%`
              : "0%"}
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
              placeholder="GRN or delivery note"
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
                        GoodsReceiptFilters["status"],
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
            Loading Goods Receipts…
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Goods Receipt
                </th>

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
                  Receipt date
                </th>

                <th>
                  Delivery note
                </th>
              </tr>
            </thead>

            <tbody>
              {receipts.map(
                (receipt) => (
                  <tr
                    key={
                      receipt.id
                    }
                  >
                    <td>
                      <Link
                        href={`/procurement/goods-receipts/${receipt.id}`}
                      >
                        {
                          receipt.goodsReceiptNumber
                        }
                      </Link>
                    </td>

                    <td>
                      <Link
                        href={`/procurement/purchase-orders/${receipt.purchaseOrderId}`}
                      >
                        {
                          receipt.purchaseOrderId
                        }
                      </Link>
                    </td>

                    <td>
                      {
                        receipt.vendorId
                      }
                    </td>

                    <td>
                      <GoodsReceiptStatusBadge
                        status={
                          receipt.status
                        }
                      />
                    </td>

                    <td>
                      {new Date(
                        receipt.receiptDate,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {receipt.deliveryNoteNumber ||
                        "—"}
                    </td>
                  </tr>
                ),
              )}

              {!receipts.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="muted"
                  >
                    No Goods Receipts found.
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
