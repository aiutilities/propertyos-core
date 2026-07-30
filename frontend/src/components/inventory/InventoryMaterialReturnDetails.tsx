"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  cancelInventoryMaterialReturn,
  getInventoryMaterialReturn,
  postInventoryMaterialReturn,
} from "@/hooks/useInventoryMaterialReturns";

import {
  InventoryMaterialReturn,
} from "@/types/inventory";

export default function InventoryMaterialReturnDetails({
  returnId,
}: {
  returnId: string;
}) {
  const [
    materialReturn,
    setMaterialReturn,
  ] =
    useState<InventoryMaterialReturn | null>(
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

  const [
    cancellationReason,
    setCancellationReason,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setMaterialReturn(
        await getInventoryMaterialReturn(
          returnId,
        ),
      );
    } catch (caught) {
      setMaterialReturn(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load material return.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [returnId]);

  async function execute(
    operation: "post" | "cancel",
  ) {
    if (!personId.trim()) {
      setError(
        "Person ID is required.",
      );
      return;
    }

    if (
      operation === "cancel" &&
      !cancellationReason.trim()
    ) {
      setError(
        "Cancellation reason is required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated =
        operation === "post"
          ? await postInventoryMaterialReturn(
              returnId,
              personId.trim(),
            )
          : await cancelInventoryMaterialReturn(
              returnId,
              personId.trim(),
              cancellationReason.trim(),
            );

      setMaterialReturn(updated);
      setPersonId("");
      setCancellationReason("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to ${operation} material return.`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading material return…
      </div>
    );
  }

  if (!materialReturn) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Material return not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const isDraft =
    materialReturn.status === "DRAFT";

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Material Return
          </p>
          <h1>
            {materialReturn.returnNumber}
          </h1>
          <p className="muted-text">
            {materialReturn.status}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/inventory/material-returns"
        >
          Back to Material Returns
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          {[
            [
              "Property",
              materialReturn.propertyId,
            ],
            [
              "Store",
              materialReturn.storeId,
            ],
            [
              "Material Issue",
              materialReturn.materialIssueId ??
                "—",
            ],
            [
              "Return Date",
              materialReturn.returnDate,
            ],
            [
              "Reason",
              materialReturn.reasonCode,
            ],
            [
              "Returned By",
              materialReturn.returnedByPersonId ??
                "—",
            ],
            [
              "Created By",
              materialReturn.createdByPersonId,
            ],
            [
              "Posted By",
              materialReturn.postedByPersonId ??
                "—",
            ],
            [
              "Cancelled By",
              materialReturn.cancelledByPersonId ??
                "—",
            ],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <span className="muted-text">
                {label}
              </span>
              <strong>
                {String(value)}
              </strong>
            </div>
          ))}
        </div>

        {materialReturn.reasonDescription ? (
          <p>
            {materialReturn.reasonDescription}
          </p>
        ) : null}

        {materialReturn.remarks ? (
          <p>{materialReturn.remarks}</p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Material Return Lines</h2>

        {materialReturn.items?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Bin</th>
                  <th>Batch</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {materialReturn.items.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>{item.itemId}</td>
                      <td>
                        {item.binLocationId ??
                          "—"}
                      </td>
                      <td>
                        {item.batchId ?? "—"}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{item.unitCost}</td>
                      <td>
                        {item.remarks ?? "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No return lines found.</p>
          </div>
        )}
      </section>

      {isDraft ? (
        <section className="panel">
          <h2>Material Return Actions</h2>

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
              Cancellation Reason
              <input
                value={
                  cancellationReason
                }
                onChange={(event) =>
                  setCancellationReason(
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
                execute("post")
              }
            >
              Post Material Return
            </button>

            <button
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                execute("cancel")
              }
            >
              Cancel Material Return
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
