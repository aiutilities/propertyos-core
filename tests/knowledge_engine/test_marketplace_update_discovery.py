from __future__ import annotations

import unittest

from tools.knowledge_engine.marketplace_update_discovery import (
    MarketplaceInstalledPlugin,
    MarketplaceUpdateDiscoveryEngine,
    MarketplaceUpdateDiscoveryRequest,
    MarketplaceUpdateKind,
)


def repository_index():
    return {
        "plugins": [
            {
                "id": "inventory",
                "publisherId": "cogzidel",
                "releases": [
                    {
                        "version": "0.1.1",
                        "minimumHostApi": "0.1.0",
                        "maximumHostApi": "0.3.0",
                        "archiveUrl": "https://example/inventory-0.1.1.tgz",
                        "archiveSha256": "a" * 64,
                        "manifestUrl": "https://example/inventory-0.1.1.json",
                        "signature": {
                            "algorithm": "ed25519",
                            "keyId": "cogzidel-primary",
                            "value": "SIGNATURE",
                        },
                        "yanked": False,
                    },
                    {
                        "version": "0.2.0",
                        "minimumHostApi": "0.2.0",
                        "maximumHostApi": "0.3.0",
                        "archiveUrl": "https://example/inventory-0.2.0.tgz",
                        "archiveSha256": "b" * 64,
                        "manifestUrl": "https://example/inventory-0.2.0.json",
                        "signature": {
                            "algorithm": "ed25519",
                            "keyId": "cogzidel-primary",
                            "value": "SIGNATURE",
                        },
                        "yanked": False,
                    },
                    {
                        "version": "1.0.0",
                        "minimumHostApi": "0.2.0",
                        "maximumHostApi": "0.3.0",
                        "archiveUrl": "https://example/inventory-1.0.0.tgz",
                        "archiveSha256": "c" * 64,
                        "manifestUrl": "https://example/inventory-1.0.0.json",
                        "signature": {
                            "algorithm": "ed25519",
                            "keyId": "cogzidel-primary",
                            "value": "SIGNATURE",
                        },
                        "yanked": False,
                    },
                ],
            },
            {
                "id": "procurement",
                "publisherId": "cogzidel",
                "releases": [
                    {
                        "version": "0.2.0",
                        "minimumHostApi": "0.1.0",
                        "maximumHostApi": "0.3.0",
                        "archiveUrl": "https://example/procurement-0.2.0.tgz",
                        "archiveSha256": "d" * 64,
                        "manifestUrl": "https://example/procurement-0.2.0.json",
                        "signature": {
                            "algorithm": "ed25519",
                            "keyId": "cogzidel-primary",
                            "value": "SIGNATURE",
                        },
                        "yanked": True,
                    }
                ],
            },
        ]
    }


class MarketplaceUpdateDiscoveryEngineTest(
    unittest.TestCase
):
    def setUp(
        self,
    ) -> None:
        self.engine = (
            MarketplaceUpdateDiscoveryEngine()
        )

    def request(
        self,
        **overrides,
    ) -> MarketplaceUpdateDiscoveryRequest:
        values = {
            "installed_plugins": (
                MarketplaceInstalledPlugin(
                    plugin_id="inventory",
                    version="0.1.0",
                ),
                MarketplaceInstalledPlugin(
                    plugin_id="procurement",
                    version="0.1.0",
                ),
            ),
            "repository_index": repository_index(),
            "host_api_version": "0.2.0",
            "include_yanked": False,
            "allow_major": True,
            "allow_minor": True,
            "allow_patch": True,
        }
        values.update(
            overrides
        )
        return MarketplaceUpdateDiscoveryRequest(
            **values
        )

    def test_selects_highest_eligible_release(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request()
        )

        inventory = next(
            update
            for update in result.updates
            if update.plugin_id
            == "inventory"
        )

        self.assertEqual(
            inventory.target_version,
            "1.0.0",
        )
        self.assertEqual(
            inventory.update_kind,
            MarketplaceUpdateKind.MAJOR,
        )

    def test_excludes_yanked_by_default(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request()
        )

        self.assertNotIn(
            "procurement",
            tuple(
                update.plugin_id
                for update in result.updates
            ),
        )

    def test_includes_yanked_when_requested(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request(
                include_yanked=True
            )
        )

        procurement = next(
            update
            for update in result.updates
            if update.plugin_id
            == "procurement"
        )

        self.assertEqual(
            procurement.target_version,
            "0.2.0",
        )

    def test_respects_major_update_policy(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request(
                allow_major=False
            )
        )

        inventory = next(
            update
            for update in result.updates
            if update.plugin_id
            == "inventory"
        )

        self.assertEqual(
            inventory.target_version,
            "0.2.0",
        )
        self.assertEqual(
            inventory.update_kind,
            MarketplaceUpdateKind.MINOR,
        )

    def test_respects_minor_update_policy(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request(
                allow_major=False,
                allow_minor=False,
            )
        )

        inventory = next(
            update
            for update in result.updates
            if update.plugin_id
            == "inventory"
        )

        self.assertEqual(
            inventory.target_version,
            "0.1.1",
        )
        self.assertEqual(
            inventory.update_kind,
            MarketplaceUpdateKind.PATCH,
        )

    def test_filters_incompatible_host_api(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request(
                host_api_version="0.1.5"
            )
        )

        inventory = next(
            update
            for update in result.updates
            if update.plugin_id
            == "inventory"
        )

        self.assertEqual(
            inventory.target_version,
            "0.1.1",
        )

    def test_reports_missing_repository_plugin(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request(
                installed_plugins=(
                    MarketplaceInstalledPlugin(
                        plugin_id="missing",
                        version="0.1.0",
                    ),
                )
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "PLUGIN_NOT_IN_REPOSITORY"
                for issue in result.issues
            )
        )

    def test_rejects_duplicate_installed_plugin(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            self.engine.discover(
                self.request(
                    installed_plugins=(
                        MarketplaceInstalledPlugin(
                            plugin_id="inventory",
                            version="0.1.0",
                        ),
                        MarketplaceInstalledPlugin(
                            plugin_id="inventory",
                            version="0.1.0",
                        ),
                    )
                )
            )

    def test_result_is_deterministic(
        self,
    ) -> None:
        request = self.request()

        first = self.engine.discover(
            request
        )
        second = self.engine.discover(
            request
        )

        self.assertEqual(
            first,
            second,
        )

    def test_no_downgrade_is_proposed(
        self,
    ) -> None:
        result = self.engine.discover(
            self.request(
                installed_plugins=(
                    MarketplaceInstalledPlugin(
                        plugin_id="inventory",
                        version="2.0.0",
                    ),
                )
            )
        )

        self.assertFalse(
            result.has_updates
        )


if __name__ == "__main__":
    unittest.main()
