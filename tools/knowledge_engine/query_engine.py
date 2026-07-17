from __future__ import annotations

from typing import Any, Iterable, Optional, Tuple

from .query_models import (
    QueryColumn,
    QueryRequest,
    QueryResult,
)
from .repository_api import Repository
from .repository_models import (
    Component,
    Controller,
    Module,
    Route,
)


MODULE_COLUMNS = (
    QueryColumn("moduleId", "Module"),
    QueryColumn("role", "Role"),
    QueryColumn("location", "Location"),
    QueryColumn("criticality", "Criticality"),
    QueryColumn("riskScore", "Risk"),
    QueryColumn("blastRadius", "Blast Radius"),
    QueryColumn("routes", "Routes"),
)

ROUTE_COLUMNS = (
    QueryColumn("method", "Method"),
    QueryColumn("path", "Path"),
    QueryColumn("handler", "Handler"),
    QueryColumn("controller", "Controller"),
    QueryColumn("moduleId", "Module"),
    QueryColumn("permissions", "Permissions"),
)

CONTROLLER_COLUMNS = (
    QueryColumn("controller", "Controller"),
    QueryColumn("moduleId", "Module"),
    QueryColumn("basePath", "Base Path"),
    QueryColumn("routes", "Routes"),
    QueryColumn("authentication", "Authentication"),
    QueryColumn("source", "Source"),
)

COMPONENT_COLUMNS = (
    QueryColumn("component", "Component"),
    QueryColumn("kind", "Kind"),
    QueryColumn("moduleId", "Module"),
    QueryColumn("source", "Source"),
)


def _source_text(
    path: str,
    line: Optional[int],
) -> str:
    if line is None:
        return path

    return f"{path}:{line}"


def _module_row(
    module: Module,
) -> dict[str, Any]:
    return {
        "moduleId": module.id,
        "name": module.name,
        "className": module.class_name,
        "role": module.architectural_role,
        "location": module.physical_location,
        "expectedLocation": (
            module.expected_location
        ),
        "alignment": module.alignment_status,
        "violationCode": (
            module.violation_code or ""
        ),
        "criticality": (
            module.impact.criticality_tier
        ),
        "riskScore": module.impact.risk_score,
        "blastRadius": (
            module.impact.blast_radius
        ),
        "dependencySurface": (
            module.impact.dependency_surface
        ),
        "routes": module.route_count,
        "controllers": (
            module.controller_count
        ),
        "components": (
            module.component_count
        ),
        "source": _source_text(
            module.source.path,
            module.source.line,
        ),
    }


def _route_row(
    route: Route,
) -> dict[str, Any]:
    return {
        "method": route.http_method,
        "path": route.full_path,
        "handler": route.handler,
        "controller": (
            route.controller_class_name
        ),
        "moduleId": route.module_id,
        "permissions": ", ".join(
            route.permissions
        ),
        "bearerAuth": route.bearer_auth,
        "source": _source_text(
            route.source.path,
            route.source.line,
        ),
    }


def _controller_row(
    controller: Controller,
) -> dict[str, Any]:
    return {
        "controller": controller.class_name,
        "moduleId": controller.module_id,
        "basePath": controller.base_path,
        "routes": controller.route_count,
        "authentication": (
            "Bearer"
            if controller.bearer_auth
            else "None detected"
        ),
        "source": _source_text(
            controller.source.path,
            controller.source.line,
        ),
    }


def _component_row(
    component: Component,
) -> dict[str, Any]:
    return {
        "component": component.class_name,
        "kind": component.kind,
        "moduleId": component.module_id,
        "source": _source_text(
            component.source.path,
            component.source.line,
        ),
    }


def _limit(
    values: Tuple[Any, ...],
    limit: Optional[int],
) -> Tuple[Any, ...]:
    if limit is None:
        return values

    return values[:limit]


