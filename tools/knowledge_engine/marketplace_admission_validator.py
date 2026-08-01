from __future__ import annotations

import hashlib
import re

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Sequence, Tuple

from packaging.specifiers import (
    InvalidSpecifier,
    SpecifierSet,
)
from packaging.version import (
    InvalidVersion,
    Version,
)

from .native_schema_validator import (
    NativeSchemaIssue,
    NativeSchemaValidator,
)


@dataclass(frozen=True)
class MarketplaceAdmissionIssue:
    code: str
    path: str
    message: str

    def sort_key(
        self,
    ) -> tuple[str, str, str]:
        return (
            self.path,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceAdmissionRequest:
    manifest: Mapping[str, Any]
    active_host_api_version: str
    active_node_version: str
    available_contract_versions: Mapping[
        str,
        str,
    ]
    available_plugin_versions: Mapping[
        str,
        str,
    ]
    installed_plugin_versions: Mapping[
        str,
        str,
    ]
    trusted_publishers: Mapping[
        str,
        Tuple[str, ...],
    ]
    archive_path: Path | None = None
    allow_downgrade: bool = False


@dataclass(frozen=True)
class MarketplaceAdmissionDecision:
    accepted: bool
    issues: Tuple[
        MarketplaceAdmissionIssue,
        ...,
    ]

    @property
    def decision(
        self,
    ) -> str:
        return (
            "ACCEPT"
            if self.accepted
            else "REJECT"
        )


class MarketplaceAdmissionValidator:
    _ENTRYPOINT_PATTERN = re.compile(
        r"^dist/[A-Za-z0-9_./-]+\.js$"
    )

    _PERMISSION_PATTERN = re.compile(
        r"^[a-z][a-z0-9-]*:"
        r"[a-z][a-z0-9-]*$"
    )

    _PLUGIN_ID_PATTERN = re.compile(
        r"^[a-z][a-z0-9-]{1,63}$"
    )

    def __init__(
        self,
        schema_path: Path,
    ) -> None:
        self._schema_validator = (
            NativeSchemaValidator
            .from_path(
                schema_path
            )
        )

    def evaluate(
        self,
        request: MarketplaceAdmissionRequest,
    ) -> MarketplaceAdmissionDecision:
        issues: list[
            MarketplaceAdmissionIssue
        ] = []

        manifest = dict(
            request.manifest
        )

        self._schema_issues(
            manifest,
            issues,
        )

        if issues:
            return self._decision(
                issues
            )

        self._host_api(
            manifest,
            request,
            issues,
        )

        self._node_version(
            manifest,
            request,
            issues,
        )

        self._contracts(
            manifest,
            request,
            issues,
        )

        self._dependencies(
            manifest,
            request,
            issues,
        )

        self._publisher_trust(
            manifest,
            request,
            issues,
        )

        self._integrity(
            manifest,
            request,
            issues,
        )

        self._entrypoints(
            manifest,
            issues,
        )

        self._permissions(
            manifest,
            issues,
        )

        self._version_transition(
            manifest,
            request,
            issues,
        )

        return self._decision(
            issues
        )

    def require_admitted(
        self,
        request: MarketplaceAdmissionRequest,
    ) -> MarketplaceAdmissionDecision:
        decision = self.evaluate(
            request
        )

        if not decision.accepted:
            raise ValueError(
                "; ".join(
                    (
                        f"{issue.path}: "
                        f"{issue.code}: "
                        f"{issue.message}"
                    )
                    for issue
                    in decision.issues
                )
            )

        return decision

    @staticmethod
    def archive_sha256(
        path: Path,
    ) -> str:
        digest = hashlib.sha256()

        with path.open("rb") as stream:
            for block in iter(
                lambda: stream.read(
                    1024 * 1024
                ),
                b"",
            ):
                digest.update(block)

        return digest.hexdigest()

    def _schema_issues(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        for issue in (
            self._schema_validator
            .validate(
                manifest
            )
        ):
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "SCHEMA_"
                        + issue.code
                    ),
                    path=issue.path,
                    message=issue.message,
                )
            )

    def _host_api(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        request: MarketplaceAdmissionRequest,
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        host_api = (
            manifest["engine"][
                "hostApi"
            ]
        )

        try:
            active = Version(
                request
                .active_host_api_version
            )

            minimum = Version(
                host_api["minimum"]
            )

            maximum = Version(
                host_api["maximum"]
            )
        except InvalidVersion as error:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "INVALID_HOST_API_VERSION"
                    ),
                    path="$.engine.hostApi",
                    message=str(error),
                )
            )
            return

        if minimum > maximum:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "INVALID_HOST_API_RANGE"
                    ),
                    path="$.engine.hostApi",
                    message=(
                        "Minimum host API exceeds "
                        "maximum host API."
                    ),
                )
            )
            return

        if not (
            minimum
            <= active
            <= maximum
        ):
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "HOST_API_INCOMPATIBLE"
                    ),
                    path="$.engine.hostApi",
                    message=(
                        "Active host API version "
                        f"{active} is outside "
                        f"{minimum}..{maximum}."
                    ),
                )
            )

    def _node_version(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        request: MarketplaceAdmissionRequest,
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        raw_range = manifest[
            "engine"
        ][
            "node"
        ]

        normalized = (
            str(raw_range)
            .strip()
            .replace(
                " ",
                ",",
            )
        )

        try:
            specifier = SpecifierSet(
                normalized
            )
            active = Version(
                request.active_node_version
            )
        except (
            InvalidSpecifier,
            InvalidVersion,
        ) as error:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "INVALID_NODE_RANGE"
                    ),
                    path="$.engine.node",
                    message=str(error),
                )
            )
            return

        if active not in specifier:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "NODE_VERSION_INCOMPATIBLE"
                    ),
                    path="$.engine.node",
                    message=(
                        "Active Node.js version "
                        f"{active} does not satisfy "
                        f"{raw_range}."
                    ),
                )
            )

    def _contracts(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        request: MarketplaceAdmissionRequest,
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        for index, contract in enumerate(
            manifest["contracts"]
        ):
            package_name = contract[
                "package"
            ]

            required_version = contract[
                "version"
            ]

            available = (
                request
                .available_contract_versions
                .get(
                    package_name
                )
            )

            path = (
                f"$.contracts[{index}]"
            )

            if available is None:
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "CONTRACT_UNAVAILABLE"
                        ),
                        path=path,
                        message=(
                            "Required contract "
                            f"is unavailable: "
                            f"{package_name}"
                        ),
                    )
                )
                continue

            try:
                available_version = Version(
                    available
                )

                required = Version(
                    required_version
                )
            except InvalidVersion as error:
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "INVALID_CONTRACT_VERSION"
                        ),
                        path=path,
                        message=str(error),
                    )
                )
                continue

            if available_version != required:
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "CONTRACT_VERSION_INCOMPATIBLE"
                        ),
                        path=path,
                        message=(
                            f"{package_name} requires "
                            f"{required}, available "
                            f"{available_version}."
                        ),
                    )
                )

    def _dependencies(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        request: MarketplaceAdmissionRequest,
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        plugin_id = manifest["id"]

        for index, dependency in enumerate(
            manifest.get(
                "dependencies",
                [],
            )
        ):
            dependency_id = dependency[
                "pluginId"
            ]

            required_version = dependency[
                "version"
            ]

            optional = dependency.get(
                "optional",
                False,
            )

            path = (
                f"$.dependencies[{index}]"
            )

            if dependency_id == plugin_id:
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "SELF_DEPENDENCY"
                        ),
                        path=path,
                        message=(
                            "Plugin cannot depend "
                            "on itself."
                        ),
                    )
                )
                continue

            available = (
                request
                .available_plugin_versions
                .get(
                    dependency_id
                )
            )

            if available is None:
                if not optional:
                    issues.append(
                        MarketplaceAdmissionIssue(
                            code=(
                                "PLUGIN_DEPENDENCY_UNAVAILABLE"
                            ),
                            path=path,
                            message=(
                                "Required plugin "
                                f"is unavailable: "
                                f"{dependency_id}"
                            ),
                        )
                    )
                continue

            try:
                available_version = Version(
                    available
                )

                required = Version(
                    required_version
                )
            except InvalidVersion as error:
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "INVALID_PLUGIN_DEPENDENCY_VERSION"
                        ),
                        path=path,
                        message=str(error),
                    )
                )
                continue

            if available_version != required:
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "PLUGIN_DEPENDENCY_VERSION_INCOMPATIBLE"
                        ),
                        path=path,
                        message=(
                            f"{dependency_id} requires "
                            f"{required}, available "
                            f"{available_version}."
                        ),
                    )
                )

    def _publisher_trust(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        request: MarketplaceAdmissionRequest,
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        publisher = manifest[
            "publisher"
        ]

        publisher_id = publisher[
            "id"
        ]

        trusted_keys = (
            request
            .trusted_publishers
            .get(
                publisher_id
            )
        )

        if trusted_keys is None:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "PUBLISHER_UNTRUSTED"
                    ),
                    path="$.publisher.id",
                    message=(
                        "Publisher is not trusted."
                    ),
                )
            )
            return

        signature = (
            manifest[
                "integrity"
            ].get(
                "signature"
            )
        )

        if signature is None:
            return

        key_id = signature[
            "keyId"
        ]

        if key_id not in trusted_keys:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "SIGNING_KEY_UNTRUSTED"
                    ),
                    path=(
                        "$.integrity.signature.keyId"
                    ),
                    message=(
                        "Signing key is not trusted "
                        "for this publisher."
                    ),
                )
            )

        publisher_key = publisher.get(
            "keyId"
        )

        if (
            publisher_key is not None
            and publisher_key != key_id
        ):
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "PUBLISHER_KEY_MISMATCH"
                    ),
                    path="$.publisher.keyId",
                    message=(
                        "Publisher key does not match "
                        "the signature key."
                    ),
                )
            )

    def _integrity(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        request: MarketplaceAdmissionRequest,
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        if request.archive_path is None:
            return

        if not request.archive_path.is_file():
            issues.append(
                MarketplaceAdmissionIssue(
                    code="ARCHIVE_MISSING",
                    path="$.integrity.archiveSha256",
                    message=(
                        "Candidate archive does "
                        "not exist."
                    ),
                )
            )
            return

        actual = self.archive_sha256(
            request.archive_path
        )

        expected = (
            manifest[
                "integrity"
            ][
                "archiveSha256"
            ]
        )

        if actual != expected:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "ARCHIVE_SHA256_MISMATCH"
                    ),
                    path=(
                        "$.integrity.archiveSha256"
                    ),
                    message=(
                        "Candidate archive digest "
                        "does not match the manifest."
                    ),
                )
            )

    def _entrypoints(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        entrypoint = manifest.get(
            "entrypoint",
            "dist/index.js",
        )

        if (
            self._ENTRYPOINT_PATTERN
            .fullmatch(
                entrypoint
            )
            is None
        ):
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "UNSAFE_ENTRYPOINT"
                    ),
                    path="$.entrypoint",
                    message=(
                        "Entrypoint must resolve "
                        "inside dist."
                    ),
                )
            )

        lifecycle = manifest.get(
            "lifecycle",
            {},
        )

        for hook in sorted(lifecycle):
            value = lifecycle[hook]

            if (
                self._ENTRYPOINT_PATTERN
                .fullmatch(
                    value
                )
                is None
            ):
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "UNSAFE_LIFECYCLE_ENTRYPOINT"
                        ),
                        path=(
                            f"$.lifecycle.{hook}"
                        ),
                        message=(
                            "Lifecycle entrypoint must "
                            "resolve inside dist."
                        ),
                    )
                )

    def _permissions(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        for index, permission in enumerate(
            manifest.get(
                "permissions",
                [],
            )
        ):
            if (
                self._PERMISSION_PATTERN
                .fullmatch(
                    permission
                )
                is None
            ):
                issues.append(
                    MarketplaceAdmissionIssue(
                        code=(
                            "INVALID_PERMISSION"
                        ),
                        path=(
                            f"$.permissions[{index}]"
                        ),
                        message=(
                            "Permission must use "
                            "resource:action."
                        ),
                    )
                )

    def _version_transition(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        request: MarketplaceAdmissionRequest,
        issues: list[
            MarketplaceAdmissionIssue
        ],
    ) -> None:
        plugin_id = manifest["id"]

        installed = (
            request
            .installed_plugin_versions
            .get(
                plugin_id
            )
        )

        if installed is None:
            return

        try:
            installed_version = Version(
                installed
            )

            candidate_version = Version(
                manifest["version"]
            )
        except InvalidVersion as error:
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "INVALID_PLUGIN_VERSION"
                    ),
                    path="$.version",
                    message=str(error),
                )
            )
            return

        if (
            candidate_version
            < installed_version
            and not request.allow_downgrade
        ):
            issues.append(
                MarketplaceAdmissionIssue(
                    code=(
                        "DOWNGRADE_NOT_ALLOWED"
                    ),
                    path="$.version",
                    message=(
                        f"Installed version is "
                        f"{installed_version}; "
                        f"candidate is "
                        f"{candidate_version}."
                    ),
                )
            )

    @staticmethod
    def _decision(
        issues: Sequence[
            MarketplaceAdmissionIssue
        ],
    ) -> MarketplaceAdmissionDecision:
        ordered = tuple(
            sorted(
                issues,
                key=(
                    lambda issue:
                    issue.sort_key()
                ),
            )
        )

        return MarketplaceAdmissionDecision(
            accepted=not ordered,
            issues=ordered,
        )


__all__ = [
    "MarketplaceAdmissionDecision",
    "MarketplaceAdmissionIssue",
    "MarketplaceAdmissionRequest",
    "MarketplaceAdmissionValidator",
    "NativeSchemaIssue",
]
