from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from typing import Tuple


@dataclass(frozen=True)
class ContractPackageGenerationRequest:
    apply: bool = False
    overwrite: bool = False


@dataclass(frozen=True)
class GeneratedContractPackageFile:
    path: str
    file_kind: str
    sha256: str
    size_bytes: int
    written: bool


@dataclass(frozen=True)
class GeneratedContractPackage:
    package_name: str
    version: str
    package_directory: str
    source_strategy: str
    publishable: bool
    files: Tuple[
        GeneratedContractPackageFile,
        ...,
    ]
    valid: bool

    @property
    def file_count(self) -> int:
        return len(self.files)

    @property
    def written_file_count(self) -> int:
        return sum(
            file.written
            for file in self.files
        )


@dataclass(frozen=True)
class ContractPackageGenerationIssue:
    code: str
    message: str
    package_name: str = ""
    path: str = ""


@dataclass(frozen=True)
class ContractPackageGenerationPortfolio:
    schema_version: str
    request: ContractPackageGenerationRequest
    packages: Tuple[
        GeneratedContractPackage,
        ...,
    ]
    issues: Tuple[
        ContractPackageGenerationIssue,
        ...,
    ]
    summary: dict[str, Any]

    @property
    def valid(self) -> bool:
        return not self.issues
