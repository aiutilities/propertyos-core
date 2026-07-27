#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "propertyos-performance-contract.json"


def main() -> None:
    try:
        contract = json.loads(CONTRACT_PATH.read_text())
    except FileNotFoundError as error:
        raise SystemExit(
            f"ERROR: missing contract: {CONTRACT_PATH}"
        ) from error
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"ERROR: invalid JSON: {error}"
        ) from error

    execution = contract["execution"]
    routes = contract["routes"]
    safety = contract["safety"]

    assert contract["schemaVersion"] == 1
    assert contract["phase"] == "17D"
    assert contract["name"] == "Performance and Scale Validation"

    assert execution["target"] == "local-production-build"
    assert execution["defaultBaseUrl"] == "http://127.0.0.1:3000"
    assert execution["warmupRequestsPerRoute"] == 10
    assert execution["measuredRequestsPerRoute"] == 100
    assert execution["requestTimeoutMs"] == 5000
    assert execution["concurrencyLevels"] == [1, 5, 10]

    isolated_runtime = execution["isolatedRuntime"]

    assert isolated_runtime["required"] is True
    assert isolated_runtime["recommendedPort"] == 3017
    assert (
        isolated_runtime["environment"]["NODE_ENV"]
        == "production"
    )
    assert (
        isolated_runtime["environment"]["RATE_LIMIT_MAX"]
        == "5000"
    )
    assert (
        isolated_runtime["environment"]["RATE_LIMIT_TTL_MS"]
        == "60000"
    )

    assert len(routes) == 3

    expected_paths = [
        "/api/v1/health",
        "/api/v1/health/live",
        "/api/v1/health/ready",
    ]

    assert [route["path"] for route in routes] == expected_paths

    for route in routes:
        assert route["method"] == "GET"
        assert route["expectedStatus"] == 200
        assert route["requiresAuthentication"] is False

        thresholds = route["thresholds"]

        assert thresholds["p50LatencyMs"] > 0
        assert thresholds["p95LatencyMs"] >= thresholds["p50LatencyMs"]
        assert thresholds["p99LatencyMs"] >= thresholds["p95LatencyMs"]
        assert thresholds["failureRatioMaximum"] == 0

    assert safety["mutatesApplicationData"] is False
    assert safety["allowedAgainstPublicProduction"] is False
    assert safety["databaseWritesPermitted"] is False
    assert (
        safety["applicationInstrumentationChangesPermitted"]
        is False
    )
    assert safety["prometheusContractChangesPermitted"] is False
    assert safety["grafanaContractChangesPermitted"] is False
    assert safety["normalRuntimeRateLimitMayBeChanged"] is False
    assert safety["isolatedRuntimeOverridePermitted"] is True

    print("Performance contract:       VALID")
    print("Routes:                    ", len(routes))
    print(
        "Concurrency levels:        ",
        execution["concurrencyLevels"],
    )
    print(
        "Measured requests/route:   ",
        execution["measuredRequestsPerRoute"],
    )
    print("Public production allowed: ", safety["allowedAgainstPublicProduction"])
    print("Database writes permitted: ", safety["databaseWritesPermitted"])


if __name__ == "__main__":
    main()
