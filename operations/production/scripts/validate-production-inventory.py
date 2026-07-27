#!/usr/bin/env python3

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

INVENTORIES = {
    "runtime": ROOT / "inventory/runtime-inventory.json",
    "environment": ROOT / "inventory/environment-inventory.json",
    "network": ROOT / "inventory/network-inventory.json",
    "storage": ROOT / "inventory/storage-inventory.json",
    "services": ROOT / "inventory/service-inventory.json",
}

TEMPLATES = [
    ROOT / "templates/.env.production.template",
    ROOT / "templates/docker-compose.production.template.yml",
    ROOT / "templates/systemd-api.service",
    ROOT / "templates/systemd-scheduler.service",
]

CHECKLISTS = [
    ROOT / "checklists/pre-deployment.md",
    ROOT / "checklists/post-deployment.md",
    ROOT / "checklists/pre-backup.md",
    ROOT / "checklists/post-restore.md",
]

FORBIDDEN_VALUES = [
    "propertyos-dev-secret-change-me",
    "change-me-in-production",
    "replace-with-a-secure-production-secret",
]


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except FileNotFoundError as error:
        raise AssertionError(
            f"missing inventory: {path}"
        ) from error
    except json.JSONDecodeError as error:
        raise AssertionError(
            f"invalid inventory JSON: {path}: {error}"
        ) from error


def validate_inventories() -> None:
    data = {
        name: load_json(path)
        for name, path in INVENTORIES.items()
    }

    for name, inventory in data.items():
        assert inventory["schemaVersion"] == 1
        assert inventory["phase"] == "18"
        assert inventory["status"] == "contract-only"
        print(f"VALID: {INVENTORIES[name]}")

    runtime = data["runtime"]
    assert (
        runtime["runtime"]["backend"]["compiledEntryPoint"]
        == "backend/dist/main.js"
    )
    assert (
        runtime["runtime"]["scheduler"]["compiledEntryPoint"]
        == "backend/dist/scheduler-worker.js"
    )
    assert runtime["runtime"]["database"]["majorVersion"] == 16
    assert (
        runtime["safety"]["productionExecutionAuthorized"]
        is False
    )

    environment = data["environment"]
    assert len(environment["requiredVariables"]) == 8
    assert len(environment["operationalVariables"]) == 9
    assert set(environment["secretVariables"]) == {
        "POSTGRES_PASSWORD",
        "AUTH_SECRET",
    }
    assert (
        environment["rules"]["secretValuesMayBeCommitted"]
        is False
    )
    assert (
        environment["validation"]["secretValuesCaptured"]
        is False
    )

    network = data["network"]
    assert (
        network["services"]["postgres"]
        ["publicExposurePermitted"]
        is False
    )
    assert (
        network["rules"]["databaseMustNotBePubliclyExposed"]
        is True
    )
    assert (
        network["safety"]["networkChangesAuthorized"]
        is False
    )

    storage = data["storage"]
    assert len(storage["volumes"]) == 3
    assert all(
        item["persistent"] is True
        for item in storage["volumes"].values()
    )
    assert all(
        item["backupRequired"] is True
        for item in storage["volumes"].values()
    )
    assert (
        storage["safety"]["restoreExecutionAuthorized"]
        is False
    )

    services = data["services"]
    assert len(services["services"]) == 7
    assert len({
        item["name"]
        for item in services["services"]
    }) == 7
    assert (
        services["safety"]
        ["migrationServiceExecutionAuthorized"]
        is False
    )
    assert (
        services["safety"]
        ["productionTrafficExposureAuthorized"]
        is False
    )


def validate_templates() -> None:
    for path in TEMPLATES:
        assert path.is_file()
        assert path.stat().st_size > 0
        assert path.read_text().endswith("\n")
        print(f"VALID: {path}")

    env_path = ROOT / "templates/.env.production.template"
    env_text = env_path.read_text()

    found = {
        match.group(1)
        for match in re.finditer(
            r"^[ \t]*([A-Za-z_][A-Za-z0-9_]*)[ \t]*=",
            env_text,
            re.MULTILINE,
        )
    }

    assert len(found) == 17
    assert "NODE_ENV=production" in env_text
    assert (
        "POSTGRES_PASSWORD="
        "<SECRET_FROM_APPROVED_SECRET_STORE>"
        in env_text
    )
    assert (
        "AUTH_SECRET="
        "<SECRET_AT_LEAST_32_CHARACTERS>"
        in env_text
    )

    compose_path = (
        ROOT
        / "templates"
        / "docker-compose.production.template.yml"
    )
    compose = compose_path.read_text()

    assert (
        "POSTGRES_PASSWORD: "
        "${POSTGRES_PASSWORD:?required}"
        in compose
    )
    assert "AUTH_SECRET: ${AUTH_SECRET:?required}" in compose
    assert "authorized-migration" in compose
    assert "dist/scheduler-worker.js" in compose
    assert "/api/v1/health/ready" in compose

    api = (
        ROOT
        / "templates"
        / "systemd-api.service"
    ).read_text()

    scheduler = (
        ROOT
        / "templates"
        / "systemd-scheduler.service"
    ).read_text()

    assert (
        "ExecStart=/usr/bin/node backend/dist/main.js"
        in api
    )
    assert (
        "ExecStart=/usr/bin/node "
        "backend/dist/scheduler-worker.js"
        in scheduler
    )
    assert "NoNewPrivileges=true" in api
    assert "NoNewPrivileges=true" in scheduler

    serialized = "\n".join(
        path.read_text()
        for path in TEMPLATES
    )

    for forbidden in FORBIDDEN_VALUES:
        assert forbidden not in serialized


def validate_checklists() -> None:
    for path in CHECKLISTS:
        assert path.is_file()
        text = path.read_text()

        assert text.startswith("# PropertyOS")
        assert text.endswith("\n")
        assert "## Safety Boundary" in text
        assert "- [ ]" in text

        print(f"VALID: {path}")


def main() -> None:
    validate_inventories()
    validate_templates()
    validate_checklists()

    print("Production inventory:       VALID")
    print("Inventories validated:      5")
    print("Templates validated:        4")
    print("Checklists validated:       4")
    print("Empty files:                0")
    print("Committed secret findings:  0")
    print("Production authorized:      false")


if __name__ == "__main__":
    main()
