#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

CONTRACT = json.loads(
    (
        ROOT
        / "contracts"
        / "founder-acceptance-contract.json"
    ).read_text()
)

PLAN = json.loads(
    (
        ROOT
        / "plans"
        / "execution-plan.json"
    ).read_text()
)

TEMPLATE = json.loads(
    (
        ROOT
        / "templates"
        / "suite-evidence-template.json"
    ).read_text()
)


def main() -> None:
    required_suites = CONTRACT["requiredSuites"]

    assert PLAN["schemaVersion"] == 1
    assert PLAN["phase"] == "19"
    assert PLAN["status"] == "planned"
    assert PLAN["executionOrder"] == required_suites
    assert len(PLAN["executionOrder"]) == 10

    environment = PLAN["environment"]

    assert environment["type"] == "isolated"
    assert environment["productionPermitted"] is False
    assert environment["syntheticDataRequired"] is True
    assert environment["dedicatedDatabaseRequired"] is True

    rules = PLAN["rules"]

    assert rules["captureEvidenceAfterEachSuite"] is True
    assert rules["stopOnCriticalDefect"] is True
    assert rules["stopOnEnvironmentFailure"] is True
    assert rules["allSuitesMustPassForSignOff"] is True

    assert PLAN["authorization"] == {
        "executionAuthorized": False,
        "databaseWritesAuthorized": False,
        "productionExecutionAuthorized": False,
        "publicReleaseAuthorized": False,
    }

    assert TEMPLATE["schemaVersion"] == 1
    assert TEMPLATE["phase"] == "19"
    assert TEMPLATE["suiteId"] == "<SUITE_ID>"
    assert TEMPLATE["status"] == "NOT_STARTED"

    assert TEMPLATE["environment"] == {
        "type": "isolated",
        "baseUrl": None,
        "database": None,
        "production": False,
    }

    assert TEMPLATE["checks"] == []
    assert TEMPLATE["summary"] == {
        "checksTotal": 0,
        "checksPassed": 0,
        "checksFailed": 0,
        "checksBlocked": 0,
    }
    assert TEMPLATE["evidenceReferences"] == []
    assert TEMPLATE["defects"] == []
    assert TEMPLATE["founderDecision"] is None

    assert TEMPLATE["authorization"] == {
        "executionAuthorized": False,
        "productionExecutionAuthorized": False,
    }

    print("FAT execution framework:    VALID")
    print("Execution order:           ", len(required_suites))
    print("Evidence template:          VALID")
    print("Isolated environment:       required")
    print("Execution authorized:      ", PLAN["authorization"]["executionAuthorized"])
    print("Database writes authorized:", PLAN["authorization"]["databaseWritesAuthorized"])
    print("Production authorized:     ", PLAN["authorization"]["productionExecutionAuthorized"])


if __name__ == "__main__":
    main()
