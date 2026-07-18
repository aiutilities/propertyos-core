from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional, Tuple

from .plugin_package_portfolio_models import (
    PackagingStage,
    PackagingStageResult,
    PackagingStageStatus,
    PluginPackageArtifact,
    PluginPackagePortfolio,
    PluginPackagePortfolioRequest,
)
from .repository_api import Repository


@dataclass(frozen=True)
class PackagingCommandResult:
    exit_code: int
    duration_seconds: float
    stdout: str = ""
    stderr: str = ""


PackagingCommandRunner = Callable[
    [Tuple[str, ...], Path],
    PackagingCommandResult,
]


def subprocess_packaging_runner(
    command: Tuple[str, ...],
    cwd: Path,
) -> PackagingCommandResult:
    started = time.perf_counter()

    completed = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        check=False,
    )

    return PackagingCommandResult(
        exit_code=completed.returncode,
        duration_seconds=(
            time.perf_counter()
            - started
        ),
        stdout=completed.stdout,
        stderr=completed.stderr,
    )


class PluginPackagePortfolioBuilder:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
        repository_root: Path,
        staging_root: Path,
        artifact_root: Path,
        command_runner: PackagingCommandRunner = (
            subprocess_packaging_runner
        ),
        npm_executable: str = "npm",
    ) -> None:
        self.repository = repository
        self.repository_root = (
            repository_root.resolve()
        )
        self.staging_root = self._safe_root(
            staging_root,
            "Staging root",
        )
        self.artifact_root = self._safe_root(
            artifact_root,
            "Artifact root",
        )
        self.command_runner = command_runner
        self.npm_executable = npm_executable

    def build(
        self,
        module_ids: Tuple[str, ...],
        overwrite: bool = False,
    ) -> PluginPackagePortfolio:
        request = PluginPackagePortfolioRequest(
            module_ids=module_ids,
            artifact_root=(
                self._display_path(
                    self.artifact_root
                )
            ),
            overwrite=overwrite,
        )

        self.artifact_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        artifacts = tuple(
            self._build_artifact(
                module_id=module_id,
                overwrite=overwrite,
            )
            for module_id in request.module_ids
        )

        return PluginPackagePortfolio(
            schema_version=(
                self.SCHEMA_VERSION
            ),
            request=request,
            artifacts=artifacts,
        )

    def _build_artifact(
        self,
        module_id: str,
        overwrite: bool,
    ) -> PluginPackageArtifact:
        workspace = (
            self.staging_root
            / module_id
        )

        package = self._package_metadata(
            workspace
        )
        plugin = self._plugin_metadata(
            workspace
        )

        package_name = self._string(
            package,
            "name",
            "Package name",
        )
        version = self._string(
            package,
            "version",
            "Package version",
        )
        plugin_id = self._string(
            plugin,
            "id",
            "Plugin ID",
        )

        stages = []

        build_result = self._run(
            stage=PackagingStage.BUILD,
            command=(
                self.npm_executable,
                "run",
                "build",
            ),
            cwd=workspace,
        )
        stages.append(build_result)

        if (
            build_result.status
            == PackagingStageStatus.FAILED
        ):
            stages.extend(
                (
                    self._blocked(
                        PackagingStage.PACK
                    ),
                    self._blocked(
                        PackagingStage.VERIFY
                    ),
                )
            )

            return self._incomplete_artifact(
                module_id=module_id,
                plugin_id=plugin_id,
                package_name=package_name,
                version=version,
                workspace=workspace,
                stages=tuple(stages),
            )

        expected_filename = (
            self._artifact_filename(
                package_name,
                version,
            )
        )
        expected_path = (
            self.artifact_root
            / expected_filename
        )

        if expected_path.exists():
            if not overwrite:
                stages.append(
                    PackagingStageResult(
                        stage=PackagingStage.PACK,
                        status=(
                            PackagingStageStatus.FAILED
                        ),
                        detail=(
                            "Artifact already exists: "
                            + self._display_path(
                                expected_path
                            ).as_posix()
                        ),
                    )
                )
                stages.append(
                    self._blocked(
                        PackagingStage.VERIFY
                    )
                )

                return self._incomplete_artifact(
                    module_id=module_id,
                    plugin_id=plugin_id,
                    package_name=package_name,
                    version=version,
                    workspace=workspace,
                    stages=tuple(stages),
                )

            expected_path.unlink()

        try:
            with tempfile.TemporaryDirectory(
                dir=self.artifact_root
            ) as temporary:
                package_workspace = (
                    Path(temporary)
                    / module_id
                )

                shutil.copytree(
                    workspace,
                    package_workspace,
                    ignore=shutil.ignore_patterns(
                        "node_modules",
                    ),
                )

                portable_package = (
                    self._portable_package_metadata(
                        package=package,
                        source_workspace=workspace,
                    )
                )

                (
                    package_workspace
                    / "package.json"
                ).write_text(
                    json.dumps(
                        portable_package,
                        indent=2,
                        sort_keys=True,
                    )
                    + "\n",
                    encoding="utf-8",
                )

                pack_result = self._run(
                    stage=PackagingStage.PACK,
                    command=(
                        self.npm_executable,
                        "pack",
                        "--json",
                        "--ignore-scripts",
                        "--pack-destination",
                        str(self.artifact_root),
                    ),
                    cwd=package_workspace,
                )
        except (
            OSError,
            ValueError,
        ) as error:
            pack_result = PackagingStageResult(
                stage=PackagingStage.PACK,
                status=(
                    PackagingStageStatus.FAILED
                ),
                detail=str(error),
            )

        pack_output = pack_result.detail

        if (
            pack_result.status
            == PackagingStageStatus.PASSED
        ):
            pack_result = (
                PackagingStageResult(
                    stage=PackagingStage.PACK,
                    status=(
                        PackagingStageStatus.PASSED
                    ),
                    duration_seconds=(
                        pack_result.duration_seconds
                    ),
                    detail=(
                        "Package archive created."
                    ),
                    command=pack_result.command,
                    exit_code=(
                        pack_result.exit_code
                    ),
                )
            )

        stages.append(pack_result)

        if (
            pack_result.status
            == PackagingStageStatus.FAILED
        ):
            stages.append(
                self._blocked(
                    PackagingStage.VERIFY
                )
            )

            return self._incomplete_artifact(
                module_id=module_id,
                plugin_id=plugin_id,
                package_name=package_name,
                version=version,
                workspace=workspace,
                stages=tuple(stages),
            )

        metadata, metadata_error = (
            self._pack_metadata(
                pack_output
            )
        )

        if metadata_error:
            stages.append(
                PackagingStageResult(
                    stage=PackagingStage.VERIFY,
                    status=(
                        PackagingStageStatus.FAILED
                    ),
                    detail=metadata_error,
                )
            )

            return self._incomplete_artifact(
                module_id=module_id,
                plugin_id=plugin_id,
                package_name=package_name,
                version=version,
                workspace=workspace,
                stages=tuple(stages),
            )

        filename = str(
            metadata.get("filename", "")
        )
        artifact_path = (
            self.artifact_root
            / filename
        )

        verification_error = (
            self._verification_error(
                metadata=metadata,
                expected_filename=(
                    expected_filename
                ),
                artifact_path=artifact_path,
            )
        )

        if verification_error:
            stages.append(
                PackagingStageResult(
                    stage=PackagingStage.VERIFY,
                    status=(
                        PackagingStageStatus.FAILED
                    ),
                    detail=verification_error,
                )
            )

            return self._incomplete_artifact(
                module_id=module_id,
                plugin_id=plugin_id,
                package_name=package_name,
                version=version,
                workspace=workspace,
                stages=tuple(stages),
            )

        sha256 = hashlib.sha256(
            artifact_path.read_bytes()
        ).hexdigest()

        stages.append(
            PackagingStageResult(
                stage=PackagingStage.VERIFY,
                status=(
                    PackagingStageStatus.PASSED
                ),
                detail=(
                    "Artifact metadata and checksum "
                    "verified."
                ),
            )
        )

        return PluginPackageArtifact(
            module_id=module_id,
            plugin_id=plugin_id,
            package_name=package_name,
            version=version,
            workspace=self._display_path(
                workspace
            ),
            stages=tuple(stages),
            artifact_path=self._display_path(
                artifact_path
            ),
            filename=filename,
            size_bytes=int(
                metadata["size"]
            ),
            unpacked_size_bytes=int(
                metadata["unpackedSize"]
            ),
            file_count=self._file_count(
                metadata
            ),
            shasum=str(
                metadata["shasum"]
            ),
            integrity=str(
                metadata["integrity"]
            ),
            sha256=sha256,
        )

    def _portable_package_metadata(
        self,
        package: dict[str, object],
        source_workspace: Path,
    ) -> dict[str, object]:
        portable = dict(package)

        for section in (
            "dependencies",
            "devDependencies",
            "optionalDependencies",
            "peerDependencies",
        ):
            source = portable.get(section)

            if not isinstance(source, dict):
                continue

            rewritten = {}

            for name, version in source.items():
                if (
                    isinstance(version, str)
                    and version.startswith(
                        "file:"
                    )
                ):
                    rewritten[name] = (
                        self._local_dependency_version(
                            source_workspace=(
                                source_workspace
                            ),
                            specification=version,
                            package_name=name,
                        )
                    )
                else:
                    rewritten[name] = version

            portable[section] = rewritten

        portable["files"] = [
            "dist",
            "plugin.json",
            "README.md",
        ]

        return portable

    def _local_dependency_version(
        self,
        source_workspace: Path,
        specification: str,
        package_name: str,
    ) -> str:
        relative = specification[
            len("file:"):
        ]

        if not relative.strip():
            raise ValueError(
                "Local dependency has an empty "
                f"path: {package_name}"
            )

        dependency_root = (
            source_workspace
            / relative
        ).resolve()

        try:
            dependency_root.relative_to(
                self.repository_root
            )
        except ValueError as error:
            raise ValueError(
                "Local dependency escapes the "
                f"repository: {package_name}"
            ) from error

        metadata = self._json_object(
            dependency_root
            / "package.json",
            (
                "Local dependency metadata for "
                + package_name
            ),
        )

        actual_name = self._string(
            metadata,
            "name",
            "Local dependency package name",
        )

        if actual_name != package_name:
            raise ValueError(
                "Local dependency package name "
                f"mismatch: expected {package_name}, "
                f"received {actual_name}."
            )

        return self._string(
            metadata,
            "version",
            (
                "Local dependency version for "
                + package_name
            ),
        )

    def _package_metadata(
        self,
        workspace: Path,
    ) -> dict[str, object]:
        if not workspace.is_dir():
            raise ValueError(
                "Plugin workspace does not exist: "
                + workspace.as_posix()
            )

        return self._json_object(
            workspace / "package.json",
            "Package metadata",
        )

    def _plugin_metadata(
        self,
        workspace: Path,
    ) -> dict[str, object]:
        return self._json_object(
            workspace / "plugin.json",
            "Plugin metadata",
        )

    @staticmethod
    def _json_object(
        path: Path,
        label: str,
    ) -> dict[str, object]:
        try:
            value = json.loads(
                path.read_text(
                    encoding="utf-8"
                )
            )
        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            raise ValueError(
                f"{label} is unreadable: {path}"
            ) from error

        if not isinstance(value, dict):
            raise ValueError(
                f"{label} must be a JSON object."
            )

        return value

    @staticmethod
    def _string(
        value: dict[str, object],
        key: str,
        label: str,
    ) -> str:
        result = value.get(key)

        if (
            not isinstance(result, str)
            or not result.strip()
        ):
            raise ValueError(
                f"{label} is missing."
            )

        return result.strip()

    def _run(
        self,
        stage: PackagingStage,
        command: Tuple[str, ...],
        cwd: Path,
    ) -> PackagingStageResult:
        try:
            result = self.command_runner(
                command,
                cwd,
            )
        except OSError as error:
            return PackagingStageResult(
                stage=stage,
                status=(
                    PackagingStageStatus.FAILED
                ),
                detail=str(error),
                command=command,
            )

        passed = result.exit_code == 0
        detail = (
            result.stdout.strip()
            if passed
            else (
                result.stderr.strip()
                or result.stdout.strip()
                or (
                    "Command failed with exit "
                    f"code {result.exit_code}."
                )
            )
        )

        return PackagingStageResult(
            stage=stage,
            status=(
                PackagingStageStatus.PASSED
                if passed
                else PackagingStageStatus.FAILED
            ),
            duration_seconds=(
                result.duration_seconds
            ),
            detail=detail,
            command=command,
            exit_code=result.exit_code,
        )

    @staticmethod
    def _pack_metadata(
        output: str,
    ) -> tuple[
        dict[str, object],
        str,
    ]:
        try:
            value = json.loads(output)
        except json.JSONDecodeError:
            return {}, (
                "npm pack did not return valid JSON."
            )

        if (
            not isinstance(value, list)
            or len(value) != 1
            or not isinstance(value[0], dict)
        ):
            return {}, (
                "npm pack returned an unexpected "
                "metadata payload."
            )

        return value[0], ""

    @staticmethod
    def _verification_error(
        metadata: dict[str, object],
        expected_filename: str,
        artifact_path: Path,
    ) -> str:
        required = (
            "filename",
            "size",
            "unpackedSize",
            "shasum",
            "integrity",
        )

        missing = tuple(
            key
            for key in required
            if metadata.get(key) in (
                None,
                "",
            )
        )

        if missing:
            return (
                "npm pack metadata is missing: "
                + ", ".join(missing)
            )

        if (
            metadata["filename"]
            != expected_filename
        ):
            return (
                "Unexpected artifact filename: "
                f"{metadata['filename']}"
            )

        if not artifact_path.is_file():
            return (
                "Packed artifact does not exist: "
                + artifact_path.as_posix()
            )

        if artifact_path.stat().st_size != int(
            metadata["size"]
        ):
            return (
                "Packed artifact size does not "
                "match npm metadata."
            )

        if int(metadata["unpackedSize"]) <= 0:
            return (
                "Packed artifact has an invalid "
                "unpacked size."
            )

        return ""

    @staticmethod
    def _file_count(
        metadata: dict[str, object],
    ) -> int:
        files = metadata.get("files")

        if isinstance(files, list):
            return len(files)

        entry_count = metadata.get(
            "entryCount"
        )

        if isinstance(entry_count, int):
            return entry_count

        return 0

    def _incomplete_artifact(
        self,
        module_id: str,
        plugin_id: str,
        package_name: str,
        version: str,
        workspace: Path,
        stages: Tuple[
            PackagingStageResult,
            ...,
        ],
    ) -> PluginPackageArtifact:
        return PluginPackageArtifact(
            module_id=module_id,
            plugin_id=plugin_id,
            package_name=package_name,
            version=version,
            workspace=self._display_path(
                workspace
            ),
            stages=stages,
            errors=tuple(
                stage.detail
                for stage in stages
                if stage.status
                == PackagingStageStatus.FAILED
            ),
        )

    @staticmethod
    def _blocked(
        stage: PackagingStage,
    ) -> PackagingStageResult:
        return PackagingStageResult(
            stage=stage,
            status=(
                PackagingStageStatus.BLOCKED
            ),
            detail=(
                "Stage blocked by an earlier "
                "failure."
            ),
        )

    @staticmethod
    def _artifact_filename(
        package_name: str,
        version: str,
    ) -> str:
        normalized = (
            package_name
            .removeprefix("@")
            .replace("/", "-")
        )

        return f"{normalized}-{version}.tgz"

    def _safe_root(
        self,
        path: Path,
        label: str,
    ) -> Path:
        resolved = (
            path.resolve()
            if path.is_absolute()
            else (
                self.repository_root
                / path
            ).resolve()
        )

        try:
            resolved.relative_to(
                self.repository_root
            )
        except ValueError as error:
            raise ValueError(
                f"{label} must remain inside "
                "the repository."
            ) from error

        return resolved

    def _display_path(
        self,
        path: Path,
    ) -> Path:
        return path.resolve().relative_to(
            self.repository_root
        )
