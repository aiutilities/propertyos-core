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

EVIDENCE_CONTRACT = json.loads(
    (
        ROOT
        / "contracts"
        / "founder-acceptance-evidence-contract.json"
    ).read_text()
)

RESULTS = json.loads(
    (
        ROOT
        / "evidence"
        / "founder-acceptance-results.json"
    ).read_text()
)


def main() -> None:
    required_suites = CONTRACT["requiredSuites"]
    suites = RESULTS["suites"]
    suite_ids = [
        suite["suiteId"]
        for suite in suites
    ]

    allowed_statuses = set(
        EVIDENCE_CONTRACT["suiteStatuses"]
    )

    assert EVIDENCE_CONTRACT["schemaVersion"] == 1
    assert EVIDENCE_CONTRACT["phase"] == "19"
    assert (
        EVIDENCE_CONTRACT["status"]
        == "contract-only"
    )

    assert RESULTS["schemaVersion"] == 1
    assert RESULTS["phase"] == "19"
    assert RESULTS["status"] == "NOT_STARTED"

    assert suite_ids == required_suites
    assert len(suites) == 10
    assert len(set(suite_ids)) == 10

    for suite in suites:
        assert suite["status"] in allowed_statuses
        assert suite["status"] == "NOT_STARTED"
        assert suite["environment"] == "isolated"
        assert suite["checksTotal"] == 0
        assert suite["checksPassed"] == 0
        assert suite["checksFailed"] == 0
        assert suite["checksBlocked"] == 0
        assert suite["evidenceReferences"] == []
        assert suite["defects"] == []
        assert suite["founderDecision"] is None

    summary = RESULTS["summary"]

    assert summary["requiredSuites"] == 10
    assert summary["passedSuites"] == 0
    assert summary["failedSuites"] == 0
    assert summary["blockedSuites"] == 0
    assert summary["notStartedSuites"] == 10
    assert summary["totalChecks"] == 0
    assert summary["failedChecks"] == 0
    assert summary["blockedChecks"] == 0
    assert summary["openCriticalDefects"] == 0
    assert summary["openHighDefects"] == 0

    assert (
        RESULTS["environment"]["production"]
        is False
    )

    assert (
        RESULTS["execution"]["authorized"]
        is False
    )

    assert RESULTS["founderSignOff"] == {
        "decision": None,
        "signedAt": None,
        "signedBy": None,
        "notes": None,
    }

    assert RESULTS["authorization"] == {
        "acceptanceExecutionAuthorized": False,
        "productionExecutionAuthorized": False,
        "publicReleaseAuthorized": False,
    }

    rules = EVIDENCE_CONTRACT["acceptanceRules"]

    assert rules["allRequiredSuitesMustPass"] is True
    assert (
        rules["failedChecksPermittedForSignOff"]
        is False
    )
    assert (
        rules["blockedChecksPermittedForSignOff"]
        is False
    )
    assert (
        rules["unresolvedCriticalDefectsPermitted"]
        is False
    )
    assert (
        rules["unresolvedHighDefectsPermitted"]
        is False
    )
    assert rules["founderSignOffRequired"] is True
    assert (
        rules["productionEnvironmentPermitted"]
        is False
    )

    print("FAT evidence contract:      VALID")
    print("Required suites:           ", len(required_suites))
    print("Result records:            ", len(suites))
    print("Not-started suites:        ", summary["notStartedSuites"])
    print("Acceptance authorized:     ", RESULTS["execution"]["authorized"])
    print("Founder sign-off recorded: ", RESULTS["founderSignOff"]["decision"] is not None)
    print("Production authorized:     ", RESULTS["authorization"]["productionExecutionAuthorized"])


if __name__ == "__main__":
    main()
