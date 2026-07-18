from __future__ import annotations

import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Callable, Optional, Sequence, Tuple

from .blueprint_generator import (
    PluginBlueprintGenerator,
)
from .blueprint_models import (
    BlueprintRequest,
    PluginBlueprint,
)
from .extraction_portfolio_models import (
    ExtractionPortfolio,
    ExtractionStage,
    ExtractionStageResult,
    ModuleExtractionResult,
    StageStatus,
)
from .repository_api import Repository


class ExtractionPortfolioError(ValueError):
    pass


@dataclass(frozen=True)
class CommandResult:
    exit_code: int
    duration_seconds: float
    stdout: str = ""
    stderr: str = ""


CommandRunner = Callable[
    [Tuple[str, ...], Path],
    CommandResult,
]


def subprocess_command_runner(
    command: Tuple[str, ...],
    cwd: Path,
) -> CommandResult:
    started = time.perf_counter()

    completed = subprocess.run(
        command,
        cwd=str(cwd),
        text=True,
        capture_output=True,
        check=False,
    )

    return CommandResult(
        exit_code=completed.returncode,
        duration_seconds=(
            time.perf_counter() - started
        ),
        stdout=completed.stdout,
        stderr=completed.stderr,
    )


class ModuleExtractionPortfolio:
    def __init__(
        self,
        repository: Repository,
        repository_root: Path,
        staging_root: Path = Path(
            "generated/plugin-staging"
        ),
        command_runner: CommandRunner = (
            subprocess_command_runner
        ),
        python_executable: Optional[str] = None,
        npm_executable: str = "npm",
    ) -> None:
        self.repository = repository
        self.repository_root = (
            repository_root.resolve()
        )
        self.staging_root = staging_root
        self.command_runner = command_runner
        self.python_executable = (
            python_executable
            or sys.executable
        )
        self.npm_executable = npm_executable

        if staging_root.is_absolute():
            raise ExtractionPortfolioError(
                "Staging root must be repository-relative."
            )

        resolved_staging = (
            self.repository_root
            / staging_root
        ).resolve()

        try:
            resolved_staging.relative_to(
                self.repository_root
            )
        except ValueError as error:
            raise ExtractionPortfolioError(
                "Staging root escapes repository root."
            ) from error

    def extract(
        self,
        module_ids: Sequence[str] = (),
        limit: Optional[int] = None,
        install: bool = True,
        compile_plugin: bool = True,
        overwrite: bool = True,
    ) -> ExtractionPortfolio:
        blueprints = self._blueprints(
            module_ids=tuple(module_ids),
            limit=limit,
        )

        modules = tuple(
            self._extract_module(
                blueprint=blueprint,
                install=install,
                compile_plugin=compile_plugin,
                overwrite=overwrite,
            )
            for blueprint in blueprints
        )

        return ExtractionPortfolio(
            modules=modules
        )

    def _blueprints(
        self,
        module_ids: Tuple[str, ...],
        limit: Optional[int],
    ) -> Tuple[PluginBlueprint, ...]:
        if limit is not None and limit < 1:
            raise ExtractionPortfolioError(
                "Limit must be greater than zero."
            )

        if len(module_ids) != len(set(module_ids)):
            raise ExtractionPortfolioError(
                "Requested module IDs must be unique."
            )

        generator = PluginBlueprintGenerator(
            self.repository
        )

        if module_ids:
            blueprints = []

            for module_id in module_ids:
                portfolio = generator.generate(
                    BlueprintRequest(
                        mode="module",
                        module_id=module_id,
                    )
                )

                if not portfolio.blueprints:
                    raise ExtractionPortfolioError(
                        "No blueprint generated for "
                        f"module: {module_id}"
                    )

                blueprints.append(
                    portfolio.blueprints[0]
                )

            if limit is not None:
                blueprints = blueprints[:limit]

            return tuple(blueprints)

        portfolio = generator.generate(
            BlueprintRequest(
                mode="candidates",
                limit=limit,
            )
        )

        return portfolio.blueprints

    def _extract_module(
        self,
        blueprint: PluginBlueprint,
        install: bool,
        compile_plugin: bool,
        overwrite: bool,
    ) -> ModuleExtractionResult:
        workspace = (
            self.staging_root
            / blueprint.module_id
        )

        stages = [
            ExtractionStageResult(
                stage=ExtractionStage.BLUEPRINT,
                status=StageStatus.PASSED,
                detail="Extraction blueprint generated.",
            )
        ]

        pipeline = (
            (
                ExtractionStage.MATERIALIZATION,
                self._materialization_command(
                    blueprint.module_id,
                    overwrite,
                ),
                self.repository_root,
            ),
            (
                ExtractionStage.CLOSURE,
                self._closure_command(
                    blueprint.module_id,
                    overwrite,
                ),
                self.repository_root,
            ),
            (
                ExtractionStage.REWRITE,
                self._rewrite_command(
                    blueprint.module_id
                ),
                self.repository_root,
            ),
        )

        failed = False

        for stage, command, cwd in pipeline:
            if failed:
                stages.append(
                    self._blocked(stage)
                )
                continue

            result = self._run_stage(
                stage=stage,
                command=command,
                cwd=cwd,
            )

            stages.append(result)
            failed = (
                result.status
                == StageStatus.FAILED
            )

        install_stage = self._optional_stage(
            stage=ExtractionStage.INSTALL,
            enabled=install,
            blocked=failed,
            command=(
                self.npm_executable,
                "install",
                "--ignore-scripts",
            ),
            workspace=workspace,
            skipped_detail=(
                "Dependency installation skipped."
            ),
        )

        stages.append(install_stage)

        if install_stage.status == StageStatus.FAILED:
            failed = True

        compile_stage = self._optional_stage(
            stage=ExtractionStage.COMPILE,
            enabled=compile_plugin,
            blocked=failed,
            command=(
                self.npm_executable,
                "run",
                "typecheck",
            ),
            workspace=workspace,
            skipped_detail=(
                "TypeScript compilation skipped."
            ),
        )

        stages.append(compile_stage)

        errors = tuple(
            result.detail
            for result in stages
            if result.status == StageStatus.FAILED
        )

        return ModuleExtractionResult(
            module_id=blueprint.module_id,
            package_name=blueprint.package_name,
            workspace=PurePosixPath(
                workspace.as_posix()
            ),
            stages=tuple(stages),
            warnings=tuple(
                blueprint.warnings
            ),
            errors=errors,
        )

    def _optional_stage(
        self,
        stage: ExtractionStage,
        enabled: bool,
        blocked: bool,
        command: Tuple[str, ...],
        workspace: Path,
        skipped_detail: str,
    ) -> ExtractionStageResult:
        if blocked:
            return self._blocked(stage)

        if not enabled:
            return ExtractionStageResult(
                stage=stage,
                status=StageStatus.SKIPPED,
                detail=skipped_detail,
            )

        return self._run_stage(
            stage=stage,
            command=command,
            cwd=(
                self.repository_root
                / workspace
            ),
        )

    def _run_stage(
        self,
        stage: ExtractionStage,
        command: Tuple[str, ...],
        cwd: Path,
    ) -> ExtractionStageResult:
        try:
            result = self.command_runner(
                command,
                cwd,
            )
        except OSError as error:
            return ExtractionStageResult(
                stage=stage,
                status=StageStatus.FAILED,
                detail=str(error),
                command=command,
            )

        passed = result.exit_code == 0

        return ExtractionStageResult(
            stage=stage,
            status=(
                StageStatus.PASSED
                if passed
                else StageStatus.FAILED
            ),
            duration_seconds=(
                result.duration_seconds
            ),
            detail=self._command_detail(
                result
            ),
            command=command,
            exit_code=result.exit_code,
        )

    def _command_detail(
        self,
        result: CommandResult,
    ) -> str:
        if result.exit_code == 0:
            return "Command completed successfully."

        output = (
            result.stderr.strip()
            or result.stdout.strip()
        )

        if output:
            meaningful_lines = tuple(
                line.strip()
                for line in output.splitlines()
                if line.strip()
                and line.strip() not in ("{", "}")
            )

            if meaningful_lines:
                return meaningful_lines[-1]

        return (
            "Command failed with exit code "
            f"{result.exit_code}."
        )

    def _blocked(
        self,
        stage: ExtractionStage,
    ) -> ExtractionStageResult:
        return ExtractionStageResult(
            stage=stage,
            status=StageStatus.BLOCKED,
            detail=(
                "Blocked by an earlier failed stage."
            ),
        )

    def _materialization_command(
        self,
        module_id: str,
        overwrite: bool,
    ) -> Tuple[str, ...]:
        command = [
            self.python_executable,
            "-m",
            (
                "tools.knowledge_engine."
                "materialization_cli"
            ),
            "--repository-root",
            str(self.repository_root),
            "--output-root",
            self.staging_root.as_posix(),
        ]

        if overwrite:
            command.append("--overwrite")

        command.extend(
            (
                "module",
                module_id,
            )
        )

        return tuple(command)

    def _closure_command(
        self,
        module_id: str,
        overwrite: bool,
    ) -> Tuple[str, ...]:
        command = [
            self.python_executable,
            "-m",
            (
                "tools.knowledge_engine."
                "dependency_closure_cli"
            ),
            "--repository-root",
            str(self.repository_root),
            "--staging-root",
            self.staging_root.as_posix(),
            "--apply",
        ]

        if overwrite:
            command.append("--overwrite")

        command.extend(
            (
                "module",
                module_id,
            )
        )

        return tuple(command)

    def _rewrite_command(
        self,
        module_id: str,
    ) -> Tuple[str, ...]:
        return (
            self.python_executable,
            "-m",
            (
                "tools.knowledge_engine."
                "import_rewrite_cli"
            ),
            "--repository-root",
            str(self.repository_root),
            "--staging-root",
            self.staging_root.as_posix(),
            "--apply",
            "module",
            module_id,
        )
