from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any

from .architecture_policy import classify_module


@dataclass(frozen=True)
class ArchitectureAnalysis:
    document: dict[str, Any]


def _module_record(
    module: dict[str, Any],
) -> dict[str, Any]:
    module_id = str(module["id"])
    physical_location = str(module["kind"])

    classification = classify_module(
        module_id=module_id,
        physical_location=physical_location,
    )

    return {
        "id": module_id,
        "name": module["name"],
        "className": module["className"],
        "physicalLocation": physical_location,
        "architecturalRole": (
            classification.architectural_role
        ),
        "expectedLocation": (
            classification.expected_location
        ),
        "alignmentStatus": (
            classification.alignment_status
        ),
        "violationCode": (
            classification.violation_code
        ),
        "rationale": classification.rationale,
        "componentCount": module["componentCount"],
        "source": module["source"],
    }


def analyse_architecture(
    modules_manifest: dict[str, Any],
) -> ArchitectureAnalysis:
    module_records = sorted(
        (
            _module_record(module)
            for module in modules_manifest["modules"]
        ),
        key=lambda module: (
            module["physicalLocation"],
            module["id"],
            module["source"]["path"],
        ),
    )

    role_counts = Counter(
        module["architecturalRole"]
        for module in module_records
    )

    location_counts = Counter(
        module["physicalLocation"]
        for module in module_records
    )

    alignment_counts = Counter(
        module["alignmentStatus"]
        for module in module_records
    )

    violations = [
        {
            "moduleId": module["id"],
            "moduleName": module["name"],
            "code": module["violationCode"],
            "physicalLocation": (
                module["physicalLocation"]
            ),
            "expectedLocation": (
                module["expectedLocation"]
            ),
            "architecturalRole": (
                module["architecturalRole"]
            ),
            "source": module["source"],
            "message": module["rationale"],
        }
        for module in module_records
        if module["alignmentStatus"] == "violation"
    ]

    recommendations = [
        {
            "moduleId": violation["moduleId"],
            "priority": "architecture-migration",
            "action": (
                "Assess dependencies, database migrations, public "
                "contracts, events, and UI coupling before moving "
                "this module from core into a plugin."
            ),
            "targetLocation": violation["expectedLocation"],
        }
        for violation in violations
    ]

    classified_count = sum(
        1
        for module in module_records
        if module["alignmentStatus"] != "unclassified"
    )

    aligned_count = alignment_counts["aligned"]

    health_score = (
        round(
            aligned_count
            / classified_count
            * 100,
            2,
        )
        if classified_count
        else 100.0
    )

    document = {
        "schemaVersion": "1.0.0",
        "generator": (
            "propertyos-architecture-intelligence"
        ),
        "sources": {
            "modules": (
                "generated/knowledge/modules.json"
            ),
            "policy": (
                "tools/knowledge_engine/"
                "architecture_policy.py"
            ),
            "architectureBoundary": (
                "architecture/"
                "004-Core-vs-Plugin-Boundaries.md"
            ),
        },
        "summary": {
            "moduleCount": len(module_records),
            "classifiedModuleCount": classified_count,
            "alignedModuleCount": aligned_count,
            "violationCount": len(violations),
            "unclassifiedModuleCount": (
                alignment_counts["unclassified"]
            ),
            "architectureHealthScore": health_score,
            "physicalLocationCounts": dict(
                sorted(location_counts.items())
            ),
            "architecturalRoleCounts": dict(
                sorted(role_counts.items())
            ),
            "alignmentStatusCounts": dict(
                sorted(alignment_counts.items())
            ),
        },
        "modules": module_records,
        "violations": violations,
        "recommendations": recommendations,
    }

    return ArchitectureAnalysis(document=document)
