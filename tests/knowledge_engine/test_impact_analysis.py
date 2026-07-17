from __future__ import annotations

import json
import unittest
from pathlib import Path

from tools.knowledge_engine.impact_analysis import (
    build_impact_analysis,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

KNOWLEDGE_DIRECTORY = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
)


def load(name: str) -> dict:
    return json.loads(
        (
            KNOWLEDGE_DIRECTORY
            / name
        ).read_text(encoding="utf-8")
    )


class ImpactAnalysisTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository_ir = load(
            "repository.ir.json"
        )

        cls.dependency_graph = load(
            "dependency-graph.json"
        )

        cls.analysis = build_impact_analysis(
            repository_ir=cls.repository_ir,
            dependency_graph=(
                cls.dependency_graph
            ),
        ).document

    def module(self, module_id: str) -> dict:
        for module in self.analysis["modules"]:
            if module["moduleId"] == module_id:
                return module

        self.fail(f"Module not found: {module_id}")

    def test_preserves_module_count(self) -> None:
        self.assertEqual(
            self.repository_ir["summary"][
                "moduleCount"
            ],
            self.analysis["summary"][
                "moduleCount"
            ],
        )

    def test_eventbus_has_large_blast_radius(
        self,
    ) -> None:
        eventbus = self.module("eventbus")

        self.assertGreater(
            eventbus["directDependentCount"],
            20,
        )

        self.assertGreaterEqual(
            eventbus[
                "transitiveDependentCount"
            ],
            eventbus["directDependentCount"],
        )

    def test_tenant_dependency_direction(
        self,
    ) -> None:
        tenant = self.module("tenant")

        self.assertIn(
            "identity",
            tenant["directDependencies"],
        )

        identity = self.module("identity")

        self.assertIn(
            "tenant",
            identity["directDependents"],
        )

    def test_plugin_visitor_is_present(self) -> None:
        visitor = self.module(
            "plugin:visitor"
        )

        self.assertEqual(
            "plugin",
            visitor["physicalLocation"],
        )

        self.assertGreater(
            visitor["directDependencyCount"],
            0,
        )

    def test_architecture_migration_risks_match(
        self,
    ) -> None:
        expected = {
            module["id"]
            for module
            in self.repository_ir["modules"]
            if module["alignmentStatus"]
            == "violation"
        }

        actual = {
            item["moduleId"]
            for item
            in self.analysis[
                "architectureMigrationRisks"
            ]
        }

        self.assertEqual(expected, actual)

    def test_transitive_sets_are_unique(
        self,
    ) -> None:
        for module in self.analysis["modules"]:
            self.assertEqual(
                len(
                    module[
                        "transitiveDependencies"
                    ]
                ),
                len(
                    set(
                        module[
                            "transitiveDependencies"
                        ]
                    )
                ),
            )

            self.assertEqual(
                len(
                    module[
                        "transitiveDependents"
                    ]
                ),
                len(
                    set(
                        module[
                            "transitiveDependents"
                        ]
                    )
                ),
            )

    def test_module_does_not_impact_itself(
        self,
    ) -> None:
        for module in self.analysis["modules"]:
            module_id = module["moduleId"]

            self.assertNotIn(
                module_id,
                module[
                    "transitiveDependencies"
                ],
            )

            self.assertNotIn(
                module_id,
                module[
                    "transitiveDependents"
                ],
            )

    def test_risk_scores_are_bounded(
        self,
    ) -> None:
        for module in self.analysis["modules"]:
            self.assertGreaterEqual(
                module["riskScore"],
                0,
            )

    def test_generation_is_deterministic(
        self,
    ) -> None:
        first = build_impact_analysis(
            repository_ir=self.repository_ir,
            dependency_graph=(
                self.dependency_graph
            ),
        ).document

        second = build_impact_analysis(
            repository_ir=self.repository_ir,
            dependency_graph=(
                self.dependency_graph
            ),
        ).document

        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
