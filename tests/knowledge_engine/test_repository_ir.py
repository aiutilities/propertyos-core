from __future__ import annotations

import json
import unittest
from pathlib import Path

from tools.knowledge_engine.repository_ir import (
    build_repository_ir,
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


class RepositoryIrTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.modules = load("modules.json")
        cls.controllers = load(
            "controllers.json"
        )
        cls.architecture = load(
            "architecture-intelligence.json"
        )

        cls.ir = build_repository_ir(
            modules_manifest=cls.modules,
            controllers_manifest=cls.controllers,
            architecture_manifest=cls.architecture,
        ).document

    def test_preserves_source_counts(self) -> None:
        summary = self.ir["summary"]

        self.assertEqual(
            self.modules["moduleCount"],
            summary["moduleCount"],
        )

        self.assertEqual(
            self.modules["componentCount"],
            summary["componentCount"],
        )

        self.assertEqual(
            self.controllers["controllerCount"],
            summary["controllerCount"],
        )

        self.assertEqual(
            self.controllers["routeCount"],
            summary["routeCount"],
        )

    def test_integrity_is_valid(self) -> None:
        self.assertTrue(
            self.ir["integrity"]["valid"]
        )

        self.assertEqual(
            0,
            self.ir["summary"][
                "integrityIssueCount"
            ],
        )

    def test_all_controllers_have_module_owners(
        self,
    ) -> None:
        module_ids = {
            module["id"]
            for module in self.ir["modules"]
        }

        for controller in self.ir["controllers"]:
            self.assertIn(
                controller["moduleId"],
                module_ids,
            )

    def test_all_routes_have_controller_owners(
        self,
    ) -> None:
        controller_ids = {
            controller["id"]
            for controller
            in self.ir["controllers"]
        }

        for route in self.ir["routes"]:
            self.assertIn(
                route["controllerId"],
                controller_ids,
            )

    def test_architecture_is_attached_to_modules(
        self,
    ) -> None:
        helpdesk = next(
            module
            for module in self.ir["modules"]
            if module["id"] == "helpdesk"
        )

        self.assertEqual(
            "business",
            helpdesk["architecturalRole"],
        )

        self.assertEqual(
            "violation",
            helpdesk["alignmentStatus"],
        )

    def test_visitor_ownership_is_plugin(self) -> None:
        visitor_controllers = [
            controller
            for controller
            in self.ir["controllers"]
            if controller["moduleId"]
            == "plugin:visitor"
        ]

        self.assertGreater(
            len(visitor_controllers),
            0,
        )

        for controller in visitor_controllers:
            self.assertEqual(
                "plugin",
                controller["ownership"][
                    "physicalLocation"
                ],
            )

    def test_relationship_counts_are_consistent(
        self,
    ) -> None:
        summary = self.ir["summary"]
        counts = summary[
            "relationshipTypeCounts"
        ]

        self.assertEqual(
            summary["componentCount"],
            counts[
                "MODULE_CONTAINS_COMPONENT"
            ],
        )

        self.assertEqual(
            summary["controllerCount"],
            counts[
                "MODULE_CONTAINS_CONTROLLER"
            ],
        )

        self.assertEqual(
            summary["routeCount"],
            counts[
                "CONTROLLER_EXPOSES_ROUTE"
            ],
        )

        self.assertEqual(
            summary["routeCount"],
            counts["MODULE_EXPOSES_ROUTE"],
        )

    def test_generation_is_deterministic(self) -> None:
        first = build_repository_ir(
            modules_manifest=self.modules,
            controllers_manifest=self.controllers,
            architecture_manifest=self.architecture,
        ).document

        second = build_repository_ir(
            modules_manifest=self.modules,
            controllers_manifest=self.controllers,
            architecture_manifest=self.architecture,
        ).document

        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
