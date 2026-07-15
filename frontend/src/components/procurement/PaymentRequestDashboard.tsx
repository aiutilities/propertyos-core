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
  PaymentRequest,
  PaymentRequestFilters,
  PaymentRequestStatus,
} from "@/types/paymentRequest";

const STATUSES: PaymentRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
];

export function PaymentRequestDashboard() {
  const {
    loading,
    error,
    listPaymentRequests,
  } = usePaymentRequests();

  const [
    requests,
    setRequests,
  ] = useState<PaymentRequest[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<PaymentRequestFilters>({
    search: "",
    status: "",
    overdue: "",
  });

  const load = useCallback(
    async () => {
      setRequests(
        await listPaymentRequests(filters),
      );
    },
    [
      filters,
      listPaymentRequests,
    ],
  );

  useEffect(
    () => {
      void load();
    },
    [load],
  );

  const submitted =
    requests.filter(
      (request) =>
        request.status === "SUBMITTED",
    ).length;

  const approved =
    requests.filter(
      (request) =>
        request.status === "APPROVED",
    ).length;

  const paid =
    requests.filter(
      (request) =>
        request.status === "PAID",
    ).length;

  const pendingValue =
    requests
      .filter(
        (request) =>
          [
            "DRAFT",
            "SUBMITTED",
            "APPROVED",
          ].includes(
            request.status,
          ),
      )
      .reduce(
        (
          total,
          request,
        ) =>
          total +
          Number(
            request.approvedAmount ??
            request.requestedAmount,
          ),
        0,
      );

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement
          </p>

          <h1>
            Payment Requests
          </h1>

          <p className="muted">
            Request, approve, and record
            vendor payments from approved
            Invoice Matches.
          </p>
        </div>

        <Link
          className="button"
          href="/procurement/payment-requests/new"
        >
          New Payment Request
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">
            Submitted
          </span>

          <strong>
            {submitted}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Approved
          </span>

          <strong>
            {approved}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Paid
          </span>

          <strong>
            {paid}
          </strong>
        </div>

        <div className="stat-card">
          <span className="muted">
            Pending value
          </span>

          <strong>
            INR{" "}
            {pendingValue.toLocaleString()}
          </strong>
        </div>
      </div>

      <section className="panel">
        <div className="form-grid">
          <label>
            Search

            <input
              value={
                filters.search || ""
              }
              placeholder="Payment request number"
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    search:
                      event.target.value,
                  }),
                )
              }
            />
          </label>

          <label>
            Status

            <select
              value={
                filters.status || ""
              }
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    status:
                      event.target
                        .value as
                        PaymentRequestFilters["status"],
                  }),
                )
              }
            >
              <option value="">
                All statuses
              </option>

              {STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Due status

            <select
              value={
                filters.overdue || ""
              }
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    overdue:
                      event.target.value,
                  }),
                )
              }
            >
              <option value="">
                All
              </option>

              <option value="true">
                Overdue only
              </option>
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      <section className="panel table-scroll">
        {loading ? (
          <p>
            Loading Payment Requests…
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Payment Request
                </th>

                <th>
                  Vendor
                </th>

                <th>
                  Status
                </th>

                <th>
                  Requested
                </th>

                <th>
                  Approved
                </th>

                <th>
                  Paid
                </th>

                <th>
                  Due date
                </th>
              </tr>
            </thead>

            <tbody>
              {requests.map(
                (request) => (
                  <tr key={request.id}>
                    <td>
                      <Link
                        href={`/procurement/payment-requests/${request.id}`}
                      >
                        {
                          request.paymentRequestNumber
                        }
                      </Link>
                    </td>

                    <td>
                      {request.vendorId}
                    </td>

                    <td>
                      <PaymentRequestStatusBadge
                        status={request.status}
                      />
                    </td>

                    <td>
                      {request.currency}{" "}
                      {Number(
                        request.requestedAmount,
                      ).toLocaleString()}
                    </td>

                    <td>
                      {request.approvedAmount !==
                      undefined
                        ? `${request.currency} ${Number(
                            request.approvedAmount,
                          ).toLocaleString()}`
                        : "—"}
                    </td>

                    <td>
                      {request.paidAmount !==
                      undefined
                        ? `${request.currency} ${Number(
                            request.paidAmount,
                          ).toLocaleString()}`
                        : "—"}
                    </td>

                    <td>
                      {request.dueDate
                        ? new Date(
                            request.dueDate,
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ),
              )}

              {!requests.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="muted"
                  >
                    No Payment Requests found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
