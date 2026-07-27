#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASELINE_PATH = (
    ROOT
    / "baselines"
    / "phase-17d-operational-health-baseline.json"
)


def main() -> None:
    try:
        baseline = json.loads(BASELINE_PATH.read_text())
    except FileNotFoundError as error:
        raise SystemExit(
            f"ERROR: missing baseline: {BASELINE_PATH}"
        ) from error
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"ERROR: invalid baseline JSON: {error}"
        ) from error

    workload = baseline["workload"]
    validation = baseline["validation"]
    results = baseline["results"]

    assert baseline["schemaVersion"] == 1
    assert baseline["phase"] == "17D"
    assert baseline["baseline"] == "operational-health"
    assert (
        baseline["target"]
        == "isolated-local-production-build"
    )

    assert baseline["runtime"] == {
        "port": 3017,
        "rateLimitMax": 5000,
        "rateLimitTtlMs": 60000,
    }

    assert workload["routes"] == 3
    assert workload["warmupRequestsPerRoute"] == 10
    assert workload["measuredRequestsPerRoute"] == 100
    assert workload["concurrencyLevels"] == [1, 5, 10]
    assert workload["totalWarmupRequests"] == 30
    assert workload["totalMeasuredRequests"] == 900

    assert validation["environmentValid"] is True
    assert validation["environmentFailures"] == 0
    assert validation["failedRequests"] == 0
    assert validation["thresholdFailures"] == 0
    assert validation["passed"] is True

    assert len(results) == 9
    assert sum(
        result["totalRequests"]
        for result in results
    ) == 900

    assert all(
        result["successfulRequests"] == 100
        for result in results
    )

    assert all(
        result["failedRequests"] == 0
        for result in results
    )

    assert all(
        result["failureRatio"] == 0
        for result in results
    )

    assert all(
        result["statusCounts"] == {"200": 100}
        for result in results
    )

    assert all(
        result["thresholdFailures"] == []
        for result in results
    )

    assert all(
        result["passed"] is True
        for result in results
    )

    print("Performance baseline:       VALID")
    print("Result groups:             ", len(results))
    print(
        "Measured requests:         ",
        sum(result["totalRequests"] for result in results),
    )
    print("Failed requests:            0")
    print("Environment failures:       0")
    print("Threshold failures:         0")


if __name__ == "__main__":
    main()
