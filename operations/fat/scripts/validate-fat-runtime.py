#!/usr/bin/env python3

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

CONTRACT = json.loads(
    (
        ROOT
        / "runtime"
        / "isolated-runtime-contract.json"
    ).read_text()
)

ENV_PATH = (
    ROOT
    / "templates"
    / ".env.fat.template"
)

COMPOSE_PATH = (
    ROOT
    / "templates"
    / "docker-compose.fat.template.yml"
)


def main() -> None:
    assert CONTRACT["schemaVersion"] == 1
    assert CONTRACT["phase"] == "19"
    assert CONTRACT["status"] == "contract-only"

    runtime = CONTRACT["runtime"]

    assert runtime["apiPort"] == 3019
    assert runtime["frontendPort"] == 3020
    assert runtime["postgresHostPort"] == 5439
    assert runtime["databaseName"] == "propertyos_fat"

    assert (
        CONTRACT["services"]["postgres"]
        ["persistent"]
        is False
    )

    assert (
        CONTRACT["services"]["postgres"]
        ["publicExposurePermitted"]
        is False
    )

    assert (
        CONTRACT["services"]["migrate"]
        ["automaticExecutionPermitted"]
        is False
    )

    assert CONTRACT["authorization"] == {
        "runtimeStartAuthorized": False,
        "databaseCreationAuthorized": False,
        "migrationExecutionAuthorized": False,
        "databaseWritesAuthorized": False,
        "acceptanceExecutionAuthorized": False,
        "productionExecutionAuthorized": False,
        "publicReleaseAuthorized": False,
    }

    assert CONTRACT["execution"] == {
        "servicesStarted": False,
        "databaseCreated": False,
        "migrationsExecuted": False,
        "testsExecuted": False,
        "databaseMutated": False,
    }

    env_text = ENV_PATH.read_text()
    compose_text = COMPOSE_PATH.read_text()

    variables = {
        match.group(1)
        for match in re.finditer(
            r"^[ \t]*([A-Za-z_][A-Za-z0-9_]*)[ \t]*=",
            env_text,
            re.MULTILINE,
        )
    }

    assert len(variables) == 17
    assert "POSTGRES_DB=propertyos_fat" in env_text
    assert "POSTGRES_PORT=5439" in env_text
    assert "RATE_LIMIT_MAX=5000" in env_text

    assert "127.0.0.1:5439:5432" in compose_text
    assert "127.0.0.1:3019:3019" in compose_text
    assert "authorized-fat-migration" in compose_text
    assert "tmpfs:" in compose_text
    assert "/api/v1/health/ready" in compose_text

    print("FAT isolated runtime:       VALID")
    print("API port:                  ", runtime["apiPort"])
    print("Frontend port:             ", runtime["frontendPort"])
    print("PostgreSQL host port:      ", runtime["postgresHostPort"])
    print("Environment variables:     ", len(variables))
    print("Services started:          ", CONTRACT["execution"]["servicesStarted"])
    print("Database created:          ", CONTRACT["execution"]["databaseCreated"])
    print("Migrations executed:       ", CONTRACT["execution"]["migrationsExecuted"])
    print("Acceptance authorized:     ", CONTRACT["authorization"]["acceptanceExecutionAuthorized"])


if __name__ == "__main__":
    main()
