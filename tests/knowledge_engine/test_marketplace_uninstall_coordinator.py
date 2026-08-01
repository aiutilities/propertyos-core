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
from tools.knowledge_engine.marketplace_uninstall_coordinator import (
    MarketplaceUninstallCoordinator,
    MarketplaceUninstallRequest,
    MarketplaceUninstallState,
)


class MarketplaceUninstallCoordinatorTest(
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

        self._install_plugin(
            "inventory"
        )

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def _install_plugin(
        self,
        plugin_id: str,
        *,
        version: str = "0.1.0",
        active: bool = True,
    ) -> None:
        root = (
            self.install_root
            / plugin_id
        )
        (root / "dist").mkdir(
            parents=True
        )
        (root / "data").mkdir()
        (root / "plugin.json").write_text(
            json.dumps(
                {
                    "id": plugin_id,
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
            "module.exports = {};\n",
            encoding="utf-8",
        )
        (
            root
            / "data"
            / "records.json"
        ).write_text(
            '{"records":[1]}\n',
            encoding="utf-8",
        )

        registry = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
        )
        records = registry.load()
        records[
            plugin_id
        ] = MarketplaceRuntimePluginRecord(
            plugin_id=plugin_id,
            version=version,
            install_path=str(root),
            state=(
                MarketplaceRuntimePluginState.ACTIVE
                if active
                else MarketplaceRuntimePluginState.INACTIVE
            ),
            activation_order=(
                len(records) + 1
            ),
        )
        registry.write(records)

    def request(
        self,
        *,
        dependency_map=None,
        preserve_data: bool = True,
    ) -> MarketplaceUninstallRequest:
        return MarketplaceUninstallRequest(
            plugin_id="inventory",
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
            dependency_map=(
                {}
                if dependency_map is None
                else dependency_map
            ),
            preserve_data=(
                preserve_data
            ),
        )

    def test_uninstalls_active_plugin(
        self,
    ) -> None:
        calls = []

        result = (
            MarketplaceUninstallCoordinator(
                self.request(),
                transaction_id="uninstall-1",
                deactivate_hook=(
                    lambda plugin_id:
                    calls.append(
                        (
                            "deactivate",
                            plugin_id,
                        )
                    )
                ),
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertFalse(
            (
                self.install_root
                / "inventory"
            ).exists()
        )
        self.assertNotIn(
            "inventory",
            MarketplaceRuntimeRegistry(
                self.registry_path
            ).load(),
        )
        self.assertEqual(
            calls,
            [
                (
                    "deactivate",
                    "inventory",
                )
            ],
        )

    def test_preserves_plugin_data(
        self,
    ) -> None:
        result = (
            MarketplaceUninstallCoordinator(
                self.request(
                    preserve_data=True
                ),
                transaction_id="uninstall-2",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertIsNotNone(
            result.preserved_data_path
        )
        self.assertTrue(
            (
                result.preserved_data_path
                / "records.json"
            ).is_file()
        )

    def test_rejects_installed_dependents(
        self,
    ) -> None:
        self._install_plugin(
            "procurement"
        )

        result = (
            MarketplaceUninstallCoordinator(
                self.request(
                    dependency_map={
                        "procurement": (
                            "inventory",
                        )
                    }
                ),
                transaction_id="uninstall-3",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUninstallState.ROLLED_BACK,
        )
        self.assertTrue(
            (
                self.install_root
                / "inventory"
            ).is_dir()
        )

    def test_registry_failure_restores_plugin(
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
            MarketplaceUninstallCoordinator(
                self.request(),
                transaction_id="uninstall-4",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUninstallState.ROLLED_BACK,
        )
        self.assertTrue(
            (
                self.install_root
                / "inventory"
                / "plugin.json"
            ).is_file()
        )
        self.assertIn(
            "inventory",
            MarketplaceRuntimeRegistry(
                self.registry_path
            ).load(),
        )

    def test_rollback_reactivates_previous_plugin(
        self,
    ) -> None:
        calls = []

        def fault(
            point: str,
        ) -> None:
            if point == "after-remove":
                raise RuntimeError(
                    "remove failure"
                )

        result = (
            MarketplaceUninstallCoordinator(
                self.request(),
                transaction_id="uninstall-5",
                activate_hook=(
                    lambda plugin_id, version:
                    calls.append(
                        (
                            plugin_id,
                            version,
                        )
                    )
                ),
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUninstallState.ROLLED_BACK,
        )
        self.assertEqual(
            calls,
            [
                (
                    "inventory",
                    "0.1.0",
                )
            ],
        )

    def test_rejects_missing_registry_entry(
        self,
    ) -> None:
        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write({})

        result = (
            MarketplaceUninstallCoordinator(
                self.request(),
                transaction_id="uninstall-6",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceUninstallState.ROLLED_BACK,
        )

    def test_can_skip_data_preservation(
        self,
    ) -> None:
        result = (
            MarketplaceUninstallCoordinator(
                self.request(
                    preserve_data=False
                ),
                transaction_id="uninstall-7",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertIsNone(
            result.preserved_data_path
        )

    def test_journal_records_commit(
        self,
    ) -> None:
        result = (
            MarketplaceUninstallCoordinator(
                self.request(),
                transaction_id="uninstall-8",
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
            events[-1],
            "uninstall-committed",
        )

    def test_failure_result_is_deterministic(
        self,
    ) -> None:
        self._install_plugin(
            "procurement"
        )
        dependency_map = {
            "procurement": (
                "inventory",
            )
        }

        first = (
            MarketplaceUninstallCoordinator(
                self.request(
                    dependency_map=(
                        dependency_map
                    )
                ),
                transaction_id="uninstall-9a",
            )
            .execute()
        )

        second = (
            MarketplaceUninstallCoordinator(
                self.request(
                    dependency_map=(
                        dependency_map
                    )
                ),
                transaction_id="uninstall-9b",
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
