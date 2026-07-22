from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.import_analysis_formatter import (
    format_import_analysis_json,
    format_import_analysis_markdown,
)
from tools.knowledge_engine.import_analysis_models import (
    ImportAnalysisRequest,
)
from tools.knowledge_engine.import_analyzer import (
    ImportAnalysisError,
    StagedImportAnalyzer,
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


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class ImportAnalyzerTest(
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
        module_id: str = "helpdesk",
    ) -> tuple[
        StagedImportAnalyzer,
        Path,
    ]:
        staging_root = (
            Path(directory)
            / "plugin-staging"
        )

        materializer = (
            StagedPluginMaterializer(
                repository=self.repository,
                repository_root=(
                    REPOSITORY_ROOT
                ),
                output_root=(
                    staging_root
                ),
            )
        )

        materializer.materialize(
            MaterializationRequest(
                mode="module",
                module_id=module_id,
            )
        )

        analyzer = StagedImportAnalyzer(
            repository=self.repository,
            repository_root=(
                REPOSITORY_ROOT
            ),
            staging_root=staging_root,
        )

        return analyzer, staging_root

    def test_helpdesk_analysis(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, _ = self._prepare(
                directory
            )

            portfolio = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            self.assertEqual(
                1,
                portfolio.summary[
                    "pluginCount"
                ],
            )

            self.assertEqual(
                "helpdesk",
                portfolio.analyses[0]
                .module_id,
            )

    def test_helpdesk_source_files_detected(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, _ = self._prepare(
                directory
            )

            analysis = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            self.assertEqual(
                7,
                analysis.source_file_count,
            )

    def test_external_packages_remain_unchanged(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, _ = self._prepare(
                directory
            )

            analysis = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            external = [
                reference
                for file in analysis.files
                for reference
                in file.imports
                if reference.classification
                == "external-package"
            ]

            self.assertTrue(external)

            self.assertTrue(
                all(
                    not reference
                    .rewrite_required
                    for reference
                    in external
                )
            )

    def test_incomplete_staging_resolves_against_repository(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, _ = self._prepare(
                directory
            )

            analysis = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            unresolved = [
                reference
                for file in analysis.files
                for reference
                in file.imports
                if reference.classification
                == "unresolved-relative"
            ]

            resolved_original = [
                reference
                for file in analysis.files
                for reference
                in file.imports
                if reference.resolution_status
                == "resolved-original"
            ]

            self.assertEqual(
                0,
                len(unresolved),
            )

            self.assertEqual(
                60,
                len(resolved_original),
            )

            self.assertEqual(
                0,
                analysis.unresolved_count,
            )

            self.assertTrue(
                analysis.valid
            )

    def test_rewrites_are_planned_for_unresolved_imports(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, _ = self._prepare(
                directory
            )

            analysis = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            rewrites = [
                reference
                for file in analysis.files
                for reference
                in file.imports
                if reference.rewrite_required
            ]

            self.assertEqual(
                60,
                len(rewrites),
            )

            self.assertEqual(
                60,
                analysis.rewrite_count,
            )

            self.assertTrue(
                all(
                    reference.resolution_status
                    == "resolved-original"
                    for reference
                    in rewrites
                )
            )

            self.assertTrue(
                all(
                    reference.reason
                    for reference
                    in rewrites
                )
            )

    def test_compound_typescript_filenames_resolve(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            root = Path(directory)

            expected = (
                root
                / "create-ticket.dto.ts"
            )

            expected.write_text(
                "export class CreateTicketDto {}\n",
                encoding="utf-8",
            )

            candidate = (
                root
                / "create-ticket.dto"
            )

            resolved = (
                StagedImportAnalyzer
                ._resolve_typescript(
                    candidate
                )
            )

            self.assertEqual(
                expected.resolve(),
                resolved,
            )

    def test_analysis_does_not_modify_staged_files(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, staging_root = (
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
                in workspace.rglob("*")
                if path.is_file()
            }

            analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            after = {
                path.relative_to(
                    workspace
                ).as_posix():
                path.read_bytes()
                for path
                in workspace.rglob("*")
                if path.is_file()
            }

            self.assertEqual(
                before,
                after,
            )

    def test_json_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, _ = self._prepare(
                directory
            )

            portfolio = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            first = (
                format_import_analysis_json(
                    portfolio
                )
            )

            second = (
                format_import_analysis_json(
                    portfolio
                )
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
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer, _ = self._prepare(
                directory
            )

            portfolio = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            first = (
                format_import_analysis_markdown(
                    portfolio
                )
            )

            second = (
                format_import_analysis_markdown(
                    portfolio
                )
            )

            self.assertEqual(first, second)

            self.assertIn(
                "## Plugin: helpdesk",
                first,
            )

    def test_missing_workspace_fails(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer = StagedImportAnalyzer(
                repository=self.repository,
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=(
                    Path(directory)
                    / "missing"
                ),
            )

            with self.assertRaises(
                ImportAnalysisError
            ):
                analyzer.analyze(
                    ImportAnalysisRequest(
                        mode="module",
                        module_id="helpdesk",
                    )
                )

    def test_missing_module_fails(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer = StagedImportAnalyzer(
                repository=self.repository,
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=(
                    Path(directory)
                ),
            )

            with self.assertRaises(
                ImportAnalysisError
            ):
                analyzer.analyze(
                    ImportAnalysisRequest(
                        mode="module"
                    )
                )

    def test_invalid_limit_fails(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            analyzer = StagedImportAnalyzer(
                repository=self.repository,
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=(
                    Path(directory)
                ),
            )

            with self.assertRaises(
                ImportAnalysisError
            ):
                analyzer.analyze(
                    ImportAnalysisRequest(
                        mode="candidates",
                        limit=0,
                    )
                )

    def test_candidate_limit(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            staging_root = (
                Path(directory)
                / "stage"
            )

            materializer = (
                StagedPluginMaterializer(
                    repository=self.repository,
                    repository_root=(
                        REPOSITORY_ROOT
                    ),
                    output_root=(
                        staging_root
                    ),
                )
            )

            materializer.materialize(
                MaterializationRequest(
                    mode="candidates",
                    limit=2,
                )
            )

            analyzer = StagedImportAnalyzer(
                repository=self.repository,
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=staging_root,
            )

            portfolio = analyzer.analyze(
                ImportAnalysisRequest(
                    mode="candidates",
                    limit=2,
                )
            )

            self.assertEqual(
                2,
                len(portfolio.analyses),
            )


if __name__ == "__main__":
    unittest.main()

class ImportAnalyzerModuleOwnershipTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

        cls.analyzer = StagedImportAnalyzer(
            repository=cls.repository,
            repository_root=REPOSITORY_ROOT,
            staging_root=(
                REPOSITORY_ROOT
                / "generated/plugin-staging"
            ),
        )

    def test_module_owner_resolves_internal_file(
        self,
    ) -> None:
        path = (
            REPOSITORY_ROOT
            / "backend/src/core/auth/guards/"
            "jwt-auth.guard.ts"
        )

        self.assertEqual(
            "auth",
            self.analyzer._module_for_path(
                path
            ),
        )

    def test_module_owner_resolves_barrel_file(
        self,
    ) -> None:
        path = (
            REPOSITORY_ROOT
            / "backend/src/core/search/index.ts"
        )

        self.assertEqual(
            "search",
            self.analyzer._module_for_path(
                path
            ),
        )

    def test_deepest_module_root_wins(
        self,
    ) -> None:
        path = (
            REPOSITORY_ROOT
            / "backend/src/database/postgres/"
            "postgres.module.ts"
        )

        owner = (
            self.analyzer._module_for_path(
                path
            )
        )

        self.assertEqual(
            "database:postgres",
            owner,
        )
