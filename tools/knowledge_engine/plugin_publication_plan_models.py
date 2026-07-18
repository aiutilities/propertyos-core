from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import PurePosixPath
from typing import Any, Optional, Tuple


class PublicationPlanError(
    ValueError
):
    pass


class PublicationPackageKind(
    str,
    Enum,
):
    CORE_CONTRACT = "core-contract"
    PLUGIN = "plugin"


class PublicationBlockerCode(
    str,
    Enum,
):
    PRIVATE_PACKAGE = "private-package"
    NON_PUBLISHABLE_PACKAGE = (
        "non-publishable-package"
    )
    REPOSITORY_BACKED_SOURCE = (
        "repository-backed-source"
    )
    MISSING_ARTIFACT = "missing-artifact"
    LOCAL_DEPENDENCY = "local-dependency"
    DEPENDENCY_BLOCKED = "dependency-blocked"
    REGISTRY_AUTHENTICATION_REQUIRED = (
        "registry-authentication-required"
    )


class PublicationBlockerSeverity(
    str,
    Enum,
):
    ERROR = "error"
    WARNING = "warning"


class PublicationPackageStatus(
    str,
    Enum,
):
    READY = "ready"
    BLOCKED = "blocked"


@dataclass(frozen=True)
class PublicationDependency:
    package_name: str
    version: str

    def __post_init__(self) -> None:
        if not self.package_name.strip():
            raise PublicationPlanError(
                "Dependency package name cannot "
                "be empty."
            )

        if not self.version.strip():
            raise PublicationPlanError(
                "Dependency version cannot be "
                "empty."
            )

    def to_dict(
        self,
    ) -> dict[str, str]:
        return {
            "packageName": self.package_name,
            "version": self.version,
        }


@dataclass(frozen=True)
class PublicationBlocker:
    code: PublicationBlockerCode
    message: str
    severity: PublicationBlockerSeverity = (
        PublicationBlockerSeverity.ERROR
    )
    dependency: str = ""

    def __post_init__(self) -> None:
        if not self.message.strip():
            raise PublicationPlanError(
                "Publication blocker message "
                "cannot be empty."
            )

    def to_dict(
        self,
    ) -> dict[str, str]:
        return {
            "code": self.code.value,
            "severity": self.severity.value,
            "message": self.message,
            "dependency": self.dependency,
        }


@dataclass(frozen=True)
class PublicationPackage:
    package_name: str
    version: str
    kind: PublicationPackageKind
    order: int
    dependencies: Tuple[
        PublicationDependency,
        ...,
    ] = ()
    artifact_path: Optional[
        PurePosixPath
    ] = None
    sha256: str = ""
    integrity: str = ""
    private: bool = False
    publishable: bool = True
    blockers: Tuple[
        PublicationBlocker,
        ...,
    ] = ()
    marketplace_id: str = ""

    def __post_init__(self) -> None:
        if not self.package_name.strip():
            raise PublicationPlanError(
                "Publication package name cannot "
                "be empty."
            )

        if not self.version.strip():
            raise PublicationPlanError(
                "Publication package version "
                "cannot be empty."
            )

        if self.order < 0:
            raise PublicationPlanError(
                "Publication order cannot be "
                "negative."
            )

        dependency_names = tuple(
            dependency.package_name
            for dependency in self.dependencies
        )

        if len(set(dependency_names)) != len(
            dependency_names
        ):
            raise PublicationPlanError(
                "Publication dependencies must "
                "be unique."
            )

        if self.status == (
            PublicationPackageStatus.READY
        ):
            if self.artifact_path is None:
                raise PublicationPlanError(
                    "A ready publication package "
                    "requires an artifact."
                )

            if not self.sha256.strip():
                raise PublicationPlanError(
                    "A ready publication package "
                    "requires a SHA-256 checksum."
                )

            if not self.integrity.strip():
                raise PublicationPlanError(
                    "A ready publication package "
                    "requires integrity metadata."
                )

    @property
    def status(
        self,
    ) -> PublicationPackageStatus:
        has_error = any(
            blocker.severity
            == PublicationBlockerSeverity.ERROR
            for blocker in self.blockers
        )

        if (
            self.private
            or not self.publishable
            or has_error
        ):
            return (
                PublicationPackageStatus.BLOCKED
            )

        return PublicationPackageStatus.READY

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "packageName": self.package_name,
            "version": self.version,
            "kind": self.kind.value,
            "order": self.order,
            "status": self.status.value,
            "dependencies": [
                dependency.to_dict()
                for dependency
                in self.dependencies
            ],
            "artifactPath": (
                self.artifact_path.as_posix()
                if self.artifact_path
                is not None
                else None
            ),
            "sha256": self.sha256,
            "integrity": self.integrity,
            "private": self.private,
            "publishable": self.publishable,
            "blockers": [
                blocker.to_dict()
                for blocker in self.blockers
            ],
            "marketplaceId": (
                self.marketplace_id
            ),
        }