class RepositoryQueryEngine:
    def __init__(
        self,
        repository: Repository,
    ) -> None:
        self.repository = repository

    def execute(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        handler_name = (
            "_query_"
            + request.command.replace("-", "_")
        )

        handler = getattr(
            self,
            handler_name,
            None,
        )

        if handler is None:
            raise ValueError(
                "No query handler registered for: "
                f"{request.command}"
            )

        return handler(request)

    def _query_summary(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        summary = (
            self.repository.to_summary_dict()
        )

        columns = (
            QueryColumn("metric", "Metric"),
            QueryColumn("count", "Count"),
        )

        rows = tuple(
            {
                "metric": key,
                "count": value,
            }
            for key, value
            in summary.items()
        )

        return QueryResult(
            query_type="summary",
            title="Repository Summary",
            columns=columns,
            rows=rows,
            metadata=summary,
        )

    def _query_module(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        module = self.repository.module(
            request.argument or ""
        )

        return QueryResult(
            query_type="module",
            title=f"Module: {module.id}",
            columns=MODULE_COLUMNS,
            rows=(_module_row(module),),
            metadata={
                "directDependencies": list(
                    module.impact
                    .direct_dependencies
                ),
                "directDependents": list(
                    module.impact
                    .direct_dependents
                ),
                "transitiveDependencies": list(
                    module.impact
                    .transitive_dependencies
                ),
                "transitiveDependents": list(
                    module.impact
                    .transitive_dependents
                ),
            },
        )

    def _dependency_result(
        self,
        request: QueryRequest,
        dependents: bool,
    ) -> QueryResult:
        module_id = request.argument or ""

        if dependents:
            modules = self.repository.dependents(
                module_id,
                transitive=request.transitive,
            )

            direction = "Dependents"
        else:
            modules = self.repository.dependencies(
                module_id,
                transitive=request.transitive,
            )

            direction = "Dependencies"

        mode = (
            "Transitive"
            if request.transitive
            else "Direct"
        )

        return QueryResult(
            query_type=(
                "dependents"
                if dependents
                else "dependencies"
            ),
            title=(
                f"{mode} {direction}: "
                f"{module_id}"
            ),
            columns=MODULE_COLUMNS,
            rows=tuple(
                _module_row(module)
                for module in modules
            ),
            metadata={
                "moduleId": module_id,
                "transitive": (
                    request.transitive
                ),
                "count": len(modules),
            },
        )

    def _query_dependencies(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        return self._dependency_result(
            request,
            dependents=False,
        )

    def _query_dependents(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        return self._dependency_result(
            request,
            dependents=True,
        )

    def _query_blast_radius(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        module_id = request.argument or ""

        modules = self.repository.blast_radius(
            module_id
        )

        return QueryResult(
            query_type="blast-radius",
            title=f"Blast Radius: {module_id}",
            columns=MODULE_COLUMNS,
            rows=tuple(
                _module_row(module)
                for module in modules
            ),
            metadata={
                "moduleId": module_id,
                "count": len(modules),
            },
        )

    def _query_routes(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        module_id = request.argument or ""

        routes = (
            self.repository.routes_for_module(
                module_id
            )
        )

        return QueryResult(
            query_type="routes",
            title=f"Routes: {module_id}",
            columns=ROUTE_COLUMNS,
            rows=tuple(
                _route_row(route)
                for route in routes
            ),
            metadata={
                "moduleId": module_id,
                "count": len(routes),
            },
        )

    def _query_controllers(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        module_id = request.argument or ""

        controllers = (
            self.repository
            .controllers_for_module(
                module_id
            )
        )

        return QueryResult(
            query_type="controllers",
            title=(
                f"Controllers: {module_id}"
            ),
            columns=CONTROLLER_COLUMNS,
            rows=tuple(
                _controller_row(controller)
                for controller
                in controllers
            ),
            metadata={
                "moduleId": module_id,
                "count": len(controllers),
            },
        )

    def _query_components(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        module_id = request.argument or ""

        components = (
            self.repository
            .components_for_module(
                module_id
            )
        )

        return QueryResult(
            query_type="components",
            title=f"Components: {module_id}",
            columns=COMPONENT_COLUMNS,
            rows=tuple(
                _component_row(component)
                for component
                in components
            ),
            metadata={
                "moduleId": module_id,
                "count": len(components),
            },
        )

    def _module_collection_result(
        self,
        query_type: str,
        title: str,
        modules: Tuple[Module, ...],
        limit: Optional[int] = None,
    ) -> QueryResult:
        limited = _limit(
            modules,
            limit,
        )

        return QueryResult(
            query_type=query_type,
            title=title,
            columns=MODULE_COLUMNS,
            rows=tuple(
                _module_row(module)
                for module in limited
            ),
            metadata={
                "totalCount": len(modules),
                "returnedCount": len(limited),
            },
        )

    def _query_violations(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        return self._module_collection_result(
            query_type="violations",
            title="Architecture Violations",
            modules=(
                self.repository
                .architecture_violations()
            ),
            limit=request.limit,
        )

    def _query_plugin_candidates(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        return self._module_collection_result(
            query_type="plugin-candidates",
            title="Plugin Migration Candidates",
            modules=(
                self.repository
                .plugin_candidates()
            ),
            limit=request.limit,
        )

    def _query_critical(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        return self._module_collection_result(
            query_type="critical",
            title="Critical Modules",
            modules=(
                self.repository
                .modules_by_criticality(
                    "critical"
                )
            ),
            limit=request.limit,
        )

    def _query_high_risk(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        return self._module_collection_result(
            query_type="high-risk",
            title="High-Risk Modules",
            modules=(
                self.repository
                .modules_by_criticality(
                    "high"
                )
            ),
            limit=request.limit,
        )

    def _query_top_risk(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        limit = request.limit or 10

        modules = (
            self.repository
            .high_risk_modules(limit=limit)
        )

        return self._module_collection_result(
            query_type="top-risk",
            title="Highest-Risk Modules",
            modules=modules,
        )

    def _query_top_routes(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        limit = request.limit or 10

        modules = (
            self.repository
            .modules_by_route_count(
                limit=limit
            )
        )

        return self._module_collection_result(
            query_type="top-routes",
            title="Modules by Route Count",
            modules=modules,
        )

    def _query_find_module(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        matches = (
            self.repository.find_modules(
                request.argument or ""
            )
        )

        return self._module_collection_result(
            query_type="find-module",
            title=(
                "Module Search: "
                f"{request.argument}"
            ),
            modules=matches,
            limit=request.limit,
        )

    def _query_find_controller(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        matches = (
            self.repository
            .find_controllers(
                request.argument or ""
            )
        )

        limited = _limit(
            matches,
            request.limit,
        )

        return QueryResult(
            query_type="find-controller",
            title=(
                "Controller Search: "
                f"{request.argument}"
            ),
            columns=CONTROLLER_COLUMNS,
            rows=tuple(
                _controller_row(controller)
                for controller in limited
            ),
            metadata={
                "totalCount": len(matches),
                "returnedCount": len(limited),
            },
        )

    def _query_find_route(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        matches = (
            self.repository.find_routes(
                request.argument or ""
            )
        )

        limited = _limit(
            matches,
            request.limit,
        )

        return QueryResult(
            query_type="find-route",
            title=(
                f"Route Search: "
                f"{request.argument}"
            ),
            columns=ROUTE_COLUMNS,
            rows=tuple(
                _route_row(route)
                for route in limited
            ),
            metadata={
                "totalCount": len(matches),
                "returnedCount": len(limited),
            },
        )

    def _query_permission(
        self,
        request: QueryRequest,
    ) -> QueryResult:
        matches = (
            self.repository
            .routes_requiring_permission(
                request.argument or ""
            )
        )

        limited = _limit(
            matches,
            request.limit,
        )

        return QueryResult(
            query_type="permission",
            title=(
                "Routes Requiring Permission: "
                f"{request.argument}"
            ),
            columns=ROUTE_COLUMNS,
            rows=tuple(
                _route_row(route)
                for route in limited
            ),
            metadata={
                "permission": request.argument,
                "totalCount": len(matches),
                "returnedCount": len(limited),
            },
        )
