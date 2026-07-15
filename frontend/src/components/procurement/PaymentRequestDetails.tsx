"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  usePaymentRequests,
} from "@/hooks/usePaymentRequests";

import {
  PaymentRequestStatusBadge,
} from "./PaymentRequestStatusBadge";

import type {
  PaymentRequestDetails as PaymentRequestDetailsType,
} from "@/types/paymentRequest";

export function PaymentRequestDetails({
  id,
}: {
  id: string;
}) {
  const {
    loading,
    error,
    getPaymentRequest,
    submitPaymentRequest,
    approvePaymentRequest,
    rejectPaymentRequest,
    payPaymentRequest,
    cancelPaymentRequest,
  } = usePaymentRequests();

  const [
    request,
    setRequest,
  ] =
    useState<PaymentRequestDetailsType | null>(
      null,
    );

  const [
    actor,
    setActor,
  ] = useState("");

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    paymentReference,
    setPaymentReference,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const load = useCallback(
    async () => {
      const data =
        await getPaymentRequest(id);

      setRequest(data);

      setAmount(
        String(
          data.approvedAmount ??
          data.requestedAmount,
        ),
      );
    },
    [
      getPaymentRequest,
      id,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  async function submit() {
    if (!actor.trim()) {
      return;
    }

    setRequest(
      await submitPaymentRequest(
        id,
        actor.trim(),
        remarks,
      ),
    );

    setRemarks("");
  }

  async function approve() {
    if (
      !actor.trim() ||
      !amount
    ) {
      return;
    }

    setRequest(
      await approvePaymentRequest(
        id,
        actor.trim(),
        Number(amount),
        remarks,
      ),
    );

    setRemarks("");
  }

  async function reject() {
    if (
      !actor.trim() ||
      !remarks.trim()
    ) {
      return;
    }

    setRequest(
      await rejectPaymentRequest(
        id,
        actor.trim(),
        remarks.trim(),
        remarks.trim(),
      ),
    );

    setRemarks("");
  }

  async function pay() {
    if (
      !actor.trim() ||
      !amount ||
      !paymentReference.trim()
    ) {
      return;
    }

    setRequest(
      await payPaymentRequest(
        id,
        actor.trim(),
        Number(amount),
        paymentReference.trim(),
        remarks,
      ),
    );

    setRemarks("");
    setPaymentReference("");
  }

  async function cancel() {
    if (!actor.trim()) {
      return;
    }

    setRequest(
      await cancelPaymentRequest(
        id,
        actor.trim(),
        remarks,
      ),
    );

    setRemarks("");
  }

  if (!request) {
    return (
      <div className="panel">
        {loading
          ? "Loading Payment Request…"
          : error ||
            "Payment Request not found."}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {
              request.paymentRequestNumber
            }
          </p>

          <h1>
            Payment Request
          </h1>

          <PaymentRequestStatusBadge
            status={request.status}
          />
        </div>

        <div className="button-row">
          {request.invoiceMatchId ? (
            <Link
              className="button button-secondary"
              href={`/procurement/invoice-matches/${request.invoiceMatchId}`}
            >
              Invoice Match
            </Link>
          ) : null}

          {request.purchaseOrderId ? (
            <Link
              className="button button-secondary"
              href={`/procurement/purchase-orders/${request.purchaseOrderId}`}
            >
              Purchase Order
            </Link>
          ) : null}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Requested
          </span>

          <strong>
            {request.currency}{" "}
            {Number(
              request.requestedAmount,
            ).toLocaleString()}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Approved
          </span>

          <strong>
            {request.approvedAmount !==
            undefined
              ? `${request.currency} ${Number(
                  request.approvedAmount,
                ).toLocaleString()}`
              : "—"}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Paid
          </span>

          <strong>
            {request.paidAmount !==
            undefined
              ? `${request.currency} ${Number(
                  request.paidAmount,
                ).toLocaleString()}`
              : "—"}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Due date
          </span>

          <strong>
            {request.dueDate
              ? new Date(
                  request.dueDate,
                ).toLocaleDateString()
              : "—"}
          </strong>
        </div>
      </div>

      <section className="panel">
        <div className="details-grid">
          <div>
            <span className="muted">
              Vendor
            </span>

            <strong>
              {request.vendorId}
            </strong>
          </div>

          <div>
            <span className="muted">
              Requested by
            </span>

            <strong>
              {
                request.requestedByPersonId
              }
            </strong>
          </div>

          <div>
            <span className="muted">
              Submitted
            </span>

            <strong>
              {request.submittedAt
                ? new Date(
                    request.submittedAt,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Approved
            </span>

            <strong>
              {request.approvedAt
                ? new Date(
                    request.approvedAt,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Paid
            </span>

            <strong>
              {request.paidAt
                ? new Date(
                    request.paidAt,
                  ).toLocaleString()
                : "—"}
            </strong>
          </div>

          <div>
            <span className="muted">
              Payment reference
            </span>

            <strong>
              {request.paymentReference ||
                "—"}
            </strong>
          </div>
        </div>
      </section>

      {request.rejectionReason ? (
        <section className="panel">
          <h2>
            Rejection reason
          </h2>

          <p>
            {request.rejectionReason}
          </p>
        </section>
      ) : null}

      {[
        "DRAFT",
        "SUBMITTED",
        "APPROVED",
      ].includes(
        request.status,
      ) ? (
        <section className="panel stack">
          <h2>
            Workflow action
          </h2>

          <div className="form-grid">
            <label>
              Action by person ID

              <input
                value={actor}
                onChange={(event) =>
                  setActor(
                    event.target.value,
                  )
                }
              />
            </label>

            {[
              "SUBMITTED",
              "APPROVED",
            ].includes(
              request.status,
            ) ? (
              <label>
                {request.status ===
                "SUBMITTED"
                  ? "Approved amount"
                  : "Paid amount"}

                <input
                  min="0.01"
                  max={
                    request.status ===
                    "SUBMITTED"
                      ? request.requestedAmount
                      : request.approvedAmount
                  }
                  step="0.01"
                  type="number"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value,
                    )
                  }
                />
              </label>
            ) : null}

            {request.status ===
            "APPROVED" ? (
              <label>
                Payment reference

                <input
                  value={
                    paymentReference
                  }
                  onChange={(event) =>
                    setPaymentReference(
                      event.target.value,
                    )
                  }
                />
              </label>
            ) : null}

            <label>
              Remarks or rejection reason

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

          <div className="button-row">
            {request.status ===
            "DRAFT" ? (
              <button
                className="button"
                disabled={
                  loading ||
                  !actor.trim()
                }
                onClick={() =>
                  void submit()
                }
              >
                Submit for Approval
              </button>
            ) : null}

            {request.status ===
            "SUBMITTED" ? (
              <>
                <button
                  className="button"
                  disabled={
                    loading ||
                    !actor.trim() ||
                    !amount
                  }
                  onClick={() =>
                    void approve()
                  }
                >
                  Approve
                </button>

                <button
                  className="button button-danger"
                  disabled={
                    loading ||
                    !actor.trim() ||
                    !remarks.trim()
                  }
                  onClick={() =>
                    void reject()
                  }
                >
                  Reject
                </button>
              </>
            ) : null}

            {request.status ===
            "APPROVED" ? (
              <button
                className="button"
                disabled={
                  loading ||
                  !actor.trim() ||
                  !amount ||
                  !paymentReference.trim()
                }
                onClick={() =>
                  void pay()
                }
              >
                Mark as Paid
              </button>
            ) : null}

            {[
              "DRAFT",
              "SUBMITTED",
              "APPROVED",
            ].includes(
              request.status,
            ) ? (
              <button
                className="button button-secondary"
                disabled={
                  loading ||
                  !actor.trim()
                }
                onClick={() =>
                  void cancel()
                }
              >
                Cancel
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <section className="panel">
        <h2>
          Status history
        </h2>

        {request.history.length ? (
          <ul>
            {request.history.map(
              (entry) => (
                <li key={entry.id}>
                  {entry.toStatus.replaceAll(
                    "_",
                    " ",
                  )}{" "}
                  —{" "}
                  {new Date(
                    entry.createdAt,
                  ).toLocaleString()}
                  {entry.remarks
                    ? ` — ${entry.remarks}`
                    : ""}
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="muted">
            No history available.
          </p>
        )}
      </section>
    </div>
  );
}
