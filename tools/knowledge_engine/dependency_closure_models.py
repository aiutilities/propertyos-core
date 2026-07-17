from __future__ import annotations

from dataclasses import asdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from typing import Optional
from typing import Tuple


@dataclass(frozen=True)
class DependencyClosureRequest:
    mode: str
    module_id: Optional[str] = None
    limit: Optional[int] = None
    apply: bool = False
    overwrite: bool = False


@dataclass(frozen=True)
class ClosureDependency:
    source_file: str
    import_specifier: str
    resolved_source: str
    staged_target: str
    depth: int
    discovered_from: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ExternalDependency:
    source_file: str
    import_specifier: str
    classification: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ClosurePluginAnalysis:
    module_id: str
    plugin_id: str
    package_name: str
    module_root: str
    workspace: str
    seed_file_count: int
    closure_file_count: int
    added_file_count: int
    external_dependency_count: int
    maximum_depth: int
    dependencies: Tuple[ClosureDependency, ...]
    external_dependencies: Tuple[
        ExternalDependency,
        ...
    ]
    applied: bool
    valid: bool
    warnings: Tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "moduleId": self.module_id,
            "pluginId": self.plugin_id,
            "packageName": self.package_name,
            "moduleRoot": self.module_root,
            "workspace": self.workspace,
            "seedFileCount": self.seed_file_count,
            "closureFileCount": self.closure_file_count,
            "addedFileCount": self.added_file_count,
            "externalDependencyCount": (
                self.external_dependency_count
            ),
            "maximumDepth": self.maximum_depth,
            "dependencies": [
                item.to_dict()
                for item in self.dependencies
            ],
            "externalDependencies": [
                item.to_dict()
                for item in self.external_dependencies
            ],
            "applied": self.applied,
            "valid": self.valid,
            "warnings": list(self.warnings),
        }


@dataclass(frozen=True)
class DependencyClosurePortfolio:
    repository_root: str
    staging_root: str
    plugin_count: int
    seed_file_count: int
    closure_file_count: int
    added_file_count: int
    external_dependency_count: int
    valid_plugin_count: int
    invalid_plugin_count: int
    analyses: Tuple[
        ClosurePluginAnalysis,
        ...
    ]

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": "1.0.0",
            "repositoryRoot": self.repository_root,
            "stagingRoot": self.staging_root,
            "summary": {
                "pluginCount": self.plugin_count,
                "seedFileCount": self.seed_file_count,
                "closureFileCount": (
                    self.closure_file_count
                ),
                "addedFileCount": self.added_file_count,
                "externalDependencyCount": (
                    self.external_dependency_count
                ),
                "validPluginCount": (
                    self.valid_plugin_count
                ),
                "invalidPluginCount": (
                    self.invalid_plugin_count
                ),
            },
            "analyses": [
                item.to_dict()
                for item in self.analyses
            ],
        }


def repository_relative(
    repository_root: Path,
    path: Path,
) -> str:
    return (
        path.resolve()
        .relative_to(repository_root.resolve())
        .as_posix()
    )
