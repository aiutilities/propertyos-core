from __future__ import annotations

import hashlib
import json
import os

from pathlib import Path
from pathlib import PurePosixPath
from typing import Dict
from typing import List
from typing import Tuple

from .contract_package_generator_models import (
    ContractPackageGenerationIssue,
)
from .contract_package_generator_models import (
    ContractPackageGenerationPortfolio,
)
from .contract_package_generator_models import (
    ContractPackageGenerationRequest,
)
from .contract_package_generator_models import (
    GeneratedContractPackage,
)
from .contract_package_generator_models import (
    GeneratedContractPackageFile,
)
from .contract_package_layout_models import (
    ContractPackageLayoutPortfolio,
)
from .contract_package_layout_models import (
    ContractPackageModuleLayout,
)
from .contract_package_layout_models import (
    PlannedContractPackage,
)


class ContractPackageGenerationError(
    ValueError
):
    pass


_TYPE_ONLY_EXPORT_KINDS = frozenset(
    (
        "interface",
        "type",
    )
)


def _sha256(content: bytes) -> str:
    return hashlib.sha256(
        content
    ).hexdigest()


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


class ContractPackageGenerator:
    def __init__(
        self,
        repository_root: Path,
    ) -> None:
        self._repository_root = (
            repository_root.resolve()
        )

    def generate(
        self,
        layout: ContractPackageLayoutPortfolio,
        request: ContractPackageGenerationRequest,
    ) -> ContractPackageGenerationPortfolio:
        if not layout.valid:
            raise ContractPackageGenerationError(
                "Cannot generate contract "
                "packages from an invalid layout."
            )

        packages = []
        issues: List[
            ContractPackageGenerationIssue
        ] = []

        for package in layout.packages:
            try:
                generated = (
                    self._generate_package(
                        package=package,
                        request=request,
                    )
                )
            except (
                ContractPackageGenerationError,
                OSError,
            ) as error:
                issues.append(
                    ContractPackageGenerationIssue(
                        code=(
                            "PACKAGE_GENERATION_FAILED"
                        ),
                        message=str(error),
                        package_name=(
                            package.package_name
                        ),
                        path=(
                            package.package_directory
                        ),
                    )
                )
                continue

            packages.append(generated)

        ordered_packages = tuple(
            sorted(
                packages,
                key=lambda item: (
                    item.package_name,
                    item.version,
                    item.package_directory,
                ),
            )
        )

        ordered_issues = tuple(
            sorted(
                issues,
                key=lambda issue: (
                    issue.code,
                    issue.package_name,
                    issue.path,
                    issue.message,
                ),
            )
        )

        summary = {
            "packageCount": len(
                ordered_packages
            ),
            "fileCount": sum(
                package.file_count
                for package
                in ordered_packages
            ),
            "writtenFileCount": sum(
                package.written_file_count
                for package
                in ordered_packages
            ),
            "issueCount": len(
                ordered_issues
            ),
            "validPackageCount": sum(
                package.valid
                for package
                in ordered_packages
            ),
            "invalidPackageCount": (
                len(ordered_packages)
                - sum(
                    package.valid
                    for package
                    in ordered_packages
                )
            ),
        }

        return ContractPackageGenerationPortfolio(
            schema_version="1.0.0",
            request=request,
            packages=ordered_packages,
            issues=ordered_issues,
            summary=summary,
        )

    def _generate_package(
        self,
        package: PlannedContractPackage,
        request: ContractPackageGenerationRequest,
    ) -> GeneratedContractPackage:
        package_directory = (
            self._safe_repository_path(
                package.package_directory
            )
        )

        content_by_path = (
            self._package_content(
                package=package,
            )
        )

        generated_files = []

        for file_layout in package.files:
            relative_path = (
                PurePosixPath(
                    file_layout.path
                )
            )

            if (
                relative_path.is_absolute()
                or ".."
                in relative_path.parts
            ):
                raise (
                    ContractPackageGenerationError(
                        "Unsafe generated package "
                        f"path: {file_layout.path}"
                    )
                )

            content = content_by_path.get(
                file_layout.path
            )

            if content is None:
                raise (
                    ContractPackageGenerationError(
                        "No generated content for "
                        f"{file_layout.path}."
                    )
                )

            destination = (
                package_directory
                / Path(*relative_path.parts)
            )

            written = False

            if request.apply:
                written = self._write_file(
                    destination=destination,
                    content=content,
                    overwrite=(
                        request.overwrite
                    ),
                )

            generated_files.append(
                GeneratedContractPackageFile(
                    path=file_layout.path,
                    file_kind=(
                        file_layout.file_kind
                    ),
                    sha256=_sha256(content),
                    size_bytes=len(content),
                    written=written,
                )
            )

        return GeneratedContractPackage(
            package_name=package.package_name,
            version=package.version,
            package_directory=(
                package.package_directory
            ),
            source_strategy=(
                package.source_strategy
            ),
            publishable=(
                package.publishable
            ),
            files=tuple(
                sorted(
                    generated_files,
                    key=lambda item: (
                        item.path,
                        item.file_kind,
                    ),
                )
            ),
            valid=True,
        )

    def _package_content(
        self,
        package: PlannedContractPackage,
    ) -> Dict[str, bytes]:
        content: Dict[str, bytes] = {}

        package_json = {
            "name": package.package_name,
            "version": package.version,
            "private": True,
            "description": (
                "Generated PropertyOS "
                "repository-backed contract facade."
            ),
            "sideEffects": False,
            "types": "./src/index.ts",
            "exports": {
                ".": {
                    "types": "./src/index.ts",
                    "default": "./src/index.ts",
                },
                **{
                    (
                        "./"
                        f"{module.directory_name}"
                    ): {
                        "types": (
                            "./"
                            f"{module.entrypoint_path}"
                        ),
                        "default": (
                            "./"
                            f"{module.entrypoint_path}"
                        ),
                    }
                    for module
                    in package.modules
                },
            },
            "propertyos": {
                "generated": True,
                "sourceStrategy": (
                    package.source_strategy
                ),
                "publishable": (
                    package.publishable
                ),
            },
        }

        tsconfig = {
            "extends": (
                "../../../backend/"
                "tsconfig.json"
            ),
            "compilerOptions": {
                "declaration": True,
                "noEmit": True,
                "rootDir": "../../../",
                "typeRoots": [
                    "../../../backend/"
                    "node_modules/@types",
                ],
            },
            "include": [
                "src/**/*.ts",
            ],
        }

        content["package.json"] = (
            _json_bytes(package_json)
        )

        content["tsconfig.json"] = (
            _json_bytes(tsconfig)
        )

        root_lines = [
            (
                "/* This file is generated. "
                "Do not edit manually. */"
            ),
            "",
        ]

        for module in package.modules:
            root_lines.append(
                "export * from "
                f'"./{module.directory_name}";'
            )

        content[
            package.root_entrypoint_path
        ] = (
            "\n".join(root_lines)
            + "\n"
        ).encode("utf-8")

        for module in package.modules:
            content[
                module.entrypoint_path
            ] = self._module_entrypoint(
                package=package,
                module=module,
            )

        return content

    def _module_entrypoint(
        self,
        package: PlannedContractPackage,
        module: ContractPackageModuleLayout,
    ) -> bytes:
        package_entrypoint = (
            PurePosixPath(
                package.package_directory
            )
            / module.entrypoint_path
        )

        entrypoint_directory = (
            package_entrypoint.parent
        )

        exports_by_source: Dict[
            str,
            Dict[str, List[str]],
        ] = {}

        for export in module.exports:
            export_group = (
                exports_by_source
                .setdefault(
                    export.source_path,
                    {
                        "runtime": [],
                        "type": [],
                    },
                )
            )

            group_name = (
                "type"
                if export.export_kind
                in _TYPE_ONLY_EXPORT_KINDS
                else "runtime"
            )

            export_group[
                group_name
            ].append(export.symbol)

        lines = [
            (
                "/* This file is generated. "
                "Do not edit manually. */"
            ),
            "",
        ]

        for source_path, groups in sorted(
            exports_by_source.items(),
            key=lambda item: item[0],
        ):
            source_without_suffix = (
                source_path[:-3]
                if source_path.endswith(".ts")
                else source_path
            )

            relative_source = os.path.relpath(
                source_without_suffix,
                start=(
                    entrypoint_directory
                    .as_posix()
                ),
            ).replace(
                os.sep,
                "/",
            )

            if not relative_source.startswith(
                "."
            ):
                relative_source = (
                    "./" + relative_source
                )

            runtime_symbols = sorted(
                set(groups["runtime"])
            )

            type_symbols = sorted(
                set(groups["type"])
            )

            if runtime_symbols:
                lines.extend(
                    self._named_export_lines(
                        symbols=runtime_symbols,
                        source=relative_source,
                        type_only=False,
                    )
                )

            if type_symbols:
                lines.extend(
                    self._named_export_lines(
                        symbols=type_symbols,
                        source=relative_source,
                        type_only=True,
                    )
                )

        return (
            "\n".join(lines)
            + "\n"
        ).encode("utf-8")

    @staticmethod
    def _named_export_lines(
        symbols: List[str],
        source: str,
        type_only: bool,
    ) -> List[str]:
        prefix = (
            "export type"
            if type_only
            else "export"
        )

        if len(symbols) == 1:
            return [
                (
                    f"{prefix} "
                    f"{{ {symbols[0]} }} "
                    f'from "{source}";'
                )
            ]

        lines = [
            f"{prefix} {{",
        ]

        lines.extend(
            f"  {symbol},"
            for symbol in symbols
        )

        lines.append(
            f'}} from "{source}";'
        )

        return lines

    def _safe_repository_path(
        self,
        relative_path: str,
    ) -> Path:
        candidate = (
            self._repository_root
            / relative_path
        ).resolve()

        try:
            candidate.relative_to(
                self._repository_root
            )
        except ValueError as error:
            raise (
                ContractPackageGenerationError(
                    "Generated package path "
                    "escapes repository root: "
                    f"{relative_path}"
                )
            ) from error

        return candidate

    @staticmethod
    def _write_file(
        destination: Path,
        content: bytes,
        overwrite: bool,
    ) -> bool:
        if destination.exists():
            existing = destination.read_bytes()

            if existing == content:
                return False

            if not overwrite:
                raise (
                    ContractPackageGenerationError(
                        "Refusing to overwrite "
                        "different generated file "
                        f"without overwrite=true: "
                        f"{destination}"
                    )
                )

        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        destination.write_bytes(content)

        return True
