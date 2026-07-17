from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.module_documentation import (
    GENERATED_NOTICE,
    build_module_documentation,
    write_module_documentation,
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


class ModuleDocumentationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository_ir = load(
            "repository.ir.json"
        )

        cls.dependency_graph = load(
            "dependency-graph.json"
        )

        cls.impact_analysis = load(
            "impact-analysis.json"
        )

        cls.documentation = (
            build_module_documentation(
                repository_ir=(
                    cls.repository_ir
                ),
                dependency_graph=(
                    cls.dependency_graph
                ),
                impact_analysis=(
                    cls.impact_analysis
                ),
            )
        )

        cls.documents = {
            document.relative_path: (
                document.content
            )
            for document
            in cls.documentation.documents
        }

    def test_generates_index_and_module_pages(
        self,
    ) -> None:
        self.assertEqual(
            (
                self.repository_ir[
                    "summary"
                ]["moduleCount"]
                + 1
            ),
            len(self.documentation.documents),
        )

        self.assertIn(
            "README.md",
            self.documents,
        )

    def test_document_paths_are_unique(
        self,
    ) -> None:
        paths = [
            document.relative_path
            for document
            in self.documentation.documents
        ]

        self.assertEqual(
            len(paths),
            len(set(paths)),
        )

    def test_eventbus_page_contains_impact(
        self,
    ) -> None:
        page = self.documents[
            "eventbus.md"
        ]

        self.assertIn(
            "# Eventbus",
            page,
        )

        self.assertIn(
            "| Class | `EventBusModule` |",
            page,
        )

        self.assertIn(
            "## Transitive Impact",
            page,
        )

        self.assertIn(
            "Risk score",
            page,
        )

    def test_helpdesk_page_contains_migration_guidance(
        self,
    ) -> None:
        page = self.documents[
            "helpdesk.md"
        ]

        self.assertIn(
            "## Architecture Migration Guidance",
            page,
        )

        self.assertIn(
            "BUSINESS_MODULE_IN_CORE",
            page,
        )

    def test_visitor_plugin_page_is_generated(
        self,
    ) -> None:
        page = self.documents[
            "plugin-visitor.md"
        ]

        self.assertIn(
            "Module ID: `plugin:visitor`",
            page,
        )

        self.assertIn(
            "| Physical location | `plugin` |",
            page,
        )

    def test_index_contains_repository_counts(
        self,
    ) -> None:
        index = self.documents["README.md"]

        self.assertIn(
            "| Modules | 47 |",
            index,
        )

        self.assertIn(
            "| Routes | 449 |",
            index,
        )

        self.assertIn(
            "## Architecture Migration Candidates",
            index,
        )

    def test_every_file_has_generated_notice(
        self,
    ) -> None:
        for content in self.documents.values():
            self.assertTrue(
                content.startswith(
                    GENERATED_NOTICE
                )
            )

    def test_generation_and_writes_are_deterministic(
        self,
    ) -> None:
        second = build_module_documentation(
            repository_ir=self.repository_ir,
            dependency_graph=(
                self.dependency_graph
            ),
            impact_analysis=(
                self.impact_analysis
            ),
        )

        self.assertEqual(
            self.documentation,
            second,
        )

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)

            write_module_documentation(
                output_directory=output,
                documentation=(
                    self.documentation
                ),
            )

            first_contents = {
                path.name: path.read_bytes()
                for path in output.glob(
                    "*.md"
                )
            }

            write_module_documentation(
                output_directory=output,
                documentation=second,
            )

            second_contents = {
                path.name: path.read_bytes()
                for path in output.glob(
                    "*.md"
                )
            }

            self.assertEqual(
                first_contents,
                second_contents,
            )


if __name__ == "__main__":
    unittest.main()
