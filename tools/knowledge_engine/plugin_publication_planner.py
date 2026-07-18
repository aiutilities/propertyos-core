from __future__ import annotations

import io
import json
import tarfile
from dataclasses import replace
from pathlib import Path, PurePosixPath
from typing import Callable, Tuple

from .plugin_publication_plan_models import (
    PluginPublicationPlan,
    PublicationBlocker,
    PublicationBlockerCode,
    PublicationDependency,
    PublicationPackage,
    PublicationPackageKind,
    PublicationRegistry,
)


ArtifactMetadataLoader = Callable[
    [Path],
    dict[str, object],
]


class PluginPublicationPlanner:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository_root: Path,
        package_portfolio_path: Path,
        core_contract_root: Path,
        registry_url: str,
        authenticated: bool,
        artifact_metadata_loader: (
            ArtifactMetadataLoader | None
        ) = None,
    ) -> None:
        self.repository_root = (
            repository_root.resolve()
        )
        self.package_portfolio_path = (
            self._safe_path(
                package_portfolio_path,
                "Package portfolio",
            )
        )
        self.core_contract_root = (
            self._safe_path(
                core_contract_root,
                "Core contract root",
            )
        )
        self.registry = PublicationRegistry(
            url=registry_url,
            authenticated=authenticated,
        )
        self.artifact_metadata_loader = (
            artifact_metadata_loader
            or self._tarball_package_metadata
        )

    def plan(
        self,
    ) -> PluginPublicationPlan:
        portfolio = self._json_object(
            self.package_portfolio_path,
            "Plugin package portfolio",
        )

        artifacts = portfolio.get(
            "artifacts"
        )

        if not isinstance(artifacts, list):
            raise ValueError(
                "Plugin package portfolio must "
                "contain an artifacts array."
            )

        packages = [
            self._core_contract_package()
        ]

        packages.extend(
            self._plugin_package(artifact)
            for artifact in artifacts
        )

        ordered = self._ordered_packages(
            tuple(packages)
        )

        propagated = (
            self._propagate_dependency_blockers(
                ordered
            )
        )

        return PluginPublicationPlan(
            schema_version=(
                self.SCHEMA_VERSION
            ),
            registry=self.registry,
            packages=tuple(
                replace(
                    package,
                    order=index,
                )
                for index, package
                in enumerate(propagated)
            ),
        )

    def _core_contract_package(
        self,
    ) -> PublicationPackage:
        path = (
            self.core_contract_root
            / "package.json"
        )

        metadata = self._json_object(
            path,
            "Core contract package",
        )

        package_name = self._string(
            metadata,
            "name",
            "Core contract package name",
        )
        version = self._string(
            metadata,
            "version",
            "Core contract version",
        )

        propertyos = metadata.get(
            "propertyos",
            {},
        )

        if not isinstance(propertyos, dict):
            propertyos = {}

        publishable = bool(
            propertyos.get(
                "publishable",
                True,
            )
        )
        source_strategy = str(
            propertyos.get(
                "sourceStrategy",
                "",
            )
        )

        blockers = []

        if bool(metadata.get("private")):
            blockers.append(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .PRIVATE_PACKAGE
                    ),
                    message=(
                        "Core contract package is "
                        "marked private."
                    ),
                )
            )

        if not publishable:
            blockers.append(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .NON_PUBLISHABLE_PACKAGE
                    ),
                    message=(
                        "Core contract package is "
                        "marked non-publishable."
                    ),
                )
            )

        if source_strategy == (
            "repository-reexport"
        ):
            blockers.append(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .REPOSITORY_BACKED_SOURCE
                    ),
                    message=(
                        "Core contracts re-export "
                        "repository source files."
                    ),
                )
            )

        blockers.append(
            PublicationBlocker(
                code=(
                    PublicationBlockerCode
                    .MISSING_ARTIFACT
                ),
                message=(
                    "No standalone core-contract "
                    "artifact exists."
                ),
            )
        )

        return PublicationPackage(
            package_name=package_name,
            version=version,
            kind=(
                PublicationPackageKind
                .CORE_CONTRACT
            ),
            order=0,
            private=bool(
                metadata.get("private")
            ),
            publishable=publishable,
            blockers=tuple(blockers),
        )

    def _plugin_package(
        self,
        artifact: object,
    ) -> PublicationPackage:
        if not isinstance(artifact, dict):
            raise ValueError(
                "Plugin artifact entry must be "
                "an object."
            )

        package_name = self._string(
            artifact,
            "packageName",
            "Plugin package name",
        )
        version = self._string(
            artifact,
            "version",
            "Plugin package version",
        )
        marketplace_id = self._string(
            artifact,
            "pluginId",
            "Plugin ID",
        )

        artifact_value = artifact.get(
            "artifactPath"
        )

        artifact_path = (
            self._safe_path(
                Path(artifact_value),
                "Plugin artifact",
            )
            if isinstance(
                artifact_value,
                str,
            )
            and artifact_value.strip()
            else None
        )

        blockers = []
        metadata: dict[str, object] = {}

        if (
            artifact_path is None
            or not artifact_path.is_file()
        ):
            blockers.append(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .MISSING_ARTIFACT
                    ),
                    message=(
                        "Plugin artifact is missing."
                    ),
                )
            )
        else:
            metadata = (
                self.artifact_metadata_loader(
                    artifact_path
                )
            )

        private = bool(
            metadata.get("private")
        )

        if private:
            blockers.append(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .PRIVATE_PACKAGE
                    ),
                    message=(
                        "Plugin package is marked "
                        "private."
                    ),
                )
            )

        dependencies = []
        dependency_sections = (
            "dependencies",
            "optionalDependencies",
        )

        for section in dependency_sections:
            values = metadata.get(
                section,
                {},
            )

            if not isinstance(values, dict):
                continue

            for name, dependency_version in (
                values.items()
            ):
                if not str(name).startswith(
                    "@propertyos/"
                ):
                    continue

                version_text = str(
                    dependency_version
                )

                dependencies.append(
                    PublicationDependency(
                        package_name=str(name),
                        version=version_text,
                    )
                )

                if version_text.startswith(
                    "file:"
                ):
                    blockers.append(
                        PublicationBlocker(
                            code=(
                                PublicationBlockerCode
                                .LOCAL_DEPENDENCY
                            ),
                            message=(
                                "Published packages "
                                "cannot use local file "
                                "dependencies."
                            ),
                            dependency=str(name),
                        )
                    )

        dependencies = tuple(
            sorted(
                {
                    dependency.package_name: (
                        dependency
                    )
                    for dependency
                    in dependencies
                }.values(),
                key=lambda item: (
                    item.package_name
                ),
            )
        )

        return PublicationPackage(
            package_name=package_name,
            version=version,
            kind=(
                PublicationPackageKind.PLUGIN
            ),
            order=0,
            dependencies=dependencies,
            artifact_path=(
                self._display_path(
                    artifact_path
                )
                if artifact_path is not None
                else None
            ),
            sha256=str(
                artifact.get("sha256", "")
            ),
            integrity=str(
                artifact.get(
                    "integrity",
                    "",
                )
            ),
            private=private,
            publishable=True,
            blockers=tuple(blockers),
            marketplace_id=marketplace_id,
        )

    def _ordered_packages(
        self,
        packages: Tuple[
            PublicationPackage,
            ...,
        ],
    ) -> Tuple[
        PublicationPackage,
        ...,
    ]:
        by_name = {
            package.package_name: package
            for package in packages
        }

        remaining = set(by_name)
        ordered = []

        while remaining:
            ready = sorted(
                name
                for name in remaining
                if all(
                    dependency.package_name
                    not in remaining
                    for dependency
                    in by_name[
                        name
                    ].dependencies
                    if dependency.package_name
                    in by_name
                )
            )

            if not ready:
                raise ValueError(
                    "Publication dependency graph "
                    "contains a cycle."
                )

            for name in ready:
                ordered.append(
                    by_name[name]
                )
                remaining.remove(name)

        return tuple(ordered)

    @staticmethod
    def _propagate_dependency_blockers(
        packages: Tuple[
            PublicationPackage,
            ...,
        ],
    ) -> Tuple[
        PublicationPackage,
        ...,
    ]:
        resolved = {}

        for package in packages:
            blockers = list(
                package.blockers
            )

            for dependency in (
                package.dependencies
            ):
                target = resolved.get(
                    dependency.package_name
                )

                if (
                    target is not None
                    and target.status.value
                    == "blocked"
                ):
                    blockers.append(
                        PublicationBlocker(
                            code=(
                                PublicationBlockerCode
                                .DEPENDENCY_BLOCKED
                            ),
                            message=(
                                "Publication dependency "
                                "is blocked."
                            ),
                            dependency=(
                                dependency.package_name
                            ),
                        )
                    )

            current = replace(
                package,
                blockers=tuple(blockers),
            )
            resolved[
                current.package_name
            ] = current

        return tuple(
            resolved[
                package.package_name
            ]
            for package in packages
        )

    @staticmethod
    def _tarball_package_metadata(
        path: Path,
    ) -> dict[str, object]:
        try:
            with tarfile.open(
                path,
                mode="r:gz",
            ) as archive:
                stream = archive.extractfile(
                    "package/package.json"
                )

                if stream is None:
                    raise ValueError(
                        "Artifact package.json is "
                        "missing."
                    )

                return json.load(
                    io.TextIOWrapper(
                        stream,
                        encoding="utf-8",
                    )
                )
        except (
            OSError,
            tarfile.TarError,
            json.JSONDecodeError,
        ) as error:
            raise ValueError(
                "Unable to read plugin artifact "
                f"metadata: {path}"
            ) from error

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

    def _safe_path(
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
                f"{label} must remain inside the "
                "repository."
            ) from error

        return resolved

    def _display_path(
        self,
        path: Path,
    ) -> PurePosixPath:
        return PurePosixPath(
            path.resolve().relative_to(
                self.repository_root
            ).as_posix()
        )
