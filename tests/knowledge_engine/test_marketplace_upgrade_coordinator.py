from __future__ import annotations

import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_runtime_activation import (
    MarketplaceRuntimePluginRecord,
    MarketplaceRuntimePluginState,
    MarketplaceRuntimeRegistry,
)
from tools.knowledge_engine.marketplace_upgrade_coordinator import (
    MarketplaceUpgradeCoordinator,
    MarketplaceUpgradeRequest,
    MarketplaceUpgradeState,
)


class MarketplaceUpgradeCoordinatorTest(
    unittest.TestCase
):
    def setUp(
        self,
    ) -> None:
        self.temporary = (
            tempfile.TemporaryDirectory()
        )
        self.root = Path(
            self.temporary.name
        )
        self.install_root = (
            self.root
            / "installed"
        )
        self.work_root = (
            self.root
            / "work"
        )
        self.registry_path = (
            self.root
            / "runtime"
            / "registry.json"
        )
        self.journal_root = (
            self.root
            / "runtime"
            / "journals"
        )

        self._write_installed(
            "0.1.0"
        )
        self.source = self._write_source(
            "0.2.0"
        )

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def _write_installed(
        self,
        version: str,
    ) -> None:
        root = (
            self.install_root
            / "inventory"
        )
        (root / "dist").mkdir(
            parents=True
        )
        (root / "plugin.json").write_text(
            json.dumps(
                {
                    "id": "inventory",
                    "version": version,
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (
            root
            / "dist"
            / "index.js"
        ).write_text(
            (
                "module.exports = "
                + repr(version)
                + ";\n"
            ),
            encoding="utf-8",
        )

        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write(
            {
                "inventory": MarketplaceRuntimePluginRecord(
                    plugin_id="inventory",
                    version=version,
                    install_path=str(
                        root
                    ),
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=1,
                )
            }
        )

    def _write_source(
        self,
        version: str,
    ) -> Path:
        root = (
            self.root
            / (
                "source-"
                + version
            )
        )
        (root / "dist").mkdir(
            parents=True
        )
        (root / "plugin.json").write_text(
            json.dumps(
                {
                    "id": "inventory",
                    "version": version,
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (
            root
            / "dist"
            / "index.js"
        ).write_text(
            (
                "module.exports = "
                + repr(version)
                + ";\n"
            ),
            encoding="utf-8",
        )
        return root

    def request(
        self,
        *,
        target_version: str = "0.2.0",
        source: Path = None,
        allow_downgrade: bool = False,
    ) -> MarketplaceUpgradeRequest:
        return MarketplaceUpgradeRequest(
            plugin_id="inventory",
            target_version=(
                target_version
            ),
            source_directory=(
                self.source
                if source is None
                else source
            ),
            install_root=(
                self.install_root
            ),
            work_root=(
                self.work_root
            ),
            registry_path=(
                self.registry_path
            ),
            journal_root=(
                self.journal_root
            ),
            allow_downgrade=(
                allow_downgrade
            ),
        )

    def test_upgrades_active_plugin(
        self,
    ) -> None:
        calls = []

        result = (
            MarketplaceUpgradeCoordinator(
                self.request(),
                transaction_id="upgrade-1",
                deactivate_hook=(
                    lambda plugin_id:
                    calls.append(
                        (
                            "deactivate",
                            plugin_id,
                        )
                    )
                ),
                activate_hook=(
                    lambda plugin_id, version:
                    calls.append(
                        (
                            "activate",
                            plugin_id,
                            version,
                        )
                    )
                ),
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )

        registry = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
            .load()
        )

        self.assertEqual(
            registry[
                "inventory"
            ].version,
            "0.2.0",
        )
        self.assertEqual(
            registry[
                "inventory"
            ].state,
            MarketplaceRuntimePluginState.ACTIVE,
        )
        self.assertTrue(
            (
                self.install_root
                / "inventory"
                / "dist"
                / "index.js"
            ).read_text(
                encoding="utf-8"
            ).find(
                "0.2.0"
            )
            >= 0
        )

    def test_rejects_downgrade_by_default(
        self,
    ) -> None:
        self.source = self._write_source(
            "0.0.9"
        )

        result = (
            MarketplaceUpgradeCoordinator(
                self.request(
                    target_version="0.0.9"
                ),
                transaction_id="upgrade-2",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUpgradeState.ROLLED_BACK,
        )

    def test_allows_explicit_downgrade(
        self,
    ) -> None:
        self.source = self._write_source(
            "0.0.9"
        )

        result = (
            MarketplaceUpgradeCoordinator(
                self.request(
                    target_version="0.0.9",
                    allow_downgrade=True,
                ),
                transaction_id="upgrade-3",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )

    def test_health_failure_restores_previous_version(
        self,
    ) -> None:
        result = (
            MarketplaceUpgradeCoordinator(
                self.request(),
                transaction_id="upgrade-4",
                health_hook=(
                    lambda plugin_id, version:
                    version == "0.1.0"
                ),
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUpgradeState.ROLLED_BACK,
        )

        registry = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
            .load()
        )

        self.assertEqual(
            registry[
                "inventory"
            ].version,
            "0.1.0",
        )
        self.assertTrue(
            (
                self.install_root
                / "inventory"
                / "dist"
                / "index.js"
            ).read_text(
                encoding="utf-8"
            ).find(
                "0.1.0"
            )
            >= 0
        )

    def test_registry_failure_restores_previous_version(
        self,
    ) -> None:
        def fault(
            point: str,
        ) -> None:
            if (
                point
                == "after-registry-write"
            ):
                raise RuntimeError(
                    "registry failure"
                )

        result = (
            MarketplaceUpgradeCoordinator(
                self.request(),
                transaction_id="upgrade-5",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUpgradeState.ROLLED_BACK,
        )

        registry = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
            .load()
        )

        self.assertEqual(
            registry[
                "inventory"
            ].version,
            "0.1.0",
        )

    def test_rejects_equal_version(
        self,
    ) -> None:
        source = self._write_source(
            "0.1.0"
        )

        result = (
            MarketplaceUpgradeCoordinator(
                self.request(
                    target_version="0.1.0",
                    source=source,
                ),
                transaction_id="upgrade-6",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUpgradeState.ROLLED_BACK,
        )

    def test_rejects_source_id_mismatch(
        self,
    ) -> None:
        (
            self.source
            / "plugin.json"
        ).write_text(
            json.dumps(
                {
                    "id": "wrong",
                    "version": "0.2.0",
                }
            )
            + "\n",
            encoding="utf-8",
        )

        result = (
            MarketplaceUpgradeCoordinator(
                self.request(),
                transaction_id="upgrade-7",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUpgradeState.ROLLED_BACK,
        )

    def test_journal_records_commit(
        self,
    ) -> None:
        result = (
            MarketplaceUpgradeCoordinator(
                self.request(),
                transaction_id="upgrade-8",
            )
            .execute()
        )

        events = [
            json.loads(line)["event"]
            for line in (
                result.journal_path
                .read_text(
                    encoding="utf-8"
                )
                .splitlines()
            )
        ]

        self.assertEqual(
            events[
                -1
            ],
            "upgrade-committed",
        )

    def test_result_is_deterministic_for_failure(
        self,
    ) -> None:
        source = self._write_source(
            "0.1.0"
        )

        first = (
            MarketplaceUpgradeCoordinator(
                self.request(
                    target_version="0.1.0",
                    source=source,
                ),
                transaction_id="upgrade-9a",
            )
            .execute()
        )

        second = (
            MarketplaceUpgradeCoordinator(
                self.request(
                    target_version="0.1.0",
                    source=source,
                ),
                transaction_id="upgrade-9b",
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


if __name__ == "__main__":
    unittest.main()
