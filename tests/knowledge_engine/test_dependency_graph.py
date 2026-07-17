from __future__ import annotations

import json
import unittest
from pathlib import Path

from tools.knowledge_engine.dependency_graph import (
    build_dependency_graph,
)
from tools.knowledge_engine.module_dependency_ast_cli import (
    generate_module_dependency_ast,
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


class DependencyGraphTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.modules = load("modules.json")
        cls.architecture = load(
            "architecture-intelligence.json"
        )

        cls.dependencies = (
            generate_module_dependency_ast(
                repository_root=(
                    REPOSITORY_ROOT
                ),
                output=(
                    KNOWLEDGE_DIRECTORY
                    / "module-dependencies.ast.json"
                ),
            )
        )

        cls.graph = build_dependency_graph(
            modules_manifest=cls.modules,
            dependency_manifest=cls.dependencies,
            architecture_manifest=cls.architecture,
        ).document

    def node(self, module_id: str) -> dict:
        for node in self.graph["nodes"]:
            if node["id"] == module_id:
                return node

        self.fail(f"Node not found: {module_id}")

    def test_preserves_module_count(self) -> None:
        self.assertEqual(
            self.modules["moduleCount"],
            self.graph["summary"]["moduleCount"],
        )

    def test_extracts_internal_dependencies(
        self,
    ) -> None:
        self.assertGreater(
            self.graph["summary"][
                "internalDependencyCount"
            ],
            0,
        )

    def test_tenant_depends_on_identity(self) -> None:
        tenant = self.node("tenant")

        self.assertIn(
            "identity",
            tenant["outboundModuleIds"],
        )

    def test_tenant_depends_on_eventbus(self) -> None:
        tenant = self.node("tenant")

        self.assertIn(
            "eventbus",
            tenant["outboundModuleIds"],
        )

    def test_visitor_plugin_has_dependencies(
        self,
    ) -> None:
        visitor = self.node("plugin:visitor")

        self.assertEqual(
            "plugin",
            visitor["physicalLocation"],
        )

        self.assertGreater(
            visitor["outboundDependencyCount"],
            0,
        )

    def test_every_internal_edge_has_nodes(
        self,
    ) -> None:
        node_ids = {
            node["id"]
            for node in self.graph["nodes"]
        }

        for edge in self.graph[
            "internalDependencies"
        ]:
            self.assertIn(
                edge["fromModuleId"],
                node_ids,
            )

            self.assertIn(
                edge["toModuleId"],
                node_ids,
            )

    def test_no_self_dependencies(self) -> None:
        self.assertEqual(
            0,
            self.graph["summary"][
                "selfDependencyCount"
            ],
        )

    def test_generation_is_deterministic(
        self,
    ) -> None:
        first = build_dependency_graph(
            modules_manifest=self.modules,
            dependency_manifest=self.dependencies,
            architecture_manifest=self.architecture,
        ).document

        second = build_dependency_graph(
            modules_manifest=self.modules,
            dependency_manifest=self.dependencies,
            architecture_manifest=self.architecture,
        ).document

        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
