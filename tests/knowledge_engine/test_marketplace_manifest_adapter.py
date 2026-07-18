from __future__ import annotations

import unittest

from tools.knowledge_engine.marketplace_manifest_adapter import (
    MarketplaceManifestAdapter,
    MarketplaceManifestError,
    MarketplacePluginIdentity,
)


def manifests():
    return {
        "helpdesk": {
            "id": "helpdesk",
            "name": "Helpdesk",
            "version": "0.1.0",
            "entrypoint": "src/index.ts",
            "dependencies": [
                "audit",
                "auth",
                "database:postgres",
                "eventbus",
                "plugin",
                "scheduler",
                "search",
            ],
            "materialization": {
                "mode": "staged-copy"
            },
        },
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
        },
    }


def adapter():
    source = manifests()

    return MarketplaceManifestAdapter(
        catalog=(
            MarketplaceManifestAdapter
            .catalog_from_manifests(source)
        )
    )


class MarketplacePluginIdentityTest(
    unittest.TestCase
):
    def test_builds_dependency_specifier(
        self,
    ) -> None:
        identity = (
            MarketplacePluginIdentity(
                plugin_id="inventory",
                name="Inventory",
                version="0.1.0",
            )
        )

        self.assertEqual(
            "Inventory@0.1.0",
            identity.dependency_specifier,
        )

    def test_rejects_invalid_version(
        self,
    ) -> None:
        with self.assertRaises(
            MarketplaceManifestError
        ):
            MarketplacePluginIdentity(
                plugin_id="inventory",
                name="Inventory",
                version="latest",
            )


class MarketplaceManifestAdapterTest(
    unittest.TestCase
):
    def test_adds_installer_required_fields(
        self,
    ) -> None:
        adapted = adapter().adapt(
            manifests()["helpdesk"]
        )

        self.assertEqual(
            "PropertyOS",
            adapted["provider"],
        )
        self.assertEqual(
            "0.1.0",
            adapted[
                "minimumPlatformVersion"
            ],
        )
        self.assertEqual(
            "dist/index.js",
            adapted["entrypoint"],
        )
        self.assertEqual(
            "dist/index.js",
            adapted["bootstrap"],
        )

    def test_separates_platform_capabilities(
        self,
    ) -> None:
        adapted = adapter().adapt(
            manifests()["helpdesk"]
        )

        self.assertEqual(
            [],
            adapted["dependencies"],
        )
        self.assertIn(
            "auth",
            adapted[
                "platformCapabilities"
            ],
        )
        self.assertIn(
            "database:postgres",
            adapted[
                "platformCapabilities"
            ],
        )

    def test_versions_plugin_dependencies(
        self,
    ) -> None:
        adapted = adapter().adapt(
            manifests()["procurement"]
        )

        self.assertEqual(
            ["Inventory@0.1.0"],
            adapted["dependencies"],
        )
        self.assertNotIn(
            "inventory",
            adapted[
                "platformCapabilities"
            ],
        )

    def test_removes_materialization_metadata(
        self,
    ) -> None:
        adapted = adapter().adapt(
            manifests()["helpdesk"]
        )

        self.assertNotIn(
            "materialization",
            adapted,
        )

    def test_adapted_manifest_has_no_issues(
        self,
    ) -> None:
        adapted = adapter().adapt(
            manifests()["procurement"]
        )

        self.assertEqual(
            (),
            adapter().issue_codes(
                adapted
            ),
        )

    def test_rejects_unknown_plugin_dependency(
        self,
    ) -> None:
        source = manifests()
        source["helpdesk"][
            "dependencies"
        ].append("missing-plugin")

        with self.assertRaisesRegex(
            MarketplaceManifestError,
            "Unknown plugin dependency",
        ):
            adapter().adapt(
                source["helpdesk"]
            )

    def test_adapts_portfolio_deterministically(
        self,
    ) -> None:
        source = manifests()
        adapted = (
            adapter().adapt_portfolio(
                source
            )
        )

        self.assertEqual(
            (
                "helpdesk",
                "inventory",
                "procurement",
            ),
            tuple(adapted),
        )

    def test_catalog_rejects_key_mismatch(
        self,
    ) -> None:
        source = {
            "wrong": manifests()[
                "helpdesk"
            ]
        }

        with self.assertRaises(
            MarketplaceManifestError
        ):
            (
                MarketplaceManifestAdapter
                .catalog_from_manifests(
                    source
                )
            )


if __name__ == "__main__":
    unittest.main()
