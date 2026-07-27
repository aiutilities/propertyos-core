#!/usr/bin/env python3

import json
from pathlib import Path

ROOT = Path("operations/production")

contract = json.loads(
    (ROOT/"evidence"/"release-evidence-contract.json").read_text()
)

assert contract["schemaVersion"] == 1
assert contract["phase"] == "18"
assert contract["status"] == "contract-only"
assert len(contract["requiredEvidence"]) == 12

assert contract["authorization"] == {
    "productionExecutionAuthorized": False,
    "databaseMutationAuthorized": False,
    "migrationExecutionAuthorized": False,
}

manifest = json.loads(
    (ROOT/"manifests"/"release-manifest.json").read_text()
)

assert manifest["schemaVersion"] == 1
assert manifest["status"] == "contract-only"
assert len(manifest["artifacts"]) == 7

build = json.loads(
    (
        ROOT
        / "evidence"
        / "build-evidence.json"
    ).read_text()
)

health = json.loads(
    (
        ROOT
        / "evidence"
        / "health-performance-evidence.json"
    ).read_text()
)

operations = json.loads(
    (
        ROOT
        / "evidence"
        / "operations-readiness-evidence.json"
    ).read_text()
)

assert build["status"] == "contract-only"
assert set(build["artifacts"]) == {
    "backend",
    "scheduler",
    "frontend",
    "docker",
}
assert (
    build["authorization"]
    ["productionDeploymentAuthorized"]
    is False
)

assert health["status"] == "validated-baseline"
assert health["performance"]["measuredRequests"] == 900
assert health["performance"]["successfulResponses"] == 900
assert health["performance"]["failedResponses"] == 0
assert health["performance"]["passed"] is True

assert operations["status"] == "validated"
assert operations["contracts"]["runbooks"] == 7
assert operations["contracts"]["inventories"] == 5
assert operations["contracts"]["templates"] == 4
assert operations["contracts"]["checklists"] == 4
assert (
    operations["authorization"]
    ["productionDeploymentAuthorized"]
    is False
)

print("Release evidence:           VALID")
print("Evidence items:            ", len(contract["requiredEvidence"]))
print("Manifest artifacts:        ", len(manifest["artifacts"]))
print("Build artifact groups:     ", len(build["artifacts"]))
print("Measured requests:         ", health["performance"]["measuredRequests"])
print("Operations validators:     ", len(operations["validators"]))
print("Production authorized:     ", contract["authorization"]["productionExecutionAuthorized"])
