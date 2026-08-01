from __future__ import annotations

import json
import unittest

from pathlib import Path
from typing import Any

from tools.knowledge_engine.marketplace_admission_validator import (
    MarketplaceAdmissionValidator,
)
from tools.knowledge_engine.marketplace_contract_v1_adapter import (
    MarketplaceContractDependency,
    MarketplaceContractV1Adapter,
    MarketplaceContractV1Context,
    MarketplaceEngineContext,
    MarketplaceMigrationContext,
    MarketplacePublisherContext,
)
from tools.knowledge_engine.marketplace_dependency_graph import (
    MarketplaceDependencyGraphValidator,
)
from tools.knowledge_engine.marketplace_manifest_adapter import (
    MarketplaceManifestAdapter,
)
from tools.knowledge_engine.marketplace_portfolio_admission import (
    MarketplacePortfolioAdmissionPlan,
    MarketplacePortfolioAdmissionPlanner,
    MarketplacePortfolioAdmissionRequest,
)


ROOT = Path(__file__).resolve().parents[2]

SCHEMA_PATH = (
    ROOT
    / "tools"
    / "knowledge_engine"
    / "contracts"
    / "marketplace_plugin_manifest.schema.json"
)

STAGING_ROOT = (
    ROOT
    / "generated"
    / "plugin-staging"
)

EXPECTED_PLUGIN_IDS = (
    "agreement",
    "communications",
    "facility",
    "helpdesk",
    "inventory",
    "invoice",
    "maintenance",
    "procurement",
    "receipt",
    "rent",
    "report",
    "reservation",
    "staff",
    "tenant",
    "vehicle",
    "vendor",
)

EXPECTED_INSTALL_ORDER = EXPECTED_PLUGIN_IDS


def load_legacy_manifests() -> dict[
    str,
    dict[str, Any],
]:
    manifests: dict[
        str,
        dict[str, Any],
    ] = {}

    for workspace in sorted(
        STAGING_ROOT.iterdir()
    ):
        path = workspace / "plugin.json"

        if not path.is_file():
            continue

        manifests[
            workspace.name
        ] = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

    return manifests


def contract_context() -> (
    MarketplaceContractV1Context
):
    return MarketplaceContractV1Context(
        publisher=(
            MarketplacePublisherContext(
                publisher_id="cogzidel",
                name="Cogzidel Technologies",
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
                    "@propertyos/core-contracts"
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
        archive_sha256="a" * 64,
    )


def build_planner(
    manifests: dict[
        str,
        dict[str, Any],
    ],
) -> MarketplacePortfolioAdmissionPlanner:
    legacy_adapter = (
        MarketplaceManifestAdapter(
            catalog=(
                MarketplaceManifestAdapter
                .catalog_from_manifests(
                    manifests
                )
            )
        )
    )

    return MarketplacePortfolioAdmissionPlanner(
        contract_adapter=(
            MarketplaceContractV1Adapter(
                legacy_adapter=legacy_adapter,
                schema_path=SCHEMA_PATH,
            )
        ),
        admission_validator=(
            MarketplaceAdmissionValidator(
                SCHEMA_PATH
            )
        ),
        graph_validator=(
            MarketplaceDependencyGraphValidator()
        ),
    )


def build_request(
    manifests: dict[
        str,
        dict[str, Any],
    ],
) -> MarketplacePortfolioAdmissionRequest:
    return MarketplacePortfolioAdmissionRequest(
        legacy_manifests=manifests,
        contract_contexts={
            plugin_id: contract_context()
            for plugin_id in manifests
        },
        active_host_api_version="0.1.0",
        active_node_version="20.12.0",
        available_contract_versions={
            "@propertyos/core-contracts": (
                "0.1.0"
            )
        },
        installed_plugin_versions={},
        trusted_publishers={
            "cogzidel": ()
        },
        archive_paths=None,
        allow_downgrade=False,
    )


def certified_plan() -> (
    MarketplacePortfolioAdmissionPlan
):
    manifests = load_legacy_manifests()

    return build_planner(
        manifests
    ).require_accepted(
        build_request(
            manifests
        )
    )


class MarketplacePortfolioRealCertificationTest(
    unittest.TestCase
):
    def test_real_inventory_is_exact(
        self,
    ) -> None:
        manifests = load_legacy_manifests()

        self.assertEqual(
            tuple(sorted(manifests)),
            EXPECTED_PLUGIN_IDS,
        )

        self.assertEqual(
            len(manifests),
            16,
        )

    def test_real_portfolio_is_accepted(
        self,
    ) -> None:
        plan = certified_plan()

        self.assertTrue(
            plan.accepted
        )

        self.assertEqual(
            plan.decision,
            "ACCEPT",
        )

        self.assertEqual(
            plan.issues,
            (),
        )

    def test_real_portfolio_install_order_is_frozen(
        self,
    ) -> None:
        plan = certified_plan()

        self.assertEqual(
            plan.install_order,
            EXPECTED_INSTALL_ORDER,
        )

    def test_real_portfolio_has_complete_steps(
        self,
    ) -> None:
        plan = certified_plan()

        self.assertEqual(
            len(plan.install_steps),
            16,
        )

        self.assertEqual(
            tuple(
                step.sequence
                for step in plan.install_steps
            ),
            tuple(range(1, 17)),
        )

        self.assertEqual(
            tuple(
                step.plugin_id
                for step in plan.install_steps
            ),
            EXPECTED_INSTALL_ORDER,
        )

    def test_inventory_precedes_procurement(
        self,
    ) -> None:
        plan = certified_plan()

        self.assertLess(
            plan.install_order.index(
                "inventory"
            ),
            plan.install_order.index(
                "procurement"
            ),
        )

        procurement = next(
            step
            for step in plan.install_steps
            if step.plugin_id
            == "procurement"
        )

        self.assertEqual(
            procurement.dependencies,
            (
                "inventory",
            ),
        )

    def test_all_manifests_are_contract_v1(
        self,
    ) -> None:
        plan = certified_plan()

        self.assertEqual(
            tuple(plan.manifests),
            EXPECTED_PLUGIN_IDS,
        )

        for plugin_id in EXPECTED_PLUGIN_IDS:
            manifest = plan.manifests[
                plugin_id
            ]

            self.assertEqual(
                manifest["schemaVersion"],
                "1.0.0",
            )

            self.assertEqual(
                manifest["id"],
                plugin_id,
            )

            self.assertEqual(
                manifest["version"],
                "0.1.0",
            )

    def test_real_plan_is_deterministic(
        self,
    ) -> None:
        first = certified_plan()
        second = certified_plan()

        self.assertEqual(
            first,
            second,
        )

    def test_no_install_step_has_forward_dependency(
        self,
    ) -> None:
        plan = certified_plan()

        position = {
            plugin_id: index
            for index, plugin_id
            in enumerate(
                plan.install_order
            )
        }

        for step in plan.install_steps:
            for dependency in (
                step.dependencies
            ):
                self.assertLess(
                    position[dependency],
                    position[
                        step.plugin_id
                    ],
                )


if __name__ == "__main__":
    unittest.main()
