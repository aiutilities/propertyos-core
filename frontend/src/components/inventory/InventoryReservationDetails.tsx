"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  expireInventoryReservation,
  fulfillInventoryReservation,
  getInventoryReservation,
  releaseInventoryReservation,
} from "@/hooks/useInventoryReservations";

import {
  InventoryStockReservation,
} from "@/types/inventory";

export default function InventoryReservationDetails({
  reservationId,
}: {
  reservationId: string;
}) {
  const [
    reservation,
    setReservation,
  ] =
    useState<InventoryStockReservation | null>(
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

  const [quantity, setQuantity] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setReservation(
        await getInventoryReservation(
          reservationId,
        ),
      );
    } catch (caught) {
      setReservation(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load stock reservation.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [reservationId]);

  async function transition(
    operation:
      | "release"
      | "fulfill"
      | "expire",
  ) {
    if (!personId.trim()) {
      setError(
        "Person ID is required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    const input = {
      personId: personId.trim(),
      quantity:
        quantity === ""
          ? undefined
          : Number(quantity),
      remarks:
        remarks.trim() ||
        undefined,
    };

    try {
      const updated =
        operation === "release"
          ? await releaseInventoryReservation(
              reservationId,
              input,
            )
          : operation === "fulfill"
            ? await fulfillInventoryReservation(
                reservationId,
                input,
              )
            : await expireInventoryReservation(
                reservationId,
                input,
              );

      setReservation(updated);
      setQuantity("");
      setRemarks("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to ${operation} reservation.`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading reservation…
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Reservation not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const actionable = [
    "ACTIVE",
    "PARTIALLY_FULFILLED",
  ].includes(reservation.status);

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Stock Reservation
          </p>
          <h1>
            {reservation.reservationNumber ??
              reservation.id}
          </h1>
          <p className="muted-text">
            {reservation.status}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/inventory/reservations"
        >
          Back to Reservations
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          {[
            [
              "Property",
              reservation.propertyId ??
                "—",
            ],
            [
              "Store",
              reservation.storeId,
            ],
            [
              "Item",
              reservation.itemId,
            ],
            [
              "Bin",
              reservation.binLocationId ??
                "—",
            ],
            [
              "Quantity",
              reservation.quantity,
            ],
            [
              "Fulfilled",
              reservation.fulfilledQuantity,
            ],
            [
              "Released",
              reservation.releasedQuantity,
            ],
            [
              "Expiry",
              reservation.expiresAt ??
                "—",
            ],
            [
              "Source",
              reservation.sourceType ??
                "—",
            ],
            [
              "Reference",
              reservation.referenceNumber ??
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

        {reservation.remarks ? (
          <p>{reservation.remarks}</p>
        ) : null}
      </section>

      {actionable ? (
        <section className="panel">
          <h2>Reservation Actions</h2>

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
              Quantity
              <input
                min="0.01"
                step="0.01"
                type="number"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
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
                transition("fulfill")
              }
            >
              Fulfill
            </button>

            <button
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                transition("release")
              }
            >
              Release
            </button>

            <button
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                transition("expire")
              }
            >
              Expire
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
