import Link from "next/link";

import {
  FormDefinition,
} from "@/types/forms";

export default function FormTable({
  forms,
}: {
  forms: FormDefinition[];
}) {
  if (forms.length === 0) {
    return (
      <div className="empty-state">
        <h3>No forms found</h3>
        <p>
          Create a form definition to begin
          collecting structured responses.
        </p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Form</th>
              <th>Code</th>
              <th>Fields</th>
              <th>Version</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                <td>
                  <Link href={`/forms/${form.id}`}>
                    <strong>{form.name}</strong>
                  </Link>

                  <div className="muted-text">
                    {form.description ?? "—"}
                  </div>
                </td>

                <td>{form.code}</td>
                <td>{form.fields?.length ?? 0}</td>
                <td>{form.version ?? 1}</td>

                <td>
                  <span className="status-badge">
                    {form.status}
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
