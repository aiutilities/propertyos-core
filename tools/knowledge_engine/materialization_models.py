from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Tuple


@dataclass(frozen=True)
class MaterializationRequest:
    mode: str
    module_id: Optional[str] = None
    limit: Optional[int] = None
    overwrite: bool = False


@dataclass(frozen=True)
class MaterializedFile:
    source_path: str
    staged_path: str
    file_kind: str
    source_sha256: str
    staged_sha256: str
    size_bytes: int
    generated: bool


@dataclass(frozen=True)
class MaterializedPlugin:
    module_id: str
    plugin_id: str
    package_name: str
    workspace_path: str
    copied_file_count: int
    generated_file_count: int
    total_file_count: int
    copied_files: Tuple[
        MaterializedFile,
        ...,
    ]
    generated_files: Tuple[
        MaterializedFile,
        ...,
    ]
    workspace_sha256: str
    valid: bool


@dataclass(frozen=True)
class MaterializationPortfolio:
    schema_version: str
    request: MaterializationRequest
    output_root: str
    plugins: Tuple[
        MaterializedPlugin,
        ...,
    ]
    summary: dict[str, Any]
