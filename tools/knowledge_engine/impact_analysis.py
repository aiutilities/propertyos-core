from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ImpactAnalysis:
    document: dict[str, Any]


def _transitive_reach(
    start: str,
    adjacency: dict[str, set[str]],
) -> list[str]:
    visited: set[str] = set()
    queue: deque[str] = deque(
        sorted(adjacency.get(start, set()))
    )

    while queue:
        current = queue.popleft()

        if current == start or current in visited:
            continue

        visited.add(current)

        for neighbour in sorted(
            adjacency.get(current, set())
        ):
            if (
                neighbour != start
                and neighbour not in visited
            ):
                queue.append(neighbour)

    return sorted(visited)


def _criticality_tier(
    blast_radius: int,
    route_count: int,
    component_count: int,
    inbound_count: int,
) -> str:
    if (
        blast_radius >= 25
        or inbound_count >= 20
        or route_count >= 80
    ):
        return "critical"

    if (
        blast_radius >= 12
        or inbound_count >= 10
        or route_count >= 35
        or component_count >= 15
    ):
        return "high"

    if (
        blast_radius >= 5
        or inbound_count >= 4
        or route_count >= 10
        or component_count >= 6
    ):
        return "medium"

    return "low"


def _risk_score(
    direct_dependents: int,
    transitive_dependents: int,
    direct_dependencies: int,
    transitive_dependencies: int,
    route_count: int,
    component_count: int,
    architecture_violation: bool,
) -> float:
    score = (
        direct_dependents * 3.0
        + transitive_dependents * 1.5
        + direct_dependencies * 1.0
        + transitive_dependencies * 0.35
        + min(route_count, 100) * 0.15
        + min(component_count, 50) * 0.25
        + (
            5.0
            if architecture_violation
            else 0.0
        )
    )

    return round(score, 2)


