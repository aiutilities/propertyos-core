from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Tuple


@dataclass(frozen=True)
class ContextRequest:
    mode: str
    value: str
    depth: int = 1
    route_limit: int = 50


@dataclass(frozen=True)
class ContextModule:
    module_id: str
    name: str
    class_name: str
    role: str
    location: str
    criticality: str
    risk_score: float
    blast_radius: int
    architecture_status: str
    violation_code: str
    source: str
    direct_dependencies: Tuple[str, ...]
    direct_dependents: Tuple[str, ...]
    controllers: Tuple[dict[str, Any], ...]
    routes: Tuple[dict[str, Any], ...]


@dataclass(frozen=True)
class ContextPackage:
    schema_version: str
    request: ContextRequest
    focus_modules: Tuple[str, ...]
    included_modules: Tuple[ContextModule, ...]
    excluded_route_count: int
    warnings: Tuple[str, ...]
    summary: dict[str, Any]
