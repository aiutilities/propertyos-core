from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from .migration_models import (
    MigrationPortfolio,
)


def migration_to_dict(
    portfolio: MigrationPortfolio,
) -> dict[str, Any]:
    value = asdict(portfolio)

    value["schemaVersion"] = value.pop(
        "schema_version"
    )

    value["recommendedOrder"] = value.pop(
        "recommended_order"
    )

    request = value["request"]

    request["moduleId"] = request.pop(
        "module_id"
    )

    plans = []

    for plan in value["plans"]:
        plan["moduleId"] = plan.pop(
            "module_id"
        )

        plan["currentLocation"] = plan.pop(
            "current_location"
        )

        plan["targetLocation"] = plan.pop(
            "target_location"
        )

        plan["architecturalRole"] = plan.pop(
            "architectural_role"
        )

        plan["architectureStatus"] = plan.pop(
            "architecture_status"
        )

        plan["violationCode"] = plan.pop(
            "violation_code"
        )

        plan["riskScore"] = plan.pop(
            "risk_score"
        )

        plan["migrationScore"] = plan.pop(
            "migration_score"
        )

        plan["migrationTier"] = plan.pop(
            "migration_tier"
        )

        plan["blastRadius"] = plan.pop(
            "blast_radius"
        )

        plan["routeCount"] = plan.pop(
            "route_count"
        )

        plan["controllerCount"] = plan.pop(
            "controller_count"
        )

        plan["componentCount"] = plan.pop(
            "component_count"
        )

        plan["directDependencies"] = plan.pop(
            "direct_dependencies"
        )

        plan["platformDependencies"] = plan.pop(
            "platform_dependencies"
        )

        plan["businessDependencies"] = plan.pop(
            "business_dependencies"
        )

        plan["directDependents"] = plan.pop(
            "direct_dependents"
        )

        plan["blockingModules"] = plan.pop(
            "blocking_modules"
        )

        plan["recommendedPredecessors"] = (
            plan.pop(
                "recommended_predecessors"
            )
        )

        plan["validationChecks"] = plan.pop(
            "validation_checks"
        )

        plan["rollbackActions"] = plan.pop(
            "rollback_actions"
        )

        for step in plan["steps"]:
            step["affectedModules"] = step.pop(
                "affected_modules"
            )

        plans.append(plan)

    value["plans"] = plans

    return value


def format_migration_json(
    portfolio: MigrationPortfolio,
) -> str:
    return json.dumps(
        migration_to_dict(portfolio),
        indent=2,
        sort_keys=True,
    ) + "\n"


def format_migration_markdown(
    portfolio: MigrationPortfolio,
) -> str:
    lines = [
        "# PropertyOS Migration Plan",
        "",
        "## Summary",
        "",
    ]

    for key, value in (
        portfolio.summary.items()
    ):
        lines.append(
            f"- {key}: `{value}`"
        )

    lines.extend(
        [
            "",
            "## Recommended Order",
            "",
        ]
    )

    for index, module_id in enumerate(
        portfolio.recommended_order,
        start=1,
    ):
        lines.append(
            f"{index}. `{module_id}`"
        )

    if portfolio.warnings:
        lines.extend(
            [
                "",
                "## Warnings",
                "",
            ]
        )

        for warning in portfolio.warnings:
            lines.append(
                f"- {warning}"
            )

    for plan in portfolio.plans:
        lines.extend(
            [
                "",
                f"## Module: {plan.module_id}",
                "",
                "| Field | Value |",
                "|---|---|",
                (
                    f"| Current location | "
                    f"`{plan.current_location}` |"
                ),
                (
                    f"| Target location | "
                    f"`{plan.target_location}` |"
                ),
                (
                    f"| Architecture status | "
                    f"`{plan.architecture_status}` |"
                ),
                (
                    f"| Criticality | "
                    f"`{plan.criticality}` |"
                ),
                (
                    f"| Repository risk | "
                    f"`{plan.risk_score}` |"
                ),
                (
                    f"| Migration score | "
                    f"`{plan.migration_score}` |"
                ),
                (
                    f"| Migration tier | "
                    f"`{plan.migration_tier}` |"
                ),
                (
                    f"| Blast radius | "
                    f"`{plan.blast_radius}` |"
                ),
                (
                    f"| Routes | "
                    f"`{plan.route_count}` |"
                ),
                (
                    f"| Controllers | "
                    f"`{plan.controller_count}` |"
                ),
                (
                    f"| Components | "
                    f"`{plan.component_count}` |"
                ),
                "",
                "### Migration Steps",
                "",
            ]
        )

        for step in plan.steps:
            lines.extend(
                [
                    (
                        f"#### {step.sequence}. "
                        f"{step.title}"
                    ),
                    "",
                    (
                        f"**Phase:** "
                        f"`{step.phase}`"
                    ),
                    "",
                    step.description,
                    "",
                    (
                        "**Affected modules:** "
                        + ", ".join(
                            f"`{module_id}`"
                            for module_id
                            in step.affected_modules
                        )
                    ),
                    "",
                ]
            )

        lines.extend(
            [
                "### Validation Checks",
                "",
            ]
        )

        for check in (
            plan.validation_checks
        ):
            lines.append(
                f"- [ ] {check}"
            )

        lines.extend(
            [
                "",
                "### Rollback Actions",
                "",
            ]
        )

        for action in (
            plan.rollback_actions
        ):
            lines.append(
                f"- {action}"
            )

    return "\n".join(lines) + "\n"
