from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.architecture_intelligence import (
    analyse_architecture,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

MODULES_PATH = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
    / "modules.json"
)


class ArchitectureIntelligenceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.modules_manifest = json.loads(
            MODULES_PATH.read_text(encoding="utf-8")
        )

        cls.analysis = analyse_architecture(
            cls.modules_manifest
        ).document

    def module(self, module_id: str):
        for module in self.analysis["modules"]:
            if module["id"] == module_id:
                return module

        self.fail(f"Module not found: {module_id}")

    def test_preserves_module_count(self) -> None:
        self.assertEqual(
            self.modules_manifest["moduleCount"],
            self.analysis["summary"]["moduleCount"],
        )

    def test_property_is_aligned_platform_module(
        self,
    ) -> None:
        module = self.module("property")

        self.assertEqual(
            "core",
            module["physicalLocation"],
        )

        self.assertEqual(
            "platform",
            module["architecturalRole"],
        )

        self.assertEqual(
            "aligned",
            module["alignmentStatus"],
        )

    def test_helpdesk_is_detected_as_core_drift(
        self,
    ) -> None:
        module = self.module("helpdesk")

        self.assertEqual(
            "business",
            module["architecturalRole"],
        )

        self.assertEqual(
            "plugin",
            module["expectedLocation"],
        )

        self.assertEqual(
            "violation",
            module["alignmentStatus"],
        )

        self.assertEqual(
            "BUSINESS_MODULE_IN_CORE",
            module["violationCode"],
        )

    def test_visitor_plugin_is_aligned(self) -> None:
        module = self.module("plugin:visitor")

        self.assertEqual(
            "plugin",
            module["physicalLocation"],
        )

        self.assertEqual(
            "plugin",
            module["architecturalRole"],
        )

        self.assertEqual(
            "aligned",
            module["alignmentStatus"],
        )

    def test_violations_have_recommendations(
        self,
    ) -> None:
        violation_ids = {
            violation["moduleId"]
            for violation in self.analysis["violations"]
        }

        recommendation_ids = {
            recommendation["moduleId"]
            for recommendation
            in self.analysis["recommendations"]
        }

        self.assertEqual(
            violation_ids,
            recommendation_ids,
        )

        self.assertIn(
            "helpdesk",
            violation_ids,
        )

    def test_health_score_is_bounded(self) -> None:
        score = self.analysis[
            "summary"
        ]["architectureHealthScore"]

        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)

    def test_analysis_is_deterministic(self) -> None:
        first = analyse_architecture(
            self.modules_manifest
        ).document

        second = analyse_architecture(
            self.modules_manifest
        ).document

        self.assertEqual(first, second)

    def test_existing_manifests_are_not_modified(
        self,
    ) -> None:
        before = MODULES_PATH.read_bytes()

        with tempfile.TemporaryDirectory() as directory:
            output = (
                Path(directory)
                / "architecture-intelligence.json"
            )

            output.write_text(
                json.dumps(
                    self.analysis,
                    indent=2,
                    sort_keys=True,
                )
                + "\n",
                encoding="utf-8",
            )

        after = MODULES_PATH.read_bytes()

        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
