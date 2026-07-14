"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useVendors,
} from "@/hooks/useVendors";

import {
  VendorMetrics,
} from "./VendorMetrics";

import {
  VendorTable,
} from "./VendorTable";

import type {
  Vendor,
  VendorFilters,
  VendorMetrics as VendorMetricsData,
} from "@/types/vendor";

const EMPTY_METRICS:
  VendorMetricsData = {
    total: 0,
    draft: 0,
    active: 0,
    suspended: 0,
    blocked: 0,
    archived: 0,
    contractsExpiring: 0,
    complianceExpiring: 0,
    complianceExpired: 0,
    openWorkOrders: 0,
  };

export function VendorDashboard() {
  const {
    loading,
    error,
    list,
    metrics,
  } = useVendors();

  const [
    vendors,
    setVendors,
  ] = useState<Vendor[]>([]);

  const [
    metricData,
    setMetricData,
  ] =
    useState<VendorMetricsData>(
      EMPTY_METRICS,
    );

  const [
    filters,
    setFilters,
  ] =
    useState<VendorFilters>({
      search: "",
      status: "",
      vendorType: "",
    });

  const load =
    useCallback(
      async () => {
        const [
          vendorRows,
          vendorMetrics,
        ] =
          await Promise.all([
            list(filters),
            metrics(),
          ]);

        setVendors(
          vendorRows,
        );

        setMetricData(
          vendorMetrics,
        );
      },
      [
        filters,
        list,
        metrics,
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
            Vendor Management
          </h1>

          <p className="muted">
            Manage vendors,
            contracts, compliance,
            work orders, and ratings.
          </p>
        </div>

        <div className="button-row">
          <Link
            className="button button-secondary"
            href="/vendors/contracts"
          >
            Contracts
          </Link>

          <Link
            className="button button-secondary"
            href="/vendors/work-orders"
          >
            Work orders
          </Link>

          <Link
            className="button"
            href="/vendors/new"
          >
            Add vendor
          </Link>
        </div>
      </div>

      <VendorMetrics
        metrics={metricData}
      />

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
              placeholder="Name, number, email"
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
                          VendorFilters[
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
              <option value="ACTIVE">
                Active
              </option>
              <option value="SUSPENDED">
                Suspended
              </option>
              <option value="BLOCKED">
                Blocked
              </option>
              <option value="ARCHIVED">
                Archived
              </option>
            </select>
          </label>

          <label>
            Vendor type
            <select
              value={
                filters.vendorType ||
                ""
              }
              onChange={
                (event) =>
                  setFilters(
                    (current) => ({
                      ...current,
                      vendorType:
                        event.target
                          .value as
                          VendorFilters[
                            "vendorType"
                          ],
                    }),
                  )
              }
            >
              <option value="">
                All types
              </option>
              <option value="COMPANY">
                Company
              </option>
              <option value="INDIVIDUAL">
                Individual
              </option>
              <option value="AGENCY">
                Agency
              </option>
              <option value="CONTRACTOR">
                Contractor
              </option>
              <option value="CONSULTANT">
                Consultant
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
          Loading vendors…
        </div>
      ) : (
        <VendorTable
          vendors={vendors}
        />
      )}
    </div>
  );
}
