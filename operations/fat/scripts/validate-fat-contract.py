#!/usr/bin/env python3

import json
from pathlib import Path

contract = json.loads(
    Path(
        "operations/fat/contracts/founder-acceptance-contract.json"
    ).read_text()
)

assert contract["schemaVersion"] == 1
assert contract["phase"] == "19"
assert contract["status"] == "contract-only"

assert len(contract["requiredSuites"]) == 10

assert contract["authorization"] == {
    "productionExecutionAuthorized": False,
    "databaseMutationAuthorized": False,
    "publicReleaseAuthorized": False,
}

manifest = json.loads(
    Path(
        "operations/fat/contracts/"
        "founder-acceptance-suite-manifest.json"
    ).read_text()
)

suite_ids = [
    suite["id"]
    for suite in manifest["suites"]
]

assert manifest["schemaVersion"] == 1
assert manifest["phase"] == "19"
assert manifest["status"] == "contract-only"
assert suite_ids == contract["requiredSuites"]

assert all(
    suite["requiresIsolatedEnvironment"] is True
    for suite in manifest["suites"]
)

assert (
    manifest["execution"]["productionEnvironmentPermitted"]
    is False
)

assert (
    manifest["authorization"]["acceptanceExecutionAuthorized"]
    is False
)

print("Founder Acceptance contract: VALID")
print("Required suites:            ", len(contract["requiredSuites"]))
print("Manifest suites:            ", len(manifest["suites"]))
print("Isolated environment:       required")
print("Acceptance authorized:      ", manifest["authorization"]["acceptanceExecutionAuthorized"])
print("Production authorized:      ", contract["authorization"]["productionExecutionAuthorized"])
