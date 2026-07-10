"use client";

import { useAgreementVersions } from "@/hooks/useAgreementVersions";

export default function AgreementVersionTable({
  agreementId,
}: {
  agreementId: string;
}) {
  const { versions, loading, error } = useAgreementVersions(agreementId);

  if (loading) return <p>Loading agreement versions...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Version</th>
          <th>Start</th>
          <th>End</th>
          <th>Rent</th>
          <th>Deposit</th>
          <th>Notice</th>
        </tr>
      </thead>

      <tbody>
        {versions.map((version) => (
          <tr key={version.id}>
            <td>{version.versionNumber}</td>
            <td>{version.startDate}</td>
            <td>{version.endDate ?? "-"}</td>
            <td>{version.rentAmount}</td>
            <td>{version.depositAmount}</td>
            <td>{version.noticePeriodDays} days</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
