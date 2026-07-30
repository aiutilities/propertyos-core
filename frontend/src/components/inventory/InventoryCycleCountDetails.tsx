"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  cancelInventoryCycleCount,
  completeInventoryCycleCount,
  getInventoryCycleCount,
  postInventoryCycleCount,
  recordInventoryCycleCount,
  startInventoryCycleCount,
} from "@/hooks/useInventoryCycleCounts";

import {
  InventoryCycleCount,
} from "@/types/inventory";

type CountValues =
  Record<string, string>;

type CountRemarks =
  Record<string, string>;

export default function InventoryCycleCountDetails({
  countId,
}: {
  countId: string;
}) {
  const [count, setCount] =
    useState<InventoryCycleCount | null>(
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

  const [values, setValues] =
    useState<CountValues>({});

  const [remarks, setRemarks] =
    useState<CountRemarks>({});

  const lines = useMemo(
    () =>
      count?.items ??
      count?.lines ??
      [],
    [count],
  );

  async function load() {
    setLoading(true);
    setError("");

    try {
      const next =
        await getInventoryCycleCount(
          countId,
        );

      setCount(next);

      const nextLines =
        next.items ??
        next.lines ??
        [];

      setValues(
        Object.fromEntries(
          nextLines.map((line) => [
            line.id,
            line.countedQuantity ===
            undefined
              ? ""
              : String(
                  line.countedQuantity,
                ),
          ]),
        ),
      );

      setRemarks(
        Object.fromEntries(
          nextLines.map((line) => [
            line.id,
            line.remarks ?? "",
          ]),
        ),
      );
    } catch (caught) {
      setCount(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load cycle count.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [countId]);

  async function execute(
    operation:
      | "start"
      | "record"
      | "complete"
      | "post"
      | "cancel",
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
        operation === "start"
          ? await startInventoryCycleCount(
              countId,
              personId.trim(),
            )
          : operation === "record"
            ? await recordInventoryCycleCount(
                countId,
                personId.trim(),
                lines.map((line) => ({
                  cycleCountItemId:
                    line.id,
                  countedQuantity:
                    Number(
                      values[line.id] ??
                        0,
                    ),
                  remarks:
                    remarks[line.id]
                      ?.trim() ||
                    undefined,
                })),
              )
            : operation === "complete"
              ? await completeInventoryCycleCount(
                  countId,
                  personId.trim(),
                )
              : operation === "post"
                ? await postInventoryCycleCount(
                    countId,
                    personId.trim(),
                  )
                : await cancelInventoryCycleCount(
                    countId,
                    personId.trim(),
                    cancellationReason.trim(),
                  );

      setCount(updated);
      setPersonId("");
      setCancellationReason("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to ${operation} cycle count.`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading cycle count…
      </div>
    );
  }

  if (!count) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Cycle count not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const canStart =
    count.status === "DRAFT";

  const canRecord =
    count.status === "IN_PROGRESS";

  const canComplete =
    count.status === "IN_PROGRESS";

  const canPost =
    count.status === "COMPLETED";

  const canCancel = [
    "DRAFT",
    "IN_PROGRESS",
    "COMPLETED",
  ].includes(count.status);

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Inventory Cycle Count
          </p>
          <h1>{count.countNumber}</h1>
          <p className="muted-text">
            {count.status}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/inventory/cycle-counts"
        >
          Back to Cycle Counts
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          {[
            ["Property", count.propertyId],
            ["Store", count.storeId],
            ["Count Date", count.countDate],
            ["Scope", count.scopeType],
            [
              "Blind Count",
              count.blindCount
                ? "Yes"
                : "No",
            ],
            [
              "Freeze Stock",
              count.freezeStock
                ? "Yes"
                : "No",
            ],
            [
              "Created By",
              count.createdByPersonId,
            ],
            [
              "Started By",
              count.startedByPersonId ??
                "—",
            ],
            [
              "Completed By",
              count.completedByPersonId ??
                "—",
            ],
            [
              "Posted By",
              count.postedByPersonId ??
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

        {count.notes ? (
          <p>{count.notes}</p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Count Lines</h2>

        {lines.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Bin</th>
                  <th>Batch</th>
                  {!count.blindCount ? (
                    <th>System Quantity</th>
                  ) : null}
                  <th>Counted Quantity</th>
                  <th>Variance</th>
                  {canRecord ? (
                    <th>Remarks</th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {lines.map((line) => {
                  const expected =
                    line.expectedQuantity ??
                    line.systemQuantity;

                  const counted =
                    line.countedQuantity;

                  const variance =
                    line.varianceQuantity ??
                    (
                      counted !== undefined &&
                      expected !== undefined
                        ? counted -
                          expected
                        : undefined
                    );

                  return (
                    <tr key={line.id}>
                      <td>{line.itemId}</td>
                      <td>
                        {line.binLocationId ??
                          "—"}
                      </td>
                      <td>
                        {line.batchId ?? "—"}
                      </td>

                      {!count.blindCount ? (
                        <td>
                          {expected ?? "—"}
                        </td>
                      ) : null}

                      <td>
                        {canRecord ? (
                          <input
                            min="0"
                            step="0.000001"
                            type="number"
                            value={
                              values[
                                line.id
                              ] ?? ""
                            }
                            onChange={(
                              event,
                            ) =>
                              setValues(
                                (current) => ({
                                  ...current,
                                  [line.id]:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                          />
                        ) : (
                          counted ?? "—"
                        )}
                      </td>

                      <td>
                        {variance ?? "—"}
                      </td>

                      {canRecord ? (
                        <td>
                          <input
                            value={
                              remarks[
                                line.id
                              ] ?? ""
                            }
                            onChange={(
                              event,
                            ) =>
                              setRemarks(
                                (current) => ({
                                  ...current,
                                  [line.id]:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>
              Count lines will be generated
              when the cycle count starts.
            </p>
          </div>
        )}
      </section>

      {(canStart ||
        canRecord ||
        canComplete ||
        canPost ||
        canCancel) ? (
        <section className="panel">
          <h2>Cycle Count Actions</h2>

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

            {canCancel ? (
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
            ) : null}
          </div>

          {error ? (
            <p className="text-danger">
              {error}
            </p>
          ) : null}

          <div className="form-actions">
            {canStart ? (
              <button
                disabled={saving}
                onClick={() =>
                  execute("start")
                }
              >
                Start Count
              </button>
            ) : null}

            {canRecord &&
            lines.length ? (
              <button
                disabled={saving}
                onClick={() =>
                  execute("record")
                }
              >
                Save Counted Quantities
              </button>
            ) : null}

            {canComplete ? (
              <button
                disabled={saving}
                onClick={() =>
                  execute("complete")
                }
              >
                Complete Count
              </button>
            ) : null}

            {canPost ? (
              <button
                disabled={saving}
                onClick={() =>
                  execute("post")
                }
              >
                Post Adjustments
              </button>
            ) : null}

            {canCancel ? (
              <button
                className="secondary-button"
                disabled={saving}
                onClick={() =>
                  execute("cancel")
                }
              >
                Cancel Count
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
