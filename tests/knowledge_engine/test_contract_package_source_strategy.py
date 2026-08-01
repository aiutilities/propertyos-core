from __future__ import annotations

import unittest

from tools.knowledge_engine.contract_package_layout import (
    ContractPackageLayoutError,
)
from tools.knowledge_engine.contract_package_layout import (
    ContractPackageLayoutPlanner,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageLayoutRequest,
)


class ContractPackageSourceStrategyTest(
    unittest.TestCase
):
    def test_repository_reexport_remains_default(
        self,
    ) -> None:
        request = ContractPackageLayoutRequest()

        self.assertEqual(
            request.source_strategy,
            "repository-reexport",
        )
        self.assertFalse(request.publishable)

    def test_portable_facade_is_publishable(
        self,
    ) -> None:
        request = ContractPackageLayoutRequest(
            source_strategy="portable-facade",
        )

        self.assertTrue(request.publishable)

    def test_supported_strategies_are_accepted(
        self,
    ) -> None:
        planner = ContractPackageLayoutPlanner()

        for strategy in (
            "repository-reexport",
            "portable-facade",
        ):
            planner._validate_request(
                ContractPackageLayoutRequest(
                    source_strategy=strategy,
                )
            )

    def test_unknown_strategy_is_rejected(
        self,
    ) -> None:
        planner = ContractPackageLayoutPlanner()

        with self.assertRaises(
            ContractPackageLayoutError
        ):
            planner._validate_request(
                ContractPackageLayoutRequest(
                    source_strategy="unknown",
                )
            )


if __name__ == "__main__":
    unittest.main()
