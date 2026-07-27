#!/usr/bin/env python3

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

PLAN_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "plans"
    / "execution-plan.json"
)

EVIDENCE_TEMPLATE_PATH = (
    ROOT
    / "operations"
    / "fat"
    / "templates"
    / "suite-evidence-template.json"
)

EXPECTED_ORDER = [
    "installation",
    "authentication",
    "property-management",
    "tenant-lifecycle",
    "procurement",
    "inventory",
    "workflow",
    "plugins",
    "performance-regression",
    "backup-restore",
]


def load_json(path: Path) -> dict:
    if not path.is_file():
        raise SystemExit(
            f"ERROR: required artifact missing: {path}"
        )

    try:
        return json.loads(
            path.read_text()
        )
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"ERROR: invalid JSON in {path}: {error}"
        ) from error


def validate_planned_state(plan: dict) -> None:
    authorization = plan["authorization"]

    assert (
        authorization["executionAuthorized"]
        is False
    )

    assert (
        authorization["databaseWritesAuthorized"]
        is False
    )

    assert (
        authorization["productionExecutionAuthorized"]
        is False
    )

    assert (
        authorization["publicReleaseAuthorized"]
        is False
    )

    assert "activeAuthorization" not in plan


def validate_isolated_procurement_state(
    plan: dict,
) -> None:
    authorization = plan["authorization"]

    assert (
        authorization["executionAuthorized"]
        is True
    )

    assert (
        authorization["databaseWritesAuthorized"]
        is True
    )

    assert (
        authorization["productionExecutionAuthorized"]
        is False
    )

    assert (
        authorization["publicReleaseAuthorized"]
        is False
    )

    active = plan["activeAuthorization"]

    assert (
        active["suiteId"]
        == "procurement"
    )

    assert (
        active["scope"]
        == "isolated-procurement-runtime-only"
    )

    assert (
        active["automaticRevocationRequired"]
        is True
    )

    assert isinstance(
        active["authorizedAt"],
        str,
    )

    assert (
        active["authorizedAt"]
        .endswith("Z")
    )


def main() -> None:
    plan = load_json(
        PLAN_PATH
    )

    evidence_template = load_json(
        EVIDENCE_TEMPLATE_PATH
    )

    assert plan["schemaVersion"] == 1
    assert plan["phase"] == "19"

    assert (
        plan["artifact"]
        == "founder-acceptance-execution-plan"
    )

    assert (
        plan["executionOrder"]
        == EXPECTED_ORDER
    )

    assert (
        plan["environment"]["type"]
        == "isolated"
    )

    assert (
        plan["environment"]
        ["productionPermitted"]
        is False
    )

    assert (
        plan["environment"]
        ["syntheticDataRequired"]
        is True
    )

    assert (
        plan["environment"]
        ["dedicatedDatabaseRequired"]
        is True
    )

    assert (
        plan["environment"]
        ["evidenceDirectoryRequired"]
        is True
    )

    assert (
        plan["rules"]
        ["captureEvidenceAfterEachSuite"]
        is True
    )

    assert (
        plan["rules"]
        ["stopOnCriticalDefect"]
        is True
    )

    assert (
        plan["rules"]
        ["stopOnEnvironmentFailure"]
        is True
    )

    assert (
        plan["rules"]
        ["founderDecisionRequiredPerSuite"]
        is True
    )

    assert (
        plan["rules"]
        ["allSuitesMustPassForSignOff"]
        is True
    )

    status = plan["status"]

    if status == "planned":
        validate_planned_state(
            plan
        )
    elif (
        status
        == "authorized-for-isolated-procurement"
    ):
        validate_isolated_procurement_state(
            plan
        )
    elif status == "completed-and-revoked":
        validate_planned_state(
            plan
        )

        assert (
            plan["lastCompletedAuthorization"]
            ["suiteId"]
            == "procurement"
        )

        assert (
            plan["lastCompletedAuthorization"]
            ["result"]
            == "PASSED"
        )
    else:
        raise AssertionError(
            f"unsupported execution-plan status: {status}"
        )

    assert (
        evidence_template["schemaVersion"]
        == 1
    )

    assert (
        evidence_template["phase"]
        == "19"
    )

    assert (
        evidence_template["suiteId"]
        == "<SUITE_ID>"
    )

    assert (
        evidence_template["status"]
        == "NOT_STARTED"
    )

    assert (
        evidence_template["startedAt"]
        is None
    )

    assert (
        evidence_template["completedAt"]
        is None
    )

    assert (
        evidence_template["commit"]
        is None
    )

    assert (
        evidence_template["environment"]
        == {
            "type": "isolated",
            "baseUrl": None,
            "database": None,
            "production": False,
        }
    )

    assert (
        evidence_template["checks"]
        == []
    )

    assert (
        evidence_template["summary"]
        == {
            "checksTotal": 0,
            "checksPassed": 0,
            "checksFailed": 0,
            "checksBlocked": 0,
        }
    )

    assert (
        evidence_template["evidenceReferences"]
        == []
    )

    assert (
        evidence_template["defects"]
        == []
    )

    assert (
        evidence_template["founderDecision"]
        is None
    )

    assert (
        evidence_template["notes"]
        is None
    )

    assert (
        evidence_template["authorization"]
        == {
            "executionAuthorized": False,
            "productionExecutionAuthorized": False,
        }
    )

    print(
        "FAT execution framework:    VALID"
    )
    print(
        "Execution-plan status:     ",
        status,
    )
    print(
        "Execution order:           ",
        len(plan["executionOrder"]),
    )
    print(
        "Evidence template:          VALID"
    )
    print(
        "Isolated environment:      ",
        plan["environment"]["type"],
    )
    print(
        "Execution authorized:      ",
        plan["authorization"]
        ["executionAuthorized"],
    )
    print(
        "Database writes authorized:",
        plan["authorization"]
        ["databaseWritesAuthorized"],
    )
    print(
        "Production authorized:     ",
        plan["authorization"]
        ["productionExecutionAuthorized"],
    )


if __name__ == "__main__":
    main()
