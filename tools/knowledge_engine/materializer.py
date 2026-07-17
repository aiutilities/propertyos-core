from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path, PurePosixPath
from typing import Dict, Iterable, Tuple

from .blueprint_generator import (
    PluginBlueprintGenerator,
)
from .blueprint_models import (
    BlueprintRequest,
    PluginBlueprint,
)
from .blueprint_validation_models import (
    BlueprintValidationRequest,
)
from .blueprint_validator import (
    PluginBlueprintValidator,
)
from .materialization_models import (
    MaterializationPortfolio,
    MaterializationRequest,
    MaterializedFile,
    MaterializedPlugin,
)
from .repository_api import Repository


class MaterializationError(ValueError):
    pass


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)

            if not chunk:
                break

            digest.update(chunk)

    return digest.hexdigest()


def _json_bytes(
    value: object,
) -> bytes:
    return (
        json.dumps(
            value,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    ).encode("utf-8")


def _normalise_relative_path(
    path: str,
) -> PurePosixPath:
    candidate = PurePosixPath(path)

    if candidate.is_absolute():
        raise MaterializationError(
            "Absolute staging paths are not allowed: "
            f"{path}"
        )

    if ".." in candidate.parts:
        raise MaterializationError(
            "Parent traversal is not allowed in "
            f"staging paths: {path}"
        )

    if not candidate.parts:
        raise MaterializationError(
            "Empty staging path is not allowed."
        )

    return candidate


def _workspace_digest(
    workspace: Path,
) -> str:
    digest = hashlib.sha256()

    files = sorted(
        path
        for path in workspace.rglob("*")
        if path.is_file()
    )

    for path in files:
        relative = path.relative_to(
            workspace
        ).as_posix()

        digest.update(
            relative.encode("utf-8")
        )

        digest.update(b"\0")

        digest.update(
            path.read_bytes()
        )

        digest.update(b"\0")

    return digest.hexdigest()


class StagedPluginMaterializer:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
        repository_root: Path,
        output_root: Path,
    ) -> None:
        self.repository = repository

        self.repository_root = (
            repository_root.resolve()
        )

        if output_root.is_absolute():
            resolved_output_root = (
                output_root.resolve()
            )
        else:
            resolved_output_root = (
                self.repository_root
                / output_root
            ).resolve()

        self.output_root = (
            resolved_output_root
        )

        try:
            self.output_root.relative_to(
                self.repository_root
            )
        except ValueError as error:
            raise MaterializationError(
                "Materialization output root must "
                "remain inside the repository."
            ) from error

        self.generator = (
            PluginBlueprintGenerator(
                repository
            )
        )

        self.validator = (
            PluginBlueprintValidator(
                repository,
                self.repository_root,
            )
        )

    def materialize(
        self,
        request: MaterializationRequest,
    ) -> MaterializationPortfolio:
        if (
            request.limit is not None
            and request.limit <= 0
        ):
            raise MaterializationError(
                "Materialization limit must be "
                "greater than zero."
            )

        blueprint_request = BlueprintRequest(
            mode=request.mode,
            module_id=request.module_id,
            limit=request.limit,
        )

        validation_request = (
            BlueprintValidationRequest(
                mode=request.mode,
                module_id=request.module_id,
                limit=request.limit,
            )
        )

        blueprint_portfolio = (
            self.generator.generate(
                blueprint_request
            )
        )

        validation_portfolio = (
            self.validator.validate(
                validation_request
            )
        )

        if not validation_portfolio.valid:
            invalid_modules = [
                result.module_id
                for result
                in validation_portfolio.results
                if not result.valid
            ]

            raise MaterializationError(
                "Blueprint validation failed for: "
                + ", ".join(invalid_modules)
            )

        self._preflight_workspaces(
            blueprint_portfolio.blueprints,
            overwrite=request.overwrite,
        )

        self.output_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        plugins = tuple(
            self._materialize_blueprint(
                blueprint,
                overwrite=request.overwrite,
            )
            for blueprint
            in blueprint_portfolio.blueprints
        )

        return MaterializationPortfolio(
            schema_version=(
                self.SCHEMA_VERSION
            ),
            request=request,
            output_root=(
                self.output_root
                .relative_to(
                    self.repository_root
                )
                .as_posix()
            ),
            plugins=plugins,
            summary={
                "pluginCount": len(plugins),
                "copiedFileCount": sum(
                    plugin.copied_file_count
                    for plugin in plugins
                ),
                "generatedFileCount": sum(
                    plugin.generated_file_count
                    for plugin in plugins
                ),
                "totalFileCount": sum(
                    plugin.total_file_count
                    for plugin in plugins
                ),
                "validPluginCount": sum(
                    1
                    for plugin in plugins
                    if plugin.valid
                ),
                "invalidPluginCount": sum(
                    1
                    for plugin in plugins
                    if not plugin.valid
                ),
            },
        )

    def _preflight_workspaces(
        self,
        blueprints: Iterable[
            PluginBlueprint
        ],
        overwrite: bool,
    ) -> None:
        for blueprint in blueprints:
            workspace = self._workspace_path(
                blueprint.plugin_id
            )

            if (
                workspace.exists()
                and not overwrite
            ):
                raise MaterializationError(
                    "Staging workspace already "
                    "exists; use --overwrite: "
                    f"{workspace.relative_to(self.repository_root)}"
                )

    def _workspace_path(
        self,
        plugin_id: str,
    ) -> Path:
        relative = _normalise_relative_path(
            plugin_id
        )

        workspace = (
            self.output_root
            / Path(*relative.parts)
        ).resolve()

        try:
            workspace.relative_to(
                self.output_root
            )
        except ValueError as error:
            raise MaterializationError(
                "Plugin workspace escaped the "
                "materialization output root."
            ) from error

        return workspace

    def _safe_destination(
        self,
        workspace: Path,
        relative_path: str,
    ) -> Path:
        relative = _normalise_relative_path(
            relative_path
        )

        destination = (
            workspace
            / Path(*relative.parts)
        ).resolve()

        try:
            destination.relative_to(
                workspace.resolve()
            )
        except ValueError as error:
            raise MaterializationError(
                "Staged file escaped its plugin "
                "workspace."
            ) from error

        return destination

    def _materialize_blueprint(
        self,
        blueprint: PluginBlueprint,
        overwrite: bool,
    ) -> MaterializedPlugin:
        workspace = self._workspace_path(
            blueprint.plugin_id
        )

        temporary_workspace = (
            self.output_root
            / (
                "."
                + blueprint.plugin_id
                + ".materializing"
            )
        ).resolve()

        try:
            temporary_workspace.relative_to(
                self.output_root
            )
        except ValueError as error:
            raise MaterializationError(
                "Temporary workspace escaped the "
                "output root."
            ) from error

        if temporary_workspace.exists():
            shutil.rmtree(
                temporary_workspace
            )

        temporary_workspace.mkdir(
            parents=True,
            exist_ok=False,
        )

        try:
            copied_files = (
                self._copy_blueprint_files(
                    blueprint,
                    temporary_workspace,
                )
            )

            generated_files = (
                self._write_generated_files(
                    blueprint,
                    temporary_workspace,
                    copied_files,
                )
            )

            all_files = (
                copied_files
                + generated_files
            )

            self._verify_materialized_files(
                all_files,
                temporary_workspace,
            )

            workspace_sha256 = (
                _workspace_digest(
                    temporary_workspace
                )
            )

            if workspace.exists():
                if not overwrite:
                    raise MaterializationError(
                        "Staging workspace already "
                        "exists."
                    )

                shutil.rmtree(workspace)

            temporary_workspace.rename(
                workspace
            )

        except Exception:
            if temporary_workspace.exists():
                shutil.rmtree(
                    temporary_workspace
                )

            raise

        copied_files = tuple(
            self._rebase_materialized_file(
                file,
                old_root=temporary_workspace,
                new_root=workspace,
            )
            for file in copied_files
        )

        generated_files = tuple(
            self._rebase_materialized_file(
                file,
                old_root=temporary_workspace,
                new_root=workspace,
            )
            for file in generated_files
        )

        return MaterializedPlugin(
            module_id=blueprint.module_id,
            plugin_id=blueprint.plugin_id,
            package_name=(
                blueprint.package_name
            ),
            workspace_path=(
                workspace
                .relative_to(
                    self.repository_root
                )
                .as_posix()
            ),
            copied_file_count=len(
                copied_files
            ),
            generated_file_count=len(
                generated_files
            ),
            total_file_count=(
                len(copied_files)
                + len(generated_files)
            ),
            copied_files=copied_files,
            generated_files=generated_files,
            workspace_sha256=(
                workspace_sha256
            ),
            valid=True,
        )

    def _copy_blueprint_files(
        self,
        blueprint: PluginBlueprint,
        workspace: Path,
    ) -> Tuple[
        MaterializedFile,
        ...,
    ]:
        copied = []

        blueprint_target_root = (
            PurePosixPath(
                blueprint.target_root
            )
        )

        for file in blueprint.files:
            source = (
                self.repository_root
                / file.source_path
            ).resolve()

            try:
                source.relative_to(
                    self.repository_root
                )
            except ValueError as error:
                raise MaterializationError(
                    "Blueprint source escaped the "
                    "repository root."
                ) from error

            if not source.is_file():
                raise MaterializationError(
                    "Blueprint source file does "
                    f"not exist: {file.source_path}"
                )

            target = PurePosixPath(
                file.target_path
            )

            try:
                relative_target = (
                    target.relative_to(
                        blueprint_target_root
                    )
                )
            except ValueError as error:
                raise MaterializationError(
                    "Blueprint target is outside "
                    "its plugin root: "
                    f"{file.target_path}"
                ) from error

            destination = (
                self._safe_destination(
                    workspace,
                    relative_target.as_posix(),
                )
            )

            destination.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            shutil.copyfile(
                source,
                destination,
            )

            source_hash = _sha256_file(
                source
            )

            staged_hash = _sha256_file(
                destination
            )

            if source_hash != staged_hash:
                raise MaterializationError(
                    "Copied file hash mismatch: "
                    f"{file.source_path}"
                )

            copied.append(
                MaterializedFile(
                    source_path=(
                        file.source_path
                    ),
                    staged_path=(
                        destination
                        .relative_to(
                            workspace
                        )
                        .as_posix()
                    ),
                    file_kind=(
                        file.file_kind
                    ),
                    source_sha256=(
                        source_hash
                    ),
                    staged_sha256=(
                        staged_hash
                    ),
                    size_bytes=(
                        destination
                        .stat()
                        .st_size
                    ),
                    generated=False,
                )
            )

        return tuple(copied)

    def _write_generated_files(
        self,
        blueprint: PluginBlueprint,
        workspace: Path,
        copied_files: Tuple[
            MaterializedFile,
            ...,
        ],
    ) -> Tuple[
        MaterializedFile,
        ...,
    ]:
        generated_content = (
            self._generated_content(
                blueprint,
                copied_files,
            )
        )

        generated_files = []

        for relative_path in sorted(
            generated_content
        ):
            destination = (
                self._safe_destination(
                    workspace,
                    relative_path,
                )
            )

            destination.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            content = generated_content[
                relative_path
            ]

            destination.write_bytes(
                content
            )

            digest = _sha256_bytes(
                content
            )

            generated_files.append(
                MaterializedFile(
                    source_path="",
                    staged_path=(
                        relative_path
                    ),
                    file_kind="generated",
                    source_sha256="",
                    staged_sha256=digest,
                    size_bytes=len(content),
                    generated=True,
                )
            )

        return tuple(generated_files)

    def _generated_content(
        self,
        blueprint: PluginBlueprint,
        copied_files: Tuple[
            MaterializedFile,
            ...,
        ],
    ) -> Dict[str, bytes]:
        module_file = next(
            (
                file
                for file in blueprint.files
                if file.file_kind
                == "module"
            ),
            None,
        )

        if module_file is None:
            raise MaterializationError(
                "Blueprint contains no module file."
            )

        module_target = PurePosixPath(
            module_file.target_path
        )

        plugin_target_root = (
            PurePosixPath(
                blueprint.target_root
            )
        )

        module_relative = (
            module_target.relative_to(
                plugin_target_root
            )
        )

        module_import = (
            "./"
            + module_relative
            .with_suffix("")
            .as_posix()
            .removeprefix("src/")
        )

        index_content = (
            f"export {{ {blueprint.manifest['moduleClass']} }} "
            f"from '{module_import}';\n"
        ).encode("utf-8")

        plugin_manifest = dict(
            blueprint.manifest
        )

        plugin_manifest[
            "materialization"
        ] = {
            "mode": "staged-copy",
            "sourceModule": (
                blueprint.module_id
            ),
            "targetRoot": (
                blueprint.target_root
            ),
        }

        package_json = {
            "name": blueprint.package_name,
            "version": (
                blueprint.manifest[
                    "version"
                ]
            ),
            "private": True,
            "main": "dist/index.js",
            "types": "dist/index.d.ts",
            "scripts": {
                "build": (
                    "tsc -p tsconfig.json"
                ),
                "typecheck": (
                    "tsc -p tsconfig.json "
                    "--noEmit"
                ),
            },
            "peerDependencies": {
                "@nestjs/common": "*",
                "@nestjs/core": "*",
            },
        }

        tsconfig = {
            "extends": (
                "../../../backend/tsconfig.json"
            ),
            "compilerOptions": {
                "rootDir": "src",
                "outDir": "dist",
                "declaration": True,
                "composite": False,
            },
            "include": [
                "src/**/*.ts"
            ],
        }

        copied_report = [
            {
                "sourcePath": (
                    file.source_path
                ),
                "stagedPath": (
                    file.staged_path
                ),
                "fileKind": (
                    file.file_kind
                ),
                "sha256": (
                    file.staged_sha256
                ),
                "sizeBytes": (
                    file.size_bytes
                ),
            }
            for file in copied_files
        ]

        extraction_report = {
            "schemaVersion": "1.0.0",
            "moduleId": blueprint.module_id,
            "pluginId": blueprint.plugin_id,
            "packageName": (
                blueprint.package_name
            ),
            "migrationTier": (
                blueprint.migration_tier
            ),
            "migrationScore": (
                blueprint.migration_score
            ),
            "copiedFileCount": len(
                copied_files
            ),
            "files": copied_report,
            "contracts": [
                {
                    "type": (
                        contract
                        .contract_type
                    ),
                    "name": contract.name,
                    "sourceModule": (
                        contract
                        .source_module
                    ),
                    "moduleRoot": (
                        Path(
                            self.repository.module(
                                contract.source_module
                            ).source.path
                        ).parent.as_posix()
                    ),
                    "targetPackage": (
                        contract
                        .target_package
                    ),
                    "reason": (
                        contract.reason
                    ),
                }
                for contract
                in blueprint.contracts
            ],
            "dependentUpdates": list(
                blueprint
                .dependent_updates
            ),
            "warnings": list(
                blueprint.warnings
            ),
        }

        readme = (
            f"# {blueprint.manifest['name']} Plugin\n"
            "\n"
            "This workspace was generated by the "
            "PropertyOS Knowledge Engine.\n"
            "\n"
            "## Status\n"
            "\n"
            "- Materialization mode: staged copy\n"
            "- Runtime registration: disabled\n"
            "- Core source deletion: not performed\n"
            "- Import rewriting: not performed\n"
            "\n"
            "## Source Module\n"
            "\n"
            f"`{blueprint.module_id}`\n"
            "\n"
            "## Package\n"
            "\n"
            f"`{blueprint.package_name}`\n"
            "\n"
            "## Next Step\n"
            "\n"
            "Review contracts and imports before "
            "promoting this staged workspace into "
            "the runtime plugin directory.\n"
        ).encode("utf-8")

        return {
            "README.md": readme,
            "extraction-report.json": (
                _json_bytes(
                    extraction_report
                )
            ),
            "package.json": (
                _json_bytes(package_json)
            ),
            "plugin.json": (
                _json_bytes(
                    plugin_manifest
                )
            ),
            "src/index.ts": index_content,
            "tsconfig.json": (
                _json_bytes(tsconfig)
            ),
        }

    def _verify_materialized_files(
        self,
        files: Tuple[
            MaterializedFile,
            ...,
        ],
        workspace: Path,
    ) -> None:
        staged_paths = [
            file.staged_path
            for file in files
        ]

        if len(staged_paths) != len(
            set(staged_paths)
        ):
            raise MaterializationError(
                "Materialization produced duplicate "
                "staged paths."
            )

        for file in files:
            destination = (
                self._safe_destination(
                    workspace,
                    file.staged_path,
                )
            )

            if not destination.is_file():
                raise MaterializationError(
                    "Materialized file is missing: "
                    f"{file.staged_path}"
                )

            actual_hash = _sha256_file(
                destination
            )

            if (
                actual_hash
                != file.staged_sha256
            ):
                raise MaterializationError(
                    "Materialized file hash "
                    "verification failed: "
                    f"{file.staged_path}"
                )

    @staticmethod
    def _rebase_materialized_file(
        file: MaterializedFile,
        old_root: Path,
        new_root: Path,
    ) -> MaterializedFile:
        del old_root
        del new_root

        return file
