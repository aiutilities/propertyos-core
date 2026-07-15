"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useGoodsReceipts,
} from "@/hooks/useGoodsReceipts";

import type {
  CreateGoodsReceiptItemInput,
  ReceivablePurchaseOrder,
} from "@/types/goodsReceipt";

export function GoodsReceiptForm() {
  const router =
    useRouter();

  const {
    loading,
    error,
    listReceivablePurchaseOrders,
    getPurchaseOrder,
    createGoodsReceipt,
  } = useGoodsReceipts();

  const [
    orders,
    setOrders,
  ] = useState<
    ReceivablePurchaseOrder[]
  >([]);

  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<ReceivablePurchaseOrder | null>(
      null,
    );

  const [
    form,
    setForm,
  ] = useState({
    purchaseOrderId: "",
    receiptDate: "",
    deliveryNoteNumber: "",
    invoiceNumber: "",
    receivedByPersonId: "",
    notes: "",
  });

  const [
    items,
    setItems,
  ] = useState<
    CreateGoodsReceiptItemInput[]
  >([]);

  useEffect(
    () => {
      void listReceivablePurchaseOrders()
        .then(setOrders);
    },
    [
      listReceivablePurchaseOrders,
    ],
  );

  function setField(
    field:
      keyof typeof form,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  async function chooseOrder(
    purchaseOrderId: string,
  ) {
    setField(
      "purchaseOrderId",
      purchaseOrderId,
    );

    if (!purchaseOrderId) {
      setSelectedOrder(null);
      setItems([]);
      return;
    }

    const order =
      await getPurchaseOrder(
        purchaseOrderId,
      );

    setSelectedOrder(order);

    setItems(
      (order.items || [])
        .filter(
          (item) =>
            Number(
              item.receivedQuantity,
            ) <
            Number(
              item.orderedQuantity,
            ),
        )
        .map(
          (item) => ({
            purchaseOrderItemId:
              item.id,
            receivedQuantity: 0,
            acceptedQuantity: 0,
            rejectedQuantity: 0,
          }),
        ),
    );
  }

  function updateItem(
    index: number,
    patch: Partial<
      CreateGoodsReceiptItemInput
    >,
  ) {
    setItems(
      (rows) =>
        rows.map(
          (
            row,
            rowIndex,
          ) =>
            rowIndex === index
              ? {
                  ...row,
                  ...patch,
                }
              : row,
        ),
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const receipt =
      await createGoodsReceipt({
        purchaseOrderId:
          form.purchaseOrderId,
        receiptDate:
          form.receiptDate ||
          undefined,
        deliveryNoteNumber:
          form.deliveryNoteNumber.trim() ||
          undefined,
        invoiceNumber:
          form.invoiceNumber.trim() ||
          undefined,
        receivedByPersonId:
          form.receivedByPersonId.trim(),
        notes:
          form.notes.trim() ||
          undefined,
        items:
          items.filter(
            (item) =>
              item.receivedQuantity >
              0,
          ),
      });

    router.push(
      `/procurement/goods-receipts/${receipt.id}`,
    );
  }

  return (
    <form
      className="stack"
      onSubmit={submit}
    >
      <section className="panel stack">
        <h2>
          Receipt information
        </h2>

        <div className="form-grid">
          <label>
            Purchase Order

            <select
              required
              value={
                form.purchaseOrderId
              }
              onChange={(event) =>
                void chooseOrder(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select Purchase Order
              </option>

              {orders.map(
                (order) => (
                  <option
                    key={order.id}
                    value={order.id}
                  >
                    {
                      order.purchaseOrderNumber
                    }{" "}
                    —{" "}
                    {order.title}{" "}
                    —{" "}
                    {order.status}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Received by person ID

            <input
              required
              value={
                form.receivedByPersonId
              }
              onChange={(event) =>
                setField(
                  "receivedByPersonId",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Receipt date

            <input
              type="date"
              value={
                form.receiptDate
              }
              onChange={(event) =>
                setField(
                  "receiptDate",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Delivery note number

            <input
              value={
                form.deliveryNoteNumber
              }
              onChange={(event) =>
                setField(
                  "deliveryNoteNumber",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Vendor invoice number

            <input
              value={
                form.invoiceNumber
              }
              onChange={(event) =>
                setField(
                  "invoiceNumber",
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        {selectedOrder ? (
          <div className="details-grid">
            <div>
              <span className="muted">
                Vendor
              </span>

              <strong>
                {
                  selectedOrder.vendorId
                }
              </strong>
            </div>

            <div>
              <span className="muted">
                Purchase Order value
              </span>

              <strong>
                {
                  selectedOrder.currency
                }{" "}
                {Number(
                  selectedOrder.totalAmount,
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="muted">
                Status
              </span>

              <strong>
                {
                  selectedOrder.status
                }
              </strong>
            </div>
          </div>
        ) : null}

        <label>
          Notes

          <textarea
            value={form.notes}
            onChange={(event) =>
              setField(
                "notes",
                event.target.value,
              )
            }
          />
        </label>
      </section>

      <section className="panel table-scroll">
        <h2>
          Receipt quantities
        </h2>

        {!selectedOrder ? (
          <p className="muted">
            Select a Purchase Order to
            load its open quantities.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Line
                </th>

                <th>
                  Description
                </th>

                <th>
                  Ordered
                </th>

                <th>
                  Previously received
                </th>

                <th>
                  Remaining
                </th>

                <th>
                  Received now
                </th>

                <th>
                  Accepted
                </th>

                <th>
                  Rejected
                </th>

                <th>
                  Inspection notes
                </th>
              </tr>
            </thead>

            <tbody>
              {(selectedOrder.items || [])
                .filter(
                  (orderItem) =>
                    Number(
                      orderItem.receivedQuantity,
                    ) <
                    Number(
                      orderItem.orderedQuantity,
                    ),
                )
                .map(
                  (
                    orderItem,
                    index,
                  ) => {
                    const remaining =
                      Number(
                        orderItem.orderedQuantity,
                      ) -
                      Number(
                        orderItem.receivedQuantity,
                      );

                    const receiptItem =
                      items[index];

                    return (
                      <tr
                        key={
                          orderItem.id
                        }
                      >
                        <td>
                          {
                            orderItem.lineNumber
                          }
                        </td>

                        <td>
                          {
                            orderItem.description
                          }
                        </td>

                        <td>
                          {
                            orderItem.orderedQuantity
                          }{" "}
                          {
                            orderItem.unit
                          }
                        </td>

                        <td>
                          {
                            orderItem.receivedQuantity
                          }{" "}
                          {
                            orderItem.unit
                          }
                        </td>

                        <td>
                          {remaining}{" "}
                          {
                            orderItem.unit
                          }
                        </td>

                        <td>
                          <input
                            min="0"
                            max={
                              remaining
                            }
                            step="0.01"
                            type="number"
                            value={
                              receiptItem
                                ?.receivedQuantity ??
                              0
                            }
                            onChange={(
                              event,
                            ) => {
                              const received =
                                Number(
                                  event
                                    .target
                                    .value,
                                );

                              updateItem(
                                index,
                                {
                                  receivedQuantity:
                                    received,
                                  acceptedQuantity:
                                    received,
                                  rejectedQuantity:
                                    0,
                                },
                              );
                            }}
                          />
                        </td>

                        <td>
                          <input
                            min="0"
                            max={
                              receiptItem
                                ?.receivedQuantity ??
                              0
                            }
                            step="0.01"
                            type="number"
                            value={
                              receiptItem
                                ?.acceptedQuantity ??
                              0
                            }
                            onChange={(
                              event,
                            ) => {
                              const accepted =
                                Number(
                                  event
                                    .target
                                    .value,
                                );

                              const received =
                                receiptItem
                                  ?.receivedQuantity ??
                                0;

                              updateItem(
                                index,
                                {
                                  acceptedQuantity:
                                    accepted,
                                  rejectedQuantity:
                                    Math.max(
                                      received -
                                        accepted,
                                      0,
                                    ),
                                },
                              );
                            }}
                          />
                        </td>

                        <td>
                          <input
                            readOnly
                            type="number"
                            value={
                              receiptItem
                                ?.rejectedQuantity ??
                              0
                            }
                          />
                        </td>

                        <td>
                          <input
                            value={
                              receiptItem
                                ?.inspectionNotes ??
                              ""
                            }
                            onChange={(
                              event,
                            ) =>
                              updateItem(
                                index,
                                {
                                  inspectionNotes:
                                    event
                                      .target
                                      .value,
                                  rejectionReason:
                                    (
                                      receiptItem
                                        ?.rejectedQuantity ??
                                      0
                                    ) > 0
                                      ? event
                                          .target
                                          .value
                                      : undefined,
                                },
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  },
                )}
            </tbody>
          </table>
        )}
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <button
        className="button"
        disabled={
          loading ||
          !items.some(
            (item) =>
              item.receivedQuantity >
              0,
          )
        }
        type="submit"
      >
        {loading
          ? "Creating…"
          : "Create Goods Receipt"}
      </button>
    </form>
  );
}
