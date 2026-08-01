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


def normalize_approved_module_id(
    module_id: str,
) -> str:
    return module_id.replace(":", "-")


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
        normalized_module_id = (
            normalize_approved_module_id(
                module_id
            )
        )

        return any(
            (
                item.module_id == module_id
                or item.module_id
                == normalized_module_id
            )
            and item.symbol == symbol
            and item.kind == kind
            and item.portable
            for item in self.symbols
        )
