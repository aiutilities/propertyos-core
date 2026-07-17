from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Tuple


@dataclass(frozen=True)
class ImportAnalysisRequest:
    mode: str
    module_id: Optional[str] = None
    limit: Optional[int] = None


@dataclass(frozen=True)
class ImportReference:
    source_file: str
    line: int
    column: int
    syntax: str
    imported_symbols: Tuple[str, ...]
    original_specifier: str
    classification: str
    resolution_status: str
    resolved_path: str
    target_module: str
    proposed_specifier: str
    rewrite_required: bool
    reason: str


@dataclass(frozen=True)
class FileImportAnalysis:
    staged_path: str
    import_count: int
    rewrite_count: int
    unresolved_count: int
    imports: Tuple[
        ImportReference,
        ...,
    ]


@dataclass(frozen=True)
class PluginImportAnalysis:
    module_id: str
    plugin_id: str
    workspace_path: str
    source_file_count: int
    import_count: int
    rewrite_count: int
    unresolved_count: int
    files: Tuple[
        FileImportAnalysis,
        ...,
    ]
    warnings: Tuple[str, ...]
    valid: bool


@dataclass(frozen=True)
class ImportAnalysisPortfolio:
    schema_version: str
    request: ImportAnalysisRequest
    analyses: Tuple[
        PluginImportAnalysis,
        ...,
    ]
    summary: dict[str, Any]
