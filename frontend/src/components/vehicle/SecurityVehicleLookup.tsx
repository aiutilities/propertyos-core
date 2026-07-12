"use client";

import { useState } from "react";
import {
  lookupVehicle,
  recordVehicleMovement,
} from "@/hooks/useVehicles";
import { Vehicle } from "@/types/vehicle";

export default function SecurityVehicleLookup() {
  const [registration, setRegistration] = useState("");
  const [securityPersonId, setSecurityPersonId] =
    useState("");
  const [gate, setGate] = useState("");
  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function lookup() {
    setError("");
    setVehicle(null);

    try {
      setVehicle(await lookupVehicle(registration));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Vehicle not found.",
      );
    }
  }

  async function record(
    movementType: "ENTRY" | "EXIT",
  ) {
    if (!vehicle || !securityPersonId) {
      setError("Security person ID is required.");
      return;
    }

    setBusy(movementType);
    setError("");

    try {
      await recordVehicleMovement(
        vehicle.id,
        movementType,
        securityPersonId,
        gate || undefined,
      );

      setVehicle(
        await lookupVehicle(
          vehicle.registrationNumber,
        ),
      );
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

  return (
    <div className="stack-lg">
      <section className="panel">
        <h2>Vehicle Lookup</h2>

        <div className="toolbar">
          <input
            placeholder="Registration number"
            value={registration}
            onChange={(event) =>
              setRegistration(
                event.target.value.toUpperCase(),
              )
            }
          />

          <button onClick={lookup}>Lookup</button>
        </div>

        <div className="form-grid">
          <label>
            Security Person ID
            <input
              value={securityPersonId}
              onChange={(event) =>
                setSecurityPersonId(event.target.value)
              }
            />
          </label>

          <label>
            Gate
            <input
              value={gate}
              onChange={(event) =>
                setGate(event.target.value)
              }
            />
          </label>
        </div>
      </section>

      {error ? <div className="error-state">{error}</div> : null}

      {vehicle ? (
        <section className="panel">
          <h2>{vehicle.registrationNumber}</h2>

          <dl className="details-list">
            <div><dt>Status</dt><dd>{vehicle.status}</dd></div>
            <div><dt>Type</dt><dd>{vehicle.vehicleType.replaceAll("_", " ")}</dd></div>
            <div><dt>Vehicle</dt><dd>{[vehicle.make, vehicle.model].filter(Boolean).join(" · ") || "—"}</dd></div>
            <div><dt>Colour</dt><dd>{vehicle.colour ?? "—"}</dd></div>
            <div><dt>Parking</dt><dd>{vehicle.parkingSlot ?? "—"}</dd></div>
          </dl>

          {vehicle.status === "VERIFIED" ? (
            <div className="button-row">
              <button
                disabled={busy === "ENTRY"}
                onClick={() => record("ENTRY")}
              >
                Record Entry
              </button>

              <button
                disabled={busy === "EXIT"}
                onClick={() => record("EXIT")}
              >
                Record Exit
              </button>
            </div>
          ) : (
            <p className="text-danger">
              This vehicle is not verified for gate movement.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
