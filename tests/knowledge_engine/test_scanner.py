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

    def test_discovers_expected_core_modules(self) -> None:
        manifest = RepositoryScanner(self.repository_root).scan()

        module_ids = {module.id for module in manifest.modules}

        self.assertIn("inventory", module_ids)
        self.assertIn("procurement", module_ids)
        self.assertIn("property", module_ids)
        self.assertIn("tenant", module_ids)
        self.assertIn("plugin:visitor", module_ids)

    def test_ignores_legacy_duplicate_backend_tree(self) -> None:
        manifest = RepositoryScanner(self.repository_root).scan()

        paths = [module.source.path for module in manifest.modules]

        self.assertFalse(
            any(path.startswith("backend/backend/") for path in paths)
        )

    def test_modules_are_sorted_deterministically(self) -> None:
        manifest = RepositoryScanner(self.repository_root).scan()

        actual = [
            (module.kind, module.id, module.source.path)
            for module in manifest.modules
        ]

        self.assertEqual(actual, sorted(actual))

    def test_repeated_writes_are_identical(self) -> None:
        scanner = RepositoryScanner(self.repository_root)
        manifest = scanner.scan()

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_directory = Path(temporary_directory)
            writer = KnowledgeWriter(output_directory)

            output_file = writer.write_modules(manifest)
            first_content = output_file.read_bytes()

            output_file = writer.write_modules(scanner.scan())
            second_content = output_file.read_bytes()

        self.assertEqual(first_content, second_content)

    def test_generated_document_is_valid_json(self) -> None:
        manifest = RepositoryScanner(self.repository_root).scan()

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_file = KnowledgeWriter(
                Path(temporary_directory)
            ).write_modules(manifest)

            document = json.loads(output_file.read_text(encoding="utf-8"))

        self.assertEqual(document["schemaVersion"], "1.0.0")
        self.assertEqual(document["moduleCount"], len(document["modules"]))
        self.assertGreater(document["moduleCount"], 0)


if __name__ == "__main__":
    unittest.main()
