"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createVehicle } from "@/hooks/useVehicles";
import { VehicleType } from "@/types/vehicle";

export default function VehicleForm({
  residentMode = false,
}: {
  residentMode?: boolean;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    registrationNumber: "",
    vehicleType: "CAR" as VehicleType,
    ownerPersonId: "",
    propertyId: "",
    spaceId: "",
    parkingSlot: "",
    make: "",
    model: "",
    colour: "",
    yearOfManufacture: "",
    rfidTag: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const vehicle = await createVehicle({
        ...form,
        spaceId: form.spaceId || undefined,
        parkingSlot: form.parkingSlot || undefined,
        make: form.make || undefined,
        model: form.model || undefined,
        colour: form.colour || undefined,
        yearOfManufacture:
          form.yearOfManufacture
            ? Number(form.yearOfManufacture)
            : undefined,
        rfidTag: form.rfidTag || undefined,
        notes: form.notes || undefined,
      });

      router.push(
        residentMode
          ? "/resident/vehicles"
          : `/vehicles/${vehicle.id}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register vehicle.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Registration Number
          <input
            required
            placeholder="TN 59 AB 1234"
            value={form.registrationNumber}
            onChange={(event) =>
              update(
                "registrationNumber",
                event.target.value.toUpperCase(),
              )
            }
          />
        </label>

        <label>
          Vehicle Type
          <select
            value={form.vehicleType}
            onChange={(event) =>
              update("vehicleType", event.target.value)
            }
          >
            {[
              "TWO_WHEELER",
              "CAR",
              "COMMERCIAL",
              "BICYCLE",
              "OTHER",
            ].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          Owner Person ID
          <input
            required
            value={form.ownerPersonId}
            onChange={(event) =>
              update("ownerPersonId", event.target.value)
            }
          />
        </label>

        <label>
          Property ID
          <input
            required
            value={form.propertyId}
            onChange={(event) =>
              update("propertyId", event.target.value)
            }
          />
        </label>

        <label>
          Space ID
          <input
            value={form.spaceId}
            onChange={(event) =>
              update("spaceId", event.target.value)
            }
          />
        </label>

        <label>
          Parking Slot
          <input
            value={form.parkingSlot}
            onChange={(event) =>
              update("parkingSlot", event.target.value)
            }
          />
        </label>

        <label>
          Make
          <input
            value={form.make}
            onChange={(event) =>
              update("make", event.target.value)
            }
          />
        </label>

        <label>
          Model
          <input
            value={form.model}
            onChange={(event) =>
              update("model", event.target.value)
            }
          />
        </label>

        <label>
          Colour
          <input
            value={form.colour}
            onChange={(event) =>
              update("colour", event.target.value)
            }
          />
        </label>

        <label>
          Year of Manufacture
          <input
            min="1900"
            max="2200"
            type="number"
            value={form.yearOfManufacture}
            onChange={(event) =>
              update(
                "yearOfManufacture",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          RFID Tag
          <input
            value={form.rfidTag}
            onChange={(event) =>
              update("rfidTag", event.target.value)
            }
          />
        </label>
      </div>

      <label>
        Notes
        <textarea
          rows={4}
          value={form.notes}
          onChange={(event) =>
            update("notes", event.target.value)
          }
        />
      </label>

      {error ? <p className="text-danger">{error}</p> : null}

      <div className="form-actions">
        <button disabled={saving} type="submit">
          {saving ? "Registering…" : "Register Vehicle"}
        </button>
      </div>
    </form>
  );
}
