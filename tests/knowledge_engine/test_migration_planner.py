from __future__ import annotations

import json
import unittest
from pathlib import Path

from tools.knowledge_engine.migration_formatter import (
    format_migration_json,
    format_migration_markdown,
)
from tools.knowledge_engine.migration_models import (
    MigrationRequest,
)
from tools.knowledge_engine.migration_planner import (
    MigrationPlanningError,
    RepositoryMigrationPlanner,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class MigrationPlannerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

        cls.planner = (
            RepositoryMigrationPlanner(
                cls.repository
            )
        )

    def test_helpdesk_module_plan(
        self,
    ) -> None:
        portfolio = self.planner.generate(
            MigrationRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        self.assertEqual(
            ("helpdesk",),
            portfolio.recommended_order,
        )

        plan = portfolio.plans[0]

        self.assertEqual(
            "helpdesk",
            plan.module_id,
        )

        self.assertEqual(
            "core",
            plan.current_location,
        )

        self.assertEqual(
            "plugin",
            plan.target_location,
        )

    def test_helpdesk_plan_has_steps(
        self,
    ) -> None:
        plan = self.planner.generate(
            MigrationRequest(
                mode="module",
                module_id="helpdesk",
            )
        ).plans[0]

        self.assertGreaterEqual(
            len(plan.steps),
            7,
        )

        self.assertEqual(
            tuple(
                range(
                    1,
                    len(plan.steps) + 1,
                )
            ),
            tuple(
                step.sequence
                for step in plan.steps
            ),
        )

    def test_inventory_plan_detects_dependent(
        self,
    ) -> None:
        plan = self.planner.generate(
            MigrationRequest(
                mode="module",
                module_id="inventory",
            )
        ).plans[0]

        self.assertIn(
            "procurement",
            plan.direct_dependents,
        )

    def test_platform_dependencies_are_identified(
        self,
    ) -> None:
        plan = self.planner.generate(
            MigrationRequest(
                mode="module",
                module_id="inventory",
            )
        ).plans[0]

        self.assertIn(
            "eventbus",
            plan.platform_dependencies,
        )

        self.assertIn(
            "database:postgres",
            plan.platform_dependencies,
        )

    def test_candidates_include_all_plugin_candidates(
        self,
    ) -> None:
        portfolio = self.planner.generate(
            MigrationRequest(
                mode="candidates"
            )
        )

        self.assertEqual(
            16,
            portfolio.summary["planCount"],
        )

        self.assertEqual(
            set(
                self.repository
                .plugin_candidates()
            ),
            {
                self.repository.module(
                    module_id
                )
                for module_id
                in portfolio.recommended_order
            },
        )

    def test_candidate_limit_is_applied(
        self,
    ) -> None:
        portfolio = self.planner.generate(
            MigrationRequest(
                mode="candidates",
                limit=5,
            )
        )

        self.assertEqual(
            5,
            len(portfolio.plans),
        )

    def test_recommended_order_is_deterministic(
        self,
    ) -> None:
        request = MigrationRequest(
            mode="candidates"
        )

        first = self.planner.generate(
            request
        )

        second = self.planner.generate(
            request
        )

        self.assertEqual(
            first.recommended_order,
            second.recommended_order,
        )

        self.assertEqual(
            first.plans,
            second.plans,
        )

    def test_low_risk_candidate_is_early(
        self,
    ) -> None:
        portfolio = self.planner.generate(
            MigrationRequest(
                mode="candidates"
            )
        )

        first_five = (
            portfolio.recommended_order[:5]
        )

        self.assertIn(
            "receipt",
            first_five,
        )

        self.assertIn(
            "invoice",
            first_five,
        )

    def test_json_output_is_valid(
        self,
    ) -> None:
        portfolio = self.planner.generate(
            MigrationRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        output = format_migration_json(
            portfolio
        )

        value = json.loads(output)

        self.assertEqual(
            "1.0.0",
            value["schemaVersion"],
        )

        self.assertEqual(
            "helpdesk",
            value["plans"][0]["moduleId"],
        )

    def test_markdown_output_is_deterministic(
        self,
    ) -> None:
        portfolio = self.planner.generate(
            MigrationRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        first = format_migration_markdown(
            portfolio
        )

        second = format_migration_markdown(
            portfolio
        )

        self.assertEqual(first, second)

        self.assertIn(
            "# PropertyOS Migration Plan",
            first,
        )

        self.assertIn(
            "## Module: helpdesk",
            first,
        )

    def test_missing_module_fails(
        self,
    ) -> None:
        with self.assertRaises(
            MigrationPlanningError
        ):
            self.planner.generate(
                MigrationRequest(
                    mode="module"
                )
            )

    def test_invalid_limit_fails(
        self,
    ) -> None:
        with self.assertRaises(
            MigrationPlanningError
        ):
            self.planner.generate(
                MigrationRequest(
                    mode="candidates",
                    limit=0,
                )
            )


if __name__ == "__main__":
    unittest.main()
