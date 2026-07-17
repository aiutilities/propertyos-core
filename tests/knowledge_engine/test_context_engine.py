from __future__ import annotations

import json
import unittest
from pathlib import Path

from tools.knowledge_engine.context_engine import (
    ContextResolutionError,
    RepositoryContextEngine,
)
from tools.knowledge_engine.context_formatter import (
    format_context_json,
    format_context_markdown,
)
from tools.knowledge_engine.context_models import (
    ContextRequest,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class ContextEngineTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

        cls.engine = (
            RepositoryContextEngine(
                cls.repository
            )
        )

    def test_module_context_focuses_inventory(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="module",
                value="inventory",
                depth=0,
            )
        )

        self.assertEqual(
            ("inventory",),
            package.focus_modules,
        )

        self.assertEqual(
            1,
            len(package.included_modules),
        )

    def test_depth_one_includes_neighbours(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="module",
                value="inventory",
                depth=1,
            )
        )

        included = {
            module.module_id
            for module
            in package.included_modules
        }

        self.assertIn(
            "procurement",
            included,
        )

        self.assertIn(
            "eventbus",
            included,
        )

    def test_task_context_finds_inventory(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="task",
                value=(
                    "add inventory stock "
                    "adjustment endpoint"
                ),
                depth=0,
            )
        )

        self.assertIn(
            "inventory",
            package.focus_modules,
        )

    def test_task_context_finds_tenant(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="task",
                value=(
                    "change tenant "
                    "authentication"
                ),
                depth=0,
            )
        )

        self.assertIn(
            "tenant",
            package.focus_modules,
        )

    def test_routes_are_limited_per_module(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="module",
                value="inventory",
                depth=0,
                route_limit=5,
            )
        )

        module = package.included_modules[0]

        self.assertEqual(
            5,
            len(module.routes),
        )

        self.assertEqual(
            60,
            package.excluded_route_count,
        )

    def test_context_contains_source_paths(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="module",
                value="helpdesk",
                depth=0,
            )
        )

        module = package.included_modules[0]

        self.assertTrue(module.source)

        self.assertTrue(
            all(
                controller["source"]
                for controller
                in module.controllers
            )
        )

    def test_architecture_warning_is_included(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="module",
                value="helpdesk",
                depth=0,
            )
        )

        self.assertGreater(
            len(package.warnings),
            0,
        )

    def test_json_is_valid_and_deterministic(
        self,
    ) -> None:
        package = self.engine.generate(
            ContextRequest(
                mode="module",
                value="inventory",
                depth=1,
                route_limit=10,
            )
        )

        first = format_context_json(
            package
        )

        second = format_context_json(
            package
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
        package = self.engine.generate(
            ContextRequest(
                mode="module",
                value="inventory",
                depth=0,
                route_limit=5,
            )
        )

        first = format_context_markdown(
            package
        )

        second = format_context_markdown(
            package
        )

        self.assertEqual(first, second)

        self.assertIn(
            "# PropertyOS Repository Context",
            first,
        )

        self.assertIn(
            "## Module: inventory",
            first,
        )

    def test_unknown_task_fails(
        self,
    ) -> None:
        with self.assertRaises(
            ContextResolutionError
        ):
            self.engine.generate(
                ContextRequest(
                    mode="task",
                    value="xyzzy plugh qwerty",
                    depth=0,
                )
            )

    def test_negative_depth_fails(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            self.engine.generate(
                ContextRequest(
                    mode="module",
                    value="inventory",
                    depth=-1,
                )
            )

    def test_zero_route_limit_fails(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            self.engine.generate(
                ContextRequest(
                    mode="module",
                    value="inventory",
                    route_limit=0,
                )
            )


if __name__ == "__main__":
    unittest.main()
