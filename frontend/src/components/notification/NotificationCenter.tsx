"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  NotificationMessage,
  NotificationStatus,
  NotificationTemplate,
  NotificationTemplatesResponse,
  NotificationsResponse,
} from "@/types/operations";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificationCenter() {
  const [notifications, setNotifications] =
    useState<NotificationMessage[]>([]);
  const [templates, setTemplates] =
    useState<NotificationTemplate[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [notificationsResponse, templatesResponse] =
        await Promise.all([
          apiRequest<NotificationsResponse>("/notifications"),
          apiRequest<NotificationTemplatesResponse>(
            "/notifications/templates",
          ),
        ]);

      setNotifications(
        notificationsResponse.data.notifications,
      );
      setTemplates(templatesResponse.data.templates);
    } catch (err) {
      setNotifications([]);
      setTemplates([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (status && notification.status !== status) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        notification.recipient,
        notification.subject,
        notification.message,
        notification.channel,
        notification.status,
      ].some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [notifications, search, status]);

  const counts = {
    PENDING: notifications.filter(
      (item) => item.status === "PENDING",
    ).length,
    SENT: notifications.filter(
      (item) => item.status === "SENT",
    ).length,
    FAILED: notifications.filter(
      (item) => item.status === "FAILED",
    ).length,
  };

  return (
    <>
      <section className="operations-stat-grid">
        <div className="card">
          <h3>Total</h3>
          <strong>{notifications.length}</strong>
        </div>

        {(
          ["PENDING", "SENT", "FAILED"] as NotificationStatus[]
        ).map((item) => (
          <div className="card" key={item}>
            <h3>{item}</h3>
            <strong>{counts[item]}</strong>
          </div>
        ))}

        <div className="card">
          <h3>Templates</h3>
          <strong>{templates.length}</strong>
        </div>
      </section>

      <div className="list-toolbar operations-toolbar">
        <label>
          Search
          <input
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Recipient, subject or message"
            type="search"
            value={search}
          />
        </label>

        <label>
          Status
          <select
            onChange={(event) =>
              setStatus(event.target.value)
            }
            value={status}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
        </label>

        <button onClick={() => void load()} type="button">
          Refresh
        </button>
      </div>

      {loading && <p>Loading notifications...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Delivery Log</p>
                <h2>Notifications</h2>
              </div>
            </div>

            {visibleNotifications.length === 0 ? (
              <p>No notifications match the current filters.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Recipient</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleNotifications.map((notification) => (
                      <tr key={notification.id}>
                        <td>{notification.channel}</td>
                        <td>{notification.recipient}</td>
                        <td>
                          <strong>
                            {notification.subject ?? "Notification"}
                          </strong>
                          <p>{notification.message}</p>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              notification.status === "SENT"
                                ? "status-approved"
                                : notification.status === "FAILED"
                                  ? "status-rejected"
                                  : "status-invited"
                            }`}
                          >
                            {notification.status}
                          </span>
                        </td>
                        <td>{formatDate(notification.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Templates</p>
                <h2>Registered notification templates</h2>
              </div>
            </div>

            {templates.length === 0 ? (
              <p>No notification templates are registered.</p>
            ) : (
              <div className="operations-template-grid">
                {templates.map((template, index) => (
                  <article
                    className="operations-template-card"
                    key={
                      String(
                        template.id ??
                          template.code ??
                          template.name ??
                          index,
                      )
                    }
                  >
                    <h3>
                      {String(
                        template.name ??
                          template.code ??
                          "Notification Template",
                      )}
                    </h3>

                    {template.event && (
                      <p>
                        <strong>Event:</strong>{" "}
                        {String(template.event)}
                      </p>
                    )}

                    {template.channel && (
                      <p>
                        <strong>Channel:</strong>{" "}
                        {String(template.channel)}
                      </p>
                    )}

                    {template.subject && (
                      <p>
                        <strong>Subject:</strong>{" "}
                        {String(template.subject)}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
