from __future__ import annotations

import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_portfolio_transaction import (
    MarketplacePortfolioInstallItem,
    MarketplacePortfolioTransactionCoordinator,
    MarketplacePortfolioTransactionRequest,
    MarketplacePortfolioTransactionState,
)


class MarketplacePortfolioTransactionCoordinatorTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.temporary = (
            tempfile.TemporaryDirectory()
        )
        self.root = Path(
            self.temporary.name
        )
        self.sources = (
            self.root
            / "sources"
        )
        self.live = (
            self.root
            / "live"
        )
        self.work = (
            self.root
            / "work"
        )

        self._write_plugin(
            "inventory"
        )
        self._write_plugin(
            "procurement"
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _write_plugin(
        self,
        plugin_id: str,
    ) -> None:
        source = (
            self.sources
            / plugin_id
        )
        (source / "dist").mkdir(
            parents=True
        )
        (source / "plugin.json").write_text(
            json.dumps(
                {
                    "id": plugin_id,
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (
            source
            / "dist"
            / "index.js"
        ).write_text(
            (
                f"module.exports = "
                f"{{ id: '{plugin_id}' }};\n"
            ),
            encoding="utf-8",
        )

    def request(
        self,
        *,
        overwrite: bool = False,
    ) -> MarketplacePortfolioTransactionRequest:
        return MarketplacePortfolioTransactionRequest(
            install_items=(
                MarketplacePortfolioInstallItem(
                    sequence=1,
                    plugin_id="inventory",
                    version="0.1.0",
                ),
                MarketplacePortfolioInstallItem(
                    sequence=2,
                    plugin_id="procurement",
                    version="0.1.0",
                    dependencies=(
                        "inventory",
                    ),
                ),
            ),
            source_directories={
                "inventory": (
                    self.sources
                    / "inventory"
                ),
                "procurement": (
                    self.sources
                    / "procurement"
                ),
            },
            install_root=self.live,
            work_root=self.work,
            overwrite=overwrite,
        )

    def test_installs_complete_portfolio(
        self,
    ) -> None:
        result = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(),
                transaction_id="portfolio-1",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            result.state,
            MarketplacePortfolioTransactionState.COMMITTED,
        )
        self.assertTrue(
            (
                self.live
                / "inventory"
                / "dist"
                / "index.js"
            ).is_file()
        )
        self.assertTrue(
            (
                self.live
                / "procurement"
                / "dist"
                / "index.js"
            ).is_file()
        )
        self.assertEqual(
            len(
                result.plugin_results
            ),
            2,
        )

    def test_rejects_forward_dependency(
        self,
    ) -> None:
        request = (
            MarketplacePortfolioTransactionRequest(
                install_items=(
                    MarketplacePortfolioInstallItem(
                        sequence=1,
                        plugin_id="procurement",
                        version="0.1.0",
                        dependencies=(
                            "inventory",
                        ),
                    ),
                    MarketplacePortfolioInstallItem(
                        sequence=2,
                        plugin_id="inventory",
                        version="0.1.0",
                    ),
                ),
                source_directories={
                    "inventory": (
                        self.sources
                        / "inventory"
                    ),
                    "procurement": (
                        self.sources
                        / "procurement"
                    ),
                },
                install_root=self.live,
                work_root=self.work,
            )
        )

        result = (
            MarketplacePortfolioTransactionCoordinator(
                request,
                transaction_id="portfolio-2",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePortfolioTransactionState.ROLLED_BACK,
        )
        self.assertFalse(
            self.live.exists()
        )

    def test_plugin_failure_rolls_back_candidate(
        self,
    ) -> None:
        def fault(
            point: str,
            plugin_id: str | None,
        ) -> None:
            if (
                point
                == "plugin:after-stage"
                and plugin_id
                == "procurement"
            ):
                raise RuntimeError(
                    "injected plugin failure"
                )

        result = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(),
                transaction_id="portfolio-3",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePortfolioTransactionState.ROLLED_BACK,
        )
        self.assertFalse(
            self.live.exists()
        )
        self.assertEqual(
            len(
                result.plugin_results
            ),
            2,
        )

    def test_existing_live_is_preserved_on_preflight_failure(
        self,
    ) -> None:
        self.live.mkdir()
        (
            self.live
            / "existing.txt"
        ).write_text(
            "existing",
            encoding="utf-8",
        )

        result = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(
                    overwrite=False
                ),
                transaction_id="portfolio-4",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePortfolioTransactionState.ROLLED_BACK,
        )
        self.assertTrue(
            (
                self.live
                / "existing.txt"
            ).is_file()
        )

    def test_overwrite_replaces_live_portfolio(
        self,
    ) -> None:
        self.live.mkdir()
        (
            self.live
            / "existing.txt"
        ).write_text(
            "existing",
            encoding="utf-8",
        )

        result = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(
                    overwrite=True
                ),
                transaction_id="portfolio-5",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertFalse(
            (
                self.live
                / "existing.txt"
            ).exists()
        )
        self.assertTrue(
            (
                self.live
                / "inventory"
                / "plugin.json"
            ).is_file()
        )

    def test_failure_after_backup_restores_live_portfolio(
        self,
    ) -> None:
        self.live.mkdir()
        (
            self.live
            / "existing.txt"
        ).write_text(
            "existing",
            encoding="utf-8",
        )

        def fault(
            point: str,
            plugin_id: str | None,
        ) -> None:
            if point == "after-backup":
                raise RuntimeError(
                    "injected commit failure"
                )

        result = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(
                    overwrite=True
                ),
                transaction_id="portfolio-6",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePortfolioTransactionState.ROLLED_BACK,
        )
        self.assertTrue(
            (
                self.live
                / "existing.txt"
            ).is_file()
        )
        self.assertFalse(
            (
                self.live
                / "inventory"
            ).exists()
        )

    def test_failure_after_promote_restores_live_portfolio(
        self,
    ) -> None:
        self.live.mkdir()
        (
            self.live
            / "existing.txt"
        ).write_text(
            "existing",
            encoding="utf-8",
        )

        def fault(
            point: str,
            plugin_id: str | None,
        ) -> None:
            if point == "after-promote":
                raise RuntimeError(
                    "injected post-promote failure"
                )

        result = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(
                    overwrite=True
                ),
                transaction_id="portfolio-7",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePortfolioTransactionState.ROLLED_BACK,
        )
        self.assertTrue(
            (
                self.live
                / "existing.txt"
            ).is_file()
        )
        self.assertFalse(
            (
                self.live
                / "inventory"
            ).exists()
        )

    def test_journal_records_plugin_order(
        self,
    ) -> None:
        result = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(),
                transaction_id="portfolio-8",
            )
            .execute()
        )

        records = [
            json.loads(line)
            for line in (
                result.journal_path
                .read_text(
                    encoding="utf-8"
                )
                .splitlines()
            )
        ]

        completed = [
            record["details"]["pluginId"]
            for record in records
            if record["event"]
            == "plugin-transaction-complete"
        ]

        self.assertEqual(
            completed,
            [
                "inventory",
                "procurement",
            ],
        )

    def test_result_is_deterministic(
        self,
    ) -> None:
        first = (
            MarketplacePortfolioTransactionCoordinator(
                self.request(),
                transaction_id="portfolio-9a",
            )
            .execute()
        )

        second_request = (
            MarketplacePortfolioTransactionRequest(
                install_items=(
                    self.request()
                    .install_items
                ),
                source_directories=(
                    self.request()
                    .source_directories
                ),
                install_root=(
                    self.root
                    / "second-live"
                ),
                work_root=(
                    self.root
                    / "second-work"
                ),
            )
        )

        second = (
            MarketplacePortfolioTransactionCoordinator(
                second_request,
                transaction_id="portfolio-9b",
            )
            .execute()
        )

        self.assertEqual(
            first.state,
            second.state,
        )
        self.assertEqual(
            first.issues,
            second.issues,
        )
        self.assertEqual(
            tuple(
                result.plugin_id
                for result
                in first.plugin_results
            ),
            tuple(
                result.plugin_id
                for result
                in second.plugin_results
            ),
        )


if __name__ == "__main__":
    unittest.main()
