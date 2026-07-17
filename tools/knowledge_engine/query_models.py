from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Tuple


@dataclass(frozen=True)
class QueryRequest:
    command: str
    argument: Optional[str] = None
    limit: Optional[int] = None
    transitive: bool = False


@dataclass(frozen=True)
class QueryColumn:
    key: str
    title: str


@dataclass(frozen=True)
class QueryResult:
    query_type: str
    title: str
    columns: Tuple[QueryColumn, ...]
    rows: Tuple[dict[str, Any], ...]
    metadata: dict[str, Any]
