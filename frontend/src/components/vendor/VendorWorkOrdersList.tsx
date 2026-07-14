"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  useVendors,
} from "@/hooks/useVendors";

import {
  VendorPriorityBadge,
} from "./VendorPriorityBadge";

import {
  VendorWorkOrderStatusBadge,
} from "./VendorWorkOrderStatusBadge";

import type {
  VendorWorkOrder,
  VendorWorkOrderFilters,
} from "@/types/vendor";

export function VendorWorkOrdersList() {
  const searchParams =
    useSearchParams();

  const {
    loading,
    error,
    listWorkOrders,
  } = useVendors();

  const [
    workOrders,
    setWorkOrders,
  ] =
    useState<VendorWorkOrder[]>(
      [],
    );

  const [
    filters,
    setFilters,
  ] =
    useState<VendorWorkOrderFilters>({
      vendorId:
        searchParams?.get(
          "vendorId",
        ) || "",
      status: "",
      priority: "",
      search: "",
    });

  const load =
    useCallback(
      async () => {
        const rows =
          await listWorkOrders(
            filters,
          );

        setWorkOrders(rows);
      },
      [
        filters,
        listWorkOrders,
      ],
    );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement operations
          </p>

          <h1>
            Vendor Work Orders
          </h1>

          <p className="muted">
            Track vendor execution,
            scheduling, priority,
            status, and cost.
          </p>
        </div>

        <Link
          className="button button-secondary"
          href="/vendors"
        >
          Vendors
        </Link>
      </div>

      <section className="panel">
        <div className="form-grid">
          <label>
            Search
            <input
              value={
                filters.search ||
                ""
              }
              onChange={
                (event) =>
                  setFilters(
                    (current) => ({
                      ...current,
                      search:
                        event.target
                          .value,
                    }),
                  )
              }
              placeholder="Work order number or title"
            />
          </label>

          <label>
            Vendor ID
            <input
              value={
                filters.vendorId ||
                ""
              }
              onChange={
                (event) =>
                  setFilters(
                    (current) => ({
                      ...current,
                      vendorId:
                        event.target
                          .value,
                    }),
                  )
              }
              placeholder="Vendor UUID"
            />
          </label>

          <label>
            Status
            <select
              value={
                filters.status ||
                ""
              }
              onChange={
                (event) =>
                  setFilters(
                    (current) => ({
                      ...current,
                      status:
                        event.target
                          .value as
                          VendorWorkOrderFilters[
                            "status"
                          ],
                    }),
                  )
              }
            >
              <option value="">
                All statuses
              </option>
              <option value="DRAFT">
                Draft
              </option>
              <option value="ISSUED">
                Issued
              </option>
              <option value="ACCEPTED">
                Accepted
              </option>
              <option value="IN_PROGRESS">
                In progress
              </option>
              <option value="ON_HOLD">
                On hold
              </option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
              <option value="REJECTED">
                Rejected
              </option>
            </select>
          </label>

          <label>
            Priority
            <select
              value={
                filters.priority ||
                ""
              }
              onChange={
                (event) =>
                  setFilters(
                    (current) => ({
                      ...current,
                      priority:
                        event.target
                          .value as
                          VendorWorkOrderFilters[
                            "priority"
                          ],
                    }),
                  )
              }
            >
              <option value="">
                All priorities
              </option>
              <option value="LOW">
                Low
              </option>
              <option value="MEDIUM">
                Medium
              </option>
              <option value="HIGH">
                High
              </option>
              <option value="URGENT">
                Urgent
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

      {loading ? (
        <div className="panel">
          Loading work orders…
        </div>
      ) : workOrders.length ===
        0 ? (
        <div className="panel">
          <p className="muted">
            No work orders found.
          </p>
        </div>
      ) : (
        <div className="panel table-scroll">
          <table>
            <thead>
              <tr>
                <th>Work order</th>
                <th>Vendor</th>
                <th>Priority</th>
                <th>Schedule</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {workOrders.map(
                (workOrder) => (
                  <tr
                    key={
                      workOrder.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          workOrder.title
                        }
                      </strong>

                      <div className="muted">
                        {
                          workOrder.workOrderNumber
                        }
                      </div>
                    </td>

                    <td>
                      <Link
                        href={
                          `/vendors/${workOrder.vendorId}`
                        }
                      >
                        {
                          workOrder.vendorId
                        }
                      </Link>
                    </td>

                    <td>
                      <VendorPriorityBadge
                        priority={
                          workOrder.priority
                        }
                      />
                    </td>

                    <td>
                      {workOrder.scheduledStartAt
                        ? new Date(
                            workOrder.scheduledStartAt,
                          ).toLocaleString()
                        : "Not scheduled"}
                    </td>

                    <td>
                      {workOrder.actualCost !==
                      undefined
                        ? `${workOrder.currency} ${workOrder.actualCost.toLocaleString()}`
                        : workOrder.estimatedCost !==
                            undefined
                          ? `${workOrder.currency} ${workOrder.estimatedCost.toLocaleString()} est.`
                          : "—"}
                    </td>

                    <td>
                      <VendorWorkOrderStatusBadge
                        status={
                          workOrder.status
                        }
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
