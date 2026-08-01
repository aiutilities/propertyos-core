from __future__ import annotations

import copy
import hashlib
import re

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Sequence, Tuple

from .marketplace_manifest_adapter import (
    MarketplaceManifestAdapter,
    MarketplaceManifestError,
)
from .native_schema_validator import (
    NativeSchemaIssue,
    NativeSchemaValidationError,
    NativeSchemaValidator,
)


_PERMISSION_PATTERN = re.compile(
    r"^[a-z][a-z0-9-]*:"
    r"[a-z][a-z0-9-]*$"
)

_SAFE_ENTRYPOINT_PATTERN = re.compile(
    r"^dist/[A-Za-z0-9_./-]+\.js$"
)


@dataclass(frozen=True)
class MarketplacePublisherContext:
    publisher_id: str
    name: str
    key_id: str | None = None

    def as_manifest(
        self,
    ) -> dict[str, str]:
        result = {
            "id": self.publisher_id,
            "name": self.name,
        }

        if self.key_id is not None:
            result["keyId"] = self.key_id

        return result


@dataclass(frozen=True)
class MarketplaceEngineContext:
    minimum_host_api: str
    maximum_host_api: str
    node_range: str


@dataclass(frozen=True)
class MarketplaceContractDependency:
    package_name: str
    version: str

    def as_manifest(
        self,
    ) -> dict[str, str]:
        return {
            "package": self.package_name,
            "version": self.version,
        }


@dataclass(frozen=True)
class MarketplaceMigrationContext:
    strategy: str
    reversible: bool
    directory: str | None = None

    def as_manifest(
        self,
    ) -> dict[str, Any]:
        result: dict[str, Any] = {
            "strategy": self.strategy,
            "reversible": self.reversible,
        }

        if self.directory is not None:
            result["directory"] = self.directory

        return result


@dataclass(frozen=True)
class MarketplaceSignatureContext:
    algorithm: str
    key_id: str
    value: str

    def as_manifest(
        self,
    ) -> dict[str, str]:
        return {
            "algorithm": self.algorithm,
            "keyId": self.key_id,
            "value": self.value,
        }


@dataclass(frozen=True)
class MarketplaceContractV1Context:
    publisher: MarketplacePublisherContext
    engine: MarketplaceEngineContext
    contracts: Tuple[
        MarketplaceContractDependency,
        ...,
    ]
    migrations: MarketplaceMigrationContext
    archive_sha256: str
    signature: MarketplaceSignatureContext | None = None
    capabilities: Tuple[str, ...] = ()
    lifecycle: Mapping[str, str] | None = None
    description: str | None = None
    license_name: str | None = None
    homepage: str | None = None
    repository: str | None = None


