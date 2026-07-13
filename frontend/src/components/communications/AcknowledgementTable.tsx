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

export default function AcknowledgementTable({
  reads,
  acknowledgementRequired,
}: {
  reads: CommunicationRead[];
  acknowledgementRequired: boolean;
}) {
  const acknowledged =
    reads.filter(
      (read) =>
        Boolean(
          read.acknowledgedAt,
        ),
    );

  if (!acknowledgementRequired) {
    return (
      <div className="empty-state">
        <h3>
          Acknowledgement not required
        </h3>
        <p>
          This communication only tracks
          normal read activity.
        </p>
      </div>
    );
  }

  if (acknowledged.length === 0) {
    return (
      <div className="empty-state">
        <h3>
          No acknowledgements
        </h3>
        <p>
          Acknowledged residents will appear
          here.
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
              <th>Acknowledged At</th>
            </tr>
          </thead>

          <tbody>
            {acknowledged.map(
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
                    <span className="text-success">
                      {formatDate(
                        read.acknowledgedAt,
                      )}
                    </span>
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
