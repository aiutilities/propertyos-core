from __future__ import annotations

import json
import unittest
from pathlib import PurePosixPath

from tools.knowledge_engine.extraction_portfolio_formatter import (
    format_extraction_portfolio_json,
    format_extraction_portfolio_markdown,
)
from tools.knowledge_engine.extraction_portfolio_models import (
    ExtractionPortfolio,
    ExtractionStage,
    ExtractionStageResult,
    ModuleExtractionResult,
    StageStatus,
)


class ExtractionPortfolioFormatterTest(
    unittest.TestCase
):
    def _portfolio(
        self,
    ) -> ExtractionPortfolio:
        module = ModuleExtractionResult(
            module_id="helpdesk",
            package_name=(
                "@propertyos/plugin-helpdesk"
            ),
            workspace=PurePosixPath(
                "generated/plugin-staging/helpdesk"
            ),
            stages=(
                ExtractionStageResult(
                    stage=(
                        ExtractionStage.BLUEPRINT
                    ),
                    status=StageStatus.PASSED,
                    duration_seconds=0.125,
                    detail="Blueprint generated.",
                ),
                ExtractionStageResult(
                    stage=(
                        ExtractionStage.MATERIALIZATION
                    ),
                    status=StageStatus.PASSED,
                    duration_seconds=1.5,
                    detail="22 files copied.",
                    command=(
                        "python3",
                        "-m",
                        (
                            "tools.knowledge_engine."
                            "materialization_cli"
                        ),
                        "module",
                        "helpdesk",
                    ),
                    exit_code=0,
                ),
            ),
            warnings=(
                "Review route | parity.",
            ),
        )

        return ExtractionPortfolio(
            modules=(module,)
        )

    def test_json_is_valid_and_has_summary(
        self,
    ) -> None:
        value = json.loads(
            format_extraction_portfolio_json(
                self._portfolio()
            )
        )

        self.assertEqual(
            1,
            value["summary"]["moduleCount"],
        )

        self.assertEqual(
            1,
            value["summary"]["passedCount"],
        )

        self.assertTrue(
            value["summary"]["successful"]
        )

    def test_json_ends_with_newline(
        self,
    ) -> None:
        output = (
            format_extraction_portfolio_json(
                self._portfolio()
            )
        )

        self.assertTrue(
            output.endswith("\n")
        )

    def test_json_is_deterministic(
        self,
    ) -> None:
        portfolio = self._portfolio()

        self.assertEqual(
            format_extraction_portfolio_json(
                portfolio
            ),
            format_extraction_portfolio_json(
                portfolio
            ),
        )

    def test_markdown_contains_summary_and_module(
        self,
    ) -> None:
        output = (
            format_extraction_portfolio_markdown(
                self._portfolio()
            )
        )

        self.assertIn(
            "# PropertyOS Module Extraction Portfolio",
            output,
        )

        self.assertIn(
            "- Passed: `1`",
            output,
        )

        self.assertIn(
            "## Module: `helpdesk`",
            output,
        )

        self.assertIn(
            "| blueprint | passed | 0.125 |",
            output,
        )

    def test_markdown_contains_command(
        self,
    ) -> None:
        output = (
            format_extraction_portfolio_markdown(
                self._portfolio()
            )
        )

        self.assertIn(
            (
                "python3 -m "
                "tools.knowledge_engine."
                "materialization_cli "
                "module helpdesk"
            ),
            output,
        )

    def test_markdown_escapes_table_pipes(
        self,
    ) -> None:
        output = (
            format_extraction_portfolio_markdown(
                self._portfolio()
            )
        )

        self.assertIn(
            "Review route \\| parity.",
            output,
        )

    def test_empty_portfolio_is_reported(
        self,
    ) -> None:
        portfolio = ExtractionPortfolio(
            modules=()
        )

        output = (
            format_extraction_portfolio_markdown(
                portfolio
            )
        )

        self.assertIn(
            "_No modules were selected._",
            output,
        )

        self.assertIn(
            "- Portfolio result: `failed`",
            output,
        )
