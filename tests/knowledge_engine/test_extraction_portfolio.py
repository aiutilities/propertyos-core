from __future__ import annotations

import unittest
from pathlib import Path

from tools.knowledge_engine.extraction_portfolio import (
    CommandResult,
    ExtractionPortfolioError,
    ModuleExtractionPortfolio,
)
from tools.knowledge_engine.extraction_portfolio_models import (
    ExtractionStage,
    ModuleExtractionStatus,
    StageStatus,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = (
    Path(__file__).resolve().parents[2]
)


class FakeCommandRunner:
    def __init__(
        self,
        failures=(),
    ) -> None:
        self.failures = set(failures)
        self.calls = []

    def __call__(
        self,
        command,
        cwd,
    ) -> CommandResult:
        self.calls.append(
            (command, cwd)
        )

        command_text = " ".join(command)

        failed = any(
            marker in command_text
            for marker in self.failures
        )

        return CommandResult(
            exit_code=1 if failed else 0,
            duration_seconds=0.1,
            stdout=(
                ""
                if failed
                else "completed"
            ),
            stderr=(
                "simulated failure"
                if failed
                else ""
            ),
        )


class ModuleExtractionPortfolioTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

    def _extractor(
        self,
        runner,
    ) -> ModuleExtractionPortfolio:
        return ModuleExtractionPortfolio(
            repository=self.repository,
            repository_root=(
                REPOSITORY_ROOT
            ),
            command_runner=runner,
            python_executable="python-test",
            npm_executable="npm-test",
        )

    def test_helpdesk_runs_complete_pipeline(
        self,
    ) -> None:
        runner = FakeCommandRunner()

        portfolio = self._extractor(
            runner
        ).extract(
            module_ids=("helpdesk",)
        )

        module = portfolio.modules[0]

        self.assertEqual(
            ModuleExtractionStatus.PASSED,
            module.status,
        )

        self.assertEqual(
            (
                ExtractionStage.BLUEPRINT,
                ExtractionStage.MATERIALIZATION,
                ExtractionStage.CLOSURE,
                ExtractionStage.REWRITE,
                ExtractionStage.INSTALL,
                ExtractionStage.COMPILE,
            ),
            tuple(
                stage.stage
                for stage in module.stages
            ),
        )

        self.assertEqual(
            5,
            len(runner.calls),
        )

        self.assertEqual(
            (
                "npm-test",
                "run",
                "build",
            ),
            runner.calls[-1][0],
        )

    def test_failure_blocks_downstream_stages(
        self,
    ) -> None:
        runner = FakeCommandRunner(
            failures=(
                "dependency_closure_cli",
            )
        )

        portfolio = self._extractor(
            runner
        ).extract(
            module_ids=("helpdesk",)
        )

        module = portfolio.modules[0]

        self.assertEqual(
            ModuleExtractionStatus.FAILED,
            module.status,
        )

        self.assertEqual(
            StageStatus.FAILED,
            module.stage(
                ExtractionStage.CLOSURE
            ).status,
        )

        for stage in (
            ExtractionStage.REWRITE,
            ExtractionStage.INSTALL,
            ExtractionStage.COMPILE,
        ):
            self.assertEqual(
                StageStatus.BLOCKED,
                module.stage(stage).status,
            )

        self.assertEqual(
            2,
            len(runner.calls),
        )

    def test_failed_module_does_not_stop_portfolio(
        self,
    ) -> None:
        class ModuleAwareRunner(
            FakeCommandRunner
        ):
            def __call__(
                self,
                command,
                cwd,
            ) -> CommandResult:
                self.calls.append(
                    (command, cwd)
                )

                failed = (
                    "helpdesk" in command
                    and any(
                        argument.endswith(
                            "materialization_cli"
                        )
                        for argument in command
                    )
                )

                return CommandResult(
                    exit_code=1 if failed else 0,
                    duration_seconds=0.1,
                    stderr=(
                        "helpdesk failure"
                        if failed
                        else ""
                    ),
                )

        runner = ModuleAwareRunner()

        portfolio = self._extractor(
            runner
        ).extract(
            module_ids=(
                "helpdesk",
                "maintenance",
            ),
        )

        self.assertEqual(
            ModuleExtractionStatus.FAILED,
            portfolio.modules[0].status,
        )

        self.assertEqual(
            ModuleExtractionStatus.PASSED,
            portfolio.modules[1].status,
        )

        self.assertEqual(
            1,
            portfolio.failed_count,
        )

        self.assertEqual(
            1,
            portfolio.passed_count,
        )

    def test_install_and_compile_can_be_skipped(
        self,
    ) -> None:
        runner = FakeCommandRunner()

        portfolio = self._extractor(
            runner
        ).extract(
            module_ids=("helpdesk",),
            install=False,
            compile_plugin=False,
        )

        module = portfolio.modules[0]

        self.assertEqual(
            StageStatus.SKIPPED,
            module.stage(
                ExtractionStage.INSTALL
            ).status,
        )

        self.assertEqual(
            StageStatus.SKIPPED,
            module.stage(
                ExtractionStage.COMPILE
            ).status,
        )

        self.assertEqual(
            ModuleExtractionStatus.PASSED,
            module.status,
        )

        self.assertEqual(
            3,
            len(runner.calls),
        )

    def test_requested_module_order_is_preserved(
        self,
    ) -> None:
        runner = FakeCommandRunner()

        portfolio = self._extractor(
            runner
        ).extract(
            module_ids=(
                "maintenance",
                "helpdesk",
            ),
            install=False,
            compile_plugin=False,
        )

        self.assertEqual(
            (
                "maintenance",
                "helpdesk",
            ),
            tuple(
                module.module_id
                for module in portfolio.modules
            ),
        )

    def test_duplicate_modules_are_rejected(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ExtractionPortfolioError,
            "unique",
        ):
            self._extractor(
                FakeCommandRunner()
            ).extract(
                module_ids=(
                    "helpdesk",
                    "helpdesk",
                )
            )

    def test_invalid_limit_is_rejected(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ExtractionPortfolioError,
            "greater than zero",
        ):
            self._extractor(
                FakeCommandRunner()
            ).extract(
                limit=0
            )

    def test_successful_json_output_has_stable_detail(
        self,
    ) -> None:
        extractor = self._extractor(
            FakeCommandRunner()
        )

        detail = extractor._command_detail(
            CommandResult(
                exit_code=0,
                duration_seconds=0.1,
                stdout=(
                    "{\\n"
                    '  "summary": {\\n'
                    '    "validPluginCount": 1\\n'
                    "  }\\n"
                    "}\\n"
                ),
            )
        )

        self.assertEqual(
            "Command completed successfully.",
            detail,
        )

    def test_staging_root_escape_is_rejected(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ExtractionPortfolioError,
            "escapes",
        ):
            ModuleExtractionPortfolio(
                repository=self.repository,
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=Path("../outside"),
                command_runner=(
                    FakeCommandRunner()
                ),
            )
