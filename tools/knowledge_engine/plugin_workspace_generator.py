from __future__ import annotations

import json
import os
import re
from pathlib import Path, PurePosixPath
from typing import Dict, Tuple

from .blueprint_models import (
    PluginBlueprint,
)
from .materialization_models import (
    MaterializedFile,
)
from .import_analyzer import (
    NODE_BUILTINS,
)
from .repository_api import Repository
from .test_source_policy import is_test_source


class PluginWorkspaceGenerationError(
    ValueError
):
    pass


_PACKAGE_SPECIFIER_PATTERN = re.compile(
    r"""(?:from\s+|require\(\s*)"""
    r"""['"]([^'"]+)['"]"""
)


_CROSS_MODULE_IMPORT_PATTERN = re.compile(
    r"""
    import
    \s+
    (?P<body>[^;]*?)
    \s+
    from
    \s*
    ['"]
    (?P<specifier>[^'"]+)
    ['"]
    \s*;
    """,
    re.VERBOSE,
)


def _package_root(
    specifier: str,
) -> str:
    if specifier.startswith("@"):
        parts = specifier.split("/")

        if len(parts) >= 2:
            return "/".join(parts[:2])

    return specifier.split("/", 1)[0]


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
            (
                f"export {{ "
                f"{blueprint.manifest['moduleClass']} "
                f"}} from '{module_import}';\n"
            )
            + self._plugin_contract_surface(
                blueprint
            )
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

        for package in (
            self._external_packages(
                blueprint
            )
        ):
            if package in dependencies:
                continue

            if package in backend_dependencies:
                dependencies[package] = (
                    self._required_version(
                        package=package,
                        source=(
                            backend_dependencies
                        ),
                        section="dependencies",
                    )
                )

            elif package in (
                backend_dev_dependencies
            ):
                dev_dependencies[package] = (
                    self._required_version(
                        package=package,
                        source=(
                            backend_dev_dependencies
                        ),
                        section=(
                            "devDependencies"
                        ),
                    )
                )

            else:
                raise (
                    PluginWorkspaceGenerationError(
                        "Imported external package "
                        f"{package} is not declared "
                        "by the backend package."
                    )
                )

            type_package = (
                self._type_package(package)
            )

            if (
                type_package
                in backend_dev_dependencies
            ):
                dev_dependencies[
                    type_package
                ] = self._required_version(
                    package=type_package,
                    source=(
                        backend_dev_dependencies
                    ),
                    section="devDependencies",
                )

        for contract in blueprint.contracts:
            if (
                contract.contract_type
                != "plugin-contract"
            ):
                continue

            dependencies[
                contract.target_package
            ] = self._plugin_dependency(
                workspace=workspace,
                package_name=(
                    contract.target_package
                ),
            )

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

    def _plugin_contract_surface(
        self,
        blueprint: PluginBlueprint,
    ) -> str:
        """
        Expose symbols imported across plugin module
        boundaries through the owning plugin's public
        entry point.

        The source backend remains authoritative. This
        method does not modify backend barrels or infer
        exports from rewritten package imports.
        """
        module_root = self._module_root(
            blueprint.module_id
        )

        source_root = (
            self.repository_root
            / "backend"
            / "src"
        )

        exports: dict[
            tuple[str, bool],
            set[str],
        ] = {}

        for consumer in sorted(
            source_root.rglob("*.ts")
        ):
            try:
                consumer.relative_to(
                    module_root
                )
            except ValueError:
                pass
            else:
                continue

            try:
                content = consumer.read_text(
                    encoding="utf-8"
                )
            except (
                OSError,
                UnicodeDecodeError,
            ):
                continue

            for match in (
                _CROSS_MODULE_IMPORT_PATTERN
                .finditer(content)
            ):
                specifier = match.group(
                    "specifier"
                )

                source_file = (
                    self._resolve_typescript_import(
                        consumer=consumer,
                        specifier=specifier,
                    )
                )

                if source_file is None:
                    continue

                try:
                    source_file.relative_to(
                        module_root
                    )
                except ValueError:
                    continue

                for symbol in (
                    self._named_import_symbols(
                        match.group("body")
                    )
                ):
                    if symbol == (
                        blueprint.manifest[
                            "moduleClass"
                        ]
                    ):
                        continue

                    declaration = (
                        self._symbol_declaration(
                            module_root=module_root,
                            preferred_file=(
                                source_file
                            ),
                            symbol=symbol,
                        )
                    )

                    if declaration is None:
                        continue

                    declaration_file, type_only = (
                        declaration
                    )

                    relative = (
                        declaration_file
                        .relative_to(module_root)
                        .with_suffix("")
                        .as_posix()
                    )

                    exports.setdefault(
                        (relative, type_only),
                        set(),
                    ).add(symbol)

        lines = []

        for (
            relative,
            type_only,
        ), symbols in sorted(
            exports.items(),
            key=lambda item: (
                item[0][0],
                item[0][1],
            ),
        ):
            keyword = (
                "export type"
                if type_only
                else "export"
            )

            lines.append(
                f"{keyword} {{ "
                + ", ".join(sorted(symbols))
                + f" }} from './{relative}';"
            )

        if not lines:
            return ""

        return "".join(
            f"{line}\n"
            for line in lines
        )

    def _module_root(
        self,
        module_id: str,
    ) -> Path:
        module = self.repository.module(
            module_id
        )

        root = Path(module.source.path)

        if not root.is_absolute():
            root = (
                self.repository_root
                / root
            )

        root = root.resolve()

        if root.is_file():
            root = root.parent

        return root

    @staticmethod
    def _named_import_symbols(
        body: str,
    ) -> Tuple[str, ...]:
        match = re.search(
            r"\{([\s\S]*?)\}",
            body,
        )

        if match is None:
            return ()

        symbols = set()

        for item in match.group(1).split(","):
            item = item.strip()

            if not item:
                continue

            item = re.sub(
                r"^type\s+",
                "",
                item,
            ).strip()

            if " as " in item:
                item = item.split(
                    " as ",
                    1,
                )[0].strip()

            if re.fullmatch(
                r"[A-Za-z_$][\w$]*",
                item,
            ):
                symbols.add(item)

        return tuple(sorted(symbols))

    @staticmethod
    def _resolve_typescript_import(
        consumer: Path,
        specifier: str,
    ) -> Path | None:
        if not specifier.startswith("."):
            return None

        base = (
            consumer.parent
            / specifier
        )

        candidates = (
            base,
            Path(str(base) + ".ts"),
            base / "index.ts",
        )

        for candidate in candidates:
            candidate = candidate.resolve()

            if candidate.is_file():
                return candidate

        return None

    def _symbol_declaration(
        self,
        module_root: Path,
        preferred_file: Path,
        symbol: str,
    ) -> tuple[Path, bool] | None:
        direct = self._declaration_kind(
            preferred_file,
            symbol,
        )

        if direct is not None:
            return preferred_file, direct

        matches = []

        for source_file in sorted(
            module_root.rglob("*.ts")
        ):
            kind = self._declaration_kind(
                source_file,
                symbol,
            )

            if kind is not None:
                matches.append(
                    (source_file, kind)
                )

        if len(matches) != 1:
            return None

        return matches[0]

    @staticmethod
    def _declaration_kind(
        source_file: Path,
        symbol: str,
    ) -> bool | None:
        try:
            content = source_file.read_text(
                encoding="utf-8"
            )
        except (
            OSError,
            UnicodeDecodeError,
        ):
            return None

        escaped = re.escape(symbol)

        type_pattern = re.compile(
            r"\bexport\s+(?:declare\s+)?"
            r"(?:interface|type)\s+"
            + escaped
            + r"\b"
        )

        if type_pattern.search(content):
            return True

        value_pattern = re.compile(
            r"\bexport\s+(?:default\s+)?"
            r"(?:declare\s+)?"
            r"(?:abstract\s+)?"
            r"(?:class|const|let|var|function|"
            r"enum|namespace)\s+"
            + escaped
            + r"\b"
        )

        if value_pattern.search(content):
            return False

        return None

    def _external_packages(
        self,
        blueprint: PluginBlueprint,
    ) -> Tuple[str, ...]:
        module = self.repository.module(
            blueprint.module_id
        )

        module_root = Path(
            module.source.path
        )

        if not module_root.is_absolute():
            module_root = (
                self.repository_root
                / module_root
            )

        if module_root.is_file():
            module_root = module_root.parent

        packages = set()

        for source_file in sorted(
            module_root.rglob("*.ts")
        ):
            if is_test_source(source_file):
                continue

            try:
                content = source_file.read_text(
                    encoding="utf-8"
                )
            except (
                OSError,
                UnicodeDecodeError,
            ):
                continue

            for specifier in (
                _PACKAGE_SPECIFIER_PATTERN
                .findall(content)
            ):
                if specifier.startswith(
                    (
                        ".",
                        "/",
                        "node:",
                        "@propertyos/",
                    )
                ):
                    continue

                package = _package_root(
                    specifier
                )

                if (
                    package
                    and package
                    not in NODE_BUILTINS
                ):
                    packages.add(package)

        return tuple(sorted(packages))

    @staticmethod
    def _type_package(
        package: str,
    ) -> str:
        if package.startswith("@"):
            scope, name = package.split(
                "/",
                1,
            )

            return (
                "@types/"
                + scope.removeprefix("@")
                + "__"
                + name
            )

        return "@types/" + package

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

    def _plugin_dependency(
        self,
        workspace: Path | None,
        package_name: str,
    ) -> str:
        prefix = "@propertyos/plugin-"

        if not package_name.startswith(
            prefix
        ):
            raise (
                PluginWorkspaceGenerationError(
                    "Unsupported plugin contract "
                    f"package: {package_name}"
                )
            )

        plugin_id = package_name[
            len(prefix):
        ]

        if not plugin_id:
            raise (
                PluginWorkspaceGenerationError(
                    "Plugin contract package has "
                    "no plugin ID."
                )
            )

        if workspace is None:
            workspace = (
                self.repository_root
                / "generated"
                / "plugin-staging"
                / "_placeholder"
            )

        resolved_workspace = (
            workspace.resolve()
        )

        target_workspace = (
            resolved_workspace.parent
            / plugin_id
        ).resolve()

        relative = os.path.relpath(
            target_workspace,
            resolved_workspace,
        )

        return (
            "file:"
            + Path(relative).as_posix()
        )

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
