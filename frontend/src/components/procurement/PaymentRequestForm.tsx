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
  usePaymentRequests,
} from "@/hooks/usePaymentRequests";

import type {
  ApprovedInvoiceMatch,
} from "@/types/paymentRequest";

export function PaymentRequestForm() {
  const router = useRouter();

  const {
    loading,
    error,
    listApprovedInvoiceMatches,
    createPaymentRequest,
  } = usePaymentRequests();

  const [
    invoiceMatches,
    setInvoiceMatches,
  ] = useState<ApprovedInvoiceMatch[]>([]);

  const [
    form,
    setForm,
  ] = useState({
    invoiceMatchId: "",
    requestedAmount: "",
    currency: "INR",
    dueDate: "",
    requestedByPersonId: "",
    remarks: "",
  });

  useEffect(
    () => {
      void listApprovedInvoiceMatches()
        .then(setInvoiceMatches);
    },
    [
      listApprovedInvoiceMatches,
    ],
  );

  function setField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function chooseInvoiceMatch(
    invoiceMatchId: string,
  ) {
    const invoiceMatch =
      invoiceMatches.find(
        (row) =>
          row.id === invoiceMatchId,
      );

    setForm(
      (current) => ({
        ...current,
        invoiceMatchId,
        requestedAmount:
          invoiceMatch
            ? String(
                invoiceMatch.invoiceAmount,
              )
            : "",
        currency:
          invoiceMatch?.currency ||
          "INR",
      }),
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const created =
      await createPaymentRequest({
        invoiceMatchId:
          form.invoiceMatchId,
        requestedAmount:
          form.requestedAmount
            ? Number(
                form.requestedAmount,
              )
            : undefined,
        currency:
          form.currency
            .trim()
            .toUpperCase(),
        dueDate:
          form.dueDate ||
          undefined,
        requestedByPersonId:
          form.requestedByPersonId.trim(),
        remarks:
          form.remarks.trim() ||
          undefined,
      });

    router.push(
      `/procurement/payment-requests/${created.id}`,
    );
  }

  const selected =
    invoiceMatches.find(
      (row) =>
        row.id ===
        form.invoiceMatchId,
    );

  return (
    <form
      className="stack"
      onSubmit={submit}
    >
      <section className="panel stack">
        <h2>
          Payment information
        </h2>

        <div className="form-grid">
          <label>
            Approved Invoice Match

            <select
              required
              value={
                form.invoiceMatchId
              }
              onChange={(event) =>
                chooseInvoiceMatch(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select approved Invoice Match
              </option>

              {invoiceMatches.map(
                (match) => (
                  <option
                    key={match.id}
                    value={match.id}
                  >
                    {
                      match.invoiceMatchNumber
                    }{" "}
                    —{" "}
                    {match.externalInvoiceNumber ||
                      "Invoice"}{" "}
                    —{" "}
                    {match.currency ||
                      "INR"}{" "}
                    {Number(
                      match.invoiceAmount,
                    ).toLocaleString()}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Requested by person ID

            <input
              required
              value={
                form.requestedByPersonId
              }
              onChange={(event) =>
                setField(
                  "requestedByPersonId",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Requested amount

            <input
              required
              min="0.01"
              max={
                selected?.invoiceAmount
              }
              step="0.01"
              type="number"
              value={
                form.requestedAmount
              }
              onChange={(event) =>
                setField(
                  "requestedAmount",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Currency

            <input
              required
              value={form.currency}
              onChange={(event) =>
                setField(
                  "currency",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Due date

            <input
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setField(
                  "dueDate",
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        {selected ? (
          <div className="details-grid">
            <div>
              <span className="muted">
                Vendor
              </span>

              <strong>
                {selected.vendorId}
              </strong>
            </div>

            <div>
              <span className="muted">
                Purchase Order
              </span>

              <strong>
                {
                  selected.purchaseOrderId
                }
              </strong>
            </div>

            <div>
              <span className="muted">
                Approved invoice value
              </span>

              <strong>
                {selected.currency ||
                  "INR"}{" "}
                {Number(
                  selected.invoiceAmount,
                ).toLocaleString()}
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

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <button
        className="button"
        disabled={loading}
        type="submit"
      >
        {loading
          ? "Creating…"
          : "Create Payment Request"}
      </button>
    </form>
  );
}
