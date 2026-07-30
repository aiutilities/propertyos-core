import {
  FormSubmission,
} from "@/types/forms";

function formatDate(
  value?: string,
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function FormSubmissionTable({
  submissions,
}: {
  submissions: FormSubmission[];
}) {
  if (submissions.length === 0) {
    return (
      <div className="empty-state">
        <p>No submissions received.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Submission</th>
              <th>Submitted By</th>
              <th>Submitted At</th>
              <th>Values</th>
            </tr>
          </thead>

          <tbody>
            {submissions.map(
              (submission) => (
                <tr key={submission.id}>
                  <td>{submission.id}</td>

                  <td>
                    {submission
                      .submittedByPersonId ??
                      "—"}
                  </td>

                  <td>
                    {formatDate(
                      submission.submittedAt ??
                        submission.createdAt,
                    )}
                  </td>

                  <td>
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {JSON.stringify(
                        submission.values,
                        null,
                        2,
                      )}
                    </pre>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
