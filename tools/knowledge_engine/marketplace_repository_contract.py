from __future__ import annotations

import re

from dataclasses import dataclass
from typing import Any, Mapping, Sequence, Tuple

from packaging.version import InvalidVersion, Version


@dataclass(frozen=True)
class MarketplaceRepositoryContractIssue:
    code: str
    path: str
    message: str

    def sort_key(
        self,
    ) -> Tuple[str, str, str]:
        return (
            self.path,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceRepositoryContractResult:
    valid: bool
    issues: Tuple[
        MarketplaceRepositoryContractIssue,
        ...,
    ]


class MarketplaceRepositoryContractValidator:
    """
    Validates a machine-readable PropertyOS marketplace repository index.

    The contract is deliberately closed and deterministic. Unknown fields are
    rejected at every validated object boundary.
    """

    SCHEMA_VERSION = "1.0.0"

    _PLUGIN_ID = re.compile(
        r"^[a-z][a-z0-9-]{1,63}$"
    )
    _PUBLISHER_ID = re.compile(
        r"^[a-z][a-z0-9-]{1,63}$"
    )
    _SHA256 = re.compile(
        r"^[a-f0-9]{64}$"
    )
    _URL = re.compile(
        r"^https://[^\s]+$"
    )

    _ROOT_FIELDS = {
        "schemaVersion",
        "repository",
        "publishers",
        "plugins",
    }

    _REPOSITORY_FIELDS = {
        "id",
        "name",
        "baseUrl",
        "generatedAt",
    }

    _PUBLISHER_FIELDS = {
        "id",
        "name",
        "keyIds",
    }

    _PLUGIN_FIELDS = {
        "id",
        "displayName",
        "publisherId",
        "summary",
        "latestVersion",
        "releases",
    }

    _RELEASE_FIELDS = {
        "version",
        "manifestUrl",
        "archiveUrl",
        "archiveSha256",
        "signature",
        "publishedAt",
        "minimumHostApi",
        "maximumHostApi",
        "yanked",
    }

    _SIGNATURE_FIELDS = {
        "algorithm",
        "keyId",
        "value",
    }

    def validate(
        self,
        document: Mapping[str, Any],
    ) -> MarketplaceRepositoryContractResult:
        issues = []

        if not isinstance(
            document,
            Mapping,
        ):
            return self._result(
                [
                    MarketplaceRepositoryContractIssue(
                        code="ROOT_NOT_OBJECT",
                        path="$",
                        message=(
                            "Repository index must "
                            "be an object."
                        ),
                    )
                ]
            )

        self._closed(
            document,
            self._ROOT_FIELDS,
            "$",
            issues,
        )

        if (
            document.get(
                "schemaVersion"
            )
            != self.SCHEMA_VERSION
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="SCHEMA_VERSION_UNSUPPORTED",
                    path="$.schemaVersion",
                    message=(
                        "Repository schema version "
                        "must be 1.0.0."
                    ),
                )
            )

        self._repository(
            document.get(
                "repository"
            ),
            issues,
        )

        publishers = self._publishers(
            document.get(
                "publishers"
            ),
            issues,
        )

        self._plugins(
            document.get(
                "plugins"
            ),
            publishers,
            issues,
        )

        return self._result(
            issues
        )

    def require_valid(
        self,
        document: Mapping[str, Any],
    ) -> MarketplaceRepositoryContractResult:
        result = self.validate(
            document
        )

        if not result.valid:
            raise ValueError(
                "; ".join(
                    (
                        issue.path
                        + ":"
                        + issue.code
                        + ":"
                        + issue.message
                    )
                    for issue in result.issues
                )
            )

        return result

    def _repository(
        self,
        value: Any,
        issues: list,
    ) -> None:
        path = "$.repository"

        if not isinstance(
            value,
            Mapping,
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="REPOSITORY_NOT_OBJECT",
                    path=path,
                    message=(
                        "Repository metadata must "
                        "be an object."
                    ),
                )
            )
            return

        self._closed(
            value,
            self._REPOSITORY_FIELDS,
            path,
            issues,
        )

        self._required_strings(
            value,
            (
                "id",
                "name",
                "baseUrl",
                "generatedAt",
            ),
            path,
            issues,
        )

        base_url = value.get(
            "baseUrl"
        )

        if (
            isinstance(
                base_url,
                str,
            )
            and self._URL.fullmatch(
                base_url
            )
            is None
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="REPOSITORY_URL_UNSAFE",
                    path=path + ".baseUrl",
                    message=(
                        "Repository base URL must "
                        "use HTTPS."
                    ),
                )
            )

    def _publishers(
        self,
        value: Any,
        issues: list,
    ) -> Mapping[str, Mapping[str, Any]]:
        path = "$.publishers"

        if not isinstance(
            value,
            list,
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="PUBLISHERS_NOT_ARRAY",
                    path=path,
                    message=(
                        "Publishers must be an array."
                    ),
                )
            )
            return {}

        publishers = {}

        for index, publisher in enumerate(
            value
        ):
            item_path = (
                path
                + "["
                + str(index)
                + "]"
            )

            if not isinstance(
                publisher,
                Mapping,
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PUBLISHER_NOT_OBJECT",
                        path=item_path,
                        message=(
                            "Publisher must be "
                            "an object."
                        ),
                    )
                )
                continue

            self._closed(
                publisher,
                self._PUBLISHER_FIELDS,
                item_path,
                issues,
            )

            self._required_strings(
                publisher,
                (
                    "id",
                    "name",
                ),
                item_path,
                issues,
            )

            publisher_id = publisher.get(
                "id"
            )

            if (
                isinstance(
                    publisher_id,
                    str,
                )
                and self._PUBLISHER_ID.fullmatch(
                    publisher_id
                )
                is None
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PUBLISHER_ID_INVALID",
                        path=item_path + ".id",
                        message=(
                            "Publisher ID is invalid."
                        ),
                    )
                )

            if publisher_id in publishers:
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PUBLISHER_DUPLICATE",
                        path=item_path + ".id",
                        message=(
                            "Publisher ID is duplicated."
                        ),
                    )
                )
            elif isinstance(
                publisher_id,
                str,
            ):
                publishers[
                    publisher_id
                ] = publisher

            key_ids = publisher.get(
                "keyIds"
            )

            if (
                not isinstance(
                    key_ids,
                    list,
                )
                or not key_ids
                or not all(
                    isinstance(
                        item,
                        str,
                    )
                    and item
                    for item in key_ids
                )
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PUBLISHER_KEYS_INVALID",
                        path=item_path + ".keyIds",
                        message=(
                            "Publisher keyIds must "
                            "be a non-empty string array."
                        ),
                    )
                )

        return publishers

    def _plugins(
        self,
        value: Any,
        publishers: Mapping[
            str,
            Mapping[str, Any],
        ],
        issues: list,
    ) -> None:
        path = "$.plugins"

        if not isinstance(
            value,
            list,
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="PLUGINS_NOT_ARRAY",
                    path=path,
                    message=(
                        "Plugins must be an array."
                    ),
                )
            )
            return

        plugin_ids = set()

        for index, plugin in enumerate(
            value
        ):
            item_path = (
                path
                + "["
                + str(index)
                + "]"
            )

            if not isinstance(
                plugin,
                Mapping,
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PLUGIN_NOT_OBJECT",
                        path=item_path,
                        message=(
                            "Plugin must be an object."
                        ),
                    )
                )
                continue

            self._closed(
                plugin,
                self._PLUGIN_FIELDS,
                item_path,
                issues,
            )

            self._required_strings(
                plugin,
                (
                    "id",
                    "displayName",
                    "publisherId",
                    "summary",
                    "latestVersion",
                ),
                item_path,
                issues,
            )

            plugin_id = plugin.get(
                "id"
            )

            if (
                isinstance(
                    plugin_id,
                    str,
                )
                and self._PLUGIN_ID.fullmatch(
                    plugin_id
                )
                is None
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PLUGIN_ID_INVALID",
                        path=item_path + ".id",
                        message=(
                            "Plugin ID is invalid."
                        ),
                    )
                )

            if plugin_id in plugin_ids:
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PLUGIN_DUPLICATE",
                        path=item_path + ".id",
                        message=(
                            "Plugin ID is duplicated."
                        ),
                    )
                )
            elif isinstance(
                plugin_id,
                str,
            ):
                plugin_ids.add(
                    plugin_id
                )

            publisher_id = plugin.get(
                "publisherId"
            )

            if (
                isinstance(
                    publisher_id,
                    str,
                )
                and publisher_id
                not in publishers
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="PUBLISHER_UNKNOWN",
                        path=item_path + ".publisherId",
                        message=(
                            "Plugin references an "
                            "unknown publisher."
                        ),
                    )
                )

            self._releases(
                plugin,
                publishers,
                item_path,
                issues,
            )

    def _releases(
        self,
        plugin: Mapping[str, Any],
        publishers: Mapping[
            str,
            Mapping[str, Any],
        ],
        path: str,
        issues: list,
    ) -> None:
        releases = plugin.get(
            "releases"
        )

        if (
            not isinstance(
                releases,
                list,
            )
            or not releases
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="RELEASES_INVALID",
                    path=path + ".releases",
                    message=(
                        "Plugin releases must be "
                        "a non-empty array."
                    ),
                )
            )
            return

        versions = set()
        parsed_versions = []

        publisher = publishers.get(
            plugin.get(
                "publisherId"
            )
        )
        trusted_keys = set(
            publisher.get(
                "keyIds",
                [],
            )
            if publisher
            else []
        )

        for index, release in enumerate(
            releases
        ):
            release_path = (
                path
                + ".releases["
                + str(index)
                + "]"
            )

            if not isinstance(
                release,
                Mapping,
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="RELEASE_NOT_OBJECT",
                        path=release_path,
                        message=(
                            "Release must be an object."
                        ),
                    )
                )
                continue

            self._closed(
                release,
                self._RELEASE_FIELDS,
                release_path,
                issues,
            )

            self._required_strings(
                release,
                (
                    "version",
                    "manifestUrl",
                    "archiveUrl",
                    "archiveSha256",
                    "publishedAt",
                    "minimumHostApi",
                    "maximumHostApi",
                ),
                release_path,
                issues,
            )

            version_text = release.get(
                "version"
            )

            try:
                version = Version(
                    str(
                        version_text
                    )
                )
                parsed_versions.append(
                    version
                )
            except InvalidVersion:
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="RELEASE_VERSION_INVALID",
                        path=release_path + ".version",
                        message=(
                            "Release version is invalid."
                        ),
                    )
                )
                version = None

            if version_text in versions:
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="RELEASE_VERSION_DUPLICATE",
                        path=release_path + ".version",
                        message=(
                            "Release version is duplicated."
                        ),
                    )
                )
            else:
                versions.add(
                    version_text
                )

            for field in (
                "manifestUrl",
                "archiveUrl",
            ):
                url = release.get(
                    field
                )

                if (
                    isinstance(
                        url,
                        str,
                    )
                    and self._URL.fullmatch(
                        url
                    )
                    is None
                ):
                    issues.append(
                        MarketplaceRepositoryContractIssue(
                            code="RELEASE_URL_UNSAFE",
                            path=release_path + "." + field,
                            message=(
                                "Release URLs must use HTTPS."
                            ),
                        )
                    )

            digest = release.get(
                "archiveSha256"
            )

            if (
                isinstance(
                    digest,
                    str,
                )
                and self._SHA256.fullmatch(
                    digest
                )
                is None
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="ARCHIVE_SHA256_INVALID",
                        path=release_path + ".archiveSha256",
                        message=(
                            "archiveSha256 must be "
                            "a lowercase SHA-256 digest."
                        ),
                    )
                )

            self._signature(
                release.get(
                    "signature"
                ),
                trusted_keys,
                release_path + ".signature",
                issues,
            )

            self._host_range(
                release,
                release_path,
                issues,
            )

            if not isinstance(
                release.get(
                    "yanked"
                ),
                bool,
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="RELEASE_YANKED_INVALID",
                        path=release_path + ".yanked",
                        message=(
                            "Release yanked must be boolean."
                        ),
                    )
                )

        latest_text = plugin.get(
            "latestVersion"
        )

        try:
            latest = Version(
                str(
                    latest_text
                )
            )
        except InvalidVersion:
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="LATEST_VERSION_INVALID",
                    path=path + ".latestVersion",
                    message=(
                        "latestVersion is invalid."
                    ),
                )
            )
            latest = None

        if (
            latest is not None
            and parsed_versions
            and latest
            != max(
                parsed_versions
            )
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="LATEST_VERSION_MISMATCH",
                    path=path + ".latestVersion",
                    message=(
                        "latestVersion must equal "
                        "the highest release version."
                    ),
                )
            )

    def _signature(
        self,
        value: Any,
        trusted_keys: set,
        path: str,
        issues: list,
    ) -> None:
        if not isinstance(
            value,
            Mapping,
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="SIGNATURE_NOT_OBJECT",
                    path=path,
                    message=(
                        "Release signature must "
                        "be an object."
                    ),
                )
            )
            return

        self._closed(
            value,
            self._SIGNATURE_FIELDS,
            path,
            issues,
        )

        self._required_strings(
            value,
            (
                "algorithm",
                "keyId",
                "value",
            ),
            path,
            issues,
        )

        if value.get(
            "algorithm"
        ) != "ed25519":
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="SIGNATURE_ALGORITHM_INVALID",
                    path=path + ".algorithm",
                    message=(
                        "Signature algorithm must "
                        "be ed25519."
                    ),
                )
            )

        key_id = value.get(
            "keyId"
        )

        if (
            isinstance(
                key_id,
                str,
            )
            and key_id
            not in trusted_keys
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="SIGNING_KEY_UNKNOWN",
                    path=path + ".keyId",
                    message=(
                        "Release signing key is "
                        "not registered for publisher."
                    ),
                )
            )

    def _host_range(
        self,
        release: Mapping[str, Any],
        path: str,
        issues: list,
    ) -> None:
        try:
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
                MarketplaceRepositoryContractIssue(
                    code="HOST_API_VERSION_INVALID",
                    path=path,
                    message=(
                        "Host API range contains "
                        "an invalid version."
                    ),
                )
            )
            return

        if minimum > maximum:
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="HOST_API_RANGE_INVALID",
                    path=path,
                    message=(
                        "minimumHostApi exceeds "
                        "maximumHostApi."
                    ),
                )
            )

    @staticmethod
    def _closed(
        value: Mapping[str, Any],
        allowed: set,
        path: str,
        issues: list,
    ) -> None:
        for name in sorted(
            set(value)
            - allowed
        ):
            issues.append(
                MarketplaceRepositoryContractIssue(
                    code="UNKNOWN_FIELD",
                    path=path + "." + name,
                    message=(
                        "Unknown field is not allowed."
                    ),
                )
            )

    @staticmethod
    def _required_strings(
        value: Mapping[str, Any],
        names: Sequence[str],
        path: str,
        issues: list,
    ) -> None:
        for name in names:
            item = value.get(
                name
            )

            if (
                not isinstance(
                    item,
                    str,
                )
                or not item
            ):
                issues.append(
                    MarketplaceRepositoryContractIssue(
                        code="REQUIRED_STRING_INVALID",
                        path=path + "." + name,
                        message=(
                            "Required value must "
                            "be a non-empty string."
                        ),
                    )
                )

    @staticmethod
    def _result(
        issues: Sequence[
            MarketplaceRepositoryContractIssue
        ],
    ) -> MarketplaceRepositoryContractResult:
        ordered = tuple(
            sorted(
                issues,
                key=(
                    lambda issue:
                    issue.sort_key()
                ),
            )
        )

        return MarketplaceRepositoryContractResult(
            valid=not ordered,
            issues=ordered,
        )


__all__ = [
    "MarketplaceRepositoryContractIssue",
    "MarketplaceRepositoryContractResult",
    "MarketplaceRepositoryContractValidator",
]
