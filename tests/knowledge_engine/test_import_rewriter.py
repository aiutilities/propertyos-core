from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.dependency_closure import (
    TransitiveDependencyClosure,
)
from tools.knowledge_engine.dependency_closure_models import (
    DependencyClosureRequest,
)
from tools.knowledge_engine.import_analysis_models import (
    ImportAnalysisRequest,
    ImportReference,
)
from tools.knowledge_engine.import_analyzer import (
    StagedImportAnalyzer,
)
from tools.knowledge_engine.import_rewrite_formatter import (
    format_import_rewrite_json,
)
from tools.knowledge_engine.import_rewrite_models import (
    ImportRewriteRequest,
)
from tools.knowledge_engine.import_rewriter import (
    ImportRewriteError,
    StagedImportRewriter,
)
from tools.knowledge_engine.materialization_models import (
    MaterializationRequest,
)
from tools.knowledge_engine.materializer import (
    StagedPluginMaterializer,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = (
    Path(__file__).resolve().parents[2]
)


class ImportRewriterTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

    def _prepare(
        self,
        directory: str,
        close_dependencies: bool = True,
    ) -> tuple[
        StagedImportRewriter,
        Path,
    ]:
        staging_root = (
            Path(directory)
            / "plugin-staging"
        )

        StagedPluginMaterializer(
            repository=self.repository,
            repository_root=(
                REPOSITORY_ROOT
            ),
            output_root=staging_root,
        ).materialize(
            MaterializationRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        if close_dependencies:
            TransitiveDependencyClosure(
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=staging_root,
            ).analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                    limit=None,
                    apply=True,
                    overwrite=False,
                )
            )

        return (
            StagedImportRewriter(
                repository=self.repository,
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=staging_root,
            ),
            staging_root,
        )

    def test_check_does_not_modify_files(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            rewriter, staging_root = (
                self._prepare(directory)
            )

            workspace = (
                staging_root
                / "helpdesk"
            )

            before = {
                path.relative_to(
                    workspace
                ).as_posix():
                path.read_bytes()
                for path
                in workspace.rglob(
                    "*.ts"
                )
            }

            portfolio = rewriter.rewrite(
                ImportRewriteRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=False,
                )
            )

            after = {
                path.relative_to(
                    workspace
                ).as_posix():
                path.read_bytes()
                for path
                in workspace.rglob(
                    "*.ts"
                )
            }

            self.assertEqual(
                before,
                after,
            )

            self.assertGreater(
                portfolio.summary[
                    "plannedRewriteCount"
                ],
                0,
            )

            self.assertEqual(
                0,
                portfolio.summary[
                    "appliedRewriteCount"
                ],
            )

    def test_apply_rewrites_all_platform_imports(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            rewriter, _ = self._prepare(
                directory
            )

            portfolio = rewriter.rewrite(
                ImportRewriteRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=True,
                )
            )

            self.assertGreater(
                portfolio.summary[
                    "appliedRewriteCount"
                ],
                0,
            )

            self.assertEqual(
                0,
                portfolio.summary[
                    "remainingRewriteCount"
                ],
            )

            self.assertEqual(
                0,
                portfolio.summary[
                    "unresolvedCount"
                ],
            )

            self.assertEqual(
                1,
                portfolio.summary[
                    "validPluginCount"
                ],
            )

    def test_apply_is_idempotent(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            rewriter, _ = self._prepare(
                directory
            )

            first = rewriter.rewrite(
                ImportRewriteRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=True,
                )
            )

            second = rewriter.rewrite(
                ImportRewriteRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=True,
                )
            )

            self.assertGreater(
                first.summary[
                    "appliedRewriteCount"
                ],
                0,
            )

            self.assertEqual(
                0,
                second.summary[
                    "plannedRewriteCount"
                ],
            )

            self.assertEqual(
                0,
                second.summary[
                    "appliedRewriteCount"
                ],
            )

    def test_incomplete_workspace_is_rejected(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            rewriter, _ = self._prepare(
                directory,
                close_dependencies=False,
            )

            with self.assertRaisesRegex(
                ImportRewriteError,
                "dependency-closed",
            ):
                rewriter.rewrite(
                    ImportRewriteRequest(
                        mode="module",
                        module_id="helpdesk",
                        apply=True,
                    )
                )

    def test_multiline_import_preserves_formatting(
        self,
    ) -> None:
        text = (
            "import {\n"
            "  SchedulerJob,\n"
            "  SchedulerJobHandler,\n"
            "} from '../../scheduler/"
            "types/scheduler.types';\n"
        )

        reference = ImportReference(
            source_file="src/example.ts",
            line=1,
            column=1,
            syntax="import",
            imported_symbols=(
                "SchedulerJob",
                "SchedulerJobHandler",
            ),
            original_specifier=(
                "../../scheduler/types/"
                "scheduler.types"
            ),
            classification=(
                "platform-contract"
            ),
            resolution_status=(
                "resolved-original"
            ),
            resolved_path=(
                "backend/src/core/"
                "scheduler/types/"
                "scheduler.types.ts"
            ),
            target_module="scheduler",
            proposed_specifier=(
                "@propertyos/core-contracts"
            ),
            rewrite_required=True,
            reason="test",
        )

        rewritten, changes = (
            StagedImportRewriter
            ._rewrite_text(
                text=text,
                references=(reference,),
                apply=True,
            )
        )

        self.assertEqual(
            (
                "import {\n"
                "  SchedulerJob,\n"
                "  SchedulerJobHandler,\n"
                "} from "
                "'@propertyos/core-contracts';\n"
            ),
            rewritten,
        )

        self.assertEqual(
            1,
            len(changes),
        )

    def test_stale_plan_is_rejected(
        self,
    ) -> None:
        text = (
            "import { A } from './actual';\n"
        )

        reference = ImportReference(
            source_file="src/example.ts",
            line=1,
            column=1,
            syntax="import",
            imported_symbols=("A",),
            original_specifier=(
                "./expected"
            ),
            classification=(
                "platform-contract"
            ),
            resolution_status=(
                "resolved-original"
            ),
            resolved_path="",
            target_module="auth",
            proposed_specifier=(
                "@propertyos/core-contracts"
            ),
            rewrite_required=True,
            reason="test",
        )

        with self.assertRaisesRegex(
            ImportRewriteError,
            "Stale import rewrite plan",
        ):
            StagedImportRewriter._rewrite_text(
                text=text,
                references=(reference,),
                apply=True,
            )

    def test_json_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            rewriter, _ = self._prepare(
                directory
            )

            portfolio = rewriter.rewrite(
                ImportRewriteRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=False,
                )
            )

            self.assertEqual(
                format_import_rewrite_json(
                    portfolio
                ),
                format_import_rewrite_json(
                    portfolio
                ),
            )
