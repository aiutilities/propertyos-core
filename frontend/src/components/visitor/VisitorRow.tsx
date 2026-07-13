import Link from "next/link";
import type { Visit } from "@/types/visitor";
import VisitorStatusBadge from "./VisitorStatusBadge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VisitorRow({ visit }: { visit: Visit }) {
  return (
    <tr>
      <td>
        <Link href={`/visitors/${visit.id}`}>
          {visit.visitor?.fullName ?? visit.visitorId}
        </Link>
      </td>
      <td>{visit.visitor?.mobile ?? "—"}</td>
      <td>{visit.visitPurpose ?? "—"}</td>
      <td>{formatDate(visit.visitDate)}</td>
      <td>
        <VisitorStatusBadge status={visit.status} />
      </td>
      <td>
        <Link className="button-link secondary" href={`/visitors/${visit.id}`}>
          View
        </Link>
      </td>
    </tr>
  );
}
