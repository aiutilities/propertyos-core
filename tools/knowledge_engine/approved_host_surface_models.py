from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple


@dataclass(frozen=True)
class ApprovedHostSymbol:
    module_id: str
    symbol: str
    kind: str
    source_path: str
    portable: bool


@dataclass(frozen=True)
class ApprovedHostSurface:
    schema_version: str
    package_name: str
    host_api_version: str
    source_strategy: str
    default_decision: str
    repository_implementation_exports_allowed: bool
    unlisted_symbols_allowed: bool
    symbols: Tuple[
        ApprovedHostSymbol,
        ...,
    ]

    def permits(
        self,
        module_id: str,
        symbol: str,
        kind: str,
    ) -> bool:
        return any(
            item.module_id == module_id
            and item.symbol == symbol
            and item.kind == kind
            and item.portable
            for item in self.symbols
        )
