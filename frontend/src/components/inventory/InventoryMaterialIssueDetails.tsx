"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  cancelInventoryMaterialIssue,
  getInventoryMaterialIssue,
  postInventoryMaterialIssue,
} from "@/hooks/useInventoryMaterialIssues";

import {
  InventoryMaterialIssue,
} from "@/types/inventory";

export default function InventoryMaterialIssueDetails({
  issueId,
}: {
  issueId: string;
}) {
  const [issue, setIssue] =
    useState<InventoryMaterialIssue | null>(
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
      setIssue(
        await getInventoryMaterialIssue(
          issueId,
        ),
      );
    } catch (caught) {
      setIssue(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load material issue.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [issueId]);

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
          ? await postInventoryMaterialIssue(
              issueId,
              personId.trim(),
            )
          : await cancelInventoryMaterialIssue(
              issueId,
              personId.trim(),
              cancellationReason.trim(),
            );

      setIssue(updated);
      setPersonId("");
      setCancellationReason("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to ${operation} material issue.`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading material issue…
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Material issue not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const isDraft =
    issue.status === "DRAFT";

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Material Issue
          </p>
          <h1>{issue.issueNumber}</h1>
          <p className="muted-text">
            {issue.status}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/inventory/material-issues"
        >
          Back to Material Issues
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          {[
            ["Property", issue.propertyId],
            ["Store", issue.storeId],
            ["Issue Date", issue.issueDate],
            ["Reason", issue.reasonCode],
            [
              "Requested By",
              issue.requestedByPersonId ??
                "—",
            ],
            [
              "Created By",
              issue.createdByPersonId,
            ],
            [
              "Posted By",
              issue.postedByPersonId ??
                "—",
            ],
            [
              "Cancelled By",
              issue.cancelledByPersonId ??
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

        {issue.reasonDescription ? (
          <p>{issue.reasonDescription}</p>
        ) : null}

        {issue.remarks ? (
          <p>{issue.remarks}</p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Material Issue Lines</h2>

        {issue.items?.length ? (
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
                {issue.items.map((item) => (
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No issue lines found.</p>
          </div>
        )}
      </section>

      {isDraft ? (
        <section className="panel">
          <h2>Material Issue Actions</h2>

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
              Post Material Issue
            </button>

            <button
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                execute("cancel")
              }
            >
              Cancel Material Issue
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
