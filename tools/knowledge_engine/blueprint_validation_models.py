from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Tuple


@dataclass(frozen=True)
class BlueprintValidationRequest:
    mode: str
    module_id: Optional[str] = None
    limit: Optional[int] = None


@dataclass(frozen=True)
class BlueprintValidationIssue:
    severity: str
    code: str
    module_id: str
    message: str
    source_path: str = ""
    target_path: str = ""


@dataclass(frozen=True)
class BlueprintFileOperation:
    sequence: int
    module_id: str
    action: str
    source_path: str
    target_path: str
    file_kind: str
    executable: bool


@dataclass(frozen=True)
class BlueprintValidationResult:
    module_id: str
    valid: bool
    source_file_count: int
    target_file_count: int
    contract_count: int
    dependent_update_count: int
    issues: Tuple[
        BlueprintValidationIssue,
        ...,
    ]
    operations: Tuple[
        BlueprintFileOperation,
        ...,
    ]


@dataclass(frozen=True)
class BlueprintValidationPortfolio:
    schema_version: str
    request: BlueprintValidationRequest
    valid: bool
    results: Tuple[
        BlueprintValidationResult,
        ...,
    ]
    summary: dict[str, Any]
