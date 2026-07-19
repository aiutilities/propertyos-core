from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Mapping, Tuple


class MarketplaceManifestError(
    ValueError
):
    pass


PLATFORM_CAPABILITIES = frozenset(
    {
        "audit",
        "auth",
        "database",
        "database:database",
        "database:postgres",
        "eventbus",
        "identity",
        "platform",
        "plugin",
        "scheduler",
        "search",
        "workflow",
    }
)


_SEMVER_PATTERN = re.compile(
    r"^\d+\.\d+\.\d+"
    r"(?:-[0-9A-Za-z.-]+)?"
    r"(?:\+[0-9A-Za-z.-]+)?$"
)


@dataclass(frozen=True)
class MarketplacePluginIdentity:
    plugin_id: str
    name: str
    version: str

    def __post_init__(self) -> None:
        for label, value in (
            ("plugin ID", self.plugin_id),
            ("plugin name", self.name),
            ("plugin version", self.version),
        ):
            if not value.strip():
                raise MarketplaceManifestError(
                    f"Marketplace {label} cannot "
                    "be empty."
                )

        if not _SEMVER_PATTERN.fullmatch(
            self.version
        ):
            raise MarketplaceManifestError(
                "Marketplace plugin version must "
                f"be valid semver: {self.version}"
            )

    @property
    def dependency_specifier(
        self,
    ) -> str:
        return (
            f"{self.name}@{self.version}"
        )


class MarketplaceManifestAdapter:
    def __init__(
        self,
        catalog: Mapping[
            str,
            MarketplacePluginIdentity,
        ],
        provider: str = "propertyos",
        minimum_platform_version: str = (
            "0.1.0"
        ),
    ) -> None:
        if not provider.strip():
            raise MarketplaceManifestError(
                "Marketplace provider cannot be "
                "empty."
            )

        if not _SEMVER_PATTERN.fullmatch(
            minimum_platform_version
        ):
            raise MarketplaceManifestError(
                "Minimum platform version must "
                "be valid semver."
            )

        self.catalog = dict(catalog)
        self.provider = provider.strip()
        self.minimum_platform_version = (
            minimum_platform_version
        )

    def adapt(
        self,
        manifest: Mapping[str, Any],
    ) -> dict[str, Any]:
        plugin_id = self._string(
            manifest,
            "id",
            "Plugin ID",
        )
        name = self._string(
            manifest,
            "name",
            "Plugin name",
        )
        version = self._string(
            manifest,
            "version",
            "Plugin version",
        )

        if not _SEMVER_PATTERN.fullmatch(
            version
        ):
            raise MarketplaceManifestError(
                "Plugin version must be valid "
                f"semver: {version}"
            )

        dependencies = manifest.get(
            "dependencies",
            [],
        )

        if not isinstance(
            dependencies,
            (list, tuple),
        ):
            raise MarketplaceManifestError(
                "Plugin dependencies must be an "
                "array."
            )

        platform_capabilities = []
        plugin_dependencies = []

        for dependency_value in dependencies:
            if not isinstance(
                dependency_value,
                str,
            ):
                raise MarketplaceManifestError(
                    "Plugin dependencies must be "
                    "strings."
                )

            dependency = (
                dependency_value.strip()
            )

            if not dependency:
                raise MarketplaceManifestError(
                    "Plugin dependency cannot be "
                    "empty."
                )

            if dependency in (
                PLATFORM_CAPABILITIES
            ):
                platform_capabilities.append(
                    dependency
                )
                continue

            target = self.catalog.get(
                dependency
            )

            if target is None:
                raise MarketplaceManifestError(
                    "Unknown plugin dependency: "
                    f"{dependency}"
                )

            plugin_dependencies.append(
                target.dependency_specifier
            )

        result = dict(manifest)

        result.pop(
            "materialization",
            None,
        )

        result.update(
            {
                "id": plugin_id,
                "name": name,
                "version": version,
                "provider": self.provider,
                "author": (
                    str(
                        manifest.get(
                            "author",
                            self.provider,
                        )
                    )
                ),
                "minimumPlatformVersion": (
                    self.minimum_platform_version
                ),
                "bootstrap": "dist/index.js",
                "entrypoint": "dist/index.js",
                "dependencies": sorted(
                    set(plugin_dependencies)
                ),
                "platformCapabilities": sorted(
                    set(
                        platform_capabilities
                    )
                ),
            }
        )

        return result

    def adapt_portfolio(
        self,
        manifests: Mapping[
            str,
            Mapping[str, Any],
        ],
    ) -> dict[
        str,
        dict[str, Any],
    ]:
        unknown = (
            set(manifests)
            - set(self.catalog)
        )

        if unknown:
            raise MarketplaceManifestError(
                "Manifest portfolio contains "
                "unknown plugin IDs: "
                + ", ".join(sorted(unknown))
            )

        return {
            plugin_id: self.adapt(
                manifests[plugin_id]
            )
            for plugin_id
            in sorted(manifests)
        }

    @staticmethod
    def catalog_from_manifests(
        manifests: Mapping[
            str,
            Mapping[str, Any],
        ],
    ) -> dict[
        str,
        MarketplacePluginIdentity,
    ]:
        catalog = {}

        for key, manifest in (
            manifests.items()
        ):
            plugin_id = MarketplaceManifestAdapter._string(
                manifest,
                "id",
                "Plugin ID",
            )

            if plugin_id != key:
                raise MarketplaceManifestError(
                    "Manifest catalog key does not "
                    f"match plugin ID: {key}"
                )

            if plugin_id in catalog:
                raise MarketplaceManifestError(
                    "Duplicate plugin ID: "
                    f"{plugin_id}"
                )

            catalog[plugin_id] = (
                MarketplacePluginIdentity(
                    plugin_id=plugin_id,
                    name=(
                        MarketplaceManifestAdapter
                        ._string(
                            manifest,
                            "name",
                            "Plugin name",
                        )
                    ),
                    version=(
                        MarketplaceManifestAdapter
                        ._string(
                            manifest,
                            "version",
                            "Plugin version",
                        )
                    ),
                )
            )

        return catalog

    @staticmethod
    def issue_codes(
        manifest: Mapping[str, Any],
    ) -> Tuple[str, ...]:
        issues = []

        for field in (
            "id",
            "name",
            "version",
            "provider",
        ):
            value = manifest.get(field)

            if (
                not isinstance(value, str)
                or not value.strip()
            ):
                issues.append(
                    f"missing-{field}"
                )

        if (
            manifest.get("entrypoint")
            != "dist/index.js"
        ):
            issues.append(
                "invalid-entrypoint"
            )

        if (
            manifest.get("bootstrap")
            != "dist/index.js"
        ):
            issues.append(
                "invalid-bootstrap"
            )

        dependencies = manifest.get(
            "dependencies",
            [],
        )

        if isinstance(dependencies, list):
            if any(
                dependency
                in PLATFORM_CAPABILITIES
                for dependency in dependencies
            ):
                issues.append(
                    (
                        "platform-capability-in-"
                        "plugin-dependencies"
                    )
                )
        else:
            issues.append(
                "invalid-dependencies"
            )

        return tuple(sorted(set(issues)))

    @staticmethod
    def _string(
        value: Mapping[str, Any],
        key: str,
        label: str,
    ) -> str:
        result = value.get(key)

        if (
            not isinstance(result, str)
            or not result.strip()
        ):
            raise MarketplaceManifestError(
                f"{label} is missing."
            )

        return result.strip()
