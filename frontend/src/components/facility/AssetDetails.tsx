"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createPreventivePlan,
  getFacilityAsset,
  transitionFacilityAsset,
} from "@/hooks/useFacilities";
import {
  AssetStatus,
  FacilityAsset,
  PreventiveMaintenanceFrequency,
} from "@/types/facility";

const transitions: Partial<
  Record<AssetStatus, AssetStatus[]>
> = {
  DRAFT: ["ACTIVE", "DISPOSED"],
  ACTIVE: [
    "IN_MAINTENANCE",
    "OUT_OF_SERVICE",
    "RETIRED",
  ],
  IN_MAINTENANCE: [
    "ACTIVE",
    "OUT_OF_SERVICE",
    "RETIRED",
  ],
  OUT_OF_SERVICE: [
    "IN_MAINTENANCE",
    "ACTIVE",
    "RETIRED",
  ],
  RETIRED: ["DISPOSED"],
};

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AssetDetails({
  assetId,
}: {
  assetId: string;
}) {
  const [asset, setAsset] = useState<FacilityAsset | null>(
    null,
  );
  const [actorPersonId, setActorPersonId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState({
    name: "",
    description: "",
    frequency: "MONTHLY" as PreventiveMaintenanceFrequency,
    intervalDays: "",
    nextDueAt: "",
    assignedPersonId: "",
  });

  async function load() {
    setLoading(true);
    setError("");

    try {
      setAsset(await getFacilityAsset(assetId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load facility asset.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [assetId]);

  async function transition(status: AssetStatus) {
    if (!actorPersonId) {
      setError("Acting person ID is required.");
      return;
    }

    setBusy(status);
    setError("");

    try {
      await transitionFacilityAsset(
        assetId,
        status,
        actorPersonId,
        remarks,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update asset status.",
      );
    } finally {
      setBusy("");
    }
  }

  async function addPlan() {
    if (!actorPersonId || !plan.name || !plan.nextDueAt) {
      setError(
        "Plan name, next due date, and acting person are required.",
      );
      return;
    }

    setBusy("plan");
    setError("");

    try {
      await createPreventivePlan(assetId, {
        name: plan.name,
        description: plan.description || undefined,
        frequency: plan.frequency,
        intervalDays: plan.intervalDays
          ? Number(plan.intervalDays)
          : undefined,
        nextDueAt: new Date(plan.nextDueAt).toISOString(),
        assignedPersonId:
          plan.assignedPersonId || undefined,
        createdByPersonId: actorPersonId,
      });

      setPlan({
        name: "",
        description: "",
        frequency: "MONTHLY",
        intervalDays: "",
        nextDueAt: "",
        assignedPersonId: "",
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create preventive plan.",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="loading-state">Loading asset…</div>;
  }

  if (error && !asset) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={load}>Retry</button>
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">Facility Operations</p>
          <h1>{asset.assetNumber}</h1>
          <p>{asset.name}</p>
        </div>

        <Link
          className="secondary-button"
          href="/facilities/assets"
        >
          Back to Assets
        </Link>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Asset Details</h2>

          <dl className="details-list">
            <div><dt>Status</dt><dd>{asset.status}</dd></div>
            <div><dt>Condition</dt><dd>{asset.condition}</dd></div>
            <div><dt>Category</dt><dd>{asset.category?.name ?? asset.categoryId}</dd></div>
            <div><dt>Property</dt><dd>{asset.propertyId}</dd></div>
            <div><dt>Zone</dt><dd>{asset.zoneId ?? "—"}</dd></div>
            <div><dt>Space</dt><dd>{asset.spaceId ?? "—"}</dd></div>
            <div><dt>Manufacturer</dt><dd>{asset.manufacturer ?? "—"}</dd></div>
            <div><dt>Model</dt><dd>{asset.model ?? "—"}</dd></div>
            <div><dt>Serial Number</dt><dd>{asset.serialNumber ?? "—"}</dd></div>
            <div><dt>Warranty</dt><dd>{formatDate(asset.warrantyExpiresAt)}</dd></div>
            <div><dt>Vendor</dt><dd>{asset.vendorName ?? "—"}</dd></div>
            <div><dt>QR Token</dt><dd>{asset.qrToken}</dd></div>
          </dl>

          <p>{asset.description ?? "No description."}</p>
        </section>

        <section className="panel">
          <h2>Lifecycle Actions</h2>

          <input
            placeholder="Acting person ID"
            value={actorPersonId}
            onChange={(event) =>
              setActorPersonId(event.target.value)
            }
          />

          <textarea
            placeholder="Remarks"
            rows={3}
            value={remarks}
            onChange={(event) =>
              setRemarks(event.target.value)
            }
          />

          <div className="button-row">
            {(transitions[asset.status] ?? []).map((status) => (
              <button
                disabled={busy === status}
                key={status}
                onClick={() => transition(status)}
              >
                {status.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          {error ? <p className="text-danger">{error}</p> : null}
        </section>
      </div>

      <section className="panel">
        <h2>Preventive Maintenance</h2>

        <div className="form-grid">
          <label>
            Plan Name
            <input
              value={plan.name}
              onChange={(event) =>
                setPlan({
                  ...plan,
                  name: event.target.value,
                })
              }
            />
          </label>

          <label>
            Frequency
            <select
              value={plan.frequency}
              onChange={(event) =>
                setPlan({
                  ...plan,
                  frequency:
                    event.target
                      .value as PreventiveMaintenanceFrequency,
                })
              }
            >
              {[
                "DAILY",
                "WEEKLY",
                "MONTHLY",
                "QUARTERLY",
                "HALF_YEARLY",
                "YEARLY",
                "CUSTOM",
              ].map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label>
            Interval Days
            <input
              min="1"
              type="number"
              value={plan.intervalDays}
              onChange={(event) =>
                setPlan({
                  ...plan,
                  intervalDays: event.target.value,
                })
              }
            />
          </label>

          <label>
            Next Due
            <input
              type="datetime-local"
              value={plan.nextDueAt}
              onChange={(event) =>
                setPlan({
                  ...plan,
                  nextDueAt: event.target.value,
                })
              }
            />
          </label>

          <label>
            Assigned Person ID
            <input
              value={plan.assignedPersonId}
              onChange={(event) =>
                setPlan({
                  ...plan,
                  assignedPersonId: event.target.value,
                })
              }
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            rows={3}
            value={plan.description}
            onChange={(event) =>
              setPlan({
                ...plan,
                description: event.target.value,
              })
            }
          />
        </label>

        <button
          disabled={busy === "plan"}
          onClick={addPlan}
        >
          {busy === "plan"
            ? "Creating…"
            : "Add Preventive Plan"}
        </button>

        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Frequency</th>
                  <th>Next Due</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {(asset.preventivePlans ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.frequency}</td>
                    <td>{formatDate(item.nextDueAt)}</td>
                    <td>{item.assignedPersonId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Asset History</h2>

        {(asset.history ?? []).length > 0 ? (
          <div className="timeline">
            {(asset.history ?? []).map((entry) => (
              <article className="timeline-item" key={entry.id}>
                <strong>
                  {entry.toStatus.replaceAll("_", " ")}
                </strong>
                <span>{formatDate(entry.createdAt)}</span>
                <p>{entry.remarks ?? "No remarks"}</p>
              </article>
            ))}
          </div>
        ) : (
          <p>No asset history available.</p>
        )}
      </section>
    </div>
  );
}
