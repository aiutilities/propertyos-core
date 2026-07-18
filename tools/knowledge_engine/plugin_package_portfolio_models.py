from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import PurePosixPath
from typing import Any, Optional, Tuple


class PluginPackagingError(
    ValueError
):
    pass


class PackagingStage(
    str,
    Enum,
):
    BUILD = "build"
    PACK = "pack"
    VERIFY = "verify"


class PackagingStageStatus(
    str,
    Enum,
):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"


class PluginPackageStatus(
    str,
    Enum,
):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"


@dataclass(frozen=True)
class PluginPackagePortfolioRequest:
    module_ids: Tuple[str, ...]
    artifact_root: PurePosixPath
    overwrite: bool = False

    def __post_init__(self) -> None:
        normalized = tuple(
            module_id.strip()
            for module_id in self.module_ids
        )

        if not normalized:
            raise PluginPackagingError(
                "At least one module ID is required."
            )

        if any(
            not module_id
            for module_id in normalized
        ):
            raise PluginPackagingError(
                "Module IDs cannot be empty."
            )

        if len(set(normalized)) != len(
            normalized
        ):
            raise PluginPackagingError(
                "Module IDs must be unique."
            )

        if self.artifact_root.is_absolute():
            raise PluginPackagingError(
                "Artifact root must be repository-relative."
            )

        if ".." in self.artifact_root.parts:
            raise PluginPackagingError(
                "Artifact root cannot escape the repository."
            )

        object.__setattr__(
            self,
            "module_ids",
            normalized,
        )


@dataclass(frozen=True)
class PackagingStageResult:
    stage: PackagingStage
    status: PackagingStageStatus
    duration_seconds: float = 0.0
    detail: str = ""
    command: Tuple[str, ...] = ()
    exit_code: Optional[int] = None

    def __post_init__(self) -> None:
        if self.duration_seconds < 0:
            raise PluginPackagingError(
                "Stage duration cannot be negative."
            )

        if (
            self.status
            == PackagingStageStatus.PASSED
            and self.exit_code not in (
                None,
                0,
            )
        ):
            raise PluginPackagingError(
                "A passed stage cannot have a "
                "non-zero exit code."
            )

        if (
            self.status
            == PackagingStageStatus.FAILED
            and self.exit_code == 0
        ):
            raise PluginPackagingError(
                "A failed stage cannot have exit "
                "code zero."
            )

        if (
            self.status
            in (
                PackagingStageStatus.PENDING,
                PackagingStageStatus.BLOCKED,
            )
            and self.exit_code is not None
        ):
            raise PluginPackagingError(
                "Pending and blocked stages cannot "
                "have exit codes."
            )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "stage": self.stage.value,
            "status": self.status.value,
            "durationSeconds": (
                self.duration_seconds
            ),
            "detail": self.detail,
            "command": list(self.command),
            "exitCode": self.exit_code,
        }


