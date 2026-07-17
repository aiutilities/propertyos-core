from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class DependencyGraph:
    document: dict[str, Any]


def build_dependency_graph(
    modules_manifest: dict[str, Any],
    dependency_manifest: dict[str, Any],
    architecture_manifest: dict[str, Any],
) -> DependencyGraph:
    modules_by_source = {
        module["source"]["path"]: module
        for module in modules_manifest["modules"]
    }

    modules_by_id = {
        module["id"]: module
        for module in modules_manifest["modules"]
    }

    architecture_by_id = {
        module["id"]: module
        for module in architecture_manifest["modules"]
    }

    internal_edges: list[dict[str, Any]] = []
    external_dependencies: list[dict[str, Any]] = []
    unresolved_references: list[dict[str, Any]] = []

    for extracted_module in dependency_manifest["modules"]:
        owner = modules_by_source.get(
            extracted_module["source"]["path"]
        )

        if owner is None:
            unresolved_references.append(
                {
                    "type": "MODULE_OWNER_NOT_FOUND",
                    "className": (
                        extracted_module["className"]
                    ),
                    "source": (
                        extracted_module["source"]
                    ),
                }
            )
            continue

        source_module_id = owner["id"]

        for imported in extracted_module["imports"]:
            imported_source = imported["sourcePath"]

            if imported["external"]:
                external_dependencies.append(
                    {
                        "moduleId": source_module_id,
                        "className": (
                            imported["className"]
                        ),
                        "expression": (
                            imported["expression"]
                        ),
                        "source": imported["source"],
                    }
                )
                continue

            if imported_source is None:
                unresolved_references.append(
                    {
                        "type": (
                            "IMPORT_SYMBOL_UNRESOLVED"
                        ),
                        "moduleId": source_module_id,
                        "className": (
                            imported["className"]
                        ),
                        "expression": (
                            imported["expression"]
                        ),
                        "source": imported["source"],
                    }
                )
                continue

            dependency = modules_by_source.get(
                imported_source
            )

            if dependency is None:
                unresolved_references.append(
                    {
                        "type": (
                            "INTERNAL_MODULE_NOT_FOUND"
                        ),
                        "moduleId": source_module_id,
                        "className": (
                            imported["className"]
                        ),
                        "importedSourcePath": (
                            imported_source
                        ),
                        "source": imported["source"],
                    }
                )
                continue

            internal_edges.append(
                {
                    "id": (
                        f"{source_module_id}"
                        f"->{dependency['id']}"
                    ),
                    "type": "MODULE_IMPORTS_MODULE",
                    "fromModuleId": source_module_id,
                    "toModuleId": dependency["id"],
                    "importedClassName": (
                        imported["className"]
                    ),
                    "expression": (
                        imported["expression"]
                    ),
                    "source": imported["source"],
                    "selfDependency": (
                        source_module_id
                        == dependency["id"]
                    ),
                }
            )

    internal_edges.sort(
        key=lambda edge: (
            edge["fromModuleId"],
            edge["toModuleId"],
            edge["importedClassName"],
            edge["source"]["path"],
            edge["source"]["line"],
        )
    )

    external_dependencies.sort(
        key=lambda item: (
            item["moduleId"],
            item["className"],
            item["source"]["path"],
            item["source"]["line"],
        )
    )

    unresolved_references.sort(
        key=lambda item: (
            item.get("moduleId", ""),
            item["type"],
            item.get("className", ""),
            item["source"]["path"],
            item["source"]["line"],
        )
    )

    edge_keys = [
        (
            edge["fromModuleId"],
            edge["toModuleId"],
        )
        for edge in internal_edges
    ]

    duplicate_edge_count = (
        len(edge_keys) - len(set(edge_keys))
    )

    self_dependencies = [
        edge
        for edge in internal_edges
        if edge["selfDependency"]
    ]

    outbound: dict[str, list[str]] = defaultdict(list)
    inbound: dict[str, list[str]] = defaultdict(list)

    for edge in internal_edges:
        outbound[edge["fromModuleId"]].append(
            edge["toModuleId"]
        )

        inbound[edge["toModuleId"]].append(
            edge["fromModuleId"]
        )

    nodes: list[dict[str, Any]] = []

    for module_id, module in modules_by_id.items():
        architecture = architecture_by_id[module_id]

        outbound_ids = sorted(
            set(outbound.get(module_id, []))
        )

        inbound_ids = sorted(
            set(inbound.get(module_id, []))
        )

        nodes.append(
            {
                "id": module_id,
                "name": module["name"],
                "className": module["className"],
                "physicalLocation": (
                    architecture["physicalLocation"]
                ),
                "architecturalRole": (
                    architecture["architecturalRole"]
                ),
                "alignmentStatus": (
                    architecture["alignmentStatus"]
                ),
                "outboundDependencyCount": len(
                    outbound_ids
                ),
                "inboundDependencyCount": len(
                    inbound_ids
                ),
                "outboundModuleIds": outbound_ids,
                "inboundModuleIds": inbound_ids,
                "source": module["source"],
            }
        )

    nodes.sort(
        key=lambda node: (
            node["physicalLocation"],
            node["id"],
        )
    )

    role_edge_counts = Counter()

    for edge in internal_edges:
        source_role = architecture_by_id[
            edge["fromModuleId"]
        ]["architecturalRole"]

        target_role = architecture_by_id[
            edge["toModuleId"]
        ]["architecturalRole"]

        role_edge_counts[
            f"{source_role}->{target_role}"
        ] += 1

    integrity_issue_count = (
        len(unresolved_references)
        + len(self_dependencies)
        + duplicate_edge_count
    )

    document = {
        "schemaVersion": "1.0.0",
        "generator": (
            "propertyos-module-dependency-graph"
        ),
        "sources": {
            "modules": (
                "generated/knowledge/modules.json"
            ),
            "moduleDependencies": (
                "generated/knowledge/"
                "module-dependencies.ast.json"
            ),
            "architecture": (
                "generated/knowledge/"
                "architecture-intelligence.json"
            ),
        },
        "summary": {
            "moduleCount": len(nodes),
            "internalDependencyCount": len(
                internal_edges
            ),
            "externalDependencyCount": len(
                external_dependencies
            ),
            "unresolvedReferenceCount": len(
                unresolved_references
            ),
            "selfDependencyCount": len(
                self_dependencies
            ),
            "duplicateEdgeCount": (
                duplicate_edge_count
            ),
            "integrityIssueCount": (
                integrity_issue_count
            ),
            "roleDependencyCounts": dict(
                sorted(role_edge_counts.items())
            ),
        },
        "integrity": {
            "valid": integrity_issue_count == 0,
            "unresolvedReferences": (
                unresolved_references
            ),
            "selfDependencies": self_dependencies,
            "duplicateEdgeCount": (
                duplicate_edge_count
            ),
        },
        "nodes": nodes,
        "internalDependencies": internal_edges,
        "externalDependencies": (
            external_dependencies
        ),
    }

    return DependencyGraph(document=document)