@dataclass(frozen=True)
class PublicationRegistry:
    url: str
    authenticated: bool
    access: str = "public"
    tag: str = "latest"

    def __post_init__(self) -> None:
        if not self.url.strip():
            raise PublicationPlanError(
                "Registry URL cannot be empty."
            )

        if self.access not in (
            "public",
            "restricted",
        ):
            raise PublicationPlanError(
                "Registry access must be public "
                "or restricted."
            )

        if not self.tag.strip():
            raise PublicationPlanError(
                "Registry tag cannot be empty."
            )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "url": self.url,
            "authenticated": (
                self.authenticated
            ),
            "access": self.access,
            "tag": self.tag,
        }


@dataclass(frozen=True)
class PluginPublicationPlan:
    schema_version: str
    registry: PublicationRegistry
    packages: Tuple[
        PublicationPackage,
        ...,
    ]

    def __post_init__(self) -> None:
        if not self.schema_version.strip():
            raise PublicationPlanError(
                "Publication plan schema version "
                "cannot be empty."
            )

        names = tuple(
            package.package_name
            for package in self.packages
        )

        if len(set(names)) != len(names):
            raise PublicationPlanError(
                "Publication package names must "
                "be unique."
            )

        orders = tuple(
            package.order
            for package in self.packages
        )

        if len(set(orders)) != len(orders):
            raise PublicationPlanError(
                "Publication order values must "
                "be unique."
            )

        if orders != tuple(sorted(orders)):
            raise PublicationPlanError(
                "Publication packages must be "
                "sorted by order."
            )

    @property
    def ready_count(
        self,
    ) -> int:
        return sum(
            package.status
            == PublicationPackageStatus.READY
            for package in self.packages
        )

    @property
    def blocked_count(
        self,
    ) -> int:
        return sum(
            package.status
            == PublicationPackageStatus.BLOCKED
            for package in self.packages
        )

    @property
    def blocker_count(
        self,
    ) -> int:
        return sum(
            len(package.blockers)
            for package in self.packages
        ) + (
            0
            if self.registry.authenticated
            else 1
        )

    @property
    def ready_to_publish(
        self,
    ) -> bool:
        return (
            bool(self.packages)
            and self.registry.authenticated
            and self.blocked_count == 0
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        registry_blockers = []

        if not self.registry.authenticated:
            registry_blockers.append(
                {
                    "code": (
                        PublicationBlockerCode
                        .REGISTRY_AUTHENTICATION_REQUIRED
                        .value
                    ),
                    "severity": (
                        PublicationBlockerSeverity
                        .ERROR
                        .value
                    ),
                    "message": (
                        "Registry authentication "
                        "is required before "
                        "publication."
                    ),
                    "dependency": "",
                }
            )

        return {
            "schemaVersion": (
                self.schema_version
            ),
            "registry": (
                self.registry.to_dict()
            ),
            "registryBlockers": (
                registry_blockers
            ),
            "packages": [
                package.to_dict()
                for package in self.packages
            ],
            "summary": {
                "packageCount": len(
                    self.packages
                ),
                "readyCount": self.ready_count,
                "blockedCount": (
                    self.blocked_count
                ),
                "blockerCount": (
                    self.blocker_count
                ),
                "readyToPublish": (
                    self.ready_to_publish
                ),
            },
        }
