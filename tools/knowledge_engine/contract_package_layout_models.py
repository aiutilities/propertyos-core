from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from typing import Optional
from typing import Tuple


@dataclass(frozen=True)
class ContractPackageLayoutRequest:
    output_root: str = (
        "generated/contracts"
    )
    package_name: Optional[str] = None
    source_strategy: str = (
        "repository-reexport"
    )

    @property
    def publishable(self) -> bool:
        return (
            self.source_strategy
            == "portable-facade"
        )


@dataclass(frozen=True)
class ContractPackageExportLayout:
    symbol: str
    export_kind: str
    source_path: str
    module_id: str


@dataclass(frozen=True)
class ContractPackageModuleLayout:
    module_id: str
    directory_name: str
    entrypoint_path: str
    exports: Tuple[
        ContractPackageExportLayout,
        ...,
    ]

    @property
    def symbol_count(self) -> int:
        return len(self.exports)


@dataclass(frozen=True)
class ContractPackageFileLayout:
    path: str
    file_kind: str


@dataclass(frozen=True)
class PlannedContractPackage:
    package_name: str
    version: str
    package_directory: str
    root_entrypoint_path: str
    source_strategy: str
    publishable: bool
    modules: Tuple[
        ContractPackageModuleLayout,
        ...,
    ]
    files: Tuple[
        ContractPackageFileLayout,
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

    @property
    def file_count(self) -> int:
        return len(self.files)


@dataclass(frozen=True)
class ContractPackageLayoutIssue:
    code: str
    message: str
    package_name: str = ""
    module_id: str = ""
    symbol: str = ""
    source_path: str = ""


@dataclass(frozen=True)
class ContractPackageLayoutPortfolio:
    schema_version: str
    request: ContractPackageLayoutRequest
    packages: Tuple[
        PlannedContractPackage,
        ...,
    ]
    issues: Tuple[
        ContractPackageLayoutIssue,
        ...,
    ]
    summary: dict[str, Any]

    @property
    def valid(self) -> bool:
        return not self.issues
