from __future__ import annotations

import json
import os
from pathlib import Path, PurePosixPath
from typing import Dict, Tuple

from .blueprint_models import (
    PluginBlueprint,
)
from .materialization_models import (
    MaterializedFile,
)
from .repository_api import Repository


class PluginWorkspaceGenerationError(
    ValueError
):
    pass


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


class PluginWorkspaceGenerator:
    """
    Generate the metadata and build files for a
    staged PropertyOS plugin workspace.

    This component generates content only. It does
    not write files, install dependencies, execute
    TypeScript, or modify the runtime plugin
    registry.
    """

    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
        repository_root: Path,
    ) -> None:
        self.repository = repository
        self.repository_root = (
            repository_root.resolve()
        )

        self.backend_package_path = (
            self.repository_root
            / "backend"
            / "package.json"
        )

        self.contract_package_path = (
            self.repository_root
            / "generated"
            / "contracts"
            / "core-contracts"
        )

    def generate(
        self,
        blueprint: PluginBlueprint,
        copied_files: Tuple[
            MaterializedFile,
            ...,
        ],
        workspace: Path | None = None,
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
            raise (
                PluginWorkspaceGenerationError(
                    "Blueprint contains no "
                    "module file."
                )
            )

        module_target = PurePosixPath(
            module_file.target_path
        )

        plugin_target_root = (
            PurePosixPath(
                blueprint.target_root
            )
        )

        try:
            module_relative = (
                module_target.relative_to(
                    plugin_target_root
                )
            )
        except ValueError as error:
            raise (
                PluginWorkspaceGenerationError(
                    "Blueprint module target is "
                    "outside the plugin target "
                    "root."
                )
            ) from error

        module_import = (
            "./"
            + module_relative
            .with_suffix("")
            .as_posix()
            .removeprefix("src/")
        )

        index_content = (
            f"export {{ "
            f"{blueprint.manifest['moduleClass']} "
            f"}} from '{module_import}';\n"
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

        package_json = (
            self._package_json(
                blueprint=blueprint,
                workspace=workspace,
            )
        )

        tsconfig = self._tsconfig()

        extraction_report = (
            self._extraction_report(
                blueprint=blueprint,
                copied_files=copied_files,
            )
        )

        readme = self._readme(
            blueprint
        )

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

    def _package_json(
        self,
        blueprint: PluginBlueprint,
        workspace: Path | None,
    ) -> dict[str, object]:
        backend_package = (
            self._backend_package_json()
        )

        backend_dependencies = (
            backend_package.get(
                "dependencies",
                {},
            )
        )

        backend_dev_dependencies = (
            backend_package.get(
                "devDependencies",
                {},
            )
        )

        runtime_packages = (
            "@nestjs/common",
            "@nestjs/core",
            "@nestjs/swagger",
            "pg",
            "reflect-metadata",
            "rxjs",
        )

        development_packages = (
            "@types/node",
            "@types/pg",
            "typescript",
        )

        dependencies = {
            package: self._required_version(
                package=package,
                source=backend_dependencies,
                section="dependencies",
            )
            for package in runtime_packages
        }

        dependencies[
            "@propertyos/core-contracts"
        ] = self._contract_dependency(
            workspace
        )

        dev_dependencies = {
            package: self._required_version(
                package=package,
                source=(
                    backend_dev_dependencies
                ),
                section="devDependencies",
            )
            for package
            in development_packages
        }

        return {
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
            "dependencies": dependencies,
            "devDependencies": (
                dev_dependencies
            ),
            "peerDependencies": {
                "@nestjs/common": (
                    dependencies[
                        "@nestjs/common"
                    ]
                ),
                "@nestjs/core": (
                    dependencies[
                        "@nestjs/core"
                    ]
                ),
            },
        }

    def _backend_package_json(
        self,
    ) -> dict[str, object]:
        if not self.backend_package_path.is_file():
            raise (
                PluginWorkspaceGenerationError(
                    "Backend package metadata "
                    "does not exist: "
                    f"{self.backend_package_path}"
                )
            )

        try:
            value = json.loads(
                self.backend_package_path.read_text(
                    encoding="utf-8"
                )
            )
        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            raise (
                PluginWorkspaceGenerationError(
                    "Unable to read backend "
                    "package metadata."
                )
            ) from error

        if not isinstance(value, dict):
            raise (
                PluginWorkspaceGenerationError(
                    "Backend package metadata "
                    "must be a JSON object."
                )
            )

        return value

    def _required_version(
        self,
        package: str,
        source: object,
        section: str,
    ) -> str:
        if not isinstance(source, dict):
            raise (
                PluginWorkspaceGenerationError(
                    "Backend package section "
                    f"{section} must be an object."
                )
            )

        version = source.get(package)

        if (
            not isinstance(version, str)
            or not version.strip()
        ):
            raise (
                PluginWorkspaceGenerationError(
                    "Required backend package "
                    f"{package} is missing from "
                    f"{section}."
                )
            )

        return version

    def _contract_dependency(
        self,
        workspace: Path | None,
    ) -> str:
        if workspace is None:
            workspace = (
                self.repository_root
                / "generated"
                / "plugin-staging"
                / "_placeholder"
            )

        resolved_workspace = workspace.resolve()

        relative = os.path.relpath(
            self.contract_package_path,
            resolved_workspace,
        )

        relative_path = (
            Path(relative).as_posix()
        )

        return f"file:{relative_path}"

    def _tsconfig(
        self,
    ) -> dict[str, object]:
        return {
            "extends": (
                "../../../backend/"
                "tsconfig.json"
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

    def _extraction_report(
        self,
        blueprint: PluginBlueprint,
        copied_files: Tuple[
            MaterializedFile,
            ...,
        ],
    ) -> dict[str, object]:
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

        return {
            "schemaVersion": (
                self.SCHEMA_VERSION
            ),
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

    def _readme(
        self,
        blueprint: PluginBlueprint,
    ) -> bytes:
        return (
            f"# "
            f"{blueprint.manifest['name']} "
            "Plugin\n"
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
