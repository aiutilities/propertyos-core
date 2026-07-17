from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.scanner import RepositoryScanner
from tools.knowledge_engine.writer import KnowledgeWriter


class RepositoryScannerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.repository_root = Path(__file__).resolve().parents[2]
        self.manifest = RepositoryScanner(
            self.repository_root
        ).scan()

    def module(self, module_id: str):
        for module in self.manifest.modules:
            if module.id == module_id:
                return module

        self.fail(f"Module not found: {module_id}")

    def test_discovers_expected_modules(self) -> None:
        module_ids = {
            module.id
            for module in self.manifest.modules
        }

        self.assertIn("inventory", module_ids)
        self.assertIn("procurement", module_ids)
        self.assertIn("property", module_ids)
        self.assertIn("tenant", module_ids)
        self.assertIn("plugin:visitor", module_ids)

    def test_ignores_legacy_duplicate_backend_tree(self) -> None:
        module_paths = [
            module.source.path
            for module in self.manifest.modules
        ]

        component_paths = [
            component.source.path
            for module in self.manifest.modules
            for component in module.components
        ]

        all_paths = module_paths + component_paths

        self.assertFalse(
            any(
                path.startswith("backend/backend/")
                for path in all_paths
            )
        )

    def test_discovers_inventory_components(self) -> None:
        inventory = self.module("inventory")

        component_kinds = {
            component.kind
            for component in inventory.components
        }

        component_classes = {
            component.class_name
            for component in inventory.components
        }

        self.assertIn("controller", component_kinds)
        self.assertIn("service", component_kinds)
        self.assertIn("bootstrap-service", component_kinds)
        self.assertIn("search-provider", component_kinds)

        self.assertIn(
            "InventoryController",
            component_classes,
        )

        self.assertIn(
            "InventoryService",
            component_classes,
        )

        self.assertIn(
            "InventoryBootstrapService",
            component_classes,
        )

        #
        # Accept either naming convention:
        # InventorySearchProvider
        # InventorySearchProviderService
        #
        self.assertTrue(
            any(
                name.startswith("InventorySearchProvider")
                for name in component_classes
            ),
            f"Search provider not found: {sorted(component_classes)}",
        )

    def test_component_records_include_source_paths(self) -> None:
        inventory = self.module("inventory")

        for component in inventory.components:
            self.assertEqual(
                component.module_id,
                "inventory",
            )
            self.assertTrue(
                component.source.path.startswith(
                    "backend/src/core/inventory/"
                )
            )
            self.assertTrue(
                component.source.path.endswith(".ts")
            )

    def test_components_have_unique_source_ownership(self) -> None:
        component_paths = [
            component.source.path
            for module in self.manifest.modules
            for component in module.components
        ]

        self.assertEqual(
            len(component_paths),
            len(set(component_paths)),
        )

    def test_legacy_controller_and_service_arrays_remain(self) -> None:
        inventory = self.module("inventory")

        self.assertIn(
            "InventoryController",
            inventory.controllers,
        )

        self.assertIn(
            "InventoryService",
            inventory.services,
        )

    def test_modules_and_components_are_sorted(self) -> None:
        actual_modules = [
            (
                module.kind,
                module.id,
                module.source.path,
            )
            for module in self.manifest.modules
        ]

        self.assertEqual(
            actual_modules,
            sorted(actual_modules),
        )

        for module in self.manifest.modules:
            actual_components = [
                (
                    component.kind,
                    component.id,
                    component.source.path,
                )
                for component in module.components
            ]

            self.assertEqual(
                actual_components,
                sorted(actual_components),
            )

    def test_repeated_writes_are_identical(self) -> None:
        scanner = RepositoryScanner(
            self.repository_root
        )

        with tempfile.TemporaryDirectory() as directory:
            writer = KnowledgeWriter(Path(directory))

            first_file = writer.write_modules(
                scanner.scan()
            )
            first_content = first_file.read_bytes()

            second_file = writer.write_modules(
                scanner.scan()
            )
            second_content = second_file.read_bytes()

        self.assertEqual(
            first_content,
            second_content,
        )

    def test_generated_document_is_valid_json(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output_file = KnowledgeWriter(
                Path(directory)
            ).write_modules(self.manifest)

            document = json.loads(
                output_file.read_text(
                    encoding="utf-8"
                )
            )

        self.assertEqual(
            document["schemaVersion"],
            "1.1.0",
        )

        self.assertEqual(
            document["moduleCount"],
            len(document["modules"]),
        )

        self.assertGreater(
            document["componentCount"],
            0,
        )

        calculated_component_count = sum(
            module["componentCount"]
            for module in document["modules"]
        )

        self.assertEqual(
            document["componentCount"],
            calculated_component_count,
        )


if __name__ == "__main__":
    unittest.main()
