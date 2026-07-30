"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  cancelInventoryTransfer,
  dispatchInventoryTransfer,
  getInventoryTransfer,
  receiveInventoryTransfer,
} from "@/hooks/useInventoryTransfers";

import {
  InventoryStockTransfer,
} from "@/types/inventory";

type QuantityMap =
  Record<string, string>;

export default function InventoryTransferDetails({
  transferId,
}: {
  transferId: string;
}) {
  const [transfer, setTransfer] =
    useState<InventoryStockTransfer | null>(
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

  const [quantities, setQuantities] =
    useState<QuantityMap>({});

  async function load() {
    setLoading(true);
    setError("");

    try {
      const next =
        await getInventoryTransfer(
          transferId,
        );

      setTransfer(next);

      setQuantities(
        Object.fromEntries(
          (next.items ?? []).map(
            (item) => [
              item.id,
              String(
                next.status === "DRAFT"
                  ? item.quantity
                  : Math.max(
                      item.dispatchedQuantity -
                        item.receivedQuantity,
                      0,
                    ),
              ),
            ],
          ),
        ),
      );
    } catch (caught) {
      setTransfer(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory transfer.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [transferId]);

  async function execute(
    operation:
      | "dispatch"
      | "receive"
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

    if (!transfer) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const items = (
        transfer.items ?? []
      ).map((item) => ({
        transferItemId: item.id,
        quantity: Number(
          quantities[item.id] ?? 0,
        ),
      }));

      const updated =
        operation === "dispatch"
          ? await dispatchInventoryTransfer(
              transfer.id,
              personId.trim(),
              items,
            )
          : operation === "receive"
            ? await receiveInventoryTransfer(
                transfer.id,
                personId.trim(),
                items,
              )
            : await cancelInventoryTransfer(
                transfer.id,
                personId.trim(),
                cancellationReason.trim(),
              );

      setTransfer(updated);
      setPersonId("");
      setCancellationReason("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to ${operation} transfer.`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading inventory transfer…
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Inventory transfer not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const canDispatch =
    transfer.status === "DRAFT";

  const canReceive =
    transfer.status === "DISPATCHED";

  const canCancel = [
    "DRAFT",
    "DISPATCHED",
  ].includes(transfer.status);

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Inventory Transfer
          </p>
          <h1>
            {transfer.transferNumber}
          </h1>
          <p className="muted-text">
            {transfer.status}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/inventory/transfers"
        >
          Back to Transfers
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          {[
            [
              "Property",
              transfer.propertyId,
            ],
            [
              "Source Store",
              transfer.sourceStoreId,
            ],
            [
              "Destination Store",
              transfer.destinationStoreId,
            ],
            [
              "Transfer Date",
              transfer.transferDate,
            ],
            [
              "Created By",
              transfer.createdByPersonId,
            ],
            [
              "Dispatched By",
              transfer.dispatchedByPersonId ??
                "—",
            ],
            [
              "Received By",
              transfer.receivedByPersonId ??
                "—",
            ],
            [
              "Cancelled By",
              transfer.cancelledByPersonId ??
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

        {transfer.remarks ? (
          <p>{transfer.remarks}</p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Transfer Lines</h2>

        {transfer.items?.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Source Bin</th>
                  <th>Destination Bin</th>
                  <th>Requested</th>
                  <th>Dispatched</th>
                  <th>Received</th>
                  {(canDispatch ||
                    canReceive) ? (
                    <th>
                      Action Quantity
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {transfer.items.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {item.itemId}
                      </td>
                      <td>
                        {item.sourceBinLocationId ??
                          "—"}
                      </td>
                      <td>
                        {item.destinationBinLocationId ??
                          "—"}
                      </td>
                      <td>
                        {item.quantity}
                      </td>
                      <td>
                        {item.dispatchedQuantity}
                      </td>
                      <td>
                        {item.receivedQuantity}
                      </td>

                      {(canDispatch ||
                        canReceive) ? (
                        <td>
                          <input
                            min="0.000001"
                            step="0.000001"
                            type="number"
                            value={
                              quantities[
                                item.id
                              ] ?? ""
                            }
                            onChange={(
                              event,
                            ) =>
                              setQuantities(
                                (current) => ({
                                  ...current,
                                  [item.id]:
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
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>
              No transfer lines found.
            </p>
          </div>
        )}
      </section>

      {(canDispatch ||
        canReceive ||
        canCancel) ? (
        <section className="panel">
          <h2>Transfer Actions</h2>

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
            {canDispatch ? (
              <button
                disabled={saving}
                onClick={() =>
                  execute("dispatch")
                }
              >
                Dispatch Transfer
              </button>
            ) : null}

            {canReceive ? (
              <button
                disabled={saving}
                onClick={() =>
                  execute("receive")
                }
              >
                Receive Transfer
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
                Cancel Transfer
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
