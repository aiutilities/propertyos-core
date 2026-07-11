"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  WorkflowDefinition,
  WorkflowDefinitionsResponse,
  WorkflowInstance,
  WorkflowInstanceResponse,
  WorkflowMetrics,
  WorkflowMetricsResponse,
} from "@/types/operations";

const emptyMetrics: WorkflowMetrics = {
  definitions: {
    total: 0,
    active: 0,
    inactive: 0,
  },
  instances: {
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  },
  history: {
    totalTransitions: 0,
    averageTransitionsPerInstance: 0,
  },
  completion: {
    averageCompletionTimeSeconds: null,
  },
};

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "Not available";
  }

  if (seconds < 60) {
    return `${seconds.toFixed(0)} sec`;
  }

  if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)} min`;
  }

  return `${(seconds / 3600).toFixed(1)} hr`;
}

export default function WorkflowCenter() {
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workflowCode, setWorkflowCode] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [starting, setStarting] = useState(false);
  const [startedInstance, setStartedInstance] =
    useState<WorkflowInstance | null>(null);

  const [lookupEntityType, setLookupEntityType] = useState("");
  const [lookupEntityId, setLookupEntityId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupInstance, setLookupInstance] =
    useState<WorkflowInstance | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [definitionsResponse, metricsResponse] = await Promise.all([
        apiRequest<WorkflowDefinitionsResponse>("/workflows/definitions"),
        apiRequest<WorkflowMetricsResponse>("/workflows/metrics"),
      ]);

      setDefinitions(definitionsResponse.data.definitions);
      setMetrics(metricsResponse.data.metrics);
    } catch (err) {
      setDefinitions([]);
      setMetrics(emptyMetrics);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load workflow center.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedDefinition = useMemo(
    () =>
      definitions.find(
        (definition) => definition.code === workflowCode,
      ),
    [definitions, workflowCode],
  );

  useEffect(() => {
    if (selectedDefinition && !entityType) {
      setEntityType(selectedDefinition.entityType);
    }
  }, [entityType, selectedDefinition]);

  async function startWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarting(true);
    setError("");
    setStartedInstance(null);

    try {
      const response = await apiRequest<WorkflowInstanceResponse>(
        "/workflows/instances/by-code",
        {
          method: "POST",
          body: JSON.stringify({
            workflowCode,
            entityType,
            entityId,
            createdBy: createdBy || undefined,
            metadata: {
              source: "operations-center",
            },
          }),
        },
      );

      setStartedInstance(response.data.instance);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start workflow.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function lookupWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupLoading(true);
    setLookupMessage("");
    setLookupInstance(null);

    try {
      const response = await apiRequest<WorkflowInstanceResponse>(
        `/workflows/instances/by-entity/${encodeURIComponent(
          lookupEntityType,
        )}/${encodeURIComponent(lookupEntityId)}`,
      );

      setLookupInstance(response.data.instance);

      if (!response.data.instance) {
        setLookupMessage("No workflow instance found for this entity.");
      }
    } catch (err) {
      setLookupMessage(
        err instanceof Error
          ? err.message
          : "Unable to find workflow instance.",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <>
      <section className="operations-stat-grid">
        <div className="card">
          <h3>Definitions</h3>
          <strong>{metrics.definitions.total}</strong>
          <p>{metrics.definitions.active} active</p>
        </div>

        <div className="card">
          <h3>Active Instances</h3>
          <strong>{metrics.instances.active}</strong>
          <p>{metrics.instances.total} total</p>
        </div>

        <div className="card">
          <h3>Completed</h3>
          <strong>{metrics.instances.completed}</strong>
          <p>{metrics.instances.cancelled} cancelled</p>
        </div>

        <div className="card">
          <h3>Transitions</h3>
          <strong>{metrics.history.totalTransitions}</strong>
          <p>
            {metrics.history.averageTransitionsPerInstance.toFixed(2)} average
          </p>
        </div>

        <div className="card">
          <h3>Avg. Completion</h3>
          <strong>
            {formatDuration(
              metrics.completion.averageCompletionTimeSeconds,
            )}
          </strong>
        </div>
      </section>

      <div className="operations-refresh">
        <button onClick={() => void load()} type="button">
          Refresh Workflows
        </button>
      </div>

      {loading && <p>Loading workflows...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && (
        <>
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Definitions</p>
                <h2>Registered workflows</h2>
              </div>
            </div>

            {definitions.length === 0 ? (
              <p>No workflow definitions are registered.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Entity Type</th>
                      <th>Initial State</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {definitions.map((definition) => (
                      <tr key={definition.id}>
                        <td>
                          <strong>{definition.name}</strong>
                          {definition.description && (
                            <p>{definition.description}</p>
                          )}
                        </td>
                        <td>
                          <code>{definition.code}</code>
                        </td>
                        <td>{definition.entityType}</td>
                        <td>{definition.initialState}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              definition.isActive
                                ? "status-approved"
                                : "status-cancelled"
                            }`}
                          >
                            {definition.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="operations-form-grid">
            <form
              className="form-card"
              onSubmit={startWorkflow}
            >
              <div>
                <p className="eyebrow">Manual Execution</p>
                <h2>Start workflow</h2>
              </div>

              <label>
                Workflow
                <select
                  onChange={(event) => {
                    const code = event.target.value;
                    setWorkflowCode(code);

                    const definition = definitions.find(
                      (item) => item.code === code,
                    );

                    if (definition) {
                      setEntityType(definition.entityType);
                    }
                  }}
                  required
                  value={workflowCode}
                >
                  <option value="">Select workflow</option>
                  {definitions
                    .filter((definition) => definition.isActive)
                    .map((definition) => (
                      <option
                        key={definition.id}
                        value={definition.code}
                      >
                        {definition.name}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Entity type
                <input
                  onChange={(event) =>
                    setEntityType(event.target.value)
                  }
                  required
                  value={entityType}
                />
              </label>

              <label>
                Entity ID
                <input
                  onChange={(event) =>
                    setEntityId(event.target.value)
                  }
                  required
                  value={entityId}
                />
              </label>

              <label>
                Created by
                <input
                  onChange={(event) =>
                    setCreatedBy(event.target.value)
                  }
                  placeholder="Optional person ID"
                  value={createdBy}
                />
              </label>

              <button disabled={starting} type="submit">
                {starting ? "Starting..." : "Start Workflow"}
              </button>

              {startedInstance && (
                <div className="operations-result-card">
                  <strong>Workflow started</strong>
                  <p>ID: {startedInstance.id}</p>
                  <p>State: {startedInstance.currentState}</p>
                  <p>Status: {startedInstance.status}</p>
                </div>
              )}
            </form>

            <form
              className="form-card"
              onSubmit={lookupWorkflow}
            >
              <div>
                <p className="eyebrow">Entity Lookup</p>
                <h2>Find workflow instance</h2>
              </div>

              <label>
                Entity type
                <input
                  onChange={(event) =>
                    setLookupEntityType(event.target.value)
                  }
                  required
                  value={lookupEntityType}
                />
              </label>

              <label>
                Entity ID
                <input
                  onChange={(event) =>
                    setLookupEntityId(event.target.value)
                  }
                  required
                  value={lookupEntityId}
                />
              </label>

              <button disabled={lookupLoading} type="submit">
                {lookupLoading ? "Searching..." : "Find Instance"}
              </button>

              {lookupMessage && <p>{lookupMessage}</p>}

              {lookupInstance && (
                <div className="operations-result-card">
                  <strong>{lookupInstance.status}</strong>
                  <p>ID: {lookupInstance.id}</p>
                  <p>State: {lookupInstance.currentState}</p>
                  <p>Entity: {lookupInstance.entityId}</p>
                </div>
              )}
            </form>
          </section>
        </>
      )}
    </>
  );
}
