#!/usr/bin/env python3

import json
import re
from pathlib import Path


GRAFANA_ROOT = Path(__file__).resolve().parents[1]
OBSERVABILITY_ROOT = GRAFANA_ROOT.parent

CONTRACT_PATH = GRAFANA_ROOT / "propertyos-dashboard-contract.json"
DASHBOARD_PATH = GRAFANA_ROOT / "dashboards/propertyos-operations.json"
RECORDING_RULES_PATH = (
    OBSERVABILITY_ROOT
    / "prometheus/propertyos-recording-rules.yml"
)


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except FileNotFoundError as error:
        raise SystemExit(f"ERROR: missing file: {path}") from error
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"ERROR: invalid JSON in {path}: {error}"
        ) from error


def main() -> None:
    contract = load_json(CONTRACT_PATH)
    dashboard = load_json(DASHBOARD_PATH)

    try:
        recording_text = RECORDING_RULES_PATH.read_text()
    except FileNotFoundError as error:
        raise SystemExit(
            f"ERROR: missing file: {RECORDING_RULES_PATH}"
        ) from error

    available_rules = {
        match.strip().strip(chr(34)).strip(chr(39))
        for match in re.findall(
            r"^[ \t]*-[ \t]+record:[ \t]+([^#\r\n]+)",
            recording_text,
            re.MULTILINE,
        )
    }

    contract_queries = [
        query["expr"]
        for section in contract["sections"]
        for query in section["queries"]
    ]

    dashboard_queries = [
        target["expr"]
        for panel in dashboard["panels"]
        for target in panel.get("targets", [])
    ]

    recording_references = {
        expression
        for expression in contract_queries
        if expression.startswith("propertyos:")
    }

    forbidden_terms = {
        "tenantId",
        "propertyId",
        "actorId",
        "correlationId",
        "payload",
    }

    serialized_dashboard = json.dumps(dashboard)

    assert contract["schemaVersion"] == 1
    assert contract["dashboard"]["uid"] == "propertyos-operations"
    assert (
        contract["dashboard"]["datasourceUid"]
        == "propertyos-prometheus"
    )

    assert dashboard["uid"] == "propertyos-operations"
    assert dashboard["title"] == "PropertyOS Operations"
    assert dashboard["editable"] is False
    assert dashboard["refresh"] == "30s"
    assert dashboard["time"] == {
        "from": "now-6h",
        "to": "now",
    }

    assert len(contract["sections"]) == 7
    assert len(contract_queries) == 21
    assert dashboard_queries == contract_queries
    assert recording_references <= available_rules
    assert contract_queries[0] == (
        "up{job=\"propertyos-api\"}"
    )

    assert all(
        term not in serialized_dashboard
        for term in forbidden_terms
    )

    panel_ids = [
        panel["id"]
        for panel in dashboard["panels"]
    ]

    assert len(panel_ids) == len(set(panel_ids))

    row_count = sum(
        panel["type"] == "row"
        for panel in dashboard["panels"]
    )

    timeseries_count = sum(
        panel["type"] == "timeseries"
        for panel in dashboard["panels"]
    )

    assert row_count == 7
    assert timeseries_count == 21

    print("Grafana dashboard contract: VALID")
    print("Operational sections:       ", len(contract["sections"]))
    print(f"Dashboard queries:           {len(contract_queries)}")
    print(f"Recording-rule references:  {len(recording_references)}")
    print(f"Row panels:                  {row_count}")
    print(f"Timeseries panels:           {timeseries_count}")
    print(f"Unique panel IDs:            {len(panel_ids)}")
    print("Forbidden dimensions found:  0")


if __name__ == "__main__":
    main()
