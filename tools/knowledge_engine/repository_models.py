from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Tuple


@dataclass(frozen=True)
class SourceReference:
    path: str
    line: Optional[int] = None

    @classmethod
    def from_dict(
        cls,
        value: Optional[dict[str, Any]],
    ) -> "SourceReference":
        value = value or {}

        return cls(
            path=str(value.get("path", "unknown")),
            line=value.get("line"),
        )


@dataclass(frozen=True)
class Component:
    id: str
    module_id: str
    kind: str
    class_name: str
    source: SourceReference

    @classmethod
    def from_dict(
        cls,
        value: dict[str, Any],
    ) -> "Component":
        return cls(
            id=str(value["id"]),
            module_id=str(value["moduleId"]),
            kind=str(value.get("kind", "unknown")),
            class_name=str(
                value.get(
                    "className",
                    value["id"],
                )
            ),
            source=SourceReference.from_dict(
                value.get("source")
            ),
        )


@dataclass(frozen=True)
class Controller:
    id: str
    module_id: str
    class_name: str
    base_path: str
    route_count: int
    bearer_auth: bool
    route_ids: Tuple[str, ...]
    source: SourceReference

    @classmethod
    def from_dict(
        cls,
        value: dict[str, Any],
    ) -> "Controller":
        route_ids = tuple(
            str(route_id)
            for route_id in value.get(
                "routeIds",
                [],
            )
        )

        return cls(
            id=str(value["id"]),
            module_id=str(value["moduleId"]),
            class_name=str(
                value.get(
                    "className",
                    value["id"],
                )
            ),
            base_path=str(
                value.get("basePath", "")
            ),
            route_count=int(
                value.get(
                    "routeCount",
                    len(route_ids),
                )
            ),
            bearer_auth=bool(
                value.get("bearerAuth", False)
            ),
            route_ids=route_ids,
            source=SourceReference.from_dict(
                value.get("source")
            ),
        )


@dataclass(frozen=True)
class Route:
    id: str
    module_id: str
    controller_id: str
    controller_class_name: str
    http_method: str
    full_path: str
    handler: str
    permissions: Tuple[str, ...]
    bearer_auth: bool
    source: SourceReference

    @classmethod
    def from_dict(
        cls,
        value: dict[str, Any],
    ) -> "Route":
        raw_permissions = value.get(
            "permissions",
            [],
        )

        if raw_permissions is None:
            permissions: Tuple[str, ...] = ()
        elif isinstance(raw_permissions, list):
            permissions = tuple(
                str(permission)
                for permission in raw_permissions
            )
        else:
            permissions = (
                str(raw_permissions),
            )

        return cls(
            id=str(value["id"]),
            module_id=str(value["moduleId"]),
            controller_id=str(
                value.get("controllerId", "")
            ),
            controller_class_name=str(
                value.get(
                    "controllerClassName",
                    "",
                )
            ),
            http_method=str(
                value.get("httpMethod", "")
            ).upper(),
            full_path=str(
                value.get("fullPath", "")
            ),
            handler=str(
                value.get("handler", "")
            ),
            permissions=permissions,
            bearer_auth=bool(
                value.get("bearerAuth", False)
            ),
            source=SourceReference.from_dict(
                value.get("source")
            ),
        )


@dataclass(frozen=True)
class ModuleImpact:
    module_id: str
    risk_score: float
    criticality_tier: str
    blast_radius: int
    dependency_surface: int
    direct_dependencies: Tuple[str, ...]
    direct_dependents: Tuple[str, ...]
    transitive_dependencies: Tuple[str, ...]
    transitive_dependents: Tuple[str, ...]
    route_count: int
    controller_count: int
    component_count: int

    @classmethod
    def from_dict(
        cls,
        value: dict[str, Any],
    ) -> "ModuleImpact":
        def strings(key: str) -> Tuple[str, ...]:
            return tuple(
                str(item)
                for item in value.get(key, [])
            )

        return cls(
            module_id=str(value["moduleId"]),
            risk_score=float(
                value.get("riskScore", 0)
            ),
            criticality_tier=str(
                value.get(
                    "criticalityTier",
                    "low",
                )
            ),
            blast_radius=int(
                value.get("blastRadius", 0)
            ),
            dependency_surface=int(
                value.get(
                    "dependencySurface",
                    0,
                )
            ),
            direct_dependencies=strings(
                "directDependencies"
            ),
            direct_dependents=strings(
                "directDependents"
            ),
            transitive_dependencies=strings(
                "transitiveDependencies"
            ),
            transitive_dependents=strings(
                "transitiveDependents"
            ),
            route_count=int(
                value.get("routeCount", 0)
            ),
            controller_count=int(
                value.get(
                    "controllerCount",
                    0,
                )
            ),
            component_count=int(
                value.get(
                    "componentCount",
                    0,
                )
            ),
        )


@dataclass(frozen=True)
class Module:
    id: str
    name: str
    class_name: str
    physical_location: str
    architectural_role: str
    expected_location: str
    alignment_status: str
    violation_code: Optional[str]
    source: SourceReference
    impact: ModuleImpact
    components: Tuple[Component, ...]
    controllers: Tuple[Controller, ...]
    routes: Tuple[Route, ...]

    @property
    def is_architecture_violation(self) -> bool:
        return self.alignment_status == "violation"

    @property
    def is_plugin_candidate(self) -> bool:
        return (
            self.architectural_role == "business"
            and self.expected_location == "plugin"
        )

    @property
    def route_count(self) -> int:
        return len(self.routes)

    @property
    def controller_count(self) -> int:
        return len(self.controllers)

    @property
    def component_count(self) -> int:
        return len(self.components)


@dataclass(frozen=True)
class RepositorySummary:
    module_count: int
    component_count: int
    controller_count: int
    route_count: int
    internal_dependency_count: int
    architecture_violation_count: int
    critical_module_count: int
    high_impact_module_count: int
