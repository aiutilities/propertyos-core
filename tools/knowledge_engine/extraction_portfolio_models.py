from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import PurePosixPath
from typing import Optional, Tuple


class ExtractionStage(str, Enum):
    BLUEPRINT = "blueprint"
    MATERIALIZATION = "materialization"
    CLOSURE = "closure"
    REWRITE = "rewrite"
    INSTALL = "install"
    COMPILE = "compile"


class StageStatus(str, Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"


class ModuleExtractionStatus(str, Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"


STAGE_ORDER = (
    ExtractionStage.BLUEPRINT,
    ExtractionStage.MATERIALIZATION,
    ExtractionStage.CLOSURE,
    ExtractionStage.REWRITE,
    ExtractionStage.INSTALL,
    ExtractionStage.COMPILE,
)


@dataclass(frozen=True)
class ExtractionStageResult:
    stage: ExtractionStage
    status: StageStatus
    duration_seconds: float = 0.0
    detail: str = ""
    command: Optional[Tuple[str, ...]] = None
    exit_code: Optional[int] = None

    def __post_init__(self) -> None:
        if self.duration_seconds < 0:
            raise ValueError(
                "Stage duration cannot be negative."
            )

        if (
            self.status == StageStatus.PASSED
            and self.exit_code not in (None, 0)
        ):
            raise ValueError(
                "A passed stage cannot have a non-zero exit code."
            )

        if (
            self.status == StageStatus.FAILED
            and self.exit_code == 0
        ):
            raise ValueError(
                "A failed stage cannot have exit code zero."
            )

        if self.command is not None and not self.command:
            raise ValueError(
                "Stage command cannot be empty."
            )

    def to_dict(self) -> dict:
        value = {
            "stage": self.stage.value,
            "status": self.status.value,
            "durationSeconds": self.duration_seconds,
            "detail": self.detail,
            "exitCode": self.exit_code,
        }

        if self.command is not None:
            value["command"] = list(self.command)

        return value


@dataclass(frozen=True)
class ModuleExtractionResult:
    module_id: str
    package_name: str
    workspace: PurePosixPath
    stages: Tuple[ExtractionStageResult, ...]
    warnings: Tuple[str, ...] = ()
    errors: Tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.module_id.strip():
            raise ValueError(
                "Module ID cannot be empty."
            )

        if not self.package_name.strip():
            raise ValueError(
                "Package name cannot be empty."
            )

        if self.workspace.is_absolute():
            raise ValueError(
                "Workspace must be repository-relative."
            )

        actual_stages = tuple(
            result.stage
            for result in self.stages
        )

        if len(actual_stages) != len(set(actual_stages)):
            raise ValueError(
                "Module extraction stages must be unique."
            )

        expected_order = tuple(
            stage
            for stage in STAGE_ORDER
            if stage in actual_stages
        )

        if actual_stages != expected_order:
            raise ValueError(
                "Module extraction stages are out of order."
            )

    @property
    def status(self) -> ModuleExtractionStatus:
        statuses = tuple(
            result.status
            for result in self.stages
        )

        if (
            self.errors
            or StageStatus.FAILED in statuses
        ):
            return ModuleExtractionStatus.FAILED

        if StageStatus.BLOCKED in statuses:
            return ModuleExtractionStatus.BLOCKED

        if (
            self.stages
            and all(
                status in (
                    StageStatus.PASSED,
                    StageStatus.SKIPPED,
                )
                for status in statuses
            )
        ):
            return ModuleExtractionStatus.PASSED

        return ModuleExtractionStatus.PENDING

    def stage(
        self,
        stage: ExtractionStage,
    ) -> Optional[ExtractionStageResult]:
        return next(
            (
                result
                for result in self.stages
                if result.stage == stage
            ),
            None,
        )

    def to_dict(self) -> dict:
        return {
            "moduleId": self.module_id,
            "packageName": self.package_name,
            "workspace": self.workspace.as_posix(),
            "status": self.status.value,
            "stages": [
                result.to_dict()
                for result in self.stages
            ],
            "warnings": list(self.warnings),
            "errors": list(self.errors),
        }


@dataclass(frozen=True)
class ExtractionPortfolio:
    modules: Tuple[ModuleExtractionResult, ...]

    def __post_init__(self) -> None:
        module_ids = tuple(
            module.module_id
            for module in self.modules
        )

        if len(module_ids) != len(set(module_ids)):
            raise ValueError(
                "Portfolio module IDs must be unique."
            )

    @property
    def passed_count(self) -> int:
        return self._count(
            ModuleExtractionStatus.PASSED
        )

    @property
    def failed_count(self) -> int:
        return self._count(
            ModuleExtractionStatus.FAILED
        )

    @property
    def blocked_count(self) -> int:
        return self._count(
            ModuleExtractionStatus.BLOCKED
        )

    @property
    def pending_count(self) -> int:
        return self._count(
            ModuleExtractionStatus.PENDING
        )

    @property
    def is_successful(self) -> bool:
        return (
            bool(self.modules)
            and self.failed_count == 0
            and self.blocked_count == 0
            and self.pending_count == 0
        )

    def _count(
        self,
        status: ModuleExtractionStatus,
    ) -> int:
        return sum(
            module.status == status
            for module in self.modules
        )

    def to_dict(self) -> dict:
        return {
            "summary": {
                "moduleCount": len(self.modules),
                "passedCount": self.passed_count,
                "failedCount": self.failed_count,
                "blockedCount": self.blocked_count,
                "pendingCount": self.pending_count,
                "successful": self.is_successful,
            },
            "modules": [
                module.to_dict()
                for module in self.modules
            ],
        }
