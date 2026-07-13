"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  SchedulerHandler,
  SchedulerHandlersResponse,
  SchedulerJob,
  SchedulerJobResponse,
  SchedulerJobsResponse,
} from "@/types/operations";

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SchedulerCenter() {
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [handlers, setHandlers] = useState<SchedulerHandler[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [busyJobId, setBusyJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [jobsResponse, handlersResponse] =
        await Promise.all([
          apiRequest<SchedulerJobsResponse>("/scheduler/jobs"),
          apiRequest<SchedulerHandlersResponse>(
            "/scheduler/handlers",
          ),
        ]);

      setJobs(jobsResponse.data.jobs);
      setHandlers(handlersResponse.data.handlers);
    } catch (err) {
      setJobs([]);
      setHandlers([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load scheduler.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      if (status && job.status !== status) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        job.name,
        job.jobType,
        job.status,
        job.scheduleType,
      ].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [jobs, search, status]);

  async function runJob(job: SchedulerJob) {
    setBusyJobId(job.id);
    setError("");

    try {
      const response = await apiRequest<SchedulerJobResponse>(
        `/scheduler/jobs/${job.id}/run`,
        {
          method: "POST",
        },
      );

      setJobs((current) =>
        current.map((item) =>
          item.id === response.data.job.id
            ? response.data.job
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run scheduler job.",
      );
    } finally {
      setBusyJobId("");
    }
  }

  const counts = {
    pending: jobs.filter((job) => job.status === "PENDING").length,
    running: jobs.filter((job) => job.status === "RUNNING").length,
    completed: jobs.filter((job) => job.status === "COMPLETED").length,
    failed: jobs.filter((job) => job.status === "FAILED").length,
  };

  return (
    <>
      <section className="operations-stat-grid">
        <div className="card">
          <h3>Total Jobs</h3>
          <strong>{jobs.length}</strong>
        </div>

        <div className="card">
          <h3>Pending</h3>
          <strong>{counts.pending}</strong>
        </div>

        <div className="card">
          <h3>Running</h3>
          <strong>{counts.running}</strong>
        </div>

        <div className="card">
          <h3>Completed</h3>
          <strong>{counts.completed}</strong>
        </div>

        <div className="card">
          <h3>Failed</h3>
          <strong>{counts.failed}</strong>
        </div>

        <div className="card">
          <h3>Handlers</h3>
          <strong>{handlers.length}</strong>
        </div>
      </section>

      <div className="list-toolbar operations-toolbar">
        <label>
          Search
          <input
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Name or job type"
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
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>

        <button onClick={() => void load()} type="button">
          Refresh
        </button>
      </div>

      {loading && <p>Loading scheduler...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Job Queue</p>
                <h2>Scheduled jobs</h2>
              </div>
            </div>

            {visibleJobs.length === 0 ? (
              <p>No scheduler jobs match the current filters.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Attempts</th>
                      <th>Next Run</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleJobs.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <strong>{job.name}</strong>
                          <p>
                            <code>{job.jobType}</code>
                          </p>
                        </td>
                        <td>{job.scheduleType}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              job.status === "COMPLETED"
                                ? "status-approved"
                                : job.status === "FAILED"
                                  ? "status-rejected"
                                  : job.status === "RUNNING"
                                    ? "status-arrived"
                                    : "status-invited"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td>
                          {job.attempts} / {job.maxAttempts}
                        </td>
                        <td>
                          {formatDate(
                            job.nextRunAt ?? job.runAt,
                          )}
                        </td>
                        <td>
                          <button
                            disabled={
                              Boolean(busyJobId) ||
                              job.status === "RUNNING"
                            }
                            onClick={() => void runJob(job)}
                            type="button"
                          >
                            {busyJobId === job.id
                              ? "Running..."
                              : "Run Now"}
                          </button>
                        </td>
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
                <p className="eyebrow">Runtime Registry</p>
                <h2>Registered job handlers</h2>
              </div>
            </div>

            {handlers.length === 0 ? (
              <p>No scheduler handlers are registered.</p>
            ) : (
              <div className="operations-handler-grid">
                {handlers.map((handler) => (
                  <div
                    className="operations-handler-card"
                    key={handler.jobType}
                  >
                    <code>{handler.jobType}</code>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