class MarketplaceContractV1Adapter:
    SCHEMA_VERSION = "1.0.0"

    CAPABILITY_MAP = {
        "plugin": "permissions",
        "scheduler": "scheduler",
        "search": "search",
        "workflow": "workflow",
    }

    def __init__(
        self,
        legacy_adapter: MarketplaceManifestAdapter,
        schema_path: Path,
    ) -> None:
        self._legacy_adapter = (
            legacy_adapter
        )
        self._validator = (
            NativeSchemaValidator
            .from_path(
                schema_path
            )
        )

    def adapt(
        self,
        legacy_manifest: Mapping[
            str,
            Any,
        ],
        context: MarketplaceContractV1Context,
    ) -> dict[str, Any]:
        original = copy.deepcopy(
            dict(legacy_manifest)
        )

        installer_manifest = (
            self._legacy_adapter
            .adapt(
                original
            )
        )

        permissions = (
            self._normalize_permissions(
                original.get(
                    "permissions",
                    [],
                )
            )
        )

        capabilities = (
            self._normalize_capabilities(
                installer_manifest.get(
                    "platformCapabilities",
                    [],
                ),
                context.capabilities,
            )
        )

        dependencies = (
            self._normalize_dependencies(
                installer_manifest.get(
                    "dependencies",
                    [],
                )
            )
        )

        entrypoint = (
            installer_manifest.get(
                "entrypoint",
                "dist/index.js",
            )
        )

        if not isinstance(
            entrypoint,
            str,
        ):
            raise MarketplaceManifestError(
                "Marketplace entrypoint must "
                "be a string."
            )

        if (
            _SAFE_ENTRYPOINT_PATTERN
            .fullmatch(
                entrypoint
            )
            is None
        ):
            raise MarketplaceManifestError(
                "Marketplace entrypoint must "
                "resolve inside dist."
            )

        result: dict[str, Any] = {
            "schemaVersion": (
                self.SCHEMA_VERSION
            ),
            "id": installer_manifest[
                "id"
            ],
            "displayName": (
                installer_manifest[
                    "name"
                ]
            ),
            "version": (
                installer_manifest[
                    "version"
                ]
            ),
            "publisher": (
                context.publisher
                .as_manifest()
            ),
            "engine": {
                "hostApi": {
                    "minimum": (
                        context.engine
                        .minimum_host_api
                    ),
                    "maximum": (
                        context.engine
                        .maximum_host_api
                    ),
                },
                "node": (
                    context.engine
                    .node_range
                ),
            },
            "contracts": [
                contract.as_manifest()
                for contract in sorted(
                    context.contracts,
                    key=(
                        lambda item: (
                            item.package_name,
                            item.version,
                        )
                    ),
                )
            ],
            "entrypoint": entrypoint,
            "permissions": list(
                permissions
            ),
            "capabilities": list(
                capabilities
            ),
            "dependencies": list(
                dependencies
            ),
            "migrations": (
                context.migrations
                .as_manifest()
            ),
            "integrity": {
                "algorithm": "sha256",
                "archiveSha256": (
                    context.archive_sha256
                ),
            },
        }

        if context.signature is not None:
            result[
                "integrity"
            ][
                "signature"
            ] = (
                context.signature
                .as_manifest()
            )

        lifecycle = (
            self._normalize_lifecycle(
                context.lifecycle
            )
        )

        if lifecycle:
            result[
                "lifecycle"
            ] = lifecycle

        optional = {
            "description": (
                context.description
            ),
            "license": (
                context.license_name
            ),
            "homepage": (
                context.homepage
            ),
            "repository": (
                context.repository
            ),
        }

        for key in sorted(optional):
            value = optional[key]

            if value is not None:
                result[key] = value

        self._validator.require_valid(
            result
        )

        if original != dict(
            legacy_manifest
        ):
            raise MarketplaceManifestError(
                "Legacy manifest was mutated "
                "during adaptation."
            )

        return result

    def adapt_portfolio(
        self,
        manifests: Mapping[
            str,
            Mapping[
                str,
                Any,
            ],
        ],
        contexts: Mapping[
            str,
            MarketplaceContractV1Context,
        ],
    ) -> dict[
        str,
        dict[str, Any],
    ]:
        if set(manifests) != set(
            contexts
        ):
            missing_context = sorted(
                set(manifests)
                - set(contexts)
            )

            unknown_context = sorted(
                set(contexts)
                - set(manifests)
            )

            raise MarketplaceManifestError(
                "Marketplace Contract-v1 "
                "portfolio mismatch: "
                f"missing contexts={missing_context}; "
                f"unknown contexts={unknown_context}"
            )

        return {
            plugin_id: self.adapt(
                manifests[plugin_id],
                contexts[plugin_id],
            )
            for plugin_id in sorted(
                manifests
            )
        }

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

    @staticmethod
    def _normalize_permissions(
        value: object,
    ) -> Tuple[str, ...]:
        if not isinstance(
            value,
            (list, tuple),
        ):
            raise MarketplaceManifestError(
                "Marketplace permissions must "
                "be an array."
            )

        normalized = []

        for item in value:
            if not isinstance(
                item,
                str,
            ):
                raise MarketplaceManifestError(
                    "Marketplace permissions must "
                    "be strings."
                )

            permission = item.strip()

            if (
                len(permission) >= 2
                and permission[0]
                == permission[-1]
                and permission[0]
                in {
                    "'",
                    '"',
                }
            ):
                permission = (
                    permission[1:-1]
                    .strip()
                )

            permission = (
                permission
                .lower()
                .replace(
                    ".",
                    ":",
                )
                .replace(
                    "_",
                    "-",
                )
            )

            if (
                _PERMISSION_PATTERN
                .fullmatch(
                    permission
                )
                is None
            ):
                raise MarketplaceManifestError(
                    "Invalid marketplace permission: "
                    f"{item}"
                )

            normalized.append(
                permission
            )

        return tuple(
            sorted(
                set(normalized)
            )
        )

    @classmethod
    def _normalize_capabilities(
        cls,
        platform_capabilities: object,
        explicit_capabilities: Sequence[
            str,
        ],
    ) -> Tuple[str, ...]:
        if not isinstance(
            platform_capabilities,
            (list, tuple),
        ):
            raise MarketplaceManifestError(
                "Platform capabilities must "
                "be an array."
            )

        result = set(
            explicit_capabilities
        )

        for capability in (
            platform_capabilities
        ):
            mapped = cls.CAPABILITY_MAP.get(
                str(capability)
            )

            if mapped is not None:
                result.add(mapped)

        return tuple(
            sorted(result)
        )

    @staticmethod
    def _normalize_dependencies(
        value: object,
    ) -> Tuple[
        dict[str, Any],
        ...,
    ]:
        if not isinstance(
            value,
            (list, tuple),
        ):
            raise MarketplaceManifestError(
                "Plugin dependencies must "
                "be an array."
            )

        normalized = []

        for dependency in value:
            if not isinstance(
                dependency,
                str,
            ):
                raise MarketplaceManifestError(
                    "Plugin dependencies must "
                    "be strings."
                )

            if "@" not in dependency:
                raise MarketplaceManifestError(
                    "Versioned plugin dependency "
                    f"is required: {dependency}"
                )

            package_name, version = (
                dependency.rsplit(
                    "@",
                    maxsplit=1,
                )
            )

            plugin_id = (
                package_name.strip()
                .lower()
                .replace(
                    " ",
                    "-",
                )
            )

            normalized.append(
                {
                    "pluginId": plugin_id,
                    "version": version,
                    "optional": False,
                }
            )

        return tuple(
            sorted(
                normalized,
                key=(
                    lambda item: (
                        item["pluginId"],
                        item["version"],
                        item["optional"],
                    )
                ),
            )
        )

    @staticmethod
    def _normalize_lifecycle(
        lifecycle: Mapping[
            str,
            str,
        ]
        | None,
    ) -> dict[str, str]:
        if lifecycle is None:
            return {}

        allowed = {
            "install",
            "activate",
            "deactivate",
            "uninstall",
        }

        unknown = sorted(
            set(lifecycle)
            - allowed
        )

        if unknown:
            raise MarketplaceManifestError(
                "Unknown lifecycle hooks: "
                + ", ".join(unknown)
            )

        result = {}

        for key in sorted(lifecycle):
            value = lifecycle[key]

            if (
                not isinstance(
                    value,
                    str,
                )
                or (
                    _SAFE_ENTRYPOINT_PATTERN
                    .fullmatch(
                        value
                    )
                    is None
                )
            ):
                raise MarketplaceManifestError(
                    "Lifecycle entrypoint must "
                    f"resolve inside dist: {key}"
                )

            result[key] = value

        return result


__all__ = [
    "MarketplaceContractDependency",
    "MarketplaceContractV1Adapter",
    "MarketplaceContractV1Context",
    "MarketplaceEngineContext",
    "MarketplaceMigrationContext",
    "MarketplacePublisherContext",
    "MarketplaceSignatureContext",
    "NativeSchemaIssue",
    "NativeSchemaValidationError",
]
