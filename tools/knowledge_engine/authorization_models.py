from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class PermissionDefinition:
    name: str
    value: str


@dataclass(frozen=True)
class PermissionReference:
    name: str
    path: str
    line: int


@dataclass(frozen=True)
class EndpointAuthorization:
    path: str
    controller: str
    method: str
    http_method: str
    route: str
    line: int
    classification: str
    permission: str | None
    has_jwt_guard: bool
    has_permission_guard: bool
    has_bearer_auth: bool
    is_public: bool


@dataclass(frozen=True)
class AuthorizationViolation:
    code: str
    path: str
    line: int | None
    message: str


@dataclass
class AuthorizationReport:
    schema_version: int
    status: str
    repository_root: str
    permission_registry: str
    controller_roots: list[str]

    controller_count: int
    endpoint_count: int
    public_endpoint_count: int
    authenticated_endpoint_count: int
    permission_protected_endpoint_count: int
    permission_coverage_percent: float

    permission_definition_count: int
    permission_reference_count: int

    duplicate_permission_values: dict[str, list[str]] = field(
        default_factory=dict
    )

    undefined_permission_references: list[PermissionReference] = field(
        default_factory=list
    )

    unused_permission_definitions: list[PermissionDefinition] = field(
        default_factory=list
    )

    violations: list[AuthorizationViolation] = field(
        default_factory=list
    )

    endpoints: list[EndpointAuthorization] = field(
        default_factory=list
    )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
