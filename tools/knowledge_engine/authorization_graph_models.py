from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class AuthorizationEndpointReference:
    path: str
    controller: str
    method: str
    http_method: str
    route: str
    line: int


@dataclass(frozen=True)
class PermissionEndpointMapping:
    permission_name: str
    permission_value: str
    endpoints: list[AuthorizationEndpointReference] = field(
        default_factory=list
    )


@dataclass(frozen=True)
class ControllerPermissionMapping:
    controller: str
    path: str
    permissions: list[str] = field(default_factory=list)
    endpoint_count: int = 0
    permission_protected_endpoint_count: int = 0


@dataclass(frozen=True)
class ModuleAuthorizationSummary:
    module: str
    controller_count: int
    endpoint_count: int
    permission_protected_endpoint_count: int
    permissions: list[str] = field(default_factory=list)


@dataclass
class AuthorizationGraph:
    schema_version: int
    permission_to_endpoints: list[PermissionEndpointMapping] = field(
        default_factory=list
    )
    controller_to_permissions: list[ControllerPermissionMapping] = field(
        default_factory=list
    )
    module_summaries: list[ModuleAuthorizationSummary] = field(
        default_factory=list
    )
    permissions_without_endpoints: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
