from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from typing import Optional
from typing import Tuple


@dataclass(frozen=True)
class ContractManifestRequest:
    mode: str
    module_id: Optional[str] = None
    limit: Optional[int] = None
    package_name: str = (
        "@propertyos/core-contracts"
    )
    package_version: str = "0.1.0"


@dataclass(frozen=True)
class ContractExport:
    symbol: str
    source_path: str
    export_kind: str
    target_module: str
    package_name: str


@dataclass(frozen=True)
class ContractModule:
    module_id: str
    exports: Tuple[
        ContractExport,
        ...,
    ]

    @property
    def symbol_count(self) -> int:
        return len(self.exports)


@dataclass(frozen=True)
class ContractPackage:
    package_name: str
    version: str
    modules: Tuple[
        ContractModule,
        ...,
    ]

    @property
    def module_count(self) -> int:
        return len(self.modules)

    @property
    def symbol_count(self) -> int:
        return sum(
            module.symbol_count
            for module in self.modules
        )


@dataclass(frozen=True)
class ContractManifestIssue:
    code: str
    message: str
    module_id: str = ""
    symbol: str = ""
    source_path: str = ""


@dataclass(frozen=True)
class PluginContractManifest:
    module_id: str
    plugin_id: str
    workspace_path: str
    packages: Tuple[
        ContractPackage,
        ...,
    ]
    issues: Tuple[
        ContractManifestIssue,
        ...,
    ]
    valid: bool

    @property
    def package_count(self) -> int:
        return len(self.packages)

    @property
    def module_count(self) -> int:
        return sum(
            package.module_count
            for package in self.packages
        )

    @property
    def symbol_count(self) -> int:
        return sum(
            package.symbol_count
            for package in self.packages
        )

    @property
    def unresolved_symbol_count(
        self,
    ) -> int:
        return sum(
            issue.code
            == "UNRESOLVED_SYMBOL"
            for issue in self.issues
        )

    @property
    def duplicate_symbol_count(
        self,
    ) -> int:
        return sum(
            issue.code
            == "DUPLICATE_SYMBOL"
            for issue in self.issues
        )


@dataclass(frozen=True)
class ContractManifestPortfolio:
    schema_version: str
    request: ContractManifestRequest
    manifests: Tuple[
        PluginContractManifest,
        ...,
    ]
    summary: dict[str, Any]
