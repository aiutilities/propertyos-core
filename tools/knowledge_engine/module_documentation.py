from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


GENERATED_NOTICE = (
    "<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->"
)


@dataclass(frozen=True)
class GeneratedDocument:
    relative_path: str
    content: str


@dataclass(frozen=True)
class ModuleDocumentation:
    documents: tuple[GeneratedDocument, ...]


def _slug(module_id: str) -> str:
    value = module_id.lower().replace(":", "-")

    value = re.sub(
        r"[^a-z0-9._-]+",
        "-",
        value,
    )

    value = re.sub(r"-+", "-", value)

    return value.strip("-") or "module"


def _escape_cell(value: Any) -> str:
    if value is None:
        return ""

    text = str(value)

    return (
        text.replace("|", r"\|")
        .replace("\n", " ")
        .strip()
    )


def _code(value: Any) -> str:
    return f"`{_escape_cell(value)}`"


def _format_list(values: list[str]) -> str:
    if not values:
        return "_None_"

    return "\n".join(
        f"- `{value}`"
        for value in values
    )


def _source_text(source: dict[str, Any]) -> str:
    path = source.get("path", "unknown")
    line = source.get("line")

    if line is None:
        return f"`{path}`"

    return f"`{path}:{line}`"


def _module_link(module_id: str) -> str:
    return f"[`{module_id}`]({_slug(module_id)}.md)"


