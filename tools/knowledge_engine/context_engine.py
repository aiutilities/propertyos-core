from __future__ import annotations

import re
from collections import deque
from typing import Iterable, Tuple

from .context_models import (
    ContextModule,
    ContextPackage,
    ContextRequest,
)
from .repository_api import Repository
from .repository_models import Module


TOKEN_PATTERN = re.compile(
    r"[a-zA-Z0-9:_-]+"
)


def _source(path: str, line: int | None) -> str:
    if line is None:
        return path

    return f"{path}:{line}"


def _normalise_tokens(value: str) -> set[str]:
    return {
        token.lower()
        for token in TOKEN_PATTERN.findall(value)
        if len(token) >= 2
    }


class ContextResolutionError(ValueError):
    pass


class RepositoryContextEngine:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
    ) -> None:
        self.repository = repository

    def generate(
        self,
        request: ContextRequest,
    ) -> ContextPackage:
        if request.depth < 0:
            raise ValueError(
                "Context depth cannot be negative."
            )

        if request.route_limit <= 0:
            raise ValueError(
                "Route limit must be greater than zero."
            )

        focus_modules = self._resolve_focus_modules(
            request
        )

        included_ids = self._expand_modules(
            focus_modules,
            request.depth,
        )

        modules = tuple(
            self.repository.module(module_id)
            for module_id in sorted(included_ids)
        )

        context_modules = []
        total_routes = 0
        included_routes = 0
        warnings = []

        for module in modules:
            total_routes += module.route_count

            context_module = self._build_context_module(
                module,
                route_limit=request.route_limit,
            )

            included_routes += len(
                context_module.routes
            )

            context_modules.append(
                context_module
            )

            if module.is_architecture_violation:
                warning = (
                    f"{module.id} has architecture "
                    f"status '{module.alignment_status}'"
                )

                if module.violation_code:
                    warning += (
                        f" ({module.violation_code})"
                    )

                warnings.append(warning)

        focus_ids = tuple(
            module.id
            for module in focus_modules
        )

        return ContextPackage(
            schema_version=self.SCHEMA_VERSION,
            request=request,
            focus_modules=focus_ids,
            included_modules=tuple(
                context_modules
            ),
            excluded_route_count=(
                total_routes - included_routes
            ),
            warnings=tuple(sorted(warnings)),
            summary={
                "focusModuleCount": len(focus_ids),
                "includedModuleCount": len(
                    context_modules
                ),
                "includedControllerCount": sum(
                    len(module.controllers)
                    for module in context_modules
                ),
                "includedRouteCount": (
                    included_routes
                ),
                "excludedRouteCount": (
                    total_routes - included_routes
                ),
                "architectureWarningCount": len(
                    warnings
                ),
            },
        )

    def _resolve_focus_modules(
        self,
        request: ContextRequest,
    ) -> Tuple[Module, ...]:
        mode = request.mode.strip().lower()

        if mode == "module":
            return (
                self.repository.module(
                    request.value
                ),
            )

        if mode != "task":
            raise ContextResolutionError(
                f"Unsupported context mode: "
                f"{request.mode}"
            )

        return self._resolve_task_modules(
            request.value
        )

    def _resolve_task_modules(
        self,
        task: str,
    ) -> Tuple[Module, ...]:
        tokens = _normalise_tokens(task)

        if not tokens:
            raise ContextResolutionError(
                "Task description contains no "
                "searchable terms."
            )

        scores: dict[str, int] = {}

        for module in self.repository.modules:
            score = 0

            module_terms = _normalise_tokens(
                " ".join(
                    [
                        module.id,
                        module.name,
                        module.class_name,
                        module.architectural_role,
                    ]
                )
            )

            score += 20 * len(
                tokens & module_terms
            )

            for controller in module.controllers:
                controller_terms = (
                    _normalise_tokens(
                        " ".join(
                            [
                                controller.class_name,
                                controller.base_path,
                            ]
                        )
                    )
                )

                score += 8 * len(
                    tokens & controller_terms
                )

            for route in module.routes:
                route_terms = _normalise_tokens(
                    " ".join(
                        [
                            route.full_path,
                            route.handler,
                            route.http_method,
                            " ".join(
                                route.permissions
                            ),
                        ]
                    )
                )

                score += 3 * len(
                    tokens & route_terms
                )

            if score > 0:
                scores[module.id] = score

        if not scores:
            raise ContextResolutionError(
                "No repository modules matched "
                f"task: {task}"
            )

        ranked_ids = sorted(
            scores,
            key=lambda module_id: (
                -scores[module_id],
                module_id,
            ),
        )

        highest_score = scores[
            ranked_ids[0]
        ]

        threshold = max(
            3,
            int(highest_score * 0.4),
        )

        selected_ids = tuple(
            module_id
            for module_id in ranked_ids
            if scores[module_id] >= threshold
        )[:5]

        return tuple(
            self.repository.module(module_id)
            for module_id in selected_ids
        )

    def _expand_modules(
        self,
        focus_modules: Iterable[Module],
        depth: int,
    ) -> set[str]:
        included = {
            module.id
            for module in focus_modules
        }

        queue = deque(
            (module.id, 0)
            for module in focus_modules
        )

        while queue:
            module_id, current_depth = (
                queue.popleft()
            )

            if current_depth >= depth:
                continue

            neighbours = (
                self.repository.dependencies(
                    module_id
                )
                + self.repository.dependents(
                    module_id
                )
            )

            for neighbour in neighbours:
                if neighbour.id in included:
                    continue

                included.add(neighbour.id)

                queue.append(
                    (
                        neighbour.id,
                        current_depth + 1,
                    )
                )

        return included

    def _build_context_module(
        self,
        module: Module,
        route_limit: int,
    ) -> ContextModule:
        routes = tuple(
            {
                "method": route.http_method,
                "path": route.full_path,
                "handler": route.handler,
                "controller": (
                    route.controller_class_name
                ),
                "permissions": list(
                    route.permissions
                ),
                "bearerAuth": (
                    route.bearer_auth
                ),
                "source": _source(
                    route.source.path,
                    route.source.line,
                ),
            }
            for route in module.routes[
                :route_limit
            ]
        )

        controllers = tuple(
            {
                "className": (
                    controller.class_name
                ),
                "basePath": (
                    controller.base_path
                ),
                "routeCount": (
                    controller.route_count
                ),
                "bearerAuth": (
                    controller.bearer_auth
                ),
                "source": _source(
                    controller.source.path,
                    controller.source.line,
                ),
            }
            for controller in module.controllers
        )

        return ContextModule(
            module_id=module.id,
            name=module.name,
            class_name=module.class_name,
            role=module.architectural_role,
            location=module.physical_location,
            criticality=(
                module.impact.criticality_tier
            ),
            risk_score=(
                module.impact.risk_score
            ),
            blast_radius=(
                module.impact.blast_radius
            ),
            architecture_status=(
                module.alignment_status
            ),
            violation_code=(
                module.violation_code or ""
            ),
            source=_source(
                module.source.path,
                module.source.line,
            ),
            direct_dependencies=(
                module.impact
                .direct_dependencies
            ),
            direct_dependents=(
                module.impact
                .direct_dependents
            ),
            controllers=controllers,
            routes=routes,
        )