def build_impact_analysis(
    repository_ir: dict[str, Any],
    dependency_graph: dict[str, Any],
) -> ImpactAnalysis:
    modules_by_id = {
        module["id"]: module
        for module in repository_ir["modules"]
    }

    forward: dict[str, set[str]] = {
        module_id: set()
        for module_id in modules_by_id
    }

    reverse: dict[str, set[str]] = {
        module_id: set()
        for module_id in modules_by_id
    }

    for edge in dependency_graph[
        "internalDependencies"
    ]:
        source = edge["fromModuleId"]
        target = edge["toModuleId"]

        forward.setdefault(source, set()).add(
            target
        )

        reverse.setdefault(target, set()).add(
            source
        )

    records: list[dict[str, Any]] = []

    for module_id, module in modules_by_id.items():
        direct_dependencies = sorted(
            forward.get(module_id, set())
        )

        direct_dependents = sorted(
            reverse.get(module_id, set())
        )

        transitive_dependencies = (
            _transitive_reach(
                module_id,
                forward,
            )
        )

        transitive_dependents = (
            _transitive_reach(
                module_id,
                reverse,
            )
        )

        downstream_only = sorted(
            set(transitive_dependencies)
            - set(direct_dependencies)
        )

        upstream_only = sorted(
            set(transitive_dependents)
            - set(direct_dependents)
        )

        component_count = len(
            module["componentIds"]
        )

        route_count = len(
            module["routeIds"]
        )

        architecture_violation = (
            module["alignmentStatus"]
            == "violation"
        )

        blast_radius = len(
            transitive_dependents
        )

        dependency_surface = len(
            transitive_dependencies
        )

        risk_score = _risk_score(
            direct_dependents=len(
                direct_dependents
            ),
            transitive_dependents=len(
                transitive_dependents
            ),
            direct_dependencies=len(
                direct_dependencies
            ),
            transitive_dependencies=len(
                transitive_dependencies
            ),
            route_count=route_count,
            component_count=component_count,
            architecture_violation=(
                architecture_violation
            ),
        )

        criticality = _criticality_tier(
            blast_radius=blast_radius,
            route_count=route_count,
            component_count=component_count,
            inbound_count=len(
                direct_dependents
            ),
        )

        records.append(
            {
                "moduleId": module_id,
                "name": module["name"],
                "className": module["className"],
                "physicalLocation": (
                    module["physicalLocation"]
                ),
                "architecturalRole": (
                    module["architecturalRole"]
                ),
                "alignmentStatus": (
                    module["alignmentStatus"]
                ),
                "violationCode": (
                    module["violationCode"]
                ),
                "criticalityTier": criticality,
                "riskScore": risk_score,
                "blastRadius": blast_radius,
                "dependencySurface": (
                    dependency_surface
                ),
                "directDependencyCount": len(
                    direct_dependencies
                ),
                "transitiveDependencyCount": len(
                    transitive_dependencies
                ),
                "directDependentCount": len(
                    direct_dependents
                ),
                "transitiveDependentCount": len(
                    transitive_dependents
                ),
                "componentCount": (
                    component_count
                ),
                "controllerCount": len(
                    module["controllerIds"]
                ),
                "routeCount": route_count,
                "directDependencies": (
                    direct_dependencies
                ),
                "transitiveDependencies": (
                    transitive_dependencies
                ),
                "indirectDependencies": (
                    downstream_only
                ),
                "directDependents": (
                    direct_dependents
                ),
                "transitiveDependents": (
                    transitive_dependents
                ),
                "indirectDependents": (
                    upstream_only
                ),
                "source": module["source"],
            }
        )

    records.sort(
        key=lambda record: (
            -record["riskScore"],
            -record["blastRadius"],
            record["moduleId"],
        )
    )

    critical_modules = [
        record["moduleId"]
        for record in records
        if record["criticalityTier"]
        == "critical"
    ]

    high_impact_modules = [
        record["moduleId"]
        for record in records
        if record["criticalityTier"]
        in {"critical", "high"}
    ]

    migration_risks = [
        {
            "moduleId": record["moduleId"],
            "riskScore": record["riskScore"],
            "criticalityTier": (
                record["criticalityTier"]
            ),
            "blastRadius": (
                record["blastRadius"]
            ),
            "directDependentCount": (
                record[
                    "directDependentCount"
                ]
            ),
            "transitiveDependentCount": (
                record[
                    "transitiveDependentCount"
                ]
            ),
            "directDependencyCount": (
                record[
                    "directDependencyCount"
                ]
            ),
            "routeCount": (
                record["routeCount"]
            ),
            "recommendation": (
                "Introduce stable contracts and "
                "dependency inversion before moving "
                "this business module from core into "
                "the plugin layer."
            ),
        }
        for record in records
        if (
            record["alignmentStatus"]
            == "violation"
        )
    ]

    migration_risks.sort(
        key=lambda item: (
            -item["riskScore"],
            item["moduleId"],
        )
    )

    isolated_modules = sorted(
        record["moduleId"]
        for record in records
        if (
            record["directDependencyCount"]
            == 0
            and record["directDependentCount"]
            == 0
        )
    )

    leaf_modules = sorted(
        record["moduleId"]
        for record in records
        if (
            record["directDependentCount"]
            == 0
        )
    )

    root_modules = sorted(
        record["moduleId"]
        for record in records
        if (
            record["directDependencyCount"]
            == 0
        )
    )

    tier_counts = {
        tier: sum(
            1
            for record in records
            if record["criticalityTier"]
            == tier
        )
        for tier in (
            "critical",
            "high",
            "medium",
            "low",
        )
    }

    highest_risk = (
        records[0]["riskScore"]
        if records
        else 0.0
    )

    average_risk = (
        round(
            sum(
                record["riskScore"]
                for record in records
            )
            / len(records),
            2,
        )
        if records
        else 0.0
    )

    document = {
        "schemaVersion": "1.0.0",
        "generator": (
            "propertyos-module-impact-analysis"
        ),
        "sources": {
            "repositoryIr": (
                "generated/knowledge/"
                "repository.ir.json"
            ),
            "dependencyGraph": (
                "generated/knowledge/"
                "dependency-graph.json"
            ),
        },
        "methodology": {
            "changeDirection": (
                "A change to a dependency can affect "
                "all modules that directly or "
                "transitively depend on it."
            ),
            "blastRadiusDefinition": (
                "Number of unique transitive "
                "dependents."
            ),
            "dependencySurfaceDefinition": (
                "Number of unique transitive "
                "dependencies."
            ),
            "riskScoreFactors": [
                "direct dependents",
                "transitive dependents",
                "direct dependencies",
                "transitive dependencies",
                "route count",
                "component count",
                "architecture violation",
            ],
        },
        "summary": {
            "moduleCount": len(records),
            "criticalModuleCount": len(
                critical_modules
            ),
            "highImpactModuleCount": len(
                high_impact_modules
            ),
            "architectureMigrationRiskCount": (
                len(migration_risks)
            ),
            "isolatedModuleCount": len(
                isolated_modules
            ),
            "rootModuleCount": len(
                root_modules
            ),
            "leafModuleCount": len(
                leaf_modules
            ),
            "highestRiskScore": highest_risk,
            "averageRiskScore": average_risk,
            "criticalityTierCounts": (
                tier_counts
            ),
        },
        "criticalModuleIds": (
            critical_modules
        ),
        "highImpactModuleIds": (
            high_impact_modules
        ),
        "isolatedModuleIds": (
            isolated_modules
        ),
        "rootModuleIds": root_modules,
        "leafModuleIds": leaf_modules,
        "architectureMigrationRisks": (
            migration_risks
        ),
        "modules": records,
    }

    return ImpactAnalysis(document=document)
