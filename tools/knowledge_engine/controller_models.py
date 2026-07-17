from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class ControllerSourceReference:
    path: str
    line: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class RouteKnowledge:
    id: str
    controller_id: str
    controller_class_name: str
    module_id: str
    http_method: str
    path: str
    full_path: str
    handler: str
    handler_line: int
    permissions: tuple[str, ...]
    bearer_auth: bool
    source: ControllerSourceReference

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "controllerId": self.controller_id,
            "controllerClassName": self.controller_class_name,
            "moduleId": self.module_id,
            "httpMethod": self.http_method,
            "path": self.path,
            "fullPath": self.full_path,
            "handler": self.handler,
            "handlerLine": self.handler_line,
            "permissions": list(self.permissions),
            "bearerAuth": self.bearer_auth,
            "source": self.source.to_dict(),
        }


@dataclass(frozen=True)
class ControllerKnowledge:
    id: str
    module_id: str
    class_name: str
    base_path: str
    guards: tuple[str, ...]
    bearer_auth: bool
    routes: tuple[RouteKnowledge, ...]
    source: ControllerSourceReference

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "moduleId": self.module_id,
            "className": self.class_name,
            "basePath": self.base_path,
            "guards": list(self.guards),
            "bearerAuth": self.bearer_auth,
            "routeCount": len(self.routes),
            "routes": [
                route.to_dict()
                for route in self.routes
            ],
            "source": self.source.to_dict(),
        }


@dataclass(frozen=True)
class ControllerKnowledgeManifest:
    schema_version: str
    controller_count: int
    route_count: int
    controllers: tuple[ControllerKnowledge, ...] = field(
        default_factory=tuple
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "controllerCount": self.controller_count,
            "routeCount": self.route_count,
            "controllers": [
                controller.to_dict()
                for controller in self.controllers
            ],
        }
