#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";
import { performance } from "node:perf_hooks";

const root = new URL("../", import.meta.url);
const contractUrl = new URL(
  "propertyos-performance-contract.json",
  root,
);

const contract = JSON.parse(
  await fs.readFile(contractUrl, "utf8"),
);

const execution = contract.execution;

const baseUrl = (
  process.env[execution.baseUrlEnvironmentVariable] ??
  execution.defaultBaseUrl
).replace(/\/$/, "");

function percentile(sorted, percentileValue) {
  if (sorted.length === 0) {
    return 0;
  }

  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );

  return sorted[index];
}

async function executeRequest(route) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    execution.requestTimeoutMs,
  );

  const startedAt = performance.now();

  try {
    const response = await fetch(baseUrl + route.path, {
      method: route.method,
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    await response.arrayBuffer();

    return {
      success: response.status === route.expectedStatus,
      status: response.status,
      latencyMs: performance.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      status: null,
      latencyMs: performance.now() - startedAt,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function warmUp(route) {
  for (
    let index = 0;
    index < execution.warmupRequestsPerRoute;
    index += 1
  ) {
    await executeRequest(route);
  }
}

async function measure(route, concurrency) {
  const results = [];
  let issued = 0;

  const startedAt = performance.now();

  async function worker() {
    while (issued < execution.measuredRequestsPerRoute) {
      issued += 1;
      results.push(await executeRequest(route));
    }
  }

  await Promise.all(
    Array.from(
      { length: concurrency },
      () => worker(),
    ),
  );

  const elapsedMs = performance.now() - startedAt;
  const latencies = results
    .map((result) => result.latencyMs)
    .sort((left, right) => left - right);

  const successfulRequests = results.filter(
    (result) => result.success,
  ).length;

  const failedRequests =
    results.length - successfulRequests;

  const averageLatencyMs =
    latencies.reduce(
      (total, latency) => total + latency,
      0,
    ) / latencies.length;

  return {
    route: route.name,
    path: route.path,
    concurrency,
    totalRequests: results.length,
    successfulRequests,
    failedRequests,
    failureRatio: failedRequests / results.length,
    minimumLatencyMs: latencies[0] ?? 0,
    averageLatencyMs,
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    p99LatencyMs: percentile(latencies, 99),
    maximumLatencyMs:
      latencies[latencies.length - 1] ?? 0,
    requestsPerSecond:
      results.length / (elapsedMs / 1000),
    statusCounts: Object.fromEntries(
      Array.from(
        results.reduce((counts, result) => {
          const key =
            result.status === null
              ? "network-error"
              : String(result.status);

          counts.set(
            key,
            (counts.get(key) ?? 0) + 1,
          );

          return counts;
        }, new Map()),
      ).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    errors: results
      .filter((result) => !result.success)
      .slice(0, 5),
  };
}

function thresholdFailures(route, result) {
  const thresholds = route.thresholds;
  const failures = [];

  if (result.p50LatencyMs > thresholds.p50LatencyMs) {
    failures.push("p50LatencyMs");
  }

  if (result.p95LatencyMs > thresholds.p95LatencyMs) {
    failures.push("p95LatencyMs");
  }

  if (result.p99LatencyMs > thresholds.p99LatencyMs) {
    failures.push("p99LatencyMs");
  }

  if (
    result.failureRatio >
    thresholds.failureRatioMaximum
  ) {
    failures.push("failureRatio");
  }

  return failures;
}

const report = {
  schemaVersion: 1,
  phase: contract.phase,
  target: execution.target,
  baseUrl,
  startedAt: new Date().toISOString(),
  results: [],
  passed: true,
  environmentValid: true,
  environmentFailures: [],
};

for (const route of contract.routes) {
  await warmUp(route);

  for (const concurrency of execution.concurrencyLevels) {
    const result = await measure(route, concurrency);
    const failures = thresholdFailures(route, result);

    result.thresholdFailures = failures;
    result.passed = failures.length === 0;

    report.results.push(result);

    if ((result.statusCounts["429"] ?? 0) > 0) {
      report.environmentValid = false;
      report.environmentFailures.push({
        route: route.name,
        concurrency,
        reason: "HTTP_429_RATE_LIMITED",
        count: result.statusCounts["429"],
      });
    }

    if (!result.passed) {
      report.passed = false;
    }

    console.log(
      [
        route.name,
        `concurrency=${concurrency}`,
        `p50=${result.p50LatencyMs.toFixed(2)}ms`,
        `p95=${result.p95LatencyMs.toFixed(2)}ms`,
        `p99=${result.p99LatencyMs.toFixed(2)}ms`,
        `rps=${result.requestsPerSecond.toFixed(2)}`,
        `failed=${result.failedRequests}`,
        `passed=${result.passed}`,
      ].join(" "),
    );
  }
}

report.completedAt = new Date().toISOString();

const reportPath = process.env.PROPERTYOS_PERFORMANCE_REPORT;

if (reportPath) {
  await fs.writeFile(
    reportPath,
    JSON.stringify(report, null, 2) + "\n",
  );

  console.log(`Report written: ${reportPath}`);
}

if (!report.environmentValid) {
  console.error(
    "ERROR: benchmark environment is rate limited; " +
    "use the isolated Phase 17D runtime contract.",
  );
}

if (!report.passed || !report.environmentValid) {
  process.exitCode = 1;
}