@dataclass(frozen=True)
class PluginPackageArtifact:
    module_id: str
    plugin_id: str
    package_name: str
    version: str
    workspace: PurePosixPath
    stages: Tuple[
        PackagingStageResult,
        ...,
    ]
    artifact_path: Optional[
        PurePosixPath
    ] = None
    filename: str = ""
    size_bytes: int = 0
    unpacked_size_bytes: int = 0
    file_count: int = 0
    shasum: str = ""
    integrity: str = ""
    sha256: str = ""
    warnings: Tuple[str, ...] = ()
    errors: Tuple[str, ...] = ()

    def __post_init__(self) -> None:
        for label, value in (
            ("module ID", self.module_id),
            ("plugin ID", self.plugin_id),
            ("package name", self.package_name),
            ("version", self.version),
        ):
            if not value.strip():
                raise PluginPackagingError(
                    f"Package {label} cannot be empty."
                )

        stage_names = tuple(
            stage.stage
            for stage in self.stages
        )

        if len(set(stage_names)) != len(
            stage_names
        ):
            raise PluginPackagingError(
                "Package stages must be unique."
            )

        if self.size_bytes < 0:
            raise PluginPackagingError(
                "Artifact size cannot be negative."
            )

        if self.unpacked_size_bytes < 0:
            raise PluginPackagingError(
                "Unpacked size cannot be negative."
            )

        if self.file_count < 0:
            raise PluginPackagingError(
                "Artifact file count cannot be "
                "negative."
            )

        if self.status == (
            PluginPackageStatus.PASSED
        ):
            required = (
                self.artifact_path is not None,
                bool(self.filename.strip()),
                self.size_bytes > 0,
                self.unpacked_size_bytes > 0,
                self.file_count > 0,
                bool(self.shasum.strip()),
                bool(self.integrity.strip()),
                bool(self.sha256.strip()),
            )

            if not all(required):
                raise PluginPackagingError(
                    "A passed package requires "
                    "complete artifact metadata."
                )

    @property
    def status(
        self,
    ) -> PluginPackageStatus:
        statuses = tuple(
            stage.status
            for stage in self.stages
        )

        if PackagingStageStatus.FAILED in statuses:
            return PluginPackageStatus.FAILED

        if PackagingStageStatus.BLOCKED in statuses:
            return PluginPackageStatus.BLOCKED

        if (
            len(self.stages)
            == len(PackagingStage)
            and all(
                status
                == PackagingStageStatus.PASSED
                for status in statuses
            )
        ):
            return PluginPackageStatus.PASSED

        return PluginPackageStatus.PENDING

    def stage(
        self,
        name: PackagingStage,
    ) -> PackagingStageResult:
        for result in self.stages:
            if result.stage == name:
                return result

        raise PluginPackagingError(
            f"Package stage is missing: "
            f"{name.value}"
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "moduleId": self.module_id,
            "pluginId": self.plugin_id,
            "packageName": self.package_name,
            "version": self.version,
            "workspace": self.workspace.as_posix(),
            "status": self.status.value,
            "stages": [
                stage.to_dict()
                for stage in self.stages
            ],
            "artifactPath": (
                self.artifact_path.as_posix()
                if self.artifact_path
                is not None
                else None
            ),
            "filename": self.filename,
            "sizeBytes": self.size_bytes,
            "unpackedSizeBytes": (
                self.unpacked_size_bytes
            ),
            "fileCount": self.file_count,
            "shasum": self.shasum,
            "integrity": self.integrity,
            "sha256": self.sha256,
            "warnings": list(self.warnings),
            "errors": list(self.errors),
        }


@dataclass(frozen=True)
class PluginPackagePortfolio:
    schema_version: str
    request: PluginPackagePortfolioRequest
    artifacts: Tuple[
        PluginPackageArtifact,
        ...,
    ]

    def __post_init__(self) -> None:
        if not self.schema_version.strip():
            raise PluginPackagingError(
                "Portfolio schema version cannot "
                "be empty."
            )

        module_ids = tuple(
            artifact.module_id
            for artifact in self.artifacts
        )

        if len(set(module_ids)) != len(
            module_ids
        ):
            raise PluginPackagingError(
                "Portfolio module IDs must be unique."
            )

        if module_ids != self.request.module_ids:
            raise PluginPackagingError(
                "Portfolio artifacts must match "
                "the requested module order."
            )

    @property
    def passed_count(
        self,
    ) -> int:
        return sum(
            artifact.status
            == PluginPackageStatus.PASSED
            for artifact in self.artifacts
        )

    @property
    def failed_count(
        self,
    ) -> int:
        return sum(
            artifact.status
            == PluginPackageStatus.FAILED
            for artifact in self.artifacts
        )

    @property
    def blocked_count(
        self,
    ) -> int:
        return sum(
            artifact.status
            == PluginPackageStatus.BLOCKED
            for artifact in self.artifacts
        )

    @property
    def pending_count(
        self,
    ) -> int:
        return sum(
            artifact.status
            == PluginPackageStatus.PENDING
            for artifact in self.artifacts
        )

    @property
    def successful(
        self,
    ) -> bool:
        return (
            bool(self.artifacts)
            and self.passed_count
            == len(self.artifacts)
        )

    @property
    def total_size_bytes(
        self,
    ) -> int:
        return sum(
            artifact.size_bytes
            for artifact in self.artifacts
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "request": {
                "moduleIds": list(
                    self.request.module_ids
                ),
                "artifactRoot": (
                    self.request
                    .artifact_root
                    .as_posix()
                ),
                "overwrite": (
                    self.request.overwrite
                ),
            },
            "artifacts": [
                artifact.to_dict()
                for artifact in self.artifacts
            ],
            "summary": {
                "moduleCount": len(
                    self.artifacts
                ),
                "passedCount": (
                    self.passed_count
                ),
                "failedCount": (
                    self.failed_count
                ),
                "blockedCount": (
                    self.blocked_count
                ),
                "pendingCount": (
                    self.pending_count
                ),
                "totalSizeBytes": (
                    self.total_size_bytes
                ),
                "successful": self.successful,
            },
        }
