"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useVendors,
} from "@/hooks/useVendors";

import {
  VendorContractStatusBadge,
} from "./VendorContractStatusBadge";

import {
  VendorComplianceStatusBadge,
} from "./VendorComplianceStatusBadge";

import {
  VendorRatingDisplay,
} from "./VendorRatingDisplay";

import {
  VendorStatusBadge,
} from "./VendorStatusBadge";

import type {
  VendorDetails as VendorDetailsData,
  VendorRatingSummary,
} from "@/types/vendor";

const EMPTY_SUMMARY:
  VendorRatingSummary = {
    count: 0,
    averageRating: 0,
    averageQualityRating: 0,
    averageTimelinessRating: 0,
    averageProfessionalismRating: 0,
  };

export function VendorDetails({
  vendorId,
}: {
  vendorId: string;
}) {
  const {
    loading,
    error,
    get,
    transition,
    ratingSummary,
  } = useVendors();

  const [
    vendor,
    setVendor,
  ] =
    useState<VendorDetailsData | null>(
      null,
    );

  const [
    summary,
    setSummary,
  ] =
    useState<VendorRatingSummary>(
      EMPTY_SUMMARY,
    );

  const [
    actorPersonId,
    setActorPersonId,
  ] = useState("");

  const load =
    useCallback(
      async () => {
        const [
          details,
          rating,
        ] =
          await Promise.all([
            get(vendorId),
            ratingSummary(
              vendorId,
            ),
          ]);

        setVendor(details);
        setSummary(rating);
      },
      [
        get,
        ratingSummary,
        vendorId,
      ],
    );

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    action:
      | "activate"
      | "suspend"
      | "block"
      | "reactivate"
      | "archive",
  ) {
    if (
      !actorPersonId.trim()
    ) {
      return;
    }

    await transition(
      vendorId,
      action,
      actorPersonId.trim(),
      `Vendor ${action} from frontend`,
    );

    await load();
  }

  if (
    loading &&
    !vendor
  ) {
    return (
      <div className="panel">
        Loading vendor…
      </div>
    );
  }

  if (
    !vendor
  ) {
    return (
      <div className="panel">
        {error ||
          "Vendor could not be loaded."}
      </div>
    );
  }

  const actions: Array<{
    label: string;
    action:
      | "activate"
      | "suspend"
      | "block"
      | "reactivate"
      | "archive";
    visible: boolean;
  }> = [
    {
      label: "Activate",
      action: "activate",
      visible:
        vendor.status ===
        "DRAFT",
    },
    {
      label: "Suspend",
      action: "suspend",
      visible:
        vendor.status ===
        "ACTIVE",
    },
    {
      label: "Block",
      action: "block",
      visible:
        vendor.status ===
        "ACTIVE",
    },
    {
      label: "Reactivate",
      action:
        "reactivate",
      visible:
        vendor.status ===
          "SUSPENDED" ||
        vendor.status ===
          "BLOCKED",
    },
    {
      label: "Archive",
      action: "archive",
      visible:
        vendor.status !==
        "ARCHIVED",
    },
  ];

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {vendor.vendorNumber}
          </p>

          <h1>
            {vendor.displayName}
          </h1>

          <div className="button-row">
            <VendorStatusBadge
              status={
                vendor.status
              }
            />

            <span className="badge">
              {vendor.vendorType}
            </span>
          </div>
        </div>

        <div className="button-row">
          <Link
            className="button button-secondary"
            href="/vendors"
          >
            Back to vendors
          </Link>

          <Link
            className="button button-secondary"
            href={
              `/vendors/contracts?vendorId=${vendor.id}`
            }
          >
            Contracts
          </Link>

          <Link
            className="button button-secondary"
            href={
              `/vendors/work-orders?vendorId=${vendor.id}`
            }
          >
            Work orders
          </Link>
        </div>
      </div>

      <section className="panel stack">
        <h2>
          Lifecycle actions
        </h2>

        <label>
          Acting person ID
          <input
            value={
              actorPersonId
            }
            onChange={
              (event) =>
                setActorPersonId(
                  event.target.value,
                )
            }
            placeholder="Person UUID"
          />
        </label>

        <div className="button-row">
          {actions
            .filter(
              (item) =>
                item.visible,
            )
            .map(
              (item) => (
                <button
                  className="button button-secondary"
                  disabled={
                    loading ||
                    !actorPersonId
                      .trim()
                  }
                  key={
                    item.action
                  }
                  onClick={
                    () =>
                      void runAction(
                        item.action,
                      )
                  }
                  type="button"
                >
                  {item.label}
                </button>
              ),
            )}
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <p className="muted">
            Overall rating
          </p>

          <VendorRatingDisplay
            value={
              summary.averageRating
            }
            count={
              summary.count
            }
          />
        </article>

        <article className="metric-card">
          <p className="muted">
            Quality
          </p>

          <VendorRatingDisplay
            value={
              summary.averageQualityRating
            }
          />
        </article>

        <article className="metric-card">
          <p className="muted">
            Timeliness
          </p>

          <VendorRatingDisplay
            value={
              summary.averageTimelinessRating
            }
          />
        </article>

        <article className="metric-card">
          <p className="muted">
            Professionalism
          </p>

          <VendorRatingDisplay
            value={
              summary.averageProfessionalismRating
            }
          />
        </article>
      </section>

      <section className="panel stack">
        <h2>
          Vendor profile
        </h2>

        <div className="detail-grid">
          <div>
            <p className="muted">
              Legal name
            </p>
            <strong>
              {vendor.legalName}
            </strong>
          </div>

          <div>
            <p className="muted">
              Email
            </p>
            <strong>
              {vendor.email ||
                "—"}
            </strong>
          </div>

          <div>
            <p className="muted">
              Phone
            </p>
            <strong>
              {vendor.phone ||
                "—"}
            </strong>
          </div>

          <div>
            <p className="muted">
              Website
            </p>
            <strong>
              {vendor.website ||
                "—"}
            </strong>
          </div>

          <div>
            <p className="muted">
              Tax identifier
            </p>
            <strong>
              {vendor.taxIdentifier ||
                "—"}
            </strong>
          </div>

          <div>
            <p className="muted">
              PAN
            </p>
            <strong>
              {vendor.panNumber ||
                "—"}
            </strong>
          </div>

          <div>
            <p className="muted">
              Location
            </p>
            <strong>
              {[
                vendor.city,
                vendor.state,
                vendor.country,
              ]
                .filter(Boolean)
                .join(", ") ||
                "—"}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <h2>
          Contacts
        </h2>

        {vendor.contacts.length ===
        0 ? (
          <p className="muted">
            No contacts registered.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>

              <tbody>
                {vendor.contacts.map(
                  (contact) => (
                    <tr
                      key={
                        contact.id
                      }
                    >
                      <td>
                        {contact.name}
                      </td>
                      <td>
                        {
                          contact.contactType
                        }
                      </td>
                      <td>
                        {contact.email ||
                          "—"}
                      </td>
                      <td>
                        {contact.phone ||
                          "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel stack">
        <h2>
          Contracts
        </h2>

        {vendor.contracts.length ===
        0 ? (
          <p className="muted">
            No contracts registered.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {vendor.contracts.map(
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
      </section>

      <section className="panel stack">
        <h2>
          Compliance
        </h2>

        {vendor.complianceDocuments
          .length === 0 ? (
          <p className="muted">
            No compliance records.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {vendor.complianceDocuments.map(
                  (document) => (
                    <tr
                      key={
                        document.id
                      }
                    >
                      <td>
                        {
                          document.complianceType
                        }
                      </td>

                      <td>
                        {
                          document.referenceNumber ||
                          "—"
                        }
                      </td>

                      <td>
                        {document.expiresAt
                          ? new Date(
                              document.expiresAt,
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <VendorComplianceStatusBadge
                          status={
                            document.status
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
      </section>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}
    </div>
  );
}
