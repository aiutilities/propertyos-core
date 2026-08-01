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
from tools.knowledge_engine.marketplace_runtime_recovery import (
    MarketplaceRuntimeRecoveryAction,
    MarketplaceRuntimeRecoveryCoordinator,
    MarketplaceRuntimeRecoveryRequest,
)


class MarketplaceRuntimeRecoveryCoordinatorTest(
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

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def _install_plugin(
        self,
        plugin_id: str,
        version: str = "0.1.0",
    ) -> Path:
        root = (
            self.install_root
            / plugin_id
        )
        (root / "dist").mkdir(
            parents=True
        )
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
        return root

    def request(
        self,
        *,
        allow_remove_stale: bool = False,
        allow_rebuild: bool = True,
    ) -> MarketplaceRuntimeRecoveryRequest:
        return MarketplaceRuntimeRecoveryRequest(
            install_root=(
                self.install_root
            ),
            registry_path=(
                self.registry_path
            ),
            journal_root=(
                self.journal_root
            ),
            allow_remove_stale=(
                allow_remove_stale
            ),
            allow_rebuild=(
                allow_rebuild
            ),
        )

    def test_rebuilds_missing_registry_entry_as_inactive(
        self,
    ) -> None:
        installed = self._install_plugin(
            "inventory"
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-1",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )

        records = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
            .load()
        )

        self.assertEqual(
            records[
                "inventory"
            ].state,
            MarketplaceRuntimePluginState.INACTIVE,
        )
        self.assertEqual(
            records[
                "inventory"
            ].install_path,
            str(installed),
        )
        self.assertEqual(
            result.decisions[
                0
            ].action,
            MarketplaceRuntimeRecoveryAction.REBUILD_REGISTRY,
        )

    def test_rejects_missing_registry_when_rebuild_disabled(
        self,
    ) -> None:
        self._install_plugin(
            "inventory"
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(
                    allow_rebuild=False
                ),
                transaction_id="recovery-2",
            )
            .execute()
        )

        self.assertFalse(
            result.succeeded
        )
        self.assertTrue(
            any(
                issue.code
                == "REGISTRY_ENTRY_MISSING"
                for issue in result.issues
            )
        )

    def test_rejects_stale_registry_by_default(
        self,
    ) -> None:
        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write(
            {
                "inventory": MarketplaceRuntimePluginRecord(
                    plugin_id="inventory",
                    version="0.1.0",
                    install_path="/missing",
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=1,
                )
            }
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-3",
            )
            .execute()
        )

        self.assertFalse(
            result.succeeded
        )
        self.assertTrue(
            any(
                issue.code
                == "STALE_REGISTRY_ENTRY"
                for issue in result.issues
            )
        )

    def test_removes_stale_registry_when_explicitly_allowed(
        self,
    ) -> None:
        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write(
            {
                "inventory": MarketplaceRuntimePluginRecord(
                    plugin_id="inventory",
                    version="0.1.0",
                    install_path="/missing",
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=1,
                )
            }
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(
                    allow_remove_stale=True
                ),
                transaction_id="recovery-4",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            MarketplaceRuntimeRegistry(
                self.registry_path
            ).load(),
            {},
        )

    def test_marks_interrupted_activation_inactive(
        self,
    ) -> None:
        installed = self._install_plugin(
            "inventory"
        )

        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write(
            {
                "inventory": MarketplaceRuntimePluginRecord(
                    plugin_id="inventory",
                    version="0.1.0",
                    install_path=str(
                        installed
                    ),
                    state=(
                        MarketplaceRuntimePluginState.ACTIVATING
                    ),
                    activation_order=1,
                )
            }
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-5",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )

        record = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
            .load()[
                "inventory"
            ]
        )

        self.assertEqual(
            record.state,
            MarketplaceRuntimePluginState.INACTIVE,
        )

    def test_preserves_consistent_active_record(
        self,
    ) -> None:
        installed = self._install_plugin(
            "inventory"
        )

        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write(
            {
                "inventory": MarketplaceRuntimePluginRecord(
                    plugin_id="inventory",
                    version="0.1.0",
                    install_path=str(
                        installed
                    ),
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=1,
                )
            }
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-6",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )

        record = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
            .load()[
                "inventory"
            ]
        )

        self.assertEqual(
            record.state,
            MarketplaceRuntimePluginState.ACTIVE,
        )

    def test_rejects_version_mismatch(
        self,
    ) -> None:
        installed = self._install_plugin(
            "inventory",
            version="0.2.0",
        )

        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write(
            {
                "inventory": MarketplaceRuntimePluginRecord(
                    plugin_id="inventory",
                    version="0.1.0",
                    install_path=str(
                        installed
                    ),
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=1,
                )
            }
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-7",
            )
            .execute()
        )

        self.assertFalse(
            result.succeeded
        )
        self.assertTrue(
            any(
                issue.code
                == "VERSION_MISMATCH"
                for issue in result.issues
            )
        )

    def test_rejects_missing_installed_entrypoint(
        self,
    ) -> None:
        installed = self._install_plugin(
            "inventory"
        )
        (
            installed
            / "dist"
            / "index.js"
        ).unlink()

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-8",
            )
            .execute()
        )

        self.assertFalse(
            result.succeeded
        )
        self.assertTrue(
            any(
                issue.code
                == "INSTALLED_ENTRYPOINT_MISSING"
                for issue in result.issues
            )
        )

    def test_recovery_is_deterministic(
        self,
    ) -> None:
        self._install_plugin(
            "procurement"
        )
        self._install_plugin(
            "inventory"
        )

        first = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-9a",
            )
            .execute()
        )

        first_registry = (
            self.registry_path
            .read_bytes()
        )

        second = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-9b",
            )
            .execute()
        )

        second_registry = (
            self.registry_path
            .read_bytes()
        )

        self.assertTrue(
            first.succeeded
        )
        self.assertTrue(
            second.succeeded
        )
        self.assertEqual(
            first_registry,
            second_registry,
        )

    def test_journal_records_completion(
        self,
    ) -> None:
        self._install_plugin(
            "inventory"
        )

        result = (
            MarketplaceRuntimeRecoveryCoordinator(
                self.request(),
                transaction_id="recovery-10",
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
            "runtime-recovery-complete",
        )


if __name__ == "__main__":
    unittest.main()
