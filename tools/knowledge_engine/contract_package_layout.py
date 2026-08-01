from __future__ import annotations

import re

from pathlib import PurePosixPath
from typing import Dict
from typing import List
from typing import Tuple

from .contract_manifest_models import (
    ContractExport,
)
from .contract_manifest_models import (
    ContractManifestPortfolio,
)
from .contract_package_layout_models import (
    ContractPackageExportLayout,
)
from .contract_package_layout_models import (
    ContractPackageFileLayout,
)
from .contract_package_layout_models import (
    ContractPackageLayoutIssue,
)
from .contract_package_layout_models import (
    ContractPackageLayoutPortfolio,
)
from .contract_package_layout_models import (
    ContractPackageLayoutRequest,
)
from .contract_package_layout_models import (
    ContractPackageModuleLayout,
)
from .contract_package_layout_models import (
    PlannedContractPackage,
)


class ContractPackageLayoutError(
    ValueError
):
    pass


_SAFE_SEGMENT_PATTERN = re.compile(
    r"^[a-z0-9][a-z0-9-]*$"
)


class ContractPackageLayoutPlanner:
    def plan(
        self,
        manifest: ContractManifestPortfolio,
        request: ContractPackageLayoutRequest,
    ) -> ContractPackageLayoutPortfolio:
        self._validate_request(request)

        exports_by_package: Dict[
            Tuple[str, str],
            Dict[
                str,
                Dict[str, ContractExport],
            ],
        ] = {}

        issues: List[
            ContractPackageLayoutIssue
        ] = []

        for plugin_manifest in sorted(
            manifest.manifests,
            key=lambda item: (
                item.module_id,
                item.plugin_id,
                item.workspace_path,
            ),
        ):
            if not plugin_manifest.valid:
                issues.append(
                    ContractPackageLayoutIssue(
                        code=(
                            "INVALID_CONTRACT_MANIFEST"
                        ),
                        message=(
                            "Contract package layout "
                            "cannot consume an invalid "
                            "plugin contract manifest."
                        ),
                    )
                )
                continue

            for package in sorted(
                plugin_manifest.packages,
                key=lambda item: (
                    item.package_name,
                    item.version,
                ),
            ):
                if (
                    request.package_name
                    is not None
                    and package.package_name
                    != request.package_name
                ):
                    continue

                package_key = (
                    package.package_name,
                    package.version,
                )

                modules = (
                    exports_by_package
                    .setdefault(
                        package_key,
                        {},
                    )
                )

                for module in package.modules:
                    symbols = modules.setdefault(
                        module.module_id,
                        {},
                    )

                    for export in module.exports:
                        existing = symbols.get(
                            export.symbol
                        )

                        if existing is None:
                            symbols[
                                export.symbol
                            ] = export
                            continue

                        if existing == export:
                            continue

                        issues.append(
                            ContractPackageLayoutIssue(
                                code=(
                                    "CONFLICTING_EXPORT"
                                ),
                                message=(
                                    "Contract symbol "
                                    f"{export.symbol} has "
                                    "conflicting canonical "
                                    "declarations."
                                ),
                                package_name=(
                                    package.package_name
                                ),
                                module_id=(
                                    module.module_id
                                ),
                                symbol=export.symbol,
                                source_path=(
                                    export.source_path
                                ),
                            )
                        )

        packages = tuple(
            self._plan_package(
                package_name=package_name,
                version=version,
                modules=modules,
                request=request,
                issues=issues,
            )
            for (
                package_name,
                version,
            ), modules in sorted(
                exports_by_package.items(),
                key=lambda item: item[0],
            )
        )

        ordered_issues = tuple(
            sorted(
                issues,
                key=lambda issue: (
                    issue.code,
                    issue.package_name,
                    issue.module_id,
                    issue.symbol,
                    issue.source_path,
                    issue.message,
                ),
            )
        )

        summary = {
            "packageCount": len(packages),
            "moduleCount": sum(
                package.module_count
                for package in packages
            ),
            "symbolCount": sum(
                package.symbol_count
                for package in packages
            ),
            "fileCount": sum(
                package.file_count
                for package in packages
            ),
            "issueCount": len(
                ordered_issues
            ),
            "publishablePackageCount": sum(
                package.publishable
                for package in packages
            ),
            "repositoryBackedPackageCount": (
                sum(
                    not package.publishable
                    for package in packages
                )
            ),
        }

        return ContractPackageLayoutPortfolio(
            schema_version="1.0.0",
            request=request,
            packages=packages,
            issues=ordered_issues,
            summary=summary,
        )

    def _plan_package(
        self,
        package_name: str,
        version: str,
        modules: Dict[
            str,
            Dict[str, ContractExport],
        ],
        request: ContractPackageLayoutRequest,
        issues: List[
            ContractPackageLayoutIssue
        ],
    ) -> PlannedContractPackage:
        package_directory_name = (
            self._package_directory_name(
                package_name
            )
        )

        package_directory = (
            PurePosixPath(
                request.output_root
            )
            / package_directory_name
        )

        used_directories: Dict[
            str,
            str,
        ] = {}

        planned_modules = []

        for module_id, exports in sorted(
            modules.items(),
            key=lambda item: item[0],
        ):
            directory_name = (
                self._module_directory_name(
                    module_id
                )
            )

            existing_module = (
                used_directories.get(
                    directory_name
                )
            )

            if (
                existing_module is not None
                and existing_module
                != module_id
            ):
                issues.append(
                    ContractPackageLayoutIssue(
                        code=(
                            "MODULE_PATH_COLLISION"
                        ),
                        message=(
                            "Contract modules "
                            f"{existing_module} and "
                            f"{module_id} map to the "
                            "same package directory "
                            f"{directory_name}."
                        ),
                        package_name=package_name,
                        module_id=module_id,
                    )
                )
            else:
                used_directories[
                    directory_name
                ] = module_id

            module_exports = tuple(
                ContractPackageExportLayout(
                    symbol=export.symbol,
                    export_kind=(
                        export.export_kind
                    ),
                    source_path=(
                        export.source_path
                    ),
                    module_id=module_id,
                )
                for export in sorted(
                    exports.values(),
                    key=lambda item: (
                        item.symbol,
                        item.source_path,
                        item.export_kind,
                    ),
                )
            )

            planned_modules.append(
                ContractPackageModuleLayout(
                    module_id=module_id,
                    directory_name=(
                        directory_name
                    ),
                    entrypoint_path=(
                        "src/"
                        f"{directory_name}/"
                        "index.ts"
                    ),
                    exports=module_exports,
                )
            )

        planned_modules_tuple = tuple(
            planned_modules
        )

        files = (
            ContractPackageFileLayout(
                path="package.json",
                file_kind=(
                    "package-metadata"
                ),
            ),
            ContractPackageFileLayout(
                path="tsconfig.json",
                file_kind=(
                    "typescript-config"
                ),
            ),
            ContractPackageFileLayout(
                path="src/index.ts",
                file_kind=(
                    "root-entrypoint"
                ),
            ),
            *(
                (
                    ContractPackageFileLayout(
                        path="src/host-runtime.ts",
                        file_kind=(
                            "host-runtime-bridge"
                        ),
                    ),
                )
                if request.source_strategy
                == "portable-facade"
                else ()
            ),
            *(
                ContractPackageFileLayout(
                    path=module.entrypoint_path,
                    file_kind=(
                        "module-entrypoint"
                    ),
                )
                for module
                in planned_modules_tuple
            ),
        )

        return PlannedContractPackage(
            package_name=package_name,
            version=version,
            package_directory=(
                package_directory.as_posix()
            ),
            root_entrypoint_path=(
                "src/index.ts"
            ),
            source_strategy=(
                request.source_strategy
            ),
            publishable=request.publishable,
            modules=planned_modules_tuple,
            files=tuple(
                sorted(
                    files,
                    key=lambda file: (
                        file.path,
                        file.file_kind,
                    ),
                )
            ),
        )

    @staticmethod
    def _validate_request(
        request: ContractPackageLayoutRequest,
    ) -> None:
        output_root = PurePosixPath(
            request.output_root
        )

        if (
            output_root.is_absolute()
            or ".." in output_root.parts
            or request.output_root.strip()
            in ("", ".")
        ):
            raise ContractPackageLayoutError(
                "output_root must be a safe "
                "repository-relative directory."
            )

        if request.source_strategy not in (
            "repository-reexport",
            "portable-facade",
        ):
            raise ContractPackageLayoutError(
                "Unsupported contract package "
                "source strategy: "
                f"{request.source_strategy}"
            )

        if (
            request.package_name is not None
            and not request.package_name.strip()
        ):
            raise ContractPackageLayoutError(
                "package_name cannot be empty."
            )

    @staticmethod
    def _package_directory_name(
        package_name: str,
    ) -> str:
        value = (
            package_name
            .strip()
            .split("/")[-1]
            .lower()
        )

        value = re.sub(
            r"[^a-z0-9]+",
            "-",
            value,
        ).strip("-")

        if not value:
            raise ContractPackageLayoutError(
                "Unable to derive a package "
                "directory name from "
                f"{package_name!r}."
            )

        return value

    @staticmethod
    def _module_directory_name(
        module_id: str,
    ) -> str:
        value = re.sub(
            r"[^a-z0-9]+",
            "-",
            module_id.strip().lower(),
        ).strip("-")

        if (
            not value
            or not _SAFE_SEGMENT_PATTERN
            .fullmatch(value)
        ):
            raise ContractPackageLayoutError(
                "Unable to derive a safe module "
                "directory from "
                f"{module_id!r}."
            )

        return value
