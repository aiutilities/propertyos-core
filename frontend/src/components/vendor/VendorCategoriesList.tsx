"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useVendors,
} from "@/hooks/useVendors";

import type {
  VendorCategory,
} from "@/types/vendor";

export function VendorCategoriesList() {
  const {
    loading,
    error,
    categories,
  } = useVendors();

  const [
    rows,
    setRows,
  ] = useState<
    VendorCategory[]
  >([]);

  useEffect(() => {
    void categories().then(
      setRows,
    );
  }, [categories]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Procurement configuration
          </p>

          <h1>
            Vendor Categories
          </h1>

          <p className="muted">
            Review the service categories
            available for vendor
            classification.
          </p>
        </div>

        <Link
          className="button button-secondary"
          href="/vendors"
        >
          Vendors
        </Link>
      </div>

      {error ? (
        <div className="alert alert-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="panel">
          Loading categories…
        </div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <p className="muted">
            No vendor categories found.
          </p>
        </div>
      ) : (
        <div className="panel table-scroll">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Code</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (category) => (
                  <tr
                    key={
                      category.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          category.name
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        category.code
                      }
                    </td>

                    <td>
                      {
                        category.description ||
                        "—"
                      }
                    </td>

                    <td>
                      <span
                        className={
                          category.isActive
                            ? "badge badge-success"
                            : "badge"
                        }
                      >
                        {category.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
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
