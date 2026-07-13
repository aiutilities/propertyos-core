import {
  CommunicationRead,
} from "@/types/communication";

function formatDate(
  value?: string,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

export default function ReadReceiptTable({
  reads,
}: {
  reads: CommunicationRead[];
}) {
  if (reads.length === 0) {
    return (
      <div className="empty-state">
        <h3>No read receipts</h3>
        <p>
          Reader activity will appear after
          residents open this communication.
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
              <th>Person</th>
              <th>Read At</th>
              <th>Acknowledged</th>
            </tr>
          </thead>

          <tbody>
            {reads.map(
              (read) => (
                <tr key={read.id}>
                  <td>
                    {read.personId}
                  </td>

                  <td>
                    {formatDate(
                      read.readAt,
                    )}
                  </td>

                  <td>
                    {read.acknowledgedAt ? (
                      <span className="text-success">
                        {formatDate(
                          read.acknowledgedAt,
                        )}
                      </span>
                    ) : (
                      <span>
                        Not acknowledged
                      </span>
                    )}
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
