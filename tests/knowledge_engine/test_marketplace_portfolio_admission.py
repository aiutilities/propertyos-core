from __future__ import annotations

import unittest

from pathlib import Path

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


def legacy_manifests():
    return {
        "inventory": {
            "id": "inventory",
            "name": "Inventory",
            "version": "0.1.0",
            "entrypoint": "src/index.ts",
            "dependencies": [
                "audit",
                "database:postgres",
            ],
            "permissions": [
                "inventory.read",
            ],
        },
        "procurement": {
            "id": "procurement",
            "name": "Procurement",
            "version": "0.1.0",
            "entrypoint": "src/index.ts",
            "dependencies": [
                "inventory",
            ],
            "permissions": [
                "procurement.read",
            ],
        },
    }


def context():
    return MarketplaceContractV1Context(
        publisher=MarketplacePublisherContext(
            publisher_id="cogzidel",
            name="Cogzidel Technologies",
        ),
        engine=MarketplaceEngineContext(
            minimum_host_api="0.1.0",
            maximum_host_api="0.1.0",
            node_range=">=20",
        ),
        contracts=(
            MarketplaceContractDependency(
                package_name="@propertyos/core-contracts",
                version="0.1.0",
            ),
        ),
        migrations=MarketplaceMigrationContext(
            strategy="none",
            reversible=True,
        ),
        archive_sha256="a" * 64,
    )


def planner():
    source = legacy_manifests()

    legacy_adapter = (
        MarketplaceManifestAdapter(
            catalog=(
                MarketplaceManifestAdapter
                .catalog_from_manifests(
                    source
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


def request(
    *,
    source=None,
    contexts=None,
    trusted_publishers=None,
):
    manifests = (
        legacy_manifests()
        if source is None
        else source
    )

    return MarketplacePortfolioAdmissionRequest(
        legacy_manifests=manifests,
        contract_contexts=(
            {
                plugin_id: context()
                for plugin_id in manifests
            }
            if contexts is None
            else contexts
        ),
        active_host_api_version="0.1.0",
        active_node_version="20.12.0",
        available_contract_versions={
            "@propertyos/core-contracts": "0.1.0"
        },
        installed_plugin_versions={},
        trusted_publishers=(
            {
                "cogzidel": ()
            }
            if trusted_publishers is None
            else trusted_publishers
        ),
    )


class MarketplacePortfolioAdmissionPlannerTest(
    unittest.TestCase
):
    def test_accepts_valid_portfolio(
        self,
    ) -> None:
        plan = planner().evaluate(
            request()
        )

        self.assertTrue(
            plan.accepted
        )

        self.assertEqual(
            plan.decision,
            "ACCEPT",
        )

        self.assertEqual(
            plan.install_order,
            (
                "inventory",
                "procurement",
            ),
        )

    def test_builds_transaction_ready_steps(
        self,
    ) -> None:
        plan = planner().evaluate(
            request()
        )

        self.assertEqual(
            tuple(
                step.sequence
                for step in plan.install_steps
            ),
            (
                1,
                2,
            ),
        )

        self.assertEqual(
            plan.install_steps[
                1
            ].dependencies,
            (
                "inventory",
            ),
        )

    def test_rejects_untrusted_publisher(
        self,
    ) -> None:
        plan = planner().evaluate(
            request(
                trusted_publishers={}
            )
        )

        self.assertFalse(
            plan.accepted
        )

        self.assertTrue(
            any(
                issue.code
                == "PUBLISHER_UNTRUSTED"
                for issue in plan.issues
            )
        )

        self.assertEqual(
            plan.install_order,
            (),
        )

    def test_rejects_adaptation_context_mismatch(
        self,
    ) -> None:
        plan = planner().evaluate(
            request(
                contexts={
                    "inventory": context(),
                }
            )
        )

        self.assertFalse(
            plan.accepted
        )

        self.assertEqual(
            plan.issues[
                0
            ].stage,
            "adaptation",
        )

    def test_rejects_dependency_cycle(
        self,
    ) -> None:
        source = legacy_manifests()

        source[
            "inventory"
        ][
            "dependencies"
        ] = [
            "procurement",
        ]

        plan = planner().evaluate(
            request(
                source=source
            )
        )

        self.assertFalse(
            plan.accepted
        )

        self.assertTrue(
            any(
                issue.code
                == "DEPENDENCY_CYCLE"
                for issue in plan.issues
            )
        )

    def test_result_is_deterministic(
        self,
    ) -> None:
        first = planner().evaluate(
            request()
        )

        second = planner().evaluate(
            request()
        )

        self.assertEqual(
            first,
            second,
        )

    def test_require_accepted_raises(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            planner().require_accepted(
                request(
                    trusted_publishers={}
                )
            )


if __name__ == "__main__":
    unittest.main()
