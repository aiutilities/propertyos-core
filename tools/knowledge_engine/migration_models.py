from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Tuple


@dataclass(frozen=True)
class MigrationRequest:
    mode: str
    module_id: Optional[str] = None
    limit: Optional[int] = None


@dataclass(frozen=True)
class MigrationStep:
    sequence: int
    phase: str
    title: str
    description: str
    affected_modules: Tuple[str, ...]


@dataclass(frozen=True)
class ModuleMigrationPlan:
    module_id: str
    current_location: str
    target_location: str
    architectural_role: str
    architecture_status: str
    violation_code: str
    criticality: str
    risk_score: float
    migration_score: float
    migration_tier: str
    blast_radius: int
    route_count: int
    controller_count: int
    component_count: int
    direct_dependencies: Tuple[str, ...]
    platform_dependencies: Tuple[str, ...]
    business_dependencies: Tuple[str, ...]
    direct_dependents: Tuple[str, ...]
    blocking_modules: Tuple[str, ...]
    recommended_predecessors: Tuple[str, ...]
    steps: Tuple[MigrationStep, ...]
    validation_checks: Tuple[str, ...]
    rollback_actions: Tuple[str, ...]


@dataclass(frozen=True)
class MigrationPortfolio:
    schema_version: str
    request: MigrationRequest
    plans: Tuple[ModuleMigrationPlan, ...]
    recommended_order: Tuple[str, ...]
    summary: dict[str, Any]
    warnings: Tuple[str, ...]
