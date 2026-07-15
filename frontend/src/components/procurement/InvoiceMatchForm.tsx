"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useInvoiceMatches,
} from "@/hooks/useInvoiceMatches";

import type {
  CreateInvoiceMatchItemInput,
  InvoiceMatchGoodsReceipt,
  InvoiceMatchPurchaseOrder,
} from "@/types/invoiceMatch";

export function InvoiceMatchForm() {
  const router =
    useRouter();

  const {
    loading,
    error,
    listMatchablePurchaseOrders,
    getPurchaseOrder,
    listPostedGoodsReceipts,
    getGoodsReceipt,
    createInvoiceMatch,
  } = useInvoiceMatches();

  const [
    orders,
    setOrders,
  ] = useState<
    InvoiceMatchPurchaseOrder[]
  >([]);

  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<InvoiceMatchPurchaseOrder | null>(
      null,
    );

  const [
    goodsReceipts,
    setGoodsReceipts,
  ] = useState<
    InvoiceMatchGoodsReceipt[]
  >([]);

  const [
    selectedReceipt,
    setSelectedReceipt,
  ] =
    useState<InvoiceMatchGoodsReceipt | null>(
      null,
    );

  const [
    form,
    setForm,
  ] = useState({
    purchaseOrderId: "",
    goodsReceiptId: "",
    externalInvoiceNumber: "",
    invoiceDate: "",
    invoiceAmount: "",
    matchedByPersonId: "",
    remarks: "",
  });

  const [
    items,
    setItems,
  ] = useState<
    CreateInvoiceMatchItemInput[]
  >([]);

  useEffect(
    () => {
      void listMatchablePurchaseOrders()
        .then(setOrders);
    },
    [
      listMatchablePurchaseOrders,
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

    setField(
      "goodsReceiptId",
      "",
    );

    setSelectedReceipt(null);

    if (!purchaseOrderId) {
      setSelectedOrder(null);
      setGoodsReceipts([]);
      setItems([]);
      return;
    }

    const [
      order,
      receipts,
    ] =
      await Promise.all([
        getPurchaseOrder(
          purchaseOrderId,
        ),
        listPostedGoodsReceipts(
          purchaseOrderId,
        ),
      ]);

    setSelectedOrder(order);
    setGoodsReceipts(receipts);

    setField(
      "invoiceAmount",
      String(
        order.totalAmount,
      ),
    );

    setItems(
      (order.items || []).map(
        (item) => ({
          purchaseOrderItemId:
            item.id,
          invoicedQuantity:
            Number(
              item.receivedQuantity ||
              item.orderedQuantity,
            ),
          unitPrice:
            Number(
              item.unitPrice,
            ),
        }),
      ),
    );
  }

  async function chooseReceipt(
    goodsReceiptId: string,
  ) {
    setField(
      "goodsReceiptId",
      goodsReceiptId,
    );

    if (!goodsReceiptId) {
      setSelectedReceipt(null);

      setItems(
        (selectedOrder?.items || [])
          .map(
            (item) => ({
              purchaseOrderItemId:
                item.id,
              invoicedQuantity:
                Number(
                  item.receivedQuantity ||
                  item.orderedQuantity,
                ),
              unitPrice:
                Number(
                  item.unitPrice,
                ),
            }),
          ),
      );

      return;
    }

    const receipt =
      await getGoodsReceipt(
        goodsReceiptId,
      );

    setSelectedReceipt(receipt);

    setItems(
      (receipt.items || [])
        .filter(
          (item) =>
            Number(
              item.acceptedQuantity,
            ) > 0,
        )
        .map(
          (receiptItem) => {
            const orderItem =
              selectedOrder?.items?.find(
                (item) =>
                  item.id ===
                  receiptItem.purchaseOrderItemId,
              );

            return {
              purchaseOrderItemId:
                receiptItem.purchaseOrderItemId,
              goodsReceiptItemId:
                receiptItem.id,
              invoicedQuantity:
                Number(
                  receiptItem.acceptedQuantity,
                ),
              unitPrice:
                Number(
                  orderItem?.unitPrice ||
                  0,
                ),
            };
          },
        ),
    );
  }

  function updateItem(
    index: number,
    patch: Partial<
      CreateInvoiceMatchItemInput
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

  const calculatedLineAmount =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.invoicedQuantity,
            ) *
              Number(
                item.unitPrice,
              ),
          0,
        ),
      [items],
    );

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const match =
      await createInvoiceMatch({
        purchaseOrderId:
          form.purchaseOrderId,
        goodsReceiptId:
          form.goodsReceiptId ||
          undefined,
        externalInvoiceNumber:
          form.externalInvoiceNumber.trim(),
        invoiceDate:
          form.invoiceDate ||
          undefined,
        invoiceAmount:
          Number(
            form.invoiceAmount,
          ),
        matchedByPersonId:
          form.matchedByPersonId.trim(),
        remarks:
          form.remarks.trim() ||
          undefined,
        items,
      });

    router.push(
      `/procurement/invoice-matches/${match.id}`,
    );
  }

  return (
    <form
      className="stack"
      onSubmit={submit}
    >
      <section className="panel stack">
        <h2>
          Vendor invoice
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
                Select received Purchase Order
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
            Goods Receipt

            <select
              value={
                form.goodsReceiptId
              }
              disabled={
                !form.purchaseOrderId
              }
              onChange={(event) =>
                void chooseReceipt(
                  event.target.value,
                )
              }
            >
              <option value="">
                All posted receipts
              </option>

              {goodsReceipts.map(
                (receipt) => (
                  <option
                    key={receipt.id}
                    value={receipt.id}
                  >
                    {
                      receipt.goodsReceiptNumber
                    }{" "}
                    —{" "}
                    {new Date(
                      receipt.receiptDate,
                    ).toLocaleDateString()}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Vendor invoice number

            <input
              required
              value={
                form.externalInvoiceNumber
              }
              onChange={(event) =>
                setField(
                  "externalInvoiceNumber",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Invoice date

            <input
              type="date"
              value={
                form.invoiceDate
              }
              onChange={(event) =>
                setField(
                  "invoiceDate",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Invoice amount

            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={
                form.invoiceAmount
              }
              onChange={(event) =>
                setField(
                  "invoiceAmount",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Matched by person ID

            <input
              required
              value={
                form.matchedByPersonId
              }
              onChange={(event) =>
                setField(
                  "matchedByPersonId",
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
                PO total
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
                Invoice line subtotal
              </span>

              <strong>
                {
                  selectedOrder.currency
                }{" "}
                {calculatedLineAmount.toLocaleString()}
              </strong>
            </div>

            <div>
              <span className="muted">
                Selected receipt
              </span>

              <strong>
                {selectedReceipt
                  ?.goodsReceiptNumber ||
                  "All receipts"}
              </strong>
            </div>
          </div>
        ) : null}

        <label>
          Remarks

          <textarea
            value={form.remarks}
            onChange={(event) =>
              setField(
                "remarks",
                event.target.value,
              )
            }
          />
        </label>
      </section>

      <section className="panel table-scroll">
        <h2>
          Invoice lines
        </h2>

        {!selectedOrder ? (
          <p className="muted">
            Select a Purchase Order to
            load invoice lines.
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
                  Received
                </th>

                <th>
                  Invoiced
                </th>

                <th>
                  PO unit price
                </th>

                <th>
                  Invoice unit price
                </th>

                <th>
                  Invoice line
                </th>

                <th>
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map(
                (
                  invoiceItem,
                  index,
                ) => {
                  const orderItem =
                    selectedOrder.items?.find(
                      (item) =>
                        item.id ===
                        invoiceItem.purchaseOrderItemId,
                    );

                  return (
                    <tr
                      key={
                        invoiceItem.purchaseOrderItemId
                      }
                    >
                      <td>
                        {orderItem?.lineNumber ||
                          index + 1}
                      </td>

                      <td>
                        {orderItem?.description ||
                          "—"}
                      </td>

                      <td>
                        {orderItem?.orderedQuantity ||
                          0}{" "}
                        {orderItem?.unit ||
                          ""}
                      </td>

                      <td>
                        {orderItem?.receivedQuantity ||
                          0}{" "}
                        {orderItem?.unit ||
                          ""}
                      </td>

                      <td>
                        <input
                          required
                          min="0"
                          step="0.01"
                          type="number"
                          value={
                            invoiceItem.invoicedQuantity
                          }
                          onChange={(event) =>
                            updateItem(
                              index,
                              {
                                invoicedQuantity:
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                              },
                            )
                          }
                        />
                      </td>

                      <td>
                        {
                          selectedOrder.currency
                        }{" "}
                        {Number(
                          orderItem?.unitPrice ||
                          0,
                        ).toLocaleString()}
                      </td>

                      <td>
                        <input
                          required
                          min="0"
                          step="0.01"
                          type="number"
                          value={
                            invoiceItem.unitPrice
                          }
                          onChange={(event) =>
                            updateItem(
                              index,
                              {
                                unitPrice:
                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                              },
                            )
                          }
                        />
                      </td>

                      <td>
                        {
                          selectedOrder.currency
                        }{" "}
                        {(
                          Number(
                            invoiceItem.invoicedQuantity,
                          ) *
                          Number(
                            invoiceItem.unitPrice,
                          )
                        ).toLocaleString()}
                      </td>

                      <td>
                        <input
                          value={
                            invoiceItem.remarks ||
                            ""
                          }
                          onChange={(event) =>
                            updateItem(
                              index,
                              {
                                remarks:
                                  event
                                    .target
                                    .value,
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
          !items.length
        }
        type="submit"
      >
        {loading
          ? "Creating…"
          : "Create Invoice Match"}
      </button>
    </form>
  );
}
