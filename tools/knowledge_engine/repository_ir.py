from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RepositoryIr:
    document: dict[str, Any]


def _without(
    value: dict[str, Any],
    *keys: str,
) -> dict[str, Any]:
    excluded = set(keys)

    return {
        key: item
        for key, item in value.items()
        if key not in excluded
    }


def _resolve_controller_module_id(
    controller_module_id: str,
    known_module_ids: set[str],
) -> str | None:
    if controller_module_id in known_module_ids:
        return controller_module_id

    plugin_id = f"plugin:{controller_module_id}"

    if plugin_id in known_module_ids:
        return plugin_id

    configuration_id = (
        f"configuration:{controller_module_id}"
    )

    if configuration_id in known_module_ids:
        return configuration_id

    database_id = f"database:{controller_module_id}"

    if database_id in known_module_ids:
        return database_id

    return None


def build_repository_ir(
    modules_manifest: dict[str, Any],
    controllers_manifest: dict[str, Any],
    architecture_manifest: dict[str, Any],
) -> RepositoryIr:
    architecture_by_module_id = {
        module["id"]: module
        for module in architecture_manifest["modules"]
    }

    known_module_ids = {
        module["id"]
        for module in modules_manifest["modules"]
    }

    components: list[dict[str, Any]] = []

    component_ids_by_module: dict[str, list[str]] = {
        module_id: []
        for module_id in known_module_ids
    }

    for module in modules_manifest["modules"]:
        for component in module["components"]:
            record = dict(component)

            architecture = architecture_by_module_id[
                module["id"]
            ]

            record["ownership"] = {
                "moduleId": module["id"],
                "physicalLocation": (
                    architecture["physicalLocation"]
                ),
                "architecturalRole": (
                    architecture["architecturalRole"]
                ),
            }

            components.append(record)

            component_ids_by_module[
                module["id"]
            ].append(component["id"])

    components.sort(
        key=lambda component: (
            component["moduleId"],
            component["kind"],
            component["id"],
            component["source"]["path"],
        )
    )

    controller_records: list[dict[str, Any]] = []
    route_records: list[dict[str, Any]] = []

    controller_ids_by_module: dict[str, list[str]] = {
        module_id: []
        for module_id in known_module_ids
    }

    route_ids_by_module: dict[str, list[str]] = {
        module_id: []
        for module_id in known_module_ids
    }

    route_ids_by_controller: dict[str, list[str]] = {}

    unresolved_controller_module_ids: list[
        dict[str, str]
    ] = []

    for controller in controllers_manifest["controllers"]:
        original_module_id = controller["moduleId"]

        resolved_module_id = (
            _resolve_controller_module_id(
                original_module_id,
                known_module_ids,
            )
        )

        if resolved_module_id is None:
            unresolved_controller_module_ids.append(
                {
                    "controllerId": controller["id"],
                    "moduleId": original_module_id,
                }
            )

            resolved_module_id = original_module_id

        architecture = architecture_by_module_id.get(
            resolved_module_id
        )

        controller_record = _without(
            controller,
            "routes",
        )

        controller_record["moduleId"] = (
            resolved_module_id
        )

        controller_record[
            "declaredModuleId"
        ] = original_module_id

        controller_record["routeIds"] = sorted(
            route["id"]
            for route in controller["routes"]
        )

        controller_record["ownership"] = {
            "moduleId": resolved_module_id,
            "physicalLocation": (
                architecture["physicalLocation"]
                if architecture
                else "unknown"
            ),
            "architecturalRole": (
                architecture["architecturalRole"]
                if architecture
                else "unknown"
            ),
        }

        controller_records.append(
            controller_record
        )

        controller_ids_by_module.setdefault(
            resolved_module_id,
            [],
        ).append(controller["id"])

        route_ids_by_controller[
            controller["id"]
        ] = []

        for route in controller["routes"]:
            route_record = dict(route)

            route_record["moduleId"] = (
                resolved_module_id
            )

            route_record[
                "declaredModuleId"
            ] = route["moduleId"]

            route_record["ownership"] = {
                "moduleId": resolved_module_id,
                "controllerId": controller["id"],
                "physicalLocation": (
                    architecture["physicalLocation"]
                    if architecture
                    else "unknown"
                ),
                "architecturalRole": (
                    architecture["architecturalRole"]
                    if architecture
                    else "unknown"
                ),
            }

            route_records.append(route_record)

            route_ids_by_controller[
                controller["id"]
            ].append(route["id"])

            route_ids_by_module.setdefault(
                resolved_module_id,
                [],
            ).append(route["id"])

    controller_records.sort(
        key=lambda controller: (
            controller["moduleId"],
            controller["id"],
            controller["source"]["path"],
        )
    )

    route_records.sort(
        key=lambda route: (
            route["moduleId"],
            route["controllerId"],
            route["httpMethod"],
            route["fullPath"],
            route["handler"],
            route["id"],
        )
    )

    module_records: list[dict[str, Any]] = []

    for module in modules_manifest["modules"]:
        architecture = architecture_by_module_id[
            module["id"]
        ]

        module_record = _without(
            module,
            "components",
            "controllers",
            "services",
        )

        module_record.update(
            {
                "physicalLocation": (
                    architecture["physicalLocation"]
                ),
                "architecturalRole": (
                    architecture["architecturalRole"]
                ),
                "expectedLocation": (
                    architecture["expectedLocation"]
                ),
                "alignmentStatus": (
                    architecture["alignmentStatus"]
                ),
                "violationCode": (
                    architecture["violationCode"]
                ),
                "componentIds": sorted(
                    component_ids_by_module.get(
                        module["id"],
                        [],
                    )
                ),
                "controllerIds": sorted(
                    controller_ids_by_module.get(
                        module["id"],
                        [],
                    )
                ),
                "routeIds": sorted(
                    route_ids_by_module.get(
                        module["id"],
                        [],
                    )
                ),
                "serviceClassNames": sorted(
                    module["services"]
                ),
                "controllerClassNames": sorted(
                    module["controllers"]
                ),
            }
        )

        module_records.append(module_record)

    module_records.sort(
        key=lambda module: (
            module["physicalLocation"],
            module["id"],
            module["source"]["path"],
        )
    )

    ownership_records: list[dict[str, Any]] = []

    for module in module_records:
        ownership_records.append(
            {
                "entityType": "module",
                "entityId": module["id"],
                "moduleId": module["id"],
                "physicalLocation": (
                    module["physicalLocation"]
                ),
                "architecturalRole": (
                    module["architecturalRole"]
                ),
            }
        )

    for component in components:
        ownership_records.append(
            {
                "entityType": "component",
                "entityId": component["id"],
                **component["ownership"],
            }
        )

    for controller in controller_records:
        ownership_records.append(
            {
                "entityType": "controller",
                "entityId": controller["id"],
                **controller["ownership"],
            }
        )

    for route in route_records:
        ownership_records.append(
            {
                "entityType": "route",
                "entityId": route["id"],
                **route["ownership"],
            }
        )

    ownership_records.sort(
        key=lambda ownership: (
            ownership["entityType"],
            ownership["entityId"],
        )
    )

    relationships: list[dict[str, Any]] = []

    for component in components:
        relationships.append(
            {
                "type": "MODULE_CONTAINS_COMPONENT",
                "from": component["moduleId"],
                "to": component["id"],
            }
        )

    for controller in controller_records:
        relationships.append(
            {
                "type": "MODULE_CONTAINS_CONTROLLER",
                "from": controller["moduleId"],
                "to": controller["id"],
            }
        )

    for route in route_records:
        relationships.append(
            {
                "type": "CONTROLLER_EXPOSES_ROUTE",
                "from": route["controllerId"],
                "to": route["id"],
            }
        )

        relationships.append(
            {
                "type": "MODULE_EXPOSES_ROUTE",
                "from": route["moduleId"],
                "to": route["id"],
            }
        )

    relationships.sort(
        key=lambda relationship: (
            relationship["type"],
            relationship["from"],
            relationship["to"],
        )
    )

    relationship_type_counts = Counter(
        relationship["type"]
        for relationship in relationships
    )

    ownership_type_counts = Counter(
        ownership["entityType"]
        for ownership in ownership_records
    )

    component_ids = {
        component["id"]
        for component in components
    }

    controller_ids = {
        controller["id"]
        for controller in controller_records
    }

    route_ids = {
        route["id"]
        for route in route_records
    }

    duplicate_component_count = (
        len(components) - len(component_ids)
    )

    duplicate_controller_count = (
        len(controller_records)
        - len(controller_ids)
    )

    duplicate_route_count = (
        len(route_records) - len(route_ids)
    )

    orphan_components = [
        component["id"]
        for component in components
        if component["moduleId"]
        not in known_module_ids
    ]

    orphan_controllers = [
        controller["id"]
        for controller in controller_records
        if controller["moduleId"]
        not in known_module_ids
    ]

    orphan_routes = [
        route["id"]
        for route in route_records
        if (
            route["moduleId"]
            not in known_module_ids
            or route["controllerId"]
            not in controller_ids
        )
    ]

    integrity_issue_count = (
        duplicate_component_count
        + duplicate_controller_count
        + duplicate_route_count
        + len(orphan_components)
        + len(orphan_controllers)
        + len(orphan_routes)
        + len(unresolved_controller_module_ids)
    )

    document = {
        "schemaVersion": "1.0.0",
        "generator": (
            "propertyos-unified-repository-ir"
        ),
        "sources": {
            "modules": (
                "generated/knowledge/modules.json"
            ),
            "controllers": (
                "generated/knowledge/controllers.json"
            ),
            "architecture": (
                "generated/knowledge/"
                "architecture-intelligence.json"
            ),
        },
        "summary": {
            "moduleCount": len(module_records),
            "componentCount": len(components),
            "controllerCount": len(
                controller_records
            ),
            "routeCount": len(route_records),
            "ownershipRecordCount": len(
                ownership_records
            ),
            "relationshipCount": len(
                relationships
            ),
            "architectureViolationCount": (
                architecture_manifest[
                    "summary"
                ]["violationCount"]
            ),
            "relationshipTypeCounts": dict(
                sorted(
                    relationship_type_counts.items()
                )
            ),
            "ownershipTypeCounts": dict(
                sorted(
                    ownership_type_counts.items()
                )
            ),
            "integrityIssueCount": (
                integrity_issue_count
            ),
        },
        "integrity": {
            "valid": integrity_issue_count == 0,
            "duplicateComponentCount": (
                duplicate_component_count
            ),
            "duplicateControllerCount": (
                duplicate_controller_count
            ),
            "duplicateRouteCount": (
                duplicate_route_count
            ),
            "orphanComponentIds": sorted(
                orphan_components
            ),
            "orphanControllerIds": sorted(
                orphan_controllers
            ),
            "orphanRouteIds": sorted(
                orphan_routes
            ),
            "unresolvedControllerModules": sorted(
                unresolved_controller_module_ids,
                key=lambda item: (
                    item["moduleId"],
                    item["controllerId"],
                ),
            ),
        },
        "modules": module_records,
        "components": components,
        "controllers": controller_records,
        "routes": route_records,
        "ownership": ownership_records,
        "relationships": relationships,
    }

    return RepositoryIr(document=document)
