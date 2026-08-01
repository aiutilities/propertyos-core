from __future__ import annotations

import copy
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_contract_v1_adapter import (
    MarketplaceContractDependency,
    MarketplaceContractV1Adapter,
    MarketplaceContractV1Context,
    MarketplaceEngineContext,
    MarketplaceMigrationContext,
    MarketplacePublisherContext,
    MarketplaceSignatureContext,
)
from tools.knowledge_engine.marketplace_manifest_adapter import (
    MarketplaceManifestAdapter,
    MarketplaceManifestError,
)


ROOT = Path(__file__).resolve().parents[2]

SCHEMA_PATH = (
    ROOT
    / "tools"
    / "knowledge_engine"
    / "contracts"
    / "marketplace_plugin_manifest.schema.json"
)


def manifests():
    return {
        "inventory": {
            "id": "inventory",
            "name": "Inventory",
            "version": "0.1.0",
            "entrypoint": "src/index.ts",
            "dependencies": [
                "audit",
                "auth",
                "database:postgres",
                "eventbus",
                "plugin",
                "search",
            ],
            "permissions": [
                "inventory.read",
                "inventory:write",
                "inventory.read",
            ],
            "materialization": {
                "mode": "staged-copy"
            },
        },
        "procurement": {
            "id": "procurement",
            "name": "Procurement",
            "version": "0.1.0",
            "entrypoint": "src/index.ts",
            "dependencies": [
                "audit",
                "auth",
                "database:postgres",
                "eventbus",
                "inventory",
                "plugin",
            ],
            "permissions": [
                "procurement:read"
            ],
        },
    }


def legacy_adapter():
    source = manifests()

    return MarketplaceManifestAdapter(
        catalog=(
            MarketplaceManifestAdapter
            .catalog_from_manifests(
                source
            )
        )
    )


def context(
    *,
    archive_sha256: str = "a" * 64,
):
    return MarketplaceContractV1Context(
        publisher=(
            MarketplacePublisherContext(
                publisher_id="cogzidel",
                name=(
                    "Cogzidel Technologies"
                ),
                key_id=(
                    "cogzidel-primary"
                ),
            )
        ),
        engine=(
            MarketplaceEngineContext(
                minimum_host_api="0.1.0",
                maximum_host_api="0.1.0",
                node_range=">=20",
            )
        ),
        contracts=(
            MarketplaceContractDependency(
                package_name=(
                    "@propertyos/"
                    "core-contracts"
                ),
                version="0.1.0",
            ),
        ),
        migrations=(
            MarketplaceMigrationContext(
                strategy="none",
                reversible=True,
            )
        ),
        archive_sha256=(
            archive_sha256
        ),
        signature=(
            MarketplaceSignatureContext(
                algorithm="ed25519",
                key_id=(
                    "cogzidel-primary"
                ),
                value=(
                    "EXAMPLE_SIGNATURE"
                ),
            )
        ),
        lifecycle={
            "activate": "dist/index.js",
            "deactivate": "dist/index.js",
        },
        description=(
            "Certified PropertyOS plugin."
        ),
        license_name="Apache-2.0",
    )


def adapter():
    return MarketplaceContractV1Adapter(
        legacy_adapter=legacy_adapter(),
        schema_path=SCHEMA_PATH,
    )