def _module_by_id(
    repository_ir: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    return {
        module["id"]: module
        for module in repository_ir["modules"]
    }


def _impact_by_id(
    impact_analysis: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    return {
        module["moduleId"]: module
        for module in impact_analysis["modules"]
    }


def _dependency_node_by_id(
    dependency_graph: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    return {
        node["id"]: node
        for node in dependency_graph["nodes"]
    }


def _components_by_module(
    repository_ir: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    records: dict[
        str,
        list[dict[str, Any]],
    ] = {}

    for component in repository_ir["components"]:
        records.setdefault(
            component["moduleId"],
            [],
        ).append(component)

    for components in records.values():
        components.sort(
            key=lambda component: (
                component.get("kind", ""),
                component.get("className", ""),
                component["id"],
            )
        )

    return records


def _controllers_by_module(
    repository_ir: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    records: dict[
        str,
        list[dict[str, Any]],
    ] = {}

    for controller in repository_ir["controllers"]:
        records.setdefault(
            controller["moduleId"],
            [],
        ).append(controller)

    for controllers in records.values():
        controllers.sort(
            key=lambda controller: (
                controller.get("basePath", ""),
                controller.get("className", ""),
                controller["id"],
            )
        )

    return records


def _routes_by_module(
    repository_ir: dict[str, Any],
) -> dict[str, list[dict[str, Any]]]:
    records: dict[
        str,
        list[dict[str, Any]],
    ] = {}

    for route in repository_ir["routes"]:
        records.setdefault(
            route["moduleId"],
            [],
        ).append(route)

    for routes in records.values():
        routes.sort(
            key=lambda route: (
                route.get("fullPath", ""),
                route.get("httpMethod", ""),
                route.get("handler", ""),
                route["id"],
            )
        )

    return records


def _permissions_text(
    permissions: Any,
) -> str:
    if not permissions:
        return ""

    if isinstance(permissions, list):
        return ", ".join(
            f"`{permission}`"
            for permission in permissions
        )

    return f"`{permissions}`"


def _render_components(
    components: list[dict[str, Any]],
) -> str:
    if not components:
        return "_No components discovered._"

    lines = [
        "| Kind | Class | Source |",
        "|---|---|---|",
    ]

    for component in components:
        lines.append(
            "| "
            + " | ".join(
                (
                    _escape_cell(
                        component.get(
                            "kind",
                            "unknown",
                        )
                    ),
                    _code(
                        component.get(
                            "className",
                            component["id"],
                        )
                    ),
                    _source_text(
                        component["source"]
                    ),
                )
            )
            + " |"
        )

    return "\n".join(lines)


def _render_controllers(
    controllers: list[dict[str, Any]],
) -> str:
    if not controllers:
        return "_No controllers discovered._"

    lines = [
        "| Controller | Base path | Routes | Auth | Source |",
        "|---|---|---:|---|---|",
    ]

    for controller in controllers:
        bearer_auth = (
            "Bearer"
            if controller.get("bearerAuth")
            else "None detected"
        )

        lines.append(
            "| "
            + " | ".join(
                (
                    _code(
                        controller.get(
                            "className",
                            controller["id"],
                        )
                    ),
                    _code(
                        controller.get(
                            "basePath",
                            "",
                        )
                    ),
                    str(
                        controller.get(
                            "routeCount",
                            len(
                                controller.get(
                                    "routeIds",
                                    [],
                                )
                            ),
                        )
                    ),
                    bearer_auth,
                    _source_text(
                        controller["source"]
                    ),
                )
            )
            + " |"
        )

    return "\n".join(lines)


def _render_routes(
    routes: list[dict[str, Any]],
) -> str:
    if not routes:
        return "_No HTTP routes discovered._"

    lines = [
        "| Method | Path | Handler | Permissions | Source |",
        "|---|---|---|---|---|",
    ]

    for route in routes:
        source = route.get(
            "source",
            {
                "path": "unknown",
            },
        )

        lines.append(
            "| "
            + " | ".join(
                (
                    _code(
                        route.get(
                            "httpMethod",
                            "",
                        )
                    ),
                    _code(
                        route.get(
                            "fullPath",
                            "",
                        )
                    ),
                    _code(
                        route.get(
                            "handler",
                            "",
                        )
                    ),
                    _permissions_text(
                        route.get("permissions")
                    ),
                    _source_text(source),
                )
            )
            + " |"
        )

    return "\n".join(lines)


def _render_module_page(
    module: dict[str, Any],
    dependency_node: dict[str, Any],
    impact: dict[str, Any],
    components: list[dict[str, Any]],
    controllers: list[dict[str, Any]],
    routes: list[dict[str, Any]],
) -> str:
    module_id = module["id"]

    migration_section = ""

    if module["alignmentStatus"] == "violation":
        migration_section = f"""
## Architecture Migration Guidance

This module is currently classified as an architecture violation.

| Field | Value |
|---|---|
| Violation | `{module.get("violationCode")}` |
| Current location | `{module["physicalLocation"]}` |
| Expected location | `{module["expectedLocation"]}` |
| Migration risk | `{impact["criticalityTier"]}` |
| Risk score | `{impact["riskScore"]}` |
| Direct dependents | `{impact["directDependentCount"]}` |
| Transitive dependents | `{impact["transitiveDependentCount"]}` |

Before migration, define stable public contracts for the module, identify database ownership, preserve emitted events, and remove direct imports from modules that should communicate through platform interfaces.
"""

    content = f"""{GENERATED_NOTICE}

# {module["name"]}

> Module ID: `{module_id}`

## Overview

| Field | Value |
|---|---|
| Class | `{module["className"]}` |
| Physical location | `{module["physicalLocation"]}` |
| Architectural role | `{module["architecturalRole"]}` |
| Expected location | `{module["expectedLocation"]}` |
| Alignment | `{module["alignmentStatus"]}` |
| Criticality | `{impact["criticalityTier"]}` |
| Risk score | `{impact["riskScore"]}` |
| Blast radius | `{impact["blastRadius"]}` |
| Dependency surface | `{impact["dependencySurface"]}` |
| Source | {_source_text(module["source"])} |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | {len(components)} |
| Controllers | {len(controllers)} |
| Routes | {len(routes)} |
| Direct dependencies | {dependency_node["outboundDependencyCount"]} |
| Direct dependents | {dependency_node["inboundDependencyCount"]} |
| Transitive dependencies | {impact["transitiveDependencyCount"]} |
| Transitive dependents | {impact["transitiveDependentCount"]} |

## Direct Dependencies

{_format_list(impact["directDependencies"])}

## Direct Dependents

{_format_list(impact["directDependents"])}

## Transitive Impact

A change to `{module_id}` can potentially affect **{impact["transitiveDependentCount"]}** modules transitively.

{_format_list(impact["transitiveDependents"])}

{migration_section}
## Controllers

{_render_controllers(controllers)}

## Routes

{_render_routes(routes)}

## Components

{_render_components(components)}
"""

    return content.strip() + "\n"


def _render_index(
    modules: list[dict[str, Any]],
    impact_by_id: dict[str, dict[str, Any]],
    repository_ir: dict[str, Any],
    dependency_graph: dict[str, Any],
    impact_analysis: dict[str, Any],
) -> str:
    lines = [
        GENERATED_NOTICE,
        "",
        "# PropertyOS Module Reference",
        "",
        (
            "This documentation is generated from the "
            "PropertyOS Knowledge Engine."
        ),
        "",
        "## Repository Summary",
        "",
        "| Metric | Count |",
        "|---|---:|",
        (
            f"| Modules | "
            f"{repository_ir['summary']['moduleCount']} |"
        ),
        (
            f"| Components | "
            f"{repository_ir['summary']['componentCount']} |"
        ),
        (
            f"| Controllers | "
            f"{repository_ir['summary']['controllerCount']} |"
        ),
        (
            f"| Routes | "
            f"{repository_ir['summary']['routeCount']} |"
        ),
        (
            f"| Internal dependencies | "
            f"{dependency_graph['summary']['internalDependencyCount']} |"
        ),
        (
            f"| Architecture violations | "
            f"{repository_ir['summary']['architectureViolationCount']} |"
        ),
        (
            f"| Critical modules | "
            f"{impact_analysis['summary']['criticalModuleCount']} |"
        ),
        (
            f"| High-impact modules | "
            f"{impact_analysis['summary']['highImpactModuleCount']} |"
        ),
        "",
        "## Modules",
        "",
        (
            "| Module | Role | Location | Alignment | "
            "Criticality | Risk | Blast radius | Routes |"
        ),
        (
            "|---|---|---|---|---|---:|---:|---:|"
        ),
    ]

    sorted_modules = sorted(
        modules,
        key=lambda module: (
            module["architecturalRole"],
            module["id"],
        ),
    )

    for module in sorted_modules:
        impact = impact_by_id[module["id"]]

        lines.append(
            "| "
            + " | ".join(
                (
                    _module_link(module["id"]),
                    (
                        f"`{module['architecturalRole']}`"
                    ),
                    (
                        f"`{module['physicalLocation']}`"
                    ),
                    (
                        f"`{module['alignmentStatus']}`"
                    ),
                    (
                        f"`{impact['criticalityTier']}`"
                    ),
                    str(impact["riskScore"]),
                    str(impact["blastRadius"]),
                    str(impact["routeCount"]),
                )
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Highest-Risk Modules",
            "",
        ]
    )

    for impact in impact_analysis["modules"][:10]:
        lines.append(
            (
                f"- {_module_link(impact['moduleId'])}: "
                f"risk `{impact['riskScore']}`, "
                f"tier `{impact['criticalityTier']}`, "
                f"blast radius `{impact['blastRadius']}`"
            )
        )

    lines.extend(
        [
            "",
            "## Architecture Migration Candidates",
            "",
        ]
    )

    for migration in impact_analysis[
        "architectureMigrationRisks"
    ]:
        lines.append(
            (
                f"- {_module_link(migration['moduleId'])}: "
                f"risk `{migration['riskScore']}`, "
                f"tier `{migration['criticalityTier']}`"
            )
        )

    return "\n".join(lines).strip() + "\n"


def build_module_documentation(
    repository_ir: dict[str, Any],
    dependency_graph: dict[str, Any],
    impact_analysis: dict[str, Any],
) -> ModuleDocumentation:
    modules_by_id = _module_by_id(
        repository_ir
    )

    impact_by_id = _impact_by_id(
        impact_analysis
    )

    dependency_by_id = _dependency_node_by_id(
        dependency_graph
    )

    components_by_module = (
        _components_by_module(repository_ir)
    )

    controllers_by_module = (
        _controllers_by_module(repository_ir)
    )

    routes_by_module = (
        _routes_by_module(repository_ir)
    )

    module_ids = set(modules_by_id)

    if module_ids != set(impact_by_id):
        raise ValueError(
            "Repository IR and impact analysis "
            "module sets do not match."
        )

    if module_ids != set(dependency_by_id):
        raise ValueError(
            "Repository IR and dependency graph "
            "module sets do not match."
        )

    documents: list[GeneratedDocument] = [
        GeneratedDocument(
            relative_path="README.md",
            content=_render_index(
                modules=list(
                    modules_by_id.values()
                ),
                impact_by_id=impact_by_id,
                repository_ir=repository_ir,
                dependency_graph=dependency_graph,
                impact_analysis=impact_analysis,
            ),
        )
    ]

    for module_id in sorted(module_ids):
        module = modules_by_id[module_id]

        documents.append(
            GeneratedDocument(
                relative_path=(
                    f"{_slug(module_id)}.md"
                ),
                content=_render_module_page(
                    module=module,
                    dependency_node=(
                        dependency_by_id[module_id]
                    ),
                    impact=impact_by_id[
                        module_id
                    ],
                    components=(
                        components_by_module.get(
                            module_id,
                            [],
                        )
                    ),
                    controllers=(
                        controllers_by_module.get(
                            module_id,
                            [],
                        )
                    ),
                    routes=(
                        routes_by_module.get(
                            module_id,
                            [],
                        )
                    ),
                ),
            )
        )

    relative_paths = [
        document.relative_path
        for document in documents
    ]

    if len(relative_paths) != len(
        set(relative_paths)
    ):
        raise ValueError(
            "Generated documentation paths "
            "are not unique."
        )

    return ModuleDocumentation(
        documents=tuple(documents)
    )


def write_module_documentation(
    output_directory: Path,
    documentation: ModuleDocumentation,
) -> None:
    output_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    expected_paths = {
        document.relative_path
        for document in documentation.documents
    }

    for existing in output_directory.glob(
        "*.md"
    ):
        if existing.name not in expected_paths:
            existing.unlink()

    for document in documentation.documents:
        target = (
            output_directory
            / document.relative_path
        )

        target.write_text(
            document.content,
            encoding="utf-8",
        )
