from __future__ import annotations

import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_runtime_activation import (
    MarketplaceRuntimeActivationItem,
    MarketplaceRuntimeActivationRequest,
    MarketplaceRuntimeActivationState,
    MarketplaceRuntimeActivationTransaction,
    MarketplaceRuntimePluginRecord,
    MarketplaceRuntimePluginState,
    MarketplaceRuntimeRegistry,
)


class MarketplaceRuntimeActivationTransactionTest(
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

        self._write_plugin(
            "inventory"
        )
        self._write_plugin(
            "procurement"
        )

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def _write_plugin(
        self,
        plugin_id: str,
    ) -> None:
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

    def request(
        self,
    ) -> MarketplaceRuntimeActivationRequest:
        return MarketplaceRuntimeActivationRequest(
            items=(
                MarketplaceRuntimeActivationItem(
                    sequence=1,
                    plugin_id="inventory",
                    version="0.1.0",
                    install_path=(
                        self.install_root
                        / "inventory"
                    ),
                ),
                MarketplaceRuntimeActivationItem(
                    sequence=2,
                    plugin_id="procurement",
                    version="0.1.0",
                    install_path=(
                        self.install_root
                        / "procurement"
                    ),
                    dependencies=(
                        "inventory",
                    ),
                ),
            ),
            registry_path=(
                self.registry_path
            ),
            journal_root=(
                self.journal_root
            ),
        )

    def test_activates_in_certified_order(
        self,
    ) -> None:
        activated = []

        result = (
            MarketplaceRuntimeActivationTransaction(
                self.request(),
                transaction_id="activation-1",
                activate_hook=(
                    lambda item:
                    activated.append(
                        item.plugin_id
                    )
                ),
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            activated,
            [
                "inventory",
                "procurement",
            ],
        )
        self.assertEqual(
            result.activated_plugins,
            (
                "inventory",
                "procurement",
            ),
        )

    def test_writes_active_runtime_registry(
        self,
    ) -> None:
        result = (
            MarketplaceRuntimeActivationTransaction(
                self.request(),
                transaction_id="activation-2",
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
            tuple(sorted(records)),
            (
                "inventory",
                "procurement",
            ),
        )
        self.assertEqual(
            records[
                "procurement"
            ].state,
            MarketplaceRuntimePluginState.ACTIVE,
        )
        self.assertEqual(
            records[
                "procurement"
            ].activation_order,
            2,
        )

    def test_health_failure_deactivates_reverse_order(
        self,
    ) -> None:
        deactivated = []

        def health(
            item,
        ):
            return (
                item.plugin_id
                != "procurement"
            )

        result = (
            MarketplaceRuntimeActivationTransaction(
                self.request(),
                transaction_id="activation-3",
                deactivate_hook=(
                    lambda item:
                    deactivated.append(
                        item.plugin_id
                    )
                ),
                health_hook=health,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeActivationState.ROLLED_BACK,
        )
        self.assertEqual(
            deactivated,
            [
                "inventory",
            ],
        )

    def test_activation_failure_rolls_back_activated_plugins(
        self,
    ) -> None:
        deactivated = []

        def activate(
            item,
        ):
            if (
                item.plugin_id
                == "procurement"
            ):
                raise RuntimeError(
                    "activation failed"
                )

        result = (
            MarketplaceRuntimeActivationTransaction(
                self.request(),
                transaction_id="activation-4",
                activate_hook=activate,
                deactivate_hook=(
                    lambda item:
                    deactivated.append(
                        item.plugin_id
                    )
                ),
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeActivationState.ROLLED_BACK,
        )
        self.assertEqual(
            deactivated,
            [
                "inventory",
            ],
        )

    def test_registry_failure_restores_previous_registry(
        self,
    ) -> None:
        registry = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
        )
        registry.write(
            {
                "legacy": MarketplaceRuntimePluginRecord(
                    plugin_id="legacy",
                    version="0.1.0",
                    install_path="/legacy",
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=1,
                )
            }
        )

        def fault(
            point,
            plugin_id,
        ):
            if (
                point
                == "after-registry-write"
            ):
                raise RuntimeError(
                    "registry commit failure"
                )

        result = (
            MarketplaceRuntimeActivationTransaction(
                self.request(),
                transaction_id="activation-5",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeActivationState.ROLLED_BACK,
        )

        records = registry.load()

        self.assertEqual(
            tuple(records),
            (
                "legacy",
            ),
        )

    def test_rejects_forward_dependency(
        self,
    ) -> None:
        request = (
            MarketplaceRuntimeActivationRequest(
                items=(
                    MarketplaceRuntimeActivationItem(
                        sequence=1,
                        plugin_id="procurement",
                        version="0.1.0",
                        install_path=(
                            self.install_root
                            / "procurement"
                        ),
                        dependencies=(
                            "inventory",
                        ),
                    ),
                    MarketplaceRuntimeActivationItem(
                        sequence=2,
                        plugin_id="inventory",
                        version="0.1.0",
                        install_path=(
                            self.install_root
                            / "inventory"
                        ),
                    ),
                ),
                registry_path=(
                    self.registry_path
                ),
                journal_root=(
                    self.journal_root
                ),
            )
        )

        result = (
            MarketplaceRuntimeActivationTransaction(
                request,
                transaction_id="activation-6",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeActivationState.ROLLED_BACK,
        )

    def test_rejects_missing_runtime_entrypoint(
        self,
    ) -> None:
        (
            self.install_root
            / "inventory"
            / "dist"
            / "index.js"
        ).unlink()

        result = (
            MarketplaceRuntimeActivationTransaction(
                self.request(),
                transaction_id="activation-7",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeActivationState.ROLLED_BACK,
        )

    def test_registry_output_is_deterministic(
        self,
    ) -> None:
        registry = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
        )

        records = {
            "procurement": MarketplaceRuntimePluginRecord(
                plugin_id="procurement",
                version="0.1.0",
                install_path="/procurement",
                state=(
                    MarketplaceRuntimePluginState.ACTIVE
                ),
                activation_order=2,
            ),
            "inventory": MarketplaceRuntimePluginRecord(
                plugin_id="inventory",
                version="0.1.0",
                install_path="/inventory",
                state=(
                    MarketplaceRuntimePluginState.ACTIVE
                ),
                activation_order=1,
            ),
        }

        registry.write(
            records
        )
        first = (
            self.registry_path
            .read_bytes()
        )

        registry.write(
            {
                "inventory": records[
                    "inventory"
                ],
                "procurement": records[
                    "procurement"
                ],
            }
        )
        second = (
            self.registry_path
            .read_bytes()
        )

        self.assertEqual(
            first,
            second,
        )

    def test_journal_records_activation_order(
        self,
    ) -> None:
        result = (
            MarketplaceRuntimeActivationTransaction(
                self.request(),
                transaction_id="activation-8",
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

        activated = [
            record[
                "details"
            ][
                "pluginId"
            ]
            for record in records
            if record[
                "event"
            ]
            == "plugin-activated"
        ]

        self.assertEqual(
            activated,
            [
                "inventory",
                "procurement",
            ],
        )


if __name__ == "__main__":
    unittest.main()
