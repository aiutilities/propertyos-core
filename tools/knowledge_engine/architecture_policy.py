from __future__ import annotations

from dataclasses import dataclass
from typing import Final


PLATFORM_MODULES: Final[frozenset[str]] = frozenset(
    {
        "access-control",
        "admin",
        "ai",
        "audit",
        "auth",
        "authorization",
        "bootstrap",
        "configuration",
        "credential",
        "distribution",
        "document",
        "eventbus",
        "forms",
        "health",
        "identity",
        "integration",
        "metrics",
        "notification",
        "platform",
        "plugin",
        "property",
        "scheduler",
        "search",
        "storage",
        "theme",
        "upload",
        "workflow",
    }
)

BUSINESS_MODULES: Final[frozenset[str]] = frozenset(
    {
        "agreement",
        "communications",
        "facility",
        "helpdesk",
        "inventory",
        "invoice",
        "lease",
        "maintenance",
        "procurement",
        "receipt",
        "rent",
        "report",
        "reservation",
        "staff",
        "tenant",
        "vehicle",
        "vendor",
    }
)


@dataclass(frozen=True)
class ArchitectureClassification:
    architectural_role: str
    expected_location: str
    alignment_status: str
    violation_code: str | None
    rationale: str


def classify_module(
    module_id: str,
    physical_location: str,
) -> ArchitectureClassification:
    if physical_location == "plugin":
        return ArchitectureClassification(
            architectural_role="plugin",
            expected_location="plugin",
            alignment_status="aligned",
            violation_code=None,
            rationale=(
                "The module is physically implemented as a plugin."
            ),
        )

    if physical_location == "configuration":
        return ArchitectureClassification(
            architectural_role="configuration",
            expected_location="configuration",
            alignment_status="aligned",
            violation_code=None,
            rationale=(
                "Configuration modules belong in the "
                "configuration layer."
            ),
        )

    if physical_location == "database":
        return ArchitectureClassification(
            architectural_role="database",
            expected_location="database",
            alignment_status="aligned",
            violation_code=None,
            rationale=(
                "Database modules belong in the database layer."
            ),
        )

    if module_id in PLATFORM_MODULES:
        if physical_location == "core":
            return ArchitectureClassification(
                architectural_role="platform",
                expected_location="core",
                alignment_status="aligned",
                violation_code=None,
                rationale=(
                    "The module provides shared platform "
                    "infrastructure."
                ),
            )

        return ArchitectureClassification(
            architectural_role="platform",
            expected_location="core",
            alignment_status="violation",
            violation_code="PLATFORM_OUTSIDE_CORE",
            rationale=(
                "Platform infrastructure is expected to remain "
                "inside core."
            ),
        )

    if module_id in BUSINESS_MODULES:
        if physical_location == "plugin":
            return ArchitectureClassification(
                architectural_role="business",
                expected_location="plugin",
                alignment_status="aligned",
                violation_code=None,
                rationale=(
                    "Business-specific functionality is isolated "
                    "inside a plugin."
                ),
            )

        return ArchitectureClassification(
            architectural_role="business",
            expected_location="plugin",
            alignment_status="violation",
            violation_code="BUSINESS_MODULE_IN_CORE",
            rationale=(
                "Business-specific functionality should be "
                "implemented as a plugin rather than core."
            ),
        )

    return ArchitectureClassification(
        architectural_role="unknown",
        expected_location="review",
        alignment_status="unclassified",
        violation_code=None,
        rationale=(
            "No explicit architecture policy currently classifies "
            "this module."
        ),
    )
