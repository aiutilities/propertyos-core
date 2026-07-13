"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getVehicle,
  recordVehicleMovement,
  updateVehicleStatus,
} from "@/hooks/useVehicles";
import {
  Vehicle,
  VehicleMovementType,
  VehicleStatus,
} from "@/types/vehicle";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const statusActions: Partial<
  Record<VehicleStatus, VehicleStatus[]>
> = {
  PENDING: ["VERIFIED", "REJECTED", "ARCHIVED"],
  VERIFIED: ["SUSPENDED", "ARCHIVED"],
  REJECTED: ["PENDING", "ARCHIVED"],
  SUSPENDED: ["VERIFIED", "ARCHIVED"],
};

export default function VehicleDetails({
  vehicleId,
}: {
  vehicleId: string;
}) {
  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);
  const [actorPersonId, setActorPersonId] = useState("");
  const [reason, setReason] = useState("");
  const [gate, setGate] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");

    try {
      setVehicle(await getVehicle(vehicleId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load vehicle.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [vehicleId]);

  async function changeStatus(status: VehicleStatus) {
    if (!actorPersonId) {
      setError("Acting person ID is required.");
      return;
    }

    setBusy(status);
    setError("");

    try {
      await updateVehicleStatus(
        vehicleId,
        status,
        actorPersonId,
        reason || undefined,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update vehicle status.",
      );
    } finally {
      setBusy("");
    }
  }

  async function movement(
    movementType: VehicleMovementType,
  ) {
    if (!actorPersonId) {
      setError("Security person ID is required.");
      return;
    }

    setBusy(movementType);
    setError("");

    try {
      await recordVehicleMovement(
        vehicleId,
        movementType,
        actorPersonId,
        gate || undefined,
        reason || undefined,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record movement.",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="loading-state">Loading vehicle…</div>;
  }

  if (error && !vehicle) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={load}>Retry</button>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">Vehicle Registry</p>
          <h1>{vehicle.registrationNumber}</h1>
          <p>
            {[vehicle.make, vehicle.model, vehicle.colour]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/vehicles"
        >
          Back to Vehicles
        </Link>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Vehicle Details</h2>

          <dl className="details-list">
            <div><dt>Status</dt><dd>{vehicle.status}</dd></div>
            <div><dt>Type</dt><dd>{vehicle.vehicleType.replaceAll("_", " ")}</dd></div>
            <div><dt>Owner</dt><dd>{vehicle.ownerPersonId}</dd></div>
            <div><dt>Property</dt><dd>{vehicle.propertyId}</dd></div>
            <div><dt>Space</dt><dd>{vehicle.spaceId ?? "—"}</dd></div>
            <div><dt>Parking Slot</dt><dd>{vehicle.parkingSlot ?? "—"}</dd></div>
            <div><dt>RFID</dt><dd>{vehicle.rfidTag ?? "—"}</dd></div>
            <div><dt>Verified At</dt><dd>{formatDate(vehicle.verifiedAt)}</dd></div>
          </dl>

          <p>{vehicle.notes ?? "No notes."}</p>
        </section>

        <section className="panel">
          <h2>Administration & Gate Actions</h2>

          <input
            placeholder="Acting or security person ID"
            value={actorPersonId}
            onChange={(event) =>
              setActorPersonId(event.target.value)
            }
          />

          <input
            placeholder="Gate"
            value={gate}
            onChange={(event) =>
              setGate(event.target.value)
            }
          />

          <textarea
            placeholder="Reason or remarks"
            rows={3}
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
          />

          <div className="button-row">
            {(statusActions[vehicle.status] ?? []).map(
              (status) => (
                <button
                  disabled={busy === status}
                  key={status}
                  onClick={() => changeStatus(status)}
                >
                  {status}
                </button>
              ),
            )}
          </div>

          {vehicle.status === "VERIFIED" ? (
            <div className="button-row">
              <button
                disabled={busy === "ENTRY"}
                onClick={() => movement("ENTRY")}
              >
                Record Entry
              </button>
              <button
                disabled={busy === "EXIT"}
                onClick={() => movement("EXIT")}
              >
                Record Exit
              </button>
            </div>
          ) : null}

          {error ? <p className="text-danger">{error}</p> : null}
        </section>
      </div>

      <section className="panel">
        <h2>Movement History</h2>

        {(vehicle.movements ?? []).length > 0 ? (
          <div className="timeline">
            {(vehicle.movements ?? []).map((item) => (
              <article className="timeline-item" key={item.id}>
                <strong>{item.movementType}</strong>
                <span>{formatDate(item.occurredAt)}</span>
                <p>
                  {item.gate ?? "Gate not specified"}
                  {item.remarks ? ` — ${item.remarks}` : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p>No movement history available.</p>
        )}
      </section>
    </div>
  );
}
