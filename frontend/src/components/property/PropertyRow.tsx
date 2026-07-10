"use client";

import Link from "next/link";
import type { Property } from "@/types/property";

type Props = {
  property: Property;
};

export default function PropertyRow({ property }: Props) {
  return (
    <tr>
      <td>
        <Link href={`/properties/${property.id}`}>
          {property.name}
        </Link>
      </td>
      <td>{property.code}</td>
      <td>{property.propertyType}</td>
      <td>{property.city ?? "-"}</td>
      <td>{property.isActive ? "Active" : "Inactive"}</td>
    </tr>
  );
}
