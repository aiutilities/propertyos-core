import {
  CommunicationDelivery,
} from "@/types/communication";

export default function DeliveryMetrics({
  deliveries,
}: {
  deliveries: CommunicationDelivery[];
}) {
  const totals = {
    total:
      deliveries.length,
    pending: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    skipped: 0,
  };

  for (const delivery of deliveries) {
    switch (delivery.status) {
      case "PENDING":
        totals.pending += 1;
        break;

      case "SENT":
        totals.sent += 1;
        break;

      case "DELIVERED":
        totals.delivered += 1;
        break;

      case "FAILED":
        totals.failed += 1;
        break;

      case "SKIPPED":
        totals.skipped += 1;
        break;
    }
  }

  const cards = [
    [
      "Total Deliveries",
      totals.total,
    ],
    [
      "Pending",
      totals.pending,
    ],
    [
      "Sent",
      totals.sent,
    ],
    [
      "Delivered",
      totals.delivered,
    ],
    [
      "Failed",
      totals.failed,
    ],
    [
      "Skipped",
      totals.skipped,
    ],
  ];

  return (
    <section className="panel stack-md">
      <div>
        <p className="eyebrow">
          Distribution
        </p>
        <h2>Delivery Metrics</h2>
      </div>

      <div className="metric-grid">
        {cards.map(
          ([label, value]) => (
            <article
              className="metric-card"
              key={String(label)}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ),
        )}
      </div>

      {deliveries.length === 0 ? (
        <div className="empty-state">
          <h3>
            No delivery records
          </h3>
          <p>
            Channel delivery records will
            appear after publication and
            notification processing.
          </p>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Person</th>
                  <th>Status</th>
                  <th>Provider Message</th>
                  <th>Error</th>
                </tr>
              </thead>

              <tbody>
                {deliveries.map(
                  (delivery) => (
                    <tr key={delivery.id}>
                      <td>
                        {delivery.channel}
                      </td>

                      <td>
                        {delivery.personId ??
                          "Audience delivery"}
                      </td>

                      <td>
                        <span
                          className={[
                            "status-badge",
                            `status-${delivery.status.toLowerCase()}`,
                          ].join(" ")}
                        >
                          {delivery.status}
                        </span>
                      </td>

                      <td>
                        {delivery.providerMessageId ??
                          "—"}
                      </td>

                      <td>
                        {delivery.errorMessage ??
                          "—"}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
