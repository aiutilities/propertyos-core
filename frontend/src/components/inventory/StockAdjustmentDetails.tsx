"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  cancelStockAdjustment,
  getStockAdjustment,
  postStockAdjustment,
} from "@/hooks/useStockAdjustments";

import {
  InventoryStockAdjustment,
} from "@/types/inventory";

function formatDate(
  value?: string,
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function StockAdjustmentDetails({
  adjustmentId,
}: {
  adjustmentId: string;
}) {
  const [
    adjustment,
    setAdjustment,
  ] =
    useState<InventoryStockAdjustment | null>(
      null,
    );
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [personId, setPersonId] =
    useState("");
  const [remarks, setRemarks] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setAdjustment(
        await getStockAdjustment(
          adjustmentId,
        ),
      );
    } catch (caught) {
      setAdjustment(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load stock adjustment.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [adjustmentId]);

  async function transition(
    operation: "post" | "cancel",
  ) {
    if (!personId.trim()) {
      setError(
        "Person ID is required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated =
        operation === "post"
          ? await postStockAdjustment(
              adjustmentId,
              {
                personId:
                  personId.trim(),
                remarks:
                  remarks.trim() ||
                  undefined,
              },
            )
          : await cancelStockAdjustment(
              adjustmentId,
              {
                personId:
                  personId.trim(),
                remarks:
                  remarks.trim() ||
                  undefined,
              },
            );

      setAdjustment(updated);
      setRemarks("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to ${operation} stock adjustment.`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading stock adjustment…
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Stock adjustment not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const isDraft =
    adjustment.status === "DRAFT";

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Stock Adjustment
          </p>
          <h1>
            {adjustment.adjustmentNumber ??
              adjustment.id}
          </h1>
          <p className="muted-text">
            {adjustment.status}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/inventory/adjustments"
        >
          Back to Adjustments
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          <div>
            <span className="muted-text">
              Property
            </span>
            <strong>
              {adjustment.propertyId ??
                "—"}
            </strong>
          </div>

          <div>
            <span className="muted-text">
              Store
            </span>
            <strong>
              {adjustment.storeId ??
                "—"}
            </strong>
          </div>

          <div>
            <span className="muted-text">
              Reason
            </span>
            <strong>
              {adjustment.reasonCode ??
                "—"}
            </strong>
          </div>

          <div>
            <span className="muted-text">
              Created
            </span>
            <strong>
              {formatDate(
                adjustment.createdAt,
              )}
            </strong>
          </div>

          <div>
            <span className="muted-text">
              Posted
            </span>
            <strong>
              {formatDate(
                adjustment.postedAt,
              )}
            </strong>
          </div>

          <div>
            <span className="muted-text">
              Cancelled
            </span>
            <strong>
              {formatDate(
                adjustment.cancelledAt,
              )}
            </strong>
          </div>
        </div>

        {adjustment.reasonDescription ||
        adjustment.remarks ? (
          <p>
            {adjustment.reasonDescription ??
              adjustment.remarks}
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Adjustment Lines</h2>

        {adjustment.items?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Bin</th>
                  <th>Quantity Delta</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                </tr>
              </thead>

              <tbody>
                {adjustment.items.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>{item.itemId}</td>
                      <td>
                        {item.binLocationId ??
                          "—"}
                      </td>
                      <td>
                        {item.quantityDelta}
                      </td>
                      <td>
                        {item.unitCost ??
                          "—"}
                      </td>
                      <td>
                        {item.totalCost ??
                          "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>
              No adjustment lines found.
            </p>
          </div>
        )}
      </section>

      {isDraft ? (
        <section className="panel">
          <h2>Adjustment Actions</h2>

          <div className="form-grid">
            <label>
              Person ID
              <input
                required
                value={personId}
                onChange={(event) =>
                  setPersonId(
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

          {error ? (
            <p className="text-danger">
              {error}
            </p>
          ) : null}

          <div className="form-actions">
            <button
              disabled={saving}
              onClick={() =>
                transition("post")
              }
            >
              {saving
                ? "Saving…"
                : "Post Adjustment"}
            </button>

            <button
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                transition("cancel")
              }
            >
              Cancel Adjustment
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
