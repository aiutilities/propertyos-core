from __future__ import annotations

import json
import unittest
from pathlib import Path

from tools.knowledge_engine.query_engine import (
    RepositoryQueryEngine,
)
from tools.knowledge_engine.query_formatter import (
    format_json,
    format_markdown,
    format_table,
)
from tools.knowledge_engine.query_models import (
    QueryRequest,
)
from tools.knowledge_engine.query_parser import (
    parse_query,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class QueryParserTest(unittest.TestCase):
    def test_parses_module_query(
        self,
    ) -> None:
        request = parse_query(
            ["module", "inventory"]
        )

        self.assertEqual(
            QueryRequest(
                command="module",
                argument="inventory",
            ),
            request,
        )

    def test_parses_transitive_dependency_query(
        self,
    ) -> None:
        request = parse_query(
            [
                "dependents",
                "eventbus",
                "--transitive",
            ]
        )

        self.assertTrue(
            request.transitive
        )

        self.assertEqual(
            "eventbus",
            request.argument,
        )

    def test_parses_limit_argument(
        self,
    ) -> None:
        request = parse_query(
            ["top-risk", "5"]
        )

        self.assertEqual(
            5,
            request.limit,
        )

    def test_unknown_command_fails(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            parse_query(
                ["unknown-command"]
            )


class RepositoryQueryEngineTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

        cls.engine = RepositoryQueryEngine(
            cls.repository
        )

    def test_summary_query(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="summary"
            )
        )

        self.assertEqual(
            "summary",
            result.query_type,
        )

        self.assertEqual(
            47,
            result.metadata["moduleCount"],
        )

    def test_inventory_module_query(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="module",
                argument="inventory",
            )
        )

        self.assertEqual(
            "inventory",
            result.rows[0]["moduleId"],
        )

        self.assertEqual(
            65,
            result.rows[0]["routes"],
        )

    def test_eventbus_dependents_query(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="dependents",
                argument="eventbus",
            )
        )

        self.assertEqual(
            31,
            result.metadata["count"],
        )

    def test_identity_blast_radius_query(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="blast-radius",
                argument="identity",
            )
        )

        self.assertEqual(
            34,
            result.metadata["count"],
        )

    def test_plugin_candidates_are_lowest_risk_first(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="plugin-candidates"
            )
        )

        self.assertEqual(
            "receipt",
            result.rows[0]["moduleId"],
        )

        self.assertEqual(
            16,
            result.metadata["totalCount"],
        )

    def test_top_risk_query(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="top-risk",
                limit=5,
            )
        )

        self.assertEqual(
            [
                "eventbus",
                "database:postgres",
                "identity",
                "search",
                "plugin",
            ],
            [
                row["moduleId"]
                for row in result.rows
            ],
        )

    def test_route_search_query(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="find-route",
                argument="invoice",
                limit=10,
            )
        )

        self.assertGreater(
            result.metadata["totalCount"],
            0,
        )

    def test_formatters_are_deterministic(
        self,
    ) -> None:
        result = self.engine.execute(
            QueryRequest(
                command="top-risk",
                limit=5,
            )
        )

        json_output = format_json(result)
        markdown_output = (
            format_markdown(result)
        )
        table_output = (
            format_table(result)
        )

        self.assertEqual(
            json_output,
            format_json(result),
        )

        self.assertEqual(
            markdown_output,
            format_markdown(result),
        )

        self.assertEqual(
            table_output,
            format_table(result),
        )

        data = json.loads(json_output)

        self.assertEqual(
            "top-risk",
            data["queryType"],
        )


if __name__ == "__main__":
    unittest.main()
