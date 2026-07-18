from __future__ import annotations

import unittest
from pathlib import PurePosixPath

from tools.knowledge_engine.extraction_portfolio_models import (
    ExtractionPortfolio,
    ExtractionStage,
    ExtractionStageResult,
    ModuleExtractionResult,
    ModuleExtractionStatus,
    StageStatus,
)


class ExtractionPortfolioModelsTest(
    unittest.TestCase
):
    def _stage(
        self,
        stage: ExtractionStage,
        status: StageStatus = StageStatus.PASSED,
    ) -> ExtractionStageResult:
        return ExtractionStageResult(
            stage=stage,
            status=status,
            duration_seconds=0.25,
        )

    def _module(
        self,
        module_id: str = "helpdesk",
        stages=None,
        warnings=(),
        errors=(),
    ) -> ModuleExtractionResult:
        if stages is None:
            stages = (
                self._stage(
                    ExtractionStage.BLUEPRINT
                ),
                self._stage(
                    ExtractionStage.MATERIALIZATION
                ),
                self._stage(
                    ExtractionStage.CLOSURE
                ),
                self._stage(
                    ExtractionStage.REWRITE
                ),
                self._stage(
                    ExtractionStage.INSTALL
                ),
                self._stage(
                    ExtractionStage.COMPILE
                ),
            )

        return ModuleExtractionResult(
            module_id=module_id,
            package_name=(
                "@propertyos/plugin-"
                + module_id
            ),
            workspace=PurePosixPath(
                "generated/plugin-staging"
            )
            / module_id,
            stages=tuple(stages),
            warnings=tuple(warnings),
            errors=tuple(errors),
        )

    def test_complete_module_passes(self) -> None:
        module = self._module()

        self.assertEqual(
            ModuleExtractionStatus.PASSED,
            module.status,
        )

    def test_failed_stage_fails_module(self) -> None:
        module = self._module(
            stages=(
                self._stage(
                    ExtractionStage.BLUEPRINT
                ),
                self._stage(
                    ExtractionStage.MATERIALIZATION,
                    StageStatus.FAILED,
                ),
            )
        )

        self.assertEqual(
            ModuleExtractionStatus.FAILED,
            module.status,
        )

    def test_error_fails_module(self) -> None:
        module = self._module(
            stages=(),
            errors=("Blueprint failed.",),
        )

        self.assertEqual(
            ModuleExtractionStatus.FAILED,
            module.status,
        )

    def test_blocked_stage_blocks_module(
        self,
    ) -> None:
        module = self._module(
            stages=(
                self._stage(
                    ExtractionStage.BLUEPRINT
                ),
                self._stage(
                    ExtractionStage.MATERIALIZATION,
                    StageStatus.BLOCKED,
                ),
            )
        )

        self.assertEqual(
            ModuleExtractionStatus.BLOCKED,
            module.status,
        )

    def test_pending_stage_keeps_module_pending(
        self,
    ) -> None:
        module = self._module(
            stages=(
                self._stage(
                    ExtractionStage.BLUEPRINT
                ),
                self._stage(
                    ExtractionStage.MATERIALIZATION,
                    StageStatus.PENDING,
                ),
            )
        )

        self.assertEqual(
            ModuleExtractionStatus.PENDING,
            module.status,
        )

    def test_skipped_stage_can_still_pass(
        self,
    ) -> None:
        module = self._module(
            stages=(
                self._stage(
                    ExtractionStage.BLUEPRINT
                ),
                self._stage(
                    ExtractionStage.INSTALL,
                    StageStatus.SKIPPED,
                ),
                self._stage(
                    ExtractionStage.COMPILE,
                ),
            )
        )

        self.assertEqual(
            ModuleExtractionStatus.PASSED,
            module.status,
        )

    def test_duplicate_stages_are_rejected(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "unique",
        ):
            self._module(
                stages=(
                    self._stage(
                        ExtractionStage.BLUEPRINT
                    ),
                    self._stage(
                        ExtractionStage.BLUEPRINT
                    ),
                )
            )

    def test_out_of_order_stages_are_rejected(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "out of order",
        ):
            self._module(
                stages=(
                    self._stage(
                        ExtractionStage.REWRITE
                    ),
                    self._stage(
                        ExtractionStage.CLOSURE
                    ),
                )
            )

    def test_duplicate_modules_are_rejected(
        self,
    ) -> None:
        module = self._module()

        with self.assertRaisesRegex(
            ValueError,
            "unique",
        ):
            ExtractionPortfolio(
                modules=(module, module)
            )

    def test_portfolio_summary_counts_statuses(
        self,
    ) -> None:
        passed = self._module(
            module_id="helpdesk"
        )

        failed = self._module(
            module_id="maintenance",
            stages=(
                self._stage(
                    ExtractionStage.BLUEPRINT,
                    StageStatus.FAILED,
                ),
            ),
        )

        blocked = self._module(
            module_id="staff",
            stages=(
                self._stage(
                    ExtractionStage.BLUEPRINT,
                    StageStatus.BLOCKED,
                ),
            ),
        )

        pending = self._module(
            module_id="vehicle",
            stages=(),
        )

        portfolio = ExtractionPortfolio(
            modules=(
                passed,
                failed,
                blocked,
                pending,
            )
        )

        self.assertEqual(
            {
                "moduleCount": 4,
                "passedCount": 1,
                "failedCount": 1,
                "blockedCount": 1,
                "pendingCount": 1,
                "successful": False,
            },
            portfolio.to_dict()["summary"],
        )

    def test_successful_portfolio_requires_modules(
        self,
    ) -> None:
        self.assertFalse(
            ExtractionPortfolio(
                modules=()
            ).is_successful
        )

        self.assertTrue(
            ExtractionPortfolio(
                modules=(
                    self._module(),
                )
            ).is_successful
        )

    def test_serialization_is_deterministic(
        self,
    ) -> None:
        module = self._module(
            warnings=("Review routes.",)
        )

        first = ExtractionPortfolio(
            modules=(module,)
        ).to_dict()

        second = ExtractionPortfolio(
            modules=(module,)
        ).to_dict()

        self.assertEqual(first, second)
        self.assertEqual(
            "generated/plugin-staging/helpdesk",
            first["modules"][0]["workspace"],
        )

    def test_invalid_stage_exit_codes_are_rejected(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "passed stage",
        ):
            ExtractionStageResult(
                stage=ExtractionStage.COMPILE,
                status=StageStatus.PASSED,
                exit_code=1,
            )

        with self.assertRaisesRegex(
            ValueError,
            "failed stage",
        ):
            ExtractionStageResult(
                stage=ExtractionStage.COMPILE,
                status=StageStatus.FAILED,
                exit_code=0,
            )
