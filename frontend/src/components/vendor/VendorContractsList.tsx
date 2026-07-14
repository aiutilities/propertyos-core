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
  VendorContractStatusBadge,
} from "./VendorContractStatusBadge";

import type {
  VendorContract,
  VendorContractFilters,
} from "@/types/vendor";

export function VendorContractsList() {
  const searchParams =
    useSearchParams();

  const {
    loading,
    error,
    listContracts,
  } = useVendors();

  const [
    contracts,
    setContracts,
  ] =
    useState<VendorContract[]>(
      [],
    );

  const [
    filters,
    setFilters,
  ] =
    useState<VendorContractFilters>({
      vendorId:
        searchParams?.get(
          "vendorId",
        ) || "",
      propertyId: "",
      status: "",
      search: "",
    });

  const load =
    useCallback(
      async () => {
        const rows =
          await listContracts(
            filters,
          );

        setContracts(rows);
      },
      [
        filters,
        listContracts,
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
            Vendor Contracts
          </h1>

          <p className="muted">
            Review contract status,
            values, SLA commitments,
            and renewal dates.
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
              placeholder="Contract number or title"
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
                          VendorContractFilters[
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
              <option value="EXPIRED">
                Expired
              </option>
              <option value="TERMINATED">
                Terminated
              </option>
              <option value="RENEWED">
                Renewed
              </option>
              <option value="CANCELLED">
                Cancelled
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
          Loading contracts…
        </div>
      ) : contracts.length ===
        0 ? (
        <div className="panel">
          <p className="muted">
            No contracts found.
          </p>
        </div>
      ) : (
        <div className="panel table-scroll">
          <table>
            <thead>
              <tr>
                <th>Contract</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Period</th>
                <th>Value</th>
                <th>SLA</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {contracts.map(
                (contract) => (
                  <tr
                    key={
                      contract.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          contract.title
                        }
                      </strong>

                      <div className="muted">
                        {
                          contract.contractNumber
                        }
                      </div>
                    </td>

                    <td>
                      <Link
                        href={
                          `/vendors/${contract.vendorId}`
                        }
                      >
                        {
                          contract.vendorId
                        }
                      </Link>
                    </td>

                    <td>
                      {
                        contract.contractType
                      }
                    </td>

                    <td>
                      {new Date(
                        contract.startDate,
                      ).toLocaleDateString()}
                      {" – "}
                      {new Date(
                        contract.endDate,
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {contract.contractValue !==
                      undefined
                        ? `${contract.currency} ${contract.contractValue.toLocaleString()}`
                        : "—"}
                    </td>

                    <td>
                      <div>
                        Response:{" "}
                        {contract.responseSlaMinutes ??
                          "—"}
                      </div>

                      <div className="muted">
                        Resolution:{" "}
                        {contract.resolutionSlaMinutes ??
                          "—"}
                      </div>
                    </td>

                    <td>
                      <VendorContractStatusBadge
                        status={
                          contract.status
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
