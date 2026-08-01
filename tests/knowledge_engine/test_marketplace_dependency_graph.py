from __future__ import annotations

import unittest

from tools.knowledge_engine.marketplace_dependency_graph import (
    MarketplaceDependencyGraphValidator,
)


def plugin(
    plugin_id: str,
    *,
    version: str = "0.1.0",
    dependencies=None,
):
    return {
        "id": plugin_id,
        "version": version,
        "dependencies": (
            []
            if dependencies is None
            else dependencies
        ),
    }


class MarketplaceDependencyGraphValidatorTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.validator = (
            MarketplaceDependencyGraphValidator()
        )

    def test_orders_dependencies_before_dependents(
        self,
    ) -> None:
        portfolio = {
            "procurement": plugin(
                "procurement",
                dependencies=[
                    {
                        "pluginId": "inventory",
                        "version": "0.1.0",
                        "optional": False,
                    }
                ],
            ),
            "inventory": plugin(
                "inventory"
            ),
        }

        plan = self.validator.evaluate(
            portfolio
        )

        self.assertTrue(
            plan.valid
        )

        self.assertEqual(
            plan.install_order,
            (
                "inventory",
                "procurement",
            ),
        )

        self.assertEqual(
            plan.edges,
            (
                (
                    "inventory",
                    "procurement",
                ),
            ),
        )

    def test_independent_plugins_are_sorted(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "vendor": plugin(
                    "vendor"
                ),
                "agreement": plugin(
                    "agreement"
                ),
            }
        )

        self.assertEqual(
            plan.install_order,
            (
                "agreement",
                "vendor",
            ),
        )

    def test_rejects_missing_required_dependency(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "procurement": plugin(
                    "procurement",
                    dependencies=[
                        {
                            "pluginId": "inventory",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                )
            }
        )

        self.assertFalse(
            plan.valid
        )

        self.assertTrue(
            any(
                issue.code
                == "DEPENDENCY_MISSING"
                for issue in plan.issues
            )
        )

    def test_allows_missing_optional_dependency(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "procurement": plugin(
                    "procurement",
                    dependencies=[
                        {
                            "pluginId": "inventory",
                            "version": "0.1.0",
                            "optional": True,
                        }
                    ],
                )
            }
        )

        self.assertTrue(
            plan.valid
        )

        self.assertEqual(
            plan.install_order,
            (
                "procurement",
            ),
        )

    def test_rejects_dependency_version_mismatch(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "inventory": plugin(
                    "inventory",
                    version="0.2.0",
                ),
                "procurement": plugin(
                    "procurement",
                    dependencies=[
                        {
                            "pluginId": "inventory",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                ),
            }
        )

        self.assertTrue(
            any(
                issue.code
                == "DEPENDENCY_VERSION_MISMATCH"
                for issue in plan.issues
            )
        )

    def test_rejects_self_dependency(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "agreement": plugin(
                    "agreement",
                    dependencies=[
                        {
                            "pluginId": "agreement",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                )
            }
        )

        self.assertTrue(
            any(
                issue.code
                == "SELF_DEPENDENCY"
                for issue in plan.issues
            )
        )

    def test_rejects_two_node_cycle(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "inventory": plugin(
                    "inventory",
                    dependencies=[
                        {
                            "pluginId": "procurement",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                ),
                "procurement": plugin(
                    "procurement",
                    dependencies=[
                        {
                            "pluginId": "inventory",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                ),
            }
        )

        self.assertFalse(
            plan.valid
        )

        self.assertEqual(
            {
                issue.plugin_id
                for issue in plan.issues
                if issue.code
                == "DEPENDENCY_CYCLE"
            },
            {
                "inventory",
                "procurement",
            },
        )

    def test_rejects_three_node_cycle(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "a-plugin": plugin(
                    "a-plugin",
                    dependencies=[
                        {
                            "pluginId": "b-plugin",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                ),
                "b-plugin": plugin(
                    "b-plugin",
                    dependencies=[
                        {
                            "pluginId": "c-plugin",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                ),
                "c-plugin": plugin(
                    "c-plugin",
                    dependencies=[
                        {
                            "pluginId": "a-plugin",
                            "version": "0.1.0",
                            "optional": False,
                        }
                    ],
                ),
            }
        )

        self.assertFalse(
            plan.valid
        )

        self.assertEqual(
            len(
                [
                    issue
                    for issue in plan.issues
                    if issue.code
                    == "DEPENDENCY_CYCLE"
                ]
            ),
            3,
        )

    def test_rejects_portfolio_key_mismatch(
        self,
    ) -> None:
        plan = self.validator.evaluate(
            {
                "wrong": plugin(
                    "agreement"
                )
            }
        )

        self.assertTrue(
            any(
                issue.code
                == "PORTFOLIO_KEY_MISMATCH"
                for issue in plan.issues
            )
        )

    def test_result_is_deterministic(
        self,
    ) -> None:
        portfolio = {
            "procurement": plugin(
                "procurement",
                dependencies=[
                    {
                        "pluginId": "inventory",
                        "version": "0.1.0",
                        "optional": False,
                    }
                ],
            ),
            "inventory": plugin(
                "inventory"
            ),
            "agreement": plugin(
                "agreement"
            ),
        }

        first = self.validator.evaluate(
            portfolio
        )

        second = self.validator.evaluate(
            portfolio
        )

        self.assertEqual(
            first,
            second,
        )

    def test_require_valid_raises_on_failure(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            self.validator.require_valid(
                {
                    "agreement": plugin(
                        "agreement",
                        dependencies=[
                            {
                                "pluginId": "agreement",
                                "version": "0.1.0",
                                "optional": False,
                            }
                        ],
                    )
                }
            )


if __name__ == "__main__":
    unittest.main()
