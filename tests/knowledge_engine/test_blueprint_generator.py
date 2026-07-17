from __future__ import annotations

import json
import unittest
from pathlib import Path

from tools.knowledge_engine.blueprint_formatter import (
    format_blueprint_json,
    format_blueprint_markdown,
)
from tools.knowledge_engine.blueprint_generator import (
    BlueprintGenerationError,
    PluginBlueprintGenerator,
)
from tools.knowledge_engine.blueprint_models import (
    BlueprintRequest,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class BlueprintGeneratorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

        cls.generator = (
            PluginBlueprintGenerator(
                cls.repository
            )
        )

    def test_helpdesk_blueprint(
        self,
    ) -> None:
        portfolio = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        self.assertEqual(
            ("helpdesk",),
            portfolio.generation_order,
        )

        blueprint = (
            portfolio.blueprints[0]
        )

        self.assertEqual(
            "helpdesk",
            blueprint.plugin_id,
        )

        self.assertEqual(
            "@propertyos/plugin-helpdesk",
            blueprint.package_name,
        )

    def test_helpdesk_files_include_controller(
        self,
    ) -> None:
        blueprint = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="helpdesk",
            )
        ).blueprints[0]

        self.assertTrue(
            any(
                file.file_kind
                == "controller"
                for file
                in blueprint.files
            )
        )

    def test_helpdesk_target_paths_are_plugin_paths(
        self,
    ) -> None:
        blueprint = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="helpdesk",
            )
        ).blueprints[0]

        self.assertTrue(
            all(
                file.target_path.startswith(
                    "plugins/helpdesk/src/"
                )
                for file
                in blueprint.files
            )
        )

    def test_inventory_manifest_has_route_count(
        self,
    ) -> None:
        blueprint = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="inventory",
            )
        ).blueprints[0]

        self.assertEqual(
            65,
            blueprint.manifest["routes"],
        )

        self.assertEqual(
            8,
            blueprint.manifest[
                "controllers"
            ],
        )

    def test_platform_contracts_are_created(
        self,
    ) -> None:
        blueprint = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="inventory",
            )
        ).blueprints[0]

        sources = {
            contract.source_module
            for contract
            in blueprint.contracts
        }

        self.assertIn(
            "eventbus",
            sources,
        )

        self.assertIn(
            "database:postgres",
            sources,
        )

    def test_inventory_dependent_update_detected(
        self,
    ) -> None:
        blueprint = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="inventory",
            )
        ).blueprints[0]

        self.assertTrue(
            any(
                "procurement"
                in path
                for path
                in blueprint
                .dependent_updates
            )
        )

    def test_candidate_limit_is_applied(
        self,
    ) -> None:
        portfolio = self.generator.generate(
            BlueprintRequest(
                mode="candidates",
                limit=5,
            )
        )

        self.assertEqual(
            5,
            len(portfolio.blueprints),
        )

    def test_all_candidate_blueprints(
        self,
    ) -> None:
        portfolio = self.generator.generate(
            BlueprintRequest(
                mode="candidates"
            )
        )

        self.assertEqual(
            16,
            portfolio.summary[
                "blueprintCount"
            ],
        )

    def test_json_is_valid_and_deterministic(
        self,
    ) -> None:
        portfolio = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        first = format_blueprint_json(
            portfolio
        )

        second = format_blueprint_json(
            portfolio
        )

        self.assertEqual(first, second)

        value = json.loads(first)

        self.assertEqual(
            "1.0.0",
            value["schemaVersion"],
        )

    def test_markdown_is_deterministic(
        self,
    ) -> None:
        portfolio = self.generator.generate(
            BlueprintRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        first = (
            format_blueprint_markdown(
                portfolio
            )
        )

        second = (
            format_blueprint_markdown(
                portfolio
            )
        )

        self.assertEqual(first, second)

        self.assertIn(
            "## Module: helpdesk",
            first,
        )

    def test_missing_module_fails(
        self,
    ) -> None:
        with self.assertRaises(
            BlueprintGenerationError
        ):
            self.generator.generate(
                BlueprintRequest(
                    mode="module"
                )
            )

    def test_invalid_limit_fails(
        self,
    ) -> None:
        with self.assertRaises(
            BlueprintGenerationError
        ):
            self.generator.generate(
                BlueprintRequest(
                    mode="candidates",
                    limit=0,
                )
            )


if __name__ == "__main__":
    unittest.main()
