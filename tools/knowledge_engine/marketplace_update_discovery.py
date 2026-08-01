from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Mapping, Optional, Sequence, Tuple

from packaging.version import InvalidVersion, Version


class MarketplaceUpdateKind(str, Enum):
    PATCH = "patch"
    MINOR = "minor"
    MAJOR = "major"


@dataclass(frozen=True)
class MarketplaceInstalledPlugin:
    plugin_id: str
    version: str


@dataclass(frozen=True)
class MarketplaceUpdateCandidate:
    plugin_id: str
    installed_version: str
    target_version: str
    update_kind: MarketplaceUpdateKind
    publisher_id: str
    archive_url: str
    archive_sha256: str
    manifest_url: str
    signature: Mapping[str, Any]
    minimum_host_api: str
    maximum_host_api: str


@dataclass(frozen=True)
class MarketplaceUpdateIssue:
    code: str
    plugin_id: str
    message: str

    def sort_key(
        self,
    ) -> Tuple[str, str, str]:
        return (
            self.plugin_id,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceUpdateDiscoveryRequest:
    installed_plugins: Tuple[
        MarketplaceInstalledPlugin,
        ...,
    ]
    repository_index: Mapping[
        str,
        Any,
    ]
    host_api_version: str
    include_yanked: bool = False
    allow_major: bool = True
    allow_minor: bool = True
    allow_patch: bool = True


@dataclass(frozen=True)
class MarketplaceUpdateDiscoveryResult:
    host_api_version: str
    updates: Tuple[
        MarketplaceUpdateCandidate,
        ...,
    ]
    issues: Tuple[
        MarketplaceUpdateIssue,
        ...,
    ]

    @property
    def has_updates(
        self,
    ) -> bool:
        return bool(
            self.updates
        )


class MarketplaceUpdateDiscoveryEngine:
    """
    Compares installed plugin versions with a verified repository index and
    returns a deterministic, upgrade-coordinator-ready update plan.

    Rules:
    - only newer versions are considered;
    - host API compatibility is mandatory;
    - yanked releases are excluded by default;
    - patch/minor/major policy is explicit;
    - the highest eligible release is selected;
    - malformed repository entries are reported, not guessed.
    """

    def discover(
        self,
        request: MarketplaceUpdateDiscoveryRequest,
    ) -> MarketplaceUpdateDiscoveryResult:
        try:
            host_version = Version(
                request.host_api_version
            )
        except InvalidVersion as error:
            raise ValueError(
                "Host API version is invalid."
            ) from error

        installed = self._installed_map(
            request.installed_plugins
        )
        repository_plugins = self._repository_map(
            request.repository_index
        )

        updates = []
        issues = []

        for plugin_id in sorted(
            installed
        ):
            installed_record = installed[
                plugin_id
            ]

            try:
                installed_version = Version(
                    installed_record.version
                )
            except InvalidVersion:
                issues.append(
                    MarketplaceUpdateIssue(
                        code="INSTALLED_VERSION_INVALID",
                        plugin_id=plugin_id,
                        message=(
                            "Installed plugin version is invalid."
                        ),
                    )
                )
                continue

            plugin = repository_plugins.get(
                plugin_id
            )

            if plugin is None:
                issues.append(
                    MarketplaceUpdateIssue(
                        code="PLUGIN_NOT_IN_REPOSITORY",
                        plugin_id=plugin_id,
                        message=(
                            "Installed plugin is absent from "
                            "the repository index."
                        ),
                    )
                )
                continue

            candidates = self._eligible_releases(
                plugin_id=plugin_id,
                plugin=plugin,
                installed_version=installed_version,
                host_version=host_version,
                include_yanked=(
                    request.include_yanked
                ),
                allow_major=(
                    request.allow_major
                ),
                allow_minor=(
                    request.allow_minor
                ),
                allow_patch=(
                    request.allow_patch
                ),
                issues=issues,
            )

            if not candidates:
                continue

            target_version, release = candidates[
                -1
            ]

            update_kind = self._classify(
                installed_version,
                target_version,
            )

            updates.append(
                MarketplaceUpdateCandidate(
                    plugin_id=plugin_id,
                    installed_version=str(
                        installed_version
                    ),
                    target_version=str(
                        target_version
                    ),
                    update_kind=update_kind,
                    publisher_id=str(
                        plugin.get(
                            "publisherId",
                            "",
                        )
                    ),
                    archive_url=str(
                        release.get(
                            "archiveUrl",
                            "",
                        )
                    ),
                    archive_sha256=str(
                        release.get(
                            "archiveSha256",
                            "",
                        )
                    ),
                    manifest_url=str(
                        release.get(
                            "manifestUrl",
                            "",
                        )
                    ),
                    signature=dict(
                        release.get(
                            "signature",
                            {},
                        )
                    ),
                    minimum_host_api=str(
                        release.get(
                            "minimumHostApi",
                            "",
                        )
                    ),
                    maximum_host_api=str(
                        release.get(
                            "maximumHostApi",
                            "",
                        )
                    ),
                )
            )

        ordered_updates = tuple(
            sorted(
                updates,
                key=(
                    lambda item: (
                        item.plugin_id,
                        Version(
                            item.target_version
                        ),
                    )
                ),
            )
        )

        ordered_issues = tuple(
            sorted(
                issues,
                key=(
                    lambda issue:
                    issue.sort_key()
                ),
            )
        )

        return MarketplaceUpdateDiscoveryResult(
            host_api_version=(
                request.host_api_version
            ),
            updates=ordered_updates,
            issues=ordered_issues,
        )

    @staticmethod
    def _installed_map(
        installed_plugins: Sequence[
            MarketplaceInstalledPlugin
        ],
    ) -> Mapping[
        str,
        MarketplaceInstalledPlugin,
    ]:
        result = {}

        for item in installed_plugins:
            if item.plugin_id in result:
                raise ValueError(
                    "Duplicate installed plugin ID: "
                    + item.plugin_id
                )

            result[
                item.plugin_id
            ] = item

        return result

    @staticmethod
    def _repository_map(
        index: Mapping[
            str,
            Any,
        ],
    ) -> Mapping[
        str,
        Mapping[str, Any],
    ]:
        plugins = index.get(
            "plugins",
            []
        )

        if not isinstance(
            plugins,
            list,
        ):
            raise ValueError(
                "Repository plugins must be an array."
            )

        result = {}

        for plugin in plugins:
            if not isinstance(
                plugin,
                Mapping,
            ):
                continue

            plugin_id = str(
                plugin.get(
                    "id",
                    "",
                )
            )

            if not plugin_id:
                continue

            if plugin_id in result:
                raise ValueError(
                    "Duplicate repository plugin ID: "
                    + plugin_id
                )

            result[
                plugin_id
            ] = plugin

        return result

    def _eligible_releases(
        self,
        *,
        plugin_id: str,
        plugin: Mapping[
            str,
            Any,
        ],
        installed_version: Version,
        host_version: Version,
        include_yanked: bool,
        allow_major: bool,
        allow_minor: bool,
        allow_patch: bool,
        issues: list,
    ) -> Tuple[
        Tuple[
            Version,
            Mapping[str, Any],
        ],
        ...,
    ]:
        releases = plugin.get(
            "releases",
            []
        )

        if not isinstance(
            releases,
            list,
        ):
            issues.append(
                MarketplaceUpdateIssue(
                    code="RELEASES_INVALID",
                    plugin_id=plugin_id,
                    message=(
                        "Repository releases are invalid."
                    ),
                )
            )
            return ()

        eligible = []

        for release in releases:
            if not isinstance(
                release,
                Mapping,
            ):
                continue

            try:
                version = Version(
                    str(
                        release.get(
                            "version"
                        )
                    )
                )
                minimum = Version(
                    str(
                        release.get(
                            "minimumHostApi"
                        )
                    )
                )
                maximum = Version(
                    str(
                        release.get(
                            "maximumHostApi"
                        )
                    )
                )
            except InvalidVersion:
                issues.append(
                    MarketplaceUpdateIssue(
                        code="RELEASE_VERSION_INVALID",
                        plugin_id=plugin_id,
                        message=(
                            "Repository release contains "
                            "an invalid version."
                        ),
                    )
                )
                continue

            if version <= installed_version:
                continue

            if not (
                minimum
                <= host_version
                <= maximum
            ):
                continue

            if (
                bool(
                    release.get(
                        "yanked",
                        False,
                    )
                )
                and not include_yanked
            ):
                continue

            kind = self._classify(
                installed_version,
                version,
            )

            if (
                kind
                == MarketplaceUpdateKind.MAJOR
                and not allow_major
            ):
                continue

            if (
                kind
                == MarketplaceUpdateKind.MINOR
                and not allow_minor
            ):
                continue

            if (
                kind
                == MarketplaceUpdateKind.PATCH
                and not allow_patch
            ):
                continue

            required = (
                "archiveUrl",
                "archiveSha256",
                "manifestUrl",
                "signature",
            )

            if any(
                not release.get(
                    field
                )
                for field in required
            ):
                issues.append(
                    MarketplaceUpdateIssue(
                        code="RELEASE_METADATA_INCOMPLETE",
                        plugin_id=plugin_id,
                        message=(
                            "Eligible repository release is "
                            "missing required metadata."
                        ),
                    )
                )
                continue

            eligible.append(
                (
                    version,
                    release,
                )
            )

        return tuple(
            sorted(
                eligible,
                key=(
                    lambda item:
                    item[
                        0
                    ]
                ),
            )
        )

    @staticmethod
    def _classify(
        installed: Version,
        target: Version,
    ) -> MarketplaceUpdateKind:
        installed_release = (
            installed.release
            + (
                0,
                0,
                0,
            )
        )[
            0:3
        ]
        target_release = (
            target.release
            + (
                0,
                0,
                0,
            )
        )[
            0:3
        ]

        if (
            target_release[
                0
            ]
            != installed_release[
                0
            ]
        ):
            return (
                MarketplaceUpdateKind.MAJOR
            )

        if (
            target_release[
                1
            ]
            != installed_release[
                1
            ]
        ):
            return (
                MarketplaceUpdateKind.MINOR
            )

        return (
            MarketplaceUpdateKind.PATCH
        )


__all__ = [
    "MarketplaceInstalledPlugin",
    "MarketplaceUpdateCandidate",
    "MarketplaceUpdateDiscoveryEngine",
    "MarketplaceUpdateDiscoveryRequest",
    "MarketplaceUpdateDiscoveryResult",
    "MarketplaceUpdateIssue",
    "MarketplaceUpdateKind",
]
