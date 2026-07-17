from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable, Optional, Tuple

from .repository_loader import (
    RepositoryArtifacts,
    load_repository_artifacts,
)
from .repository_models import (
    Component,
    Controller,
    Module,
    ModuleImpact,
    RepositorySummary,
    Route,
    SourceReference,
)


class RepositoryIntegrityError(ValueError):
    pass


class Repository:
    def __init__(
        self,
        artifacts: RepositoryArtifacts,
    ) -> None:
        self._artifacts = artifacts

        repository_ir = artifacts.repository_ir
        impact_analysis = artifacts.impact_analysis
        dependency_graph = artifacts.dependency_graph

        self._components = tuple(
            Component.from_dict(component)
            for component
            in repository_ir.get(
                "components",
                [],
            )
        )

        self._controllers = tuple(
            Controller.from_dict(controller)
            for controller
            in repository_ir.get(
                "controllers",
                [],
            )
        )

        self._routes = tuple(
            Route.from_dict(route)
            for route
            in repository_ir.get(
                "routes",
                [],
            )
        )

        self._impact_by_module = {
            impact.module_id: impact
            for impact in (
                ModuleImpact.from_dict(value)
                for value
                in impact_analysis.get(
                    "modules",
                    [],
                )
            )
        }

        self._components_by_module = (
            self._group_by_module(
                self._components
            )
        )

        self._controllers_by_module = (
            self._group_by_module(
                self._controllers
            )
        )

        self._routes_by_module = (
            self._group_by_module(
                self._routes
            )
        )

        modules = []

        for value in repository_ir.get(
            "modules",
            [],
        ):
            module_id = str(value["id"])

            if module_id not in (
                self._impact_by_module
            ):
                raise RepositoryIntegrityError(
                    "Impact analysis is missing "
                    f"module: {module_id}"
                )

            modules.append(
                Module(
                    id=module_id,
                    name=str(
                        value.get(
                            "name",
                            module_id,
                        )
                    ),
                    class_name=str(
                        value.get(
                            "className",
                            "",
                        )
                    ),
                    physical_location=str(
                        value.get(
                            "physicalLocation",
                            "",
                        )
                    ),
                    architectural_role=str(
                        value.get(
                            "architecturalRole",
                            "",
                        )
                    ),
                    expected_location=str(
                        value.get(
                            "expectedLocation",
                            "",
                        )
                    ),
                    alignment_status=str(
                        value.get(
                            "alignmentStatus",
                            "",
                        )
                    ),
                    violation_code=(
                        str(value["violationCode"])
                        if value.get(
                            "violationCode"
                        )
                        else None
                    ),
                    source=SourceReference.from_dict(
                        value.get("source")
                    ),
                    impact=(
                        self._impact_by_module[
                            module_id
                        ]
                    ),
                    components=(
                        self._components_by_module.get(
                            module_id,
                            (),
                        )
                    ),
                    controllers=(
                        self._controllers_by_module.get(
                            module_id,
                            (),
                        )
                    ),
                    routes=(
                        self._routes_by_module.get(
                            module_id,
                            (),
                        )
                    ),
                )
            )

        self._modules = tuple(
            sorted(
                modules,
                key=lambda module: module.id,
            )
        )

        self._module_by_id = self._unique_index(
            self._modules,
            "module",
        )

        self._component_by_id = self._unique_index(
            self._components,
            "component",
        )

        self._controller_by_id = (
            self._unique_index(
                self._controllers,
                "controller",
            )
        )

        self._route_by_id = self._unique_index(
            self._routes,
            "route",
        )

        self._validate_cross_references()

        repository_summary = (
            repository_ir.get(
                "summary",
                {},
            )
        )

        dependency_summary = (
            dependency_graph.get(
                "summary",
                {},
            )
        )

        impact_summary = (
            impact_analysis.get(
                "summary",
                {},
            )
        )

        self._summary = RepositorySummary(
            module_count=int(
                repository_summary.get(
                    "moduleCount",
                    len(self._modules),
                )
            ),
            component_count=int(
                repository_summary.get(
                    "componentCount",
                    len(self._components),
                )
            ),
            controller_count=int(
                repository_summary.get(
                    "controllerCount",
                    len(self._controllers),
                )
            ),
            route_count=int(
                repository_summary.get(
                    "routeCount",
                    len(self._routes),
                )
            ),
            internal_dependency_count=int(
                dependency_summary.get(
                    "internalDependencyCount",
                    len(
                        dependency_graph.get(
                            "edges",
                            [],
                        )
                    ),
                )
            ),
            architecture_violation_count=int(
                repository_summary.get(
                    "architectureViolationCount",
                    len(
                        self.architecture_violations()
                    ),
                )
            ),
            critical_module_count=int(
                impact_summary.get(
                    "criticalModuleCount",
                    len(
                        self.modules_by_criticality(
                            "critical"
                        )
                    ),
                )
            ),
            high_impact_module_count=int(
                impact_summary.get(
                    "highImpactModuleCount",
                    len(
                        self.modules_by_criticality(
                            "high"
                        )
                    ),
                )
            ),
        )

    @classmethod
    def load(
        cls,
        repository_root: Optional[Path] = None,
    ) -> "Repository":
        root = (
            repository_root
            if repository_root is not None
            else Path.cwd()
        )

        return cls(
            load_repository_artifacts(root)
        )

    @staticmethod
    def _group_by_module(
        records: Iterable[Any],
    ) -> dict[str, Tuple[Any, ...]]:
        grouped: dict[str, list[Any]] = {}

        for record in records:
            grouped.setdefault(
                record.module_id,
                [],
            ).append(record)

        return {
            module_id: tuple(
                sorted(
                    values,
                    key=lambda value: value.id,
                )
            )
            for module_id, values
            in grouped.items()
        }

    @staticmethod
    def _unique_index(
        records: Iterable[Any],
        entity_name: str,
    ) -> dict[str, Any]:
        result: dict[str, Any] = {}

        for record in records:
            if record.id in result:
                raise RepositoryIntegrityError(
                    f"Duplicate {entity_name} ID: "
                    f"{record.id}"
                )

            result[record.id] = record

        return result

    def _validate_cross_references(
        self,
    ) -> None:
        module_ids = set(self._module_by_id)

        impact_ids = set(
            self._impact_by_module
        )

        if module_ids != impact_ids:
            missing_impact = sorted(
                module_ids - impact_ids
            )

            unknown_impact = sorted(
                impact_ids - module_ids
            )

            raise RepositoryIntegrityError(
                "Repository module and impact "
                "module sets differ. "
                f"Missing impact: {missing_impact}; "
                f"unknown impact: {unknown_impact}"
            )

        for component in self._components:
            if component.module_id not in module_ids:
                raise RepositoryIntegrityError(
                    "Component references unknown "
                    f"module: {component.id} -> "
                    f"{component.module_id}"
                )

        for controller in self._controllers:
            if controller.module_id not in module_ids:
                raise RepositoryIntegrityError(
                    "Controller references unknown "
                    f"module: {controller.id} -> "
                    f"{controller.module_id}"
                )

        for route in self._routes:
            if route.module_id not in module_ids:
                raise RepositoryIntegrityError(
                    "Route references unknown "
                    f"module: {route.id} -> "
                    f"{route.module_id}"
                )

            if (
                route.controller_id
                and route.controller_id
                not in self._controller_by_id
            ):
                raise RepositoryIntegrityError(
                    "Route references unknown "
                    f"controller: {route.id} -> "
                    f"{route.controller_id}"
                )

    @staticmethod
    def _normalise(value: str) -> str:
        return value.strip().lower()

    @property
    def summary(self) -> RepositorySummary:
        return self._summary

    @property
    def modules(self) -> Tuple[Module, ...]:
        return self._modules

    @property
    def components(
        self,
    ) -> Tuple[Component, ...]:
        return self._components

    @property
    def controllers(
        self,
    ) -> Tuple[Controller, ...]:
        return self._controllers

    @property
    def routes(self) -> Tuple[Route, ...]:
        return self._routes

    def module(
        self,
        module_id: str,
    ) -> Module:
        normalised = self._normalise(
            module_id
        )

        try:
            return self._module_by_id[
                normalised
            ]
        except KeyError as error:
            raise KeyError(
                f"Unknown module: {module_id}"
            ) from error

    def find_modules(
        self,
        query: str,
    ) -> Tuple[Module, ...]:
        normalised = self._normalise(query)

        return tuple(
            module
            for module in self._modules
            if (
                normalised in module.id.lower()
                or normalised
                in module.name.lower()
                or normalised
                in module.class_name.lower()
            )
        )

    def component(
        self,
        component_id: str,
    ) -> Component:
        try:
            return self._component_by_id[
                component_id
            ]
        except KeyError as error:
            raise KeyError(
                "Unknown component: "
                f"{component_id}"
            ) from error

    def controller(
        self,
        controller_id_or_class: str,
    ) -> Controller:
        if (
            controller_id_or_class
            in self._controller_by_id
        ):
            return self._controller_by_id[
                controller_id_or_class
            ]

        normalised = self._normalise(
            controller_id_or_class
        )

        matches = tuple(
            controller
            for controller
            in self._controllers
            if (
                controller.class_name.lower()
                == normalised
            )
        )

        if not matches:
            raise KeyError(
                "Unknown controller: "
                f"{controller_id_or_class}"
            )

        if len(matches) > 1:
            raise RepositoryIntegrityError(
                "Controller class name is "
                "ambiguous: "
                f"{controller_id_or_class}"
            )

        return matches[0]

    def find_controllers(
        self,
        query: str,
    ) -> Tuple[Controller, ...]:
        normalised = self._normalise(query)

        return tuple(
            controller
            for controller in self._controllers
            if (
                normalised
                in controller.id.lower()
                or normalised
                in controller.class_name.lower()
                or normalised
                in controller.base_path.lower()
                or normalised
                in controller.module_id.lower()
            )
        )

    def route(
        self,
        route_id: str,
    ) -> Route:
        try:
            return self._route_by_id[
                route_id
            ]
        except KeyError as error:
            raise KeyError(
                f"Unknown route: {route_id}"
            ) from error

    def find_routes(
        self,
        query: str,
    ) -> Tuple[Route, ...]:
        normalised = self._normalise(query)

        return tuple(
            route
            for route in self._routes
            if (
                normalised
                in route.full_path.lower()
                or normalised
                in route.handler.lower()
                or normalised
                in route.http_method.lower()
                or normalised
                in route.module_id.lower()
                or normalised
                in route.controller_class_name.lower()
            )
        )

    def routes_requiring_permission(
        self,
        permission: str,
    ) -> Tuple[Route, ...]:
        normalised = self._normalise(
            permission
        )

        return tuple(
            route
            for route in self._routes
            if any(
                self._normalise(value)
                == normalised
                for value in route.permissions
            )
        )

    def components_for_module(
        self,
        module_id: str,
    ) -> Tuple[Component, ...]:
        return self.module(
            module_id
        ).components

    def controllers_for_module(
        self,
        module_id: str,
    ) -> Tuple[Controller, ...]:
        return self.module(
            module_id
        ).controllers

    def routes_for_module(
        self,
        module_id: str,
    ) -> Tuple[Route, ...]:
        return self.module(
            module_id
        ).routes

    def dependencies(
        self,
        module_id: str,
        transitive: bool = False,
    ) -> Tuple[Module, ...]:
        impact = self.module(
            module_id
        ).impact

        dependency_ids = (
            impact.transitive_dependencies
            if transitive
            else impact.direct_dependencies
        )

        return tuple(
            self.module(value)
            for value in dependency_ids
        )

    def dependents(
        self,
        module_id: str,
        transitive: bool = False,
    ) -> Tuple[Module, ...]:
        impact = self.module(
            module_id
        ).impact

        dependent_ids = (
            impact.transitive_dependents
            if transitive
            else impact.direct_dependents
        )

        return tuple(
            self.module(value)
            for value in dependent_ids
        )

    def blast_radius(
        self,
        module_id: str,
    ) -> Tuple[Module, ...]:
        return self.dependents(
            module_id,
            transitive=True,
        )

    def architecture_violations(
        self,
    ) -> Tuple[Module, ...]:
        return tuple(
            module
            for module in self._modules
            if module.is_architecture_violation
        )

    def plugin_candidates(
        self,
    ) -> Tuple[Module, ...]:
        return tuple(
            sorted(
                (
                    module
                    for module in self._modules
                    if module.is_plugin_candidate
                ),
                key=lambda module: (
                    module.impact.risk_score,
                    module.id,
                ),
            )
        )

    def modules_by_criticality(
        self,
        tier: str,
    ) -> Tuple[Module, ...]:
        normalised = self._normalise(tier)

        return tuple(
            module
            for module in self._modules
            if (
                module.impact
                .criticality_tier.lower()
                == normalised
            )
        )

    def high_risk_modules(
        self,
        limit: Optional[int] = None,
    ) -> Tuple[Module, ...]:
        modules = tuple(
            sorted(
                self._modules,
                key=lambda module: (
                    -module.impact.risk_score,
                    module.id,
                ),
            )
        )

        if limit is None:
            return modules

        return modules[:limit]

    def modules_by_route_count(
        self,
        limit: Optional[int] = None,
    ) -> Tuple[Module, ...]:
        modules = tuple(
            sorted(
                self._modules,
                key=lambda module: (
                    -module.route_count,
                    module.id,
                ),
            )
        )

        if limit is None:
            return modules

        return modules[:limit]

    def to_summary_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "moduleCount": (
                self.summary.module_count
            ),
            "componentCount": (
                self.summary.component_count
            ),
            "controllerCount": (
                self.summary.controller_count
            ),
            "routeCount": (
                self.summary.route_count
            ),
            "internalDependencyCount": (
                self.summary
                .internal_dependency_count
            ),
            "architectureViolationCount": (
                self.summary
                .architecture_violation_count
            ),
            "criticalModuleCount": (
                self.summary
                .critical_module_count
            ),
            "highImpactModuleCount": (
                self.summary
                .high_impact_module_count
            ),
        }
