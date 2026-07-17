from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from .context_models import ContextPackage


def context_to_dict(
    package: ContextPackage,
) -> dict[str, Any]:
    value = asdict(package)

    value["schemaVersion"] = value.pop(
        "schema_version"
    )

    value["focusModules"] = value.pop(
        "focus_modules"
    )

    value["includedModules"] = value.pop(
        "included_modules"
    )

    value["excludedRouteCount"] = value.pop(
        "excluded_route_count"
    )

    request = value["request"]

    request["routeLimit"] = request.pop(
        "route_limit"
    )

    modules = []

    for module in value["includedModules"]:
        module["moduleId"] = module.pop(
            "module_id"
        )

        module["className"] = module.pop(
            "class_name"
        )

        module["riskScore"] = module.pop(
            "risk_score"
        )

        module["blastRadius"] = module.pop(
            "blast_radius"
        )

        module["architectureStatus"] = (
            module.pop(
                "architecture_status"
            )
        )

        module["violationCode"] = module.pop(
            "violation_code"
        )

        module["directDependencies"] = (
            module.pop(
                "direct_dependencies"
            )
        )

        module["directDependents"] = (
            module.pop(
                "direct_dependents"
            )
        )

        modules.append(module)

    value["includedModules"] = modules

    return value


def format_context_json(
    package: ContextPackage,
) -> str:
    return json.dumps(
        context_to_dict(package),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_context_markdown(
    package: ContextPackage,
) -> str:
    lines = [
        "# PropertyOS Repository Context",
        "",
        "## Request",
        "",
        f"- Mode: `{package.request.mode}`",
        f"- Value: `{package.request.value}`",
        f"- Depth: `{package.request.depth}`",
        (
            f"- Route limit per module: "
            f"`{package.request.route_limit}`"
        ),
        "",
        "## Summary",
        "",
    ]

    for key, value in package.summary.items():
        lines.append(
            f"- {key}: `{value}`"
        )

    lines.extend(
        [
            "",
            "## Focus Modules",
            "",
        ]
    )

    for module_id in package.focus_modules:
        lines.append(
            f"- `{module_id}`"
        )

    if package.warnings:
        lines.extend(
            [
                "",
                "## Architecture Warnings",
                "",
            ]
        )

        for warning in package.warnings:
            lines.append(
                f"- {warning}"
            )

    for module in package.included_modules:
        lines.extend(
            [
                "",
                f"## Module: {module.module_id}",
                "",
                "| Field | Value |",
                "|---|---|",
                (
                    f"| Class | "
                    f"`{module.class_name}` |"
                ),
                (
                    f"| Role | "
                    f"`{module.role}` |"
                ),
                (
                    f"| Location | "
                    f"`{module.location}` |"
                ),
                (
                    f"| Criticality | "
                    f"`{module.criticality}` |"
                ),
                (
                    f"| Risk score | "
                    f"`{module.risk_score}` |"
                ),
                (
                    f"| Blast radius | "
                    f"`{module.blast_radius}` |"
                ),
                (
                    f"| Architecture | "
                    f"`{module.architecture_status}` |"
                ),
                (
                    f"| Source | "
                    f"`{module.source}` |"
                ),
                "",
                "### Dependencies",
                "",
            ]
        )

        if module.direct_dependencies:
            for dependency in (
                module.direct_dependencies
            ):
                lines.append(
                    f"- `{dependency}`"
                )
        else:
            lines.append(
                "_No direct dependencies._"
            )

        lines.extend(
            [
                "",
                "### Dependents",
                "",
            ]
        )

        if module.direct_dependents:
            for dependent in (
                module.direct_dependents
            ):
                lines.append(
                    f"- `{dependent}`"
                )
        else:
            lines.append(
                "_No direct dependents._"
            )

        lines.extend(
            [
                "",
                "### Controllers",
                "",
            ]
        )

        if module.controllers:
            lines.extend(
                [
                    "| Controller | Base path | "
                    "Routes | Source |",
                    "|---|---|---:|---|",
                ]
            )

            for controller in (
                module.controllers
            ):
                lines.append(
                    "| "
                    f"`{controller['className']}`"
                    " | "
                    f"`{controller['basePath']}`"
                    " | "
                    f"{controller['routeCount']}"
                    " | "
                    f"`{controller['source']}`"
                    " |"
                )
        else:
            lines.append(
                "_No controllers._"
            )

        lines.extend(
            [
                "",
                "### Routes",
                "",
            ]
        )

        if module.routes:
            lines.extend(
                [
                    "| Method | Path | Handler | "
                    "Permissions |",
                    "|---|---|---|---|",
                ]
            )

            for route in module.routes:
                permissions = ", ".join(
                    route["permissions"]
                )

                lines.append(
                    "| "
                    f"`{route['method']}`"
                    " | "
                    f"`{route['path']}`"
                    " | "
                    f"`{route['handler']}`"
                    " | "
                    f"`{permissions}`"
                    " |"
                )
        else:
            lines.append(
                "_No routes._"
            )

    return "\n".join(lines) + "\n"
