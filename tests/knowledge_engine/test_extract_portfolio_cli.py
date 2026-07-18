from __future__ import annotations

import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path, PurePosixPath

from tools.knowledge_engine.extract_portfolio import (
    main,
)
from tools.knowledge_engine.extraction_portfolio_models import (
    ExtractionPortfolio,
    ExtractionStage,
    ExtractionStageResult,
    ModuleExtractionResult,
    StageStatus,
)


REPOSITORY_ROOT = (
    Path(__file__).resolve().parents[2]
)


def portfolio(
    failed=False,
) -> ExtractionPortfolio:
    return ExtractionPortfolio(
        modules=(
            ModuleExtractionResult(
                module_id="helpdesk",
                package_name=(
                    "@propertyos/plugin-helpdesk"
                ),
                workspace=PurePosixPath(
                    "generated/plugin-staging/"
                    "helpdesk"
                ),
                stages=(
                    ExtractionStageResult(
                        stage=(
                            ExtractionStage.BLUEPRINT
                        ),
                        status=(
                            StageStatus.FAILED
                            if failed
                            else StageStatus.PASSED
                        ),
                        detail=(
                            "failed"
                            if failed
                            else "passed"
                        ),
                        exit_code=(
                            1 if failed else 0
                        ),
                    ),
                ),
            ),
        )
    )


class FakeExtractor:
    calls = []
    result = portfolio()

    def __init__(
        self,
        **kwargs,
    ) -> None:
        self.kwargs = kwargs

    def extract(
        self,
        **kwargs,
    ) -> ExtractionPortfolio:
        type(self).calls.append(kwargs)
        return type(self).result


class ExtractPortfolioCliTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        FakeExtractor.calls = []
        FakeExtractor.result = portfolio()

    def _run(
        self,
        arguments,
    ):
        stdout = io.StringIO()

        with redirect_stdout(stdout):
            exit_code = main(
                arguments,
                extractor_factory=FakeExtractor,
            )

        return exit_code, stdout.getvalue()

    def test_all_selects_candidate_portfolio(
        self,
    ) -> None:
        exit_code, _ = self._run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--all",
            )
        )

        self.assertEqual(0, exit_code)
        self.assertEqual(
            (),
            FakeExtractor.calls[0][
                "module_ids"
            ],
        )

    def test_modules_are_parsed_in_order(
        self,
    ) -> None:
        exit_code, _ = self._run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--modules",
                "maintenance, helpdesk",
            )
        )

        self.assertEqual(0, exit_code)
        self.assertEqual(
            (
                "maintenance",
                "helpdesk",
            ),
            FakeExtractor.calls[0][
                "module_ids"
            ],
        )

    def test_skip_flags_are_forwarded(
        self,
    ) -> None:
        exit_code, _ = self._run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--modules",
                "helpdesk",
                "--skip-install",
                "--skip-compile",
                "--no-overwrite",
            )
        )

        self.assertEqual(0, exit_code)

        call = FakeExtractor.calls[0]

        self.assertFalse(call["install"])
        self.assertFalse(
            call["compile_plugin"]
        )
        self.assertFalse(call["overwrite"])

    def test_json_output_is_valid(
        self,
    ) -> None:
        exit_code, output = self._run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--modules",
                "helpdesk",
            )
        )

        self.assertEqual(0, exit_code)

        value = json.loads(output)

        self.assertEqual(
            1,
            value["summary"]["passedCount"],
        )

    def test_markdown_output_is_supported(
        self,
    ) -> None:
        exit_code, output = self._run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--modules",
                "helpdesk",
                "--format",
                "markdown",
            )
        )

        self.assertEqual(0, exit_code)
        self.assertIn(
            "## Module: `helpdesk`",
            output,
        )

    def test_failed_portfolio_returns_one(
        self,
    ) -> None:
        FakeExtractor.result = portfolio(
            failed=True
        )

        exit_code, _ = self._run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--all",
            )
        )

        self.assertEqual(1, exit_code)

    def test_output_file_is_written(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output_path = (
                Path(directory)
                / "portfolio.json"
            )

            exit_code, output = self._run(
                (
                    "--repository-root",
                    str(REPOSITORY_ROOT),
                    "--modules",
                    "helpdesk",
                    "--output",
                    str(output_path),
                )
            )

            self.assertEqual(0, exit_code)
            self.assertEqual(
                output,
                output_path.read_text(
                    encoding="utf-8"
                ),
            )
