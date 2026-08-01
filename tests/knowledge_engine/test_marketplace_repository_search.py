from __future__ import annotations

import unittest

from tools.knowledge_engine.marketplace_repository_search import (
    MarketplaceRepositorySearchEngine,
    MarketplaceSearchQuery,
)


def repository_index():
    return {
        "plugins": [
            {
                "id": "inventory",
                "displayName": "Inventory",
                "summary": "Stock and warehouse operations.",
                "publisherId": "cogzidel",
                "latestVersion": "0.2.0",
                "releases": [
                    {
                        "version": "0.1.0",
                        "minimumHostApi": "0.1.0",
                        "maximumHostApi": "0.1.9",
                        "yanked": False,
                    },
                    {
                        "version": "0.2.0",
                        "minimumHostApi": "0.2.0",
                        "maximumHostApi": "0.3.0",
                        "yanked": False,
                    },
                ],
            },
            {
                "id": "procurement",
                "displayName": "Procurement",
                "summary": "Purchase and vendor workflows.",
                "publisherId": "cogzidel",
                "latestVersion": "1.0.0",
                "releases": [
                    {
                        "version": "1.0.0",
                        "minimumHostApi": "0.1.0",
                        "maximumHostApi": "0.3.0",
                        "yanked": False,
                    }
                ],
            },
            {
                "id": "legacy-report",
                "displayName": "Legacy Report",
                "summary": "Old reporting extension.",
                "publisherId": "third-party",
                "latestVersion": "0.9.0",
                "releases": [
                    {
                        "version": "0.9.0",
                        "minimumHostApi": "0.1.0",
                        "maximumHostApi": "0.1.0",
                        "yanked": True,
                    }
                ],
            },
        ]
    }


class MarketplaceRepositorySearchEngineTest(
    unittest.TestCase
):
    def setUp(
        self,
    ) -> None:
        self.engine = (
            MarketplaceRepositorySearchEngine()
        )

    def test_searches_plugin_id(
        self,
    ) -> None:
        result = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                text="inventory"
            ),
        )

        self.assertEqual(
            result.total,
            1,
        )
        self.assertEqual(
            result.hits[
                0
            ].plugin_id,
            "inventory",
        )
        self.assertIn(
            "pluginId",
            result.hits[
                0
            ].matched_fields,
        )

    def test_searches_summary(
        self,
    ) -> None:
        result = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                text="warehouse"
            ),
        )

        self.assertEqual(
            result.hits[
                0
            ].plugin_id,
            "inventory",
        )
        self.assertIn(
            "summary",
            result.hits[
                0
            ].matched_fields,
        )

    def test_filters_by_publisher(
        self,
    ) -> None:
        result = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                publisher_id="third-party",
                include_yanked=True,
            ),
        )

        self.assertEqual(
            result.total,
            1,
        )
        self.assertEqual(
            result.hits[
                0
            ].plugin_id,
            "legacy-report",
        )

    def test_filters_by_host_compatibility(
        self,
    ) -> None:
        result = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                host_api_version="0.2.0",
            ),
        )

        self.assertEqual(
            tuple(
                hit.plugin_id
                for hit in result.hits
            ),
            (
                "inventory",
                "procurement",
            ),
        )

        inventory = next(
            hit
            for hit in result.hits
            if hit.plugin_id
            == "inventory"
        )

        self.assertEqual(
            inventory.compatible_versions,
            (
                "0.2.0",
            ),
        )

    def test_excludes_yanked_by_default(
        self,
    ) -> None:
        result = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(),
        )

        self.assertNotIn(
            "legacy-report",
            tuple(
                hit.plugin_id
                for hit in result.hits
            ),
        )

    def test_includes_yanked_when_requested(
        self,
    ) -> None:
        result = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                include_yanked=True,
            ),
        )

        self.assertIn(
            "legacy-report",
            tuple(
                hit.plugin_id
                for hit in result.hits
            ),
        )

    def test_searches_release_version(
        self,
    ) -> None:
        result = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                text="1.0.0"
            ),
        )

        self.assertEqual(
            result.hits[
                0
            ].plugin_id,
            "procurement",
        )
        self.assertIn(
            "versions",
            result.hits[
                0
            ].matched_fields,
        )

    def test_paginates_deterministically(
        self,
    ) -> None:
        first = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                include_yanked=True,
                page=1,
                page_size=2,
            ),
        )

        second = self.engine.search(
            repository_index(),
            MarketplaceSearchQuery(
                include_yanked=True,
                page=2,
                page_size=2,
            ),
        )

        self.assertEqual(
            first.total,
            3,
        )
        self.assertEqual(
            first.page_count,
            2,
        )
        self.assertEqual(
            len(
                first.hits
            ),
            2,
        )
        self.assertEqual(
            len(
                second.hits
            ),
            1,
        )

    def test_result_is_deterministic(
        self,
    ) -> None:
        query = MarketplaceSearchQuery(
            text="inventory",
            include_yanked=True,
        )

        first = self.engine.search(
            repository_index(),
            query,
        )
        second = self.engine.search(
            repository_index(),
            query,
        )

        self.assertEqual(
            first,
            second,
        )

    def test_rejects_invalid_page_size(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            self.engine.search(
                repository_index(),
                MarketplaceSearchQuery(
                    page_size=101,
                ),
            )

    def test_discover_returns_non_yanked_plugins(
        self,
    ) -> None:
        result = self.engine.discover(
            repository_index(),
            limit=10,
        )

        self.assertEqual(
            result.total,
            2,
        )


if __name__ == "__main__":
    unittest.main()
