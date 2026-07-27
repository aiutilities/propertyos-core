#!/usr/bin/env python3

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REPORT = json.loads(
    (
        ROOT
        / "preflight"
        / "static-preflight.json"
    ).read_text()
)

FILES = {
    "acceptanceContract": (
        ROOT
        / "contracts"
        / "founder-acceptance-contract.json"
    ),
    "suiteManifest": (
        ROOT
        / "contracts"
        / "founder-acceptance-suite-manifest.json"
    ),
    "evidenceContract": (
        ROOT
        / "contracts"
        / "founder-acceptance-evidence-contract.json"
    ),
    "initialResults": (
        ROOT
        / "evidence"
        / "founder-acceptance-results.json"
    ),
    "executionPlan": (
        ROOT
        / "plans"
        / "execution-plan.json"
    ),
    "readinessInventory": (
        ROOT
        / "readiness"
        / "isolated-execution-readiness.json"
    ),
    "runtimeContract": (
        ROOT
        / "runtime"
        / "isolated-runtime-contract.json"
    ),
    "environmentTemplate": (
        ROOT
        / "templates"
        / ".env.fat.template"
    ),
    "composeTemplate": (
        ROOT
        / "templates"
        / "docker-compose.fat.template.yml"
    ),
    "suiteEvidenceTemplate": (
        ROOT
        / "templates"
        / "suite-evidence-template.json"
    ),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(
        path.read_bytes()
    ).hexdigest()


def main() -> None:
    assert REPORT["schemaVersion"] == 1
    assert REPORT["phase"] == "19"
    assert REPORT["artifact"] == (
        "fat-static-preflight"
    )
    assert REPORT["status"] == "READY"

    assert REPORT["ports"] == {
        "api": 3019,
        "frontend": 3020,
        "postgres": 5439,
    }

    assert set(REPORT["sourceDigests"]) == set(FILES)

    for name, path in FILES.items():
        assert path.is_file(), (
            f"missing FAT source file: {path}"
        )

        assert (
            REPORT["sourceDigests"][name]
            == sha256(path)
        ), (
            f"FAT source digest changed: {path}"
        )

    validation = REPORT["validation"]

    assert validation["requiredFilesPresent"] is True
    assert validation["jsonDocumentsValid"] is True
    assert validation["portsAvailable"] is True
    assert validation["defaultServiceCount"] == 3
    assert validation["profileGatedServiceCount"] == 1
    assert validation["totalServiceCount"] == 4
    assert validation["composeRendered"] is True
    assert validation["composeRenderFormat"] == "json"
    assert validation["composeSafetyValidated"] is True
    assert (
        validation["migrationProfileGateValidated"]
        is True
    )

    rendered_digest = REPORT[
        "renderedComposeSha256"
    ]

    assert len(rendered_digest) == 64
    int(rendered_digest, 16)

    assert REPORT["authorization"] == {
        "runtimeStartAuthorized": False,
        "databaseCreationAuthorized": False,
        "migrationExecutionAuthorized": False,
        "databaseWritesAuthorized": False,
        "acceptanceExecutionAuthorized": False,
        "productionExecutionAuthorized": False,
        "publicReleaseAuthorized": False,
    }

    assert REPORT["execution"] == {
        "servicesStarted": False,
        "containersCreated": False,
        "databaseCreated": False,
        "migrationsExecuted": False,
        "testsExecuted": False,
        "databaseMutated": False,
    }

    print("FAT static preflight:       VALID")
    print("Source contracts:          ", len(FILES))
    print("Default services:          ", validation["defaultServiceCount"])
    print("Profile-gated services:    ", validation["profileGatedServiceCount"])
    print("Total services:            ", validation["totalServiceCount"])
    print("API port:                  ", REPORT["ports"]["api"])
    print("Frontend port:             ", REPORT["ports"]["frontend"])
    print("PostgreSQL port:           ", REPORT["ports"]["postgres"])
    print("Services started:          ", REPORT["execution"]["servicesStarted"])
    print("Containers created:        ", REPORT["execution"]["containersCreated"])
    print("Database created:          ", REPORT["execution"]["databaseCreated"])
    print("Migrations executed:       ", REPORT["execution"]["migrationsExecuted"])
    print("Acceptance authorized:     ", REPORT["authorization"]["acceptanceExecutionAuthorized"])


if __name__ == "__main__":
    main()
