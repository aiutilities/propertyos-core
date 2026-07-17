from __future__ import annotations

import unittest
from pathlib import Path

from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class RepositoryApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

    def test_summary_matches_repository_ir(
        self,
    ) -> None:
        summary = self.repository.summary

        self.assertEqual(
            47,
            summary.module_count,
        )

        self.assertEqual(
            179,
            summary.component_count,
        )

        self.assertEqual(
            59,
            summary.controller_count,
        )

        self.assertEqual(
            449,
            summary.route_count,
        )

    def test_module_lookup_returns_typed_module(
        self,
    ) -> None:
        inventory = self.repository.module(
            "inventory"
        )

        self.assertEqual(
            "inventory",
            inventory.id,
        )

        self.assertEqual(
            "business",
            inventory.architectural_role,
        )

        self.assertEqual(
            65,
            inventory.route_count,
        )

    def test_module_lookup_is_case_insensitive(
        self,
    ) -> None:
        inventory = self.repository.module(
            " INVENTORY "
        )

        self.assertEqual(
            "inventory",
            inventory.id,
        )

    def test_eventbus_dependents_are_available(
        self,
    ) -> None:
        dependents = {
            module.id
            for module
            in self.repository.dependents(
                "eventbus"
            )
        }

        self.assertIn(
            "inventory",
            dependents,
        )

        self.assertIn(
            "tenant",
            dependents,
        )

    def test_eventbus_blast_radius_is_transitive(
        self,
    ) -> None:
        affected = self.repository.blast_radius(
            "eventbus"
        )

        self.assertEqual(
            33,
            len(affected),
        )

        self.assertNotIn(
            "eventbus",
            {
                module.id
                for module in affected
            },
        )

    def test_tenant_dependencies_include_identity(
        self,
    ) -> None:
        dependency_ids = {
            module.id
            for module
            in self.repository.dependencies(
                "tenant"
            )
        }

        self.assertIn(
            "identity",
            dependency_ids,
        )

        self.assertIn(
            "eventbus",
            dependency_ids,
        )

    def test_architecture_violations_match_analysis(
        self,
    ) -> None:
        violations = (
            self.repository
            .architecture_violations()
        )

        self.assertEqual(
            16,
            len(violations),
        )

        self.assertIn(
            "helpdesk",
            {
                module.id
                for module in violations
            },
        )

    def test_plugin_candidates_are_risk_ordered(
        self,
    ) -> None:
        candidates = (
            self.repository
            .plugin_candidates()
        )

        scores = [
            module.impact.risk_score
            for module in candidates
        ]

        self.assertEqual(
            sorted(scores),
            scores,
        )

        self.assertEqual(
            16,
            len(candidates),
        )

    def test_high_risk_modules_match_impact_order(
        self,
    ) -> None:
        highest = (
            self.repository
            .high_risk_modules(limit=5)
        )

        self.assertEqual(
            [
                "eventbus",
                "database:postgres",
                "identity",
                "search",
                "plugin",
            ],
            [
                module.id
                for module in highest
            ],
        )

    def test_routes_for_inventory_are_available(
        self,
    ) -> None:
        routes = (
            self.repository
            .routes_for_module("inventory")
        )

        self.assertEqual(
            65,
            len(routes),
        )

        self.assertTrue(
            any(
                "inventory" in (
                    route.full_path.lower()
                )
                for route in routes
            )
        )

    def test_controller_search_returns_helpdesk(
        self,
    ) -> None:
        matches = (
            self.repository
            .find_controllers("helpdesk")
        )

        self.assertTrue(
            any(
                controller.class_name
                == "HelpdeskController"
                for controller in matches
            )
        )

    def test_api_loading_is_deterministic(
        self,
    ) -> None:
        second = Repository.load(
            REPOSITORY_ROOT
        )

        self.assertEqual(
            self.repository.modules,
            second.modules,
        )

        self.assertEqual(
            self.repository.controllers,
            second.controllers,
        )

        self.assertEqual(
            self.repository.routes,
            second.routes,
        )

        self.assertEqual(
            self.repository.to_summary_dict(),
            second.to_summary_dict(),
        )


if __name__ == "__main__":
    unittest.main()
