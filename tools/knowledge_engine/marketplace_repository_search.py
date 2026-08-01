from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Optional, Sequence, Tuple

from packaging.version import InvalidVersion, Version


@dataclass(frozen=True)
class MarketplaceSearchQuery:
    text: str = ""
    publisher_id: Optional[str] = None
    host_api_version: Optional[str] = None
    include_yanked: bool = False
    page: int = 1
    page_size: int = 20


@dataclass(frozen=True)
class MarketplaceSearchRelease:
    version: str
    compatible: bool
    yanked: bool


@dataclass(frozen=True)
class MarketplaceSearchHit:
    plugin_id: str
    display_name: str
    summary: str
    publisher_id: str
    latest_version: str
    compatible_versions: Tuple[str, ...]
    matched_fields: Tuple[str, ...]
    score: int


@dataclass(frozen=True)
class MarketplaceSearchResult:
    query: MarketplaceSearchQuery
    total: int
    page: int
    page_size: int
    page_count: int
    hits: Tuple[
        MarketplaceSearchHit,
        ...,
    ]


class MarketplaceRepositorySearchEngine:
    """
    Deterministic search and discovery across a verified repository index.

    Supported search fields:
    - plugin ID;
    - display name;
    - summary;
    - publisher ID;
    - release versions.

    Supported filters:
    - publisher;
    - host API compatibility;
    - yanked release inclusion;
    - pagination.
    """

    def search(
        self,
        index: Mapping[str, Any],
        query: MarketplaceSearchQuery,
    ) -> MarketplaceSearchResult:
        self._validate_query(
            query
        )

        normalized = (
            query.text.strip().lower()
        )

        host_version = None

        if query.host_api_version:
            try:
                host_version = Version(
                    query.host_api_version
                )
            except InvalidVersion as error:
                raise ValueError(
                    "Host API version is invalid."
                ) from error

        hits = []

        for plugin in index.get(
            "plugins",
            [],
        ):
            if not isinstance(
                plugin,
                Mapping,
            ):
                continue

            publisher_id = str(
                plugin.get(
                    "publisherId",
                    "",
                )
            )

            if (
                query.publisher_id is not None
                and publisher_id
                != query.publisher_id
            ):
                continue

            releases = self._compatible_releases(
                plugin.get(
                    "releases",
                    [],
                ),
                host_version,
                query.include_yanked,
            )

            if not releases:
                continue

            matched_fields, score = self._match(
                plugin,
                normalized,
            )

            if normalized and score == 0:
                continue

            compatible_versions = tuple(
                item.version
                for item in releases
            )

            latest_version = str(
                plugin.get(
                    "latestVersion",
                    "",
                )
            )

            if (
                not query.include_yanked
                and releases
                and latest_version
                not in compatible_versions
            ):
                latest_version = (
                    compatible_versions[
                        -1
                    ]
                )

            hits.append(
                MarketplaceSearchHit(
                    plugin_id=str(
                        plugin.get(
                            "id",
                            "",
                        )
                    ),
                    display_name=str(
                        plugin.get(
                            "displayName",
                            "",
                        )
                    ),
                    summary=str(
                        plugin.get(
                            "summary",
                            "",
                        )
                    ),
                    publisher_id=(
                        publisher_id
                    ),
                    latest_version=(
                        latest_version
                    ),
                    compatible_versions=(
                        compatible_versions
                    ),
                    matched_fields=(
                        matched_fields
                    ),
                    score=score,
                )
            )

        ordered = tuple(
            sorted(
                hits,
                key=(
                    lambda hit: (
                        -hit.score,
                        hit.display_name.lower(),
                        hit.plugin_id,
                    )
                ),
            )
        )

        total = len(
            ordered
        )

        page_count = (
            0
            if total == 0
            else (
                (
                    total
                    + query.page_size
                    - 1
                )
                // query.page_size
            )
        )

        start = (
            query.page
            - 1
        ) * query.page_size

        end = start + query.page_size

        return MarketplaceSearchResult(
            query=query,
            total=total,
            page=query.page,
            page_size=query.page_size,
            page_count=page_count,
            hits=ordered[
                start:end
            ],
        )

    def discover(
        self,
        index: Mapping[str, Any],
        *,
        host_api_version: Optional[str] = None,
        limit: int = 10,
    ) -> MarketplaceSearchResult:
        return self.search(
            index,
            MarketplaceSearchQuery(
                text="",
                host_api_version=(
                    host_api_version
                ),
                include_yanked=False,
                page=1,
                page_size=limit,
            ),
        )

    @staticmethod
    def _validate_query(
        query: MarketplaceSearchQuery,
    ) -> None:
        if query.page < 1:
            raise ValueError(
                "Search page must be at least 1."
            )

        if (
            query.page_size < 1
            or query.page_size > 100
        ):
            raise ValueError(
                "Search page size must be between 1 and 100."
            )

    @staticmethod
    def _compatible_releases(
        releases: Any,
        host_version: Optional[
            Version
        ],
        include_yanked: bool,
    ) -> Tuple[
        MarketplaceSearchRelease,
        ...,
    ]:
        if not isinstance(
            releases,
            list,
        ):
            return ()

        result = []

        for release in releases:
            if not isinstance(
                release,
                Mapping,
            ):
                continue

            yanked = bool(
                release.get(
                    "yanked",
                    False,
                )
            )

            if (
                yanked
                and not include_yanked
            ):
                continue

            compatible = True

            if host_version is not None:
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
                    compatible = False
                else:
                    compatible = (
                        minimum
                        <= host_version
                        <= maximum
                    )

            if not compatible:
                continue

            try:
                version = Version(
                    str(
                        release.get(
                            "version"
                        )
                    )
                )
            except InvalidVersion:
                continue

            result.append(
                MarketplaceSearchRelease(
                    version=str(
                        version
                    ),
                    compatible=True,
                    yanked=yanked,
                )
            )

        return tuple(
            sorted(
                result,
                key=(
                    lambda item:
                    Version(
                        item.version
                    )
                ),
            )
        )

    @staticmethod
    def _match(
        plugin: Mapping[
            str,
            Any,
        ],
        normalized: str,
    ) -> Tuple[
        Tuple[str, ...],
        int,
    ]:
        if not normalized:
            return (
                (),
                0,
            )

        fields = {
            "pluginId": str(
                plugin.get(
                    "id",
                    "",
                )
            ).lower(),
            "displayName": str(
                plugin.get(
                    "displayName",
                    "",
                )
            ).lower(),
            "summary": str(
                plugin.get(
                    "summary",
                    "",
                )
            ).lower(),
            "publisherId": str(
                plugin.get(
                    "publisherId",
                    "",
                )
            ).lower(),
            "versions": " ".join(
                str(
                    release.get(
                        "version",
                        "",
                    )
                )
                for release in plugin.get(
                    "releases",
                    [],
                )
                if isinstance(
                    release,
                    Mapping,
                )
            ).lower(),
        }

        weights = {
            "pluginId": 100,
            "displayName": 80,
            "publisherId": 50,
            "versions": 30,
            "summary": 20,
        }

        matched = []
        score = 0

        tokens = tuple(
            token
            for token in normalized.split()
            if token
        )

        for name, value in fields.items():
            if not value:
                continue

            field_matched = all(
                token in value
                for token in tokens
            )

            if field_matched:
                matched.append(
                    name
                )
                score += weights[
                    name
                ]

                if value == normalized:
                    score += weights[
                        name
                    ]

                if value.startswith(
                    normalized
                ):
                    score += (
                        weights[
                            name
                        ]
                        // 2
                    )

        return (
            tuple(
                sorted(
                    matched
                )
            ),
            score,
        )


__all__ = [
    "MarketplaceRepositorySearchEngine",
    "MarketplaceSearchHit",
    "MarketplaceSearchQuery",
    "MarketplaceSearchRelease",
    "MarketplaceSearchResult",
]
