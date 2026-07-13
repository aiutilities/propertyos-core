"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getAccessPoint } from "@/hooks/useAccessControl";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { AccessPoint } from "@/types/access-control";

export default function AccessPointDetailsPage() {
  const params = useParams<{
    id: string;
  }>();

  const accessPointId = params?.id ?? "";

  const [point, setPoint] = useState<AccessPoint | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessPointId) {
      return;
    }

    void getAccessPoint(accessPointId)
      .then(setPoint)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load access point.",
        ),
      );
  }, [accessPointId]);

  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Access Control</p>
          <h1>{point?.name ?? "Access Point"}</h1>
        </div>

        {error ? <div className="error-state">{error}</div> : null}

        {point ? (
          <section className="panel">
            <dl className="details-list">
              {Object.entries({
                Code: point.code,
                Type: point.accessPointType,
                Direction: point.direction,
                Status: point.status,
                Property: point.propertyId,
                Zone: point.zoneId ?? "—",
                Space: point.spaceId ?? "—",
                Controller: point.controllerReference ?? "—",
                "Anti-passback": point.requiresAntiPassback
                  ? "Enabled"
                  : "Disabled",
              }).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