class MarketplaceContractV1AdapterTest(
    unittest.TestCase
):
    def test_adapts_legacy_manifest_to_v1(
        self,
    ) -> None:
        result = adapter().adapt(
            manifests()["inventory"],
            context(),
        )

        self.assertEqual(
            result["schemaVersion"],
            "1.0.0",
        )

        self.assertEqual(
            result["id"],
            "inventory",
        )

        self.assertEqual(
            result["displayName"],
            "Inventory",
        )

        self.assertEqual(
            result["entrypoint"],
            "dist/index.js",
        )

    def test_normalizes_permissions(
        self,
    ) -> None:
        result = adapter().adapt(
            manifests()["inventory"],
            context(),
        )

        self.assertEqual(
            result["permissions"],
            [
                "inventory:read",
                "inventory:write",
            ],
        )

    def test_normalizes_single_quoted_legacy_permissions(
        self,
    ) -> None:
        manifest = manifests()[
            "inventory"
        ]

        manifest[
            "permissions"
        ] = [
            "'inventory.create'",
            "'inventory.read'",
        ]

        result = adapter().adapt(
            manifest,
            context(),
        )

        self.assertEqual(
            result["permissions"],
            [
                "inventory:create",
                "inventory:read",
            ],
        )

    def test_normalizes_double_quoted_legacy_permissions(
        self,
    ) -> None:
        manifest = manifests()[
            "inventory"
        ]

        manifest[
            "permissions"
        ] = [
            '"inventory.create"',
            '"inventory.read"',
        ]

        result = adapter().adapt(
            manifest,
            context(),
        )

        self.assertEqual(
            result["permissions"],
            [
                "inventory:create",
                "inventory:read",
            ],
        )

    def test_rejects_unbalanced_legacy_permission_quote(
        self,
    ) -> None:
        manifest = manifests()[
            "inventory"
        ]

        manifest[
            "permissions"
        ] = [
            "'inventory.create",
        ]

        with self.assertRaisesRegex(
            MarketplaceManifestError,
            "Invalid marketplace permission",
        ):
            adapter().adapt(
                manifest,
                context(),
            )

    def test_maps_platform_capabilities(
        self,
    ) -> None:
        result = adapter().adapt(
            manifests()["inventory"],
            context(),
        )

        self.assertEqual(
            result["capabilities"],
            [
                "permissions",
                "search",
            ],
        )

    def test_versions_plugin_dependencies(
        self,
    ) -> None:
        result = adapter().adapt(
            manifests()["procurement"],
            context(),
        )

        self.assertEqual(
            result["dependencies"],
            [
                {
                    "pluginId": "inventory",
                    "version": "0.1.0",
                    "optional": False,
                }
            ],
        )

    def test_injects_integrity_and_signature(
        self,
    ) -> None:
        result = adapter().adapt(
            manifests()["inventory"],
            context(),
        )

        self.assertEqual(
            result[
                "integrity"
            ][
                "archiveSha256"
            ],
            "a" * 64,
        )

        self.assertEqual(
            result[
                "integrity"
            ][
                "signature"
            ][
                "algorithm"
            ],
            "ed25519",
        )

    def test_drops_repository_metadata(
        self,
    ) -> None:
        result = adapter().adapt(
            manifests()["inventory"],
            context(),
        )

        for key in (
            "materialization",
            "controllers",
            "routes",
            "moduleClass",
            "package",
            "type",
            "name",
            "provider",
            "bootstrap",
            "platformCapabilities",
        ):
            self.assertNotIn(
                key,
                result,
            )

    def test_preserves_original_manifest(
        self,
    ) -> None:
        original = manifests()[
            "inventory"
        ]

        before = copy.deepcopy(
            original
        )

        adapter().adapt(
            original,
            context(),
        )

        self.assertEqual(
            original,
            before,
        )

    def test_output_is_deterministic(
        self,
    ) -> None:
        manifest = manifests()[
            "inventory"
        ]

        first = adapter().adapt(
            manifest,
            context(),
        )

        second = adapter().adapt(
            manifest,
            context(),
        )

        self.assertEqual(
            first,
            second,
        )

    def test_invalid_hash_is_rejected_by_schema(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            adapter().adapt(
                manifests()["inventory"],
                context(
                    archive_sha256="bad"
                ),
            )

    def test_invalid_permission_is_rejected(
        self,
    ) -> None:
        manifest = manifests()[
            "inventory"
        ]

        manifest[
            "permissions"
        ] = [
            "INVALID PERMISSION"
        ]

        with self.assertRaisesRegex(
            MarketplaceManifestError,
            "Invalid marketplace permission",
        ):
            adapter().adapt(
                manifest,
                context(),
            )

    def test_unsafe_lifecycle_is_rejected(
        self,
    ) -> None:
        invalid_context = (
            MarketplaceContractV1Context(
                publisher=(
                    context().publisher
                ),
                engine=(
                    context().engine
                ),
                contracts=(
                    context().contracts
                ),
                migrations=(
                    context().migrations
                ),
                archive_sha256="a" * 64,
                lifecycle={
                    "activate": (
                        "../backend/main.js"
                    )
                },
            )
        )

        with self.assertRaisesRegex(
            MarketplaceManifestError,
            "Lifecycle entrypoint",
        ):
            adapter().adapt(
                manifests()["inventory"],
                invalid_context,
            )

    def test_portfolio_is_sorted(
        self,
    ) -> None:
        source = manifests()

        result = adapter().adapt_portfolio(
            {
                "procurement": (
                    source["procurement"]
                ),
                "inventory": (
                    source["inventory"]
                ),
            },
            {
                "inventory": context(),
                "procurement": context(),
            },
        )

        self.assertEqual(
            tuple(result),
            (
                "inventory",
                "procurement",
            ),
        )

    def test_portfolio_requires_exact_contexts(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            MarketplaceManifestError,
            "portfolio mismatch",
        ):
            adapter().adapt_portfolio(
                manifests(),
                {
                    "inventory": context(),
                },
            )

    def test_archive_sha256_is_correct(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = (
                Path(temporary)
                / "artifact.tgz"
            )

            path.write_bytes(
                b"propertyos"
            )

            self.assertEqual(
                MarketplaceContractV1Adapter
                .archive_sha256(path),
                (
                    "7d8a75ae4880c1b7fcae31d384564521571b466195d02ec621d85bc8ff0a5e81"
                ),
            )


if __name__ == "__main__":
    unittest.main()
