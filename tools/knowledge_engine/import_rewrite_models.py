from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class ImportRewriteRequest:
    mode: str
    module_id: str | None = None
    limit: int | None = None
    apply: bool = False


@dataclass(frozen=True)
class ImportRewriteChange:
    source_file: str
    line: int
    column: int
    syntax: str
    original_specifier: str
    proposed_specifier: str
    target_module: str
    applied: bool


@dataclass(frozen=True)
class FileImportRewrite:
    staged_path: str
    planned_rewrite_count: int
    applied_rewrite_count: int
    changed: bool
    changes: Tuple[
        ImportRewriteChange,
        ...,
    ]


@dataclass(frozen=True)
class PluginImportRewrite:
    module_id: str
    plugin_id: str
    workspace_path: str
    source_file_count: int
    planned_rewrite_count: int
    applied_rewrite_count: int
    modified_file_count: int
    unresolved_count: int
    remaining_rewrite_count: int
    files: Tuple[
        FileImportRewrite,
        ...,
    ]
    warnings: Tuple[str, ...]
    valid: bool


@dataclass(frozen=True)
class ImportRewritePortfolio:
    schema_version: str
    request: ImportRewriteRequest
    analyses: Tuple[
        PluginImportRewrite,
        ...,
    ]
    summary: dict[str, int | bool]
