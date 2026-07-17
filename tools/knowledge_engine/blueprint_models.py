from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Tuple


@dataclass(frozen=True)
class BlueprintRequest:
    mode: str
    module_id: Optional[str] = None
    limit: Optional[int] = None


@dataclass(frozen=True)
class BlueprintFile:
    source_path: str
    target_path: str
    file_kind: str
    action: str
    class_name: str
    notes: Tuple[str, ...]


@dataclass(frozen=True)
class BlueprintContract:
    contract_type: str
    name: str
    source_module: str
    target_package: str
    reason: str


@dataclass(frozen=True)
class PluginBlueprint:
    module_id: str
    plugin_id: str
    package_name: str
    source_root: str
    target_root: str
    migration_tier: str
    migration_score: float
    manifest: dict[str, Any]
    files: Tuple[BlueprintFile, ...]
    contracts: Tuple[BlueprintContract, ...]
    dependent_updates: Tuple[str, ...]
    validation_commands: Tuple[str, ...]
    warnings: Tuple[str, ...]


@dataclass(frozen=True)
class BlueprintPortfolio:
    schema_version: str
    request: BlueprintRequest
    blueprints: Tuple[PluginBlueprint, ...]
    generation_order: Tuple[str, ...]
    summary: dict[str, Any]
    warnings: Tuple[str, ...]
