"use client";

import Link from "next/link";
import { Vehicle } from "@/types/vehicle";

export default function VehicleTable({
  vehicles,
  residentMode = false,
}: {
  vehicles: Vehicle[];
  residentMode?: boolean;
}) {
  if (vehicles.length === 0) {
    return (
      <div className="empty-state">
        <h3>No vehicles found</h3>
        <p>Register a vehicle or adjust the filters.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Registration</th>
              <th>Type</th>
              <th>Vehicle</th>
              <th>Parking</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <Link
                    href={
                      residentMode
                        ? `/vehicles/${vehicle.id}`
                        : `/vehicles/${vehicle.id}`
                    }
                  >
                    {vehicle.registrationNumber}
                  </Link>
                </td>
                <td>
                  {vehicle.vehicleType.replaceAll("_", " ")}
                </td>
                <td>
                  {[vehicle.make, vehicle.model]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                  <div className="muted-text">
                    {vehicle.colour ?? ""}
                  </div>
                </td>
                <td>{vehicle.parkingSlot ?? "—"}</td>
                <td>
                  <span className="status-badge">
                    {vehicle.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
