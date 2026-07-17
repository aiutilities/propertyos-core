from __future__ import annotations

from typing import Dict, Iterable, List, Set, Tuple

from .migration_models import (
    MigrationPortfolio,
    MigrationRequest,
    MigrationStep,
    ModuleMigrationPlan,
)
from .repository_api import Repository
from .repository_models import Module


class MigrationPlanningError(ValueError):
    pass


class RepositoryMigrationPlanner:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
    ) -> None:
        self.repository = repository

    def generate(
        self,
        request: MigrationRequest,
    ) -> MigrationPortfolio:
        mode = request.mode.strip().lower()

        if request.limit is not None:
            if request.limit <= 0:
                raise MigrationPlanningError(
                    "Migration plan limit must be "
                    "greater than zero."
                )

        if mode == "module":
            if not request.module_id:
                raise MigrationPlanningError(
                    "Module migration planning "
                    "requires a module ID."
                )

            modules = (
                self.repository.module(
                    request.module_id
                ),
            )

        elif mode == "candidates":
            modules = (
                self.repository
                .plugin_candidates()
            )

            if request.limit is not None:
                modules = modules[
                    :request.limit
                ]

        else:
            raise MigrationPlanningError(
                f"Unsupported migration mode: "
                f"{request.mode}"
            )

        plans_by_id = {
            module.id: self._build_plan(module)
            for module in modules
        }

        recommended_order = (
            self._recommended_order(
                tuple(plans_by_id)
            )
        )

        ordered_plans = tuple(
            plans_by_id[module_id]
            for module_id
            in recommended_order
        )

        warnings = []

        for plan in ordered_plans:
            if plan.migration_tier == "very-high":
                warnings.append(
                    f"{plan.module_id} is a "
                    "very-high-risk migration."
                )

            if plan.direct_dependents:
                warnings.append(
                    f"{plan.module_id} has "
                    f"{len(plan.direct_dependents)} "
                    "direct dependent module(s)."
                )

            if plan.blocking_modules:
                warnings.append(
                    f"{plan.module_id} has "
                    "business-module dependencies "
                    "that may require coordinated "
                    "migration."
                )

        return MigrationPortfolio(
            schema_version=self.SCHEMA_VERSION,
            request=request,
            plans=ordered_plans,
            recommended_order=(
                recommended_order
            ),
            summary={
                "planCount": len(
                    ordered_plans
                ),
                "lowRiskCount": sum(
                    1
                    for plan in ordered_plans
                    if plan.migration_tier
                    == "low"
                ),
                "mediumRiskCount": sum(
                    1
                    for plan in ordered_plans
                    if plan.migration_tier
                    == "medium"
                ),
                "highRiskCount": sum(
                    1
                    for plan in ordered_plans
                    if plan.migration_tier
                    == "high"
                ),
                "veryHighRiskCount": sum(
                    1
                    for plan in ordered_plans
                    if plan.migration_tier
                    == "very-high"
                ),
                "architectureViolationCount": sum(
                    1
                    for plan in ordered_plans
                    if plan.architecture_status
                    == "violation"
                ),
            },
            warnings=tuple(
                sorted(set(warnings))
            ),
        )

    def _build_plan(
        self,
        module: Module,
    ) -> ModuleMigrationPlan:
        platform_dependencies = tuple(
            dependency.id
            for dependency
            in self.repository.dependencies(
                module.id
            )
            if dependency.architectural_role
            in {
                "platform",
                "database",
            }
        )

        business_dependencies = tuple(
            dependency.id
            for dependency
            in self.repository.dependencies(
                module.id
            )
            if dependency.architectural_role
            == "business"
        )

        blocking_modules = tuple(
            sorted(
                dependency_id
                for dependency_id
                in business_dependencies
                if self.repository.module(
                    dependency_id
                ).is_plugin_candidate
            )
        )

        direct_dependents = tuple(
            module.impact.direct_dependents
        )

        migration_score = (
            module.impact.risk_score
            + module.route_count * 0.35
            + module.controller_count * 1.5
            + module.component_count * 0.75
            + len(direct_dependents) * 4
            + len(blocking_modules) * 6
        )

        migration_score = round(
            migration_score,
            2,
        )

        migration_tier = (
            self._migration_tier(
                migration_score
            )
        )

        recommended_predecessors = tuple(
            sorted(
                blocking_modules,
                key=lambda module_id: (
                    self.repository.module(
                        module_id
                    ).impact.risk_score,
                    module_id,
                ),
            )
        )

        steps = self._migration_steps(
            module=module,
            platform_dependencies=(
                platform_dependencies
            ),
            blocking_modules=(
                blocking_modules
            ),
            direct_dependents=(
                direct_dependents
            ),
        )

        validation_checks = (
            "Run the complete knowledge-engine "
            "test suite.",
            "Run backend typecheck and build.",
            "Verify generated repository counts "
            "remain unchanged.",
            "Verify all existing HTTP routes retain "
            "their methods and paths.",
            "Verify permissions and bearer-auth "
            "metadata remain unchanged.",
            "Verify dependency graph contains no "
            "unknown or duplicate module nodes.",
            "Verify the migrated module is reported "
            "with plugin ownership.",
            "Verify architecture violation count "
            "decreases by one when applicable.",
        )

        rollback_actions = (
            "Deactivate the extracted plugin.",
            "Restore the original core-module "
            "registration.",
            "Restore the previous dependency "
            "injection bindings.",
            "Restore the previous migration and "
            "configuration state.",
            "Regenerate repository knowledge "
            "artifacts.",
            "Run all knowledge and backend "
            "validation commands.",
        )

        return ModuleMigrationPlan(
            module_id=module.id,
            current_location=(
                module.physical_location
            ),
            target_location=(
                module.expected_location
                or "plugin"
            ),
            architectural_role=(
                module.architectural_role
            ),
            architecture_status=(
                module.alignment_status
            ),
            violation_code=(
                module.violation_code or ""
            ),
            criticality=(
                module.impact
                .criticality_tier
            ),
            risk_score=(
                module.impact.risk_score
            ),
            migration_score=(
                migration_score
            ),
            migration_tier=(
                migration_tier
            ),
            blast_radius=(
                module.impact.blast_radius
            ),
            route_count=(
                module.route_count
            ),
            controller_count=(
                module.controller_count
            ),
            component_count=(
                module.component_count
            ),
            direct_dependencies=tuple(
                module.impact
                .direct_dependencies
            ),
            platform_dependencies=(
                platform_dependencies
            ),
            business_dependencies=(
                business_dependencies
            ),
            direct_dependents=(
                direct_dependents
            ),
            blocking_modules=(
                blocking_modules
            ),
            recommended_predecessors=(
                recommended_predecessors
            ),
            steps=steps,
            validation_checks=(
                validation_checks
            ),
            rollback_actions=(
                rollback_actions
            ),
        )

    @staticmethod
    def _migration_tier(
        score: float,
    ) -> str:
        if score >= 100:
            return "very-high"

        if score >= 60:
            return "high"

        if score >= 30:
            return "medium"

        return "low"

    def _migration_steps(
        self,
        module: Module,
        platform_dependencies: Tuple[
            str,
            ...,
        ],
        blocking_modules: Tuple[
            str,
            ...,
        ],
        direct_dependents: Tuple[
            str,
            ...,
        ],
    ) -> Tuple[MigrationStep, ...]:
        steps = [
            MigrationStep(
                sequence=1,
                phase="analyse",
                title="Freeze module contract",
                description=(
                    "Record controllers, routes, "
                    "permissions, events, services, "
                    "repositories, configuration, "
                    "database dependencies, and "
                    "public exports."
                ),
                affected_modules=(
                    module.id,
                ),
            ),
            MigrationStep(
                sequence=2,
                phase="prepare",
                title="Create plugin package",
                description=(
                    "Create the plugin manifest, "
                    "module entry point, package "
                    "metadata, lifecycle hooks, and "
                    "registration contract."
                ),
                affected_modules=(
                    module.id,
                ),
            ),
            MigrationStep(
                sequence=3,
                phase="extract",
                title="Move implementation",
                description=(
                    "Move controllers, services, "
                    "repositories, DTOs, constants, "
                    "tests, and module wiring into "
                    "the plugin package without "
                    "changing external behaviour."
                ),
                affected_modules=(
                    module.id,
                ),
            ),
            MigrationStep(
                sequence=4,
                phase="integrate",
                title="Rebind platform services",
                description=(
                    "Replace direct core imports "
                    "with stable platform contracts "
                    "and plugin dependency injection "
                    "bindings."
                ),
                affected_modules=tuple(
                    sorted(
                        {
                            module.id,
                            *platform_dependencies,
                        }
                    )
                ),
            ),
            MigrationStep(
                sequence=5,
                phase="integrate",
                title="Update dependent modules",
                description=(
                    "Update modules that directly "
                    "depend on the migrated module "
                    "to consume the plugin contract "
                    "or event interfaces."
                ),
                affected_modules=tuple(
                    sorted(
                        {
                            module.id,
                            *direct_dependents,
                        }
                    )
                ),
            ),
            MigrationStep(
                sequence=6,
                phase="validate",
                title="Validate behavioural parity",
                description=(
                    "Verify routes, permissions, "
                    "events, persistence, plugin "
                    "activation, documentation, "
                    "dependency graph, and tests."
                ),
                affected_modules=tuple(
                    sorted(
                        {
                            module.id,
                            *direct_dependents,
                        }
                    )
                ),
            ),
            MigrationStep(
                sequence=7,
                phase="release",
                title="Remove core registration",
                description=(
                    "Remove the original core module "
                    "registration only after the "
                    "plugin implementation passes "
                    "all validation checks."
                ),
                affected_modules=(
                    module.id,
                ),
            ),
        ]

        if blocking_modules:
            steps.insert(
                1,
                MigrationStep(
                    sequence=2,
                    phase="coordinate",
                    title=(
                        "Resolve business-module "
                        "dependencies"
                    ),
                    description=(
                        "Extract or formalise stable "
                        "contracts for plugin-candidate "
                        "business dependencies before "
                        "moving the target module."
                    ),
                    affected_modules=tuple(
                        sorted(
                            {
                                module.id,
                                *blocking_modules,
                            }
                        )
                    ),
                ),
            )

            steps = [
                MigrationStep(
                    sequence=index,
                    phase=step.phase,
                    title=step.title,
                    description=(
                        step.description
                    ),
                    affected_modules=(
                        step.affected_modules
                    ),
                )
                for index, step
                in enumerate(
                    steps,
                    start=1,
                )
            ]

        return tuple(steps)

    def _recommended_order(
        self,
        module_ids: Tuple[str, ...],
    ) -> Tuple[str, ...]:
        selected = set(module_ids)

        dependencies: Dict[
            str,
            Set[str],
        ] = {
            module_id: set()
            for module_id in selected
        }

        for module_id in selected:
            module = self.repository.module(
                module_id
            )

            for dependency_id in (
                module.impact
                .direct_dependencies
            ):
                if dependency_id in selected:
                    dependencies[
                        module_id
                    ].add(dependency_id)

        ordered: List[str] = []
        remaining = set(selected)

        while remaining:
            ready = [
                module_id
                for module_id in remaining
                if not (
                    dependencies[module_id]
                    & remaining
                )
            ]

            if not ready:
                ready = list(remaining)

            ready.sort(
                key=lambda module_id: (
                    self._build_plan(
                        self.repository.module(
                            module_id
                        )
                    ).migration_score,
                    module_id,
                )
            )

            chosen = ready[0]

            ordered.append(chosen)
            remaining.remove(chosen)

        return tuple(ordered)
