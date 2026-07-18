from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.materialization_formatter import (
    format_materialization_json,
    format_materialization_markdown,
)
from tools.knowledge_engine.materialization_models import (
    MaterializationRequest,
)
from tools.knowledge_engine.materializer import (
    MaterializationError,
    StagedPluginMaterializer,
)
from tools.knowledge_engine.plugin_workspace_generator import (
    PluginWorkspaceGenerator,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class MaterializerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

    def _materializer(
        self,
        output_root: Path,
    ) -> StagedPluginMaterializer:
        return StagedPluginMaterializer(
            repository=self.repository,
            repository_root=(
                REPOSITORY_ROOT
            ),
            output_root=output_root,
        )

    def test_materializer_uses_workspace_generator(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            materializer = self._materializer(
                Path(directory) / "stage"
            )

            self.assertIsInstance(
                materializer.workspace_generator,
                PluginWorkspaceGenerator,
            )

    def test_helpdesk_workspace_is_created(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            output = Path(directory) / "stage"

            portfolio = self._materializer(
                output
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            workspace = (
                REPOSITORY_ROOT
                / portfolio.plugins[0]
                .workspace_path
            )

            self.assertTrue(
                workspace.is_dir()
            )

            self.assertTrue(
                (
                    workspace
                    / "plugin.json"
                ).is_file()
            )

    def test_helpdesk_copies_six_sources(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            portfolio = self._materializer(
                Path(directory) / "stage"
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            self.assertEqual(
                6,
                portfolio.plugins[0]
                .copied_file_count,
            )

    def test_generated_tsconfig_extends_backend_config(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            output_root = (
                Path(directory)
                / "stage"
            )

            portfolio = self._materializer(
                output_root
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            self.assertEqual(
                portfolio.summary[
                    "invalidPluginCount"
                ],
                0,
            )

            tsconfig_path = (
                output_root
                / "helpdesk"
                / "tsconfig.json"
            )

            tsconfig = json.loads(
                tsconfig_path.read_text(
                    encoding="utf-8"
                )
            )

            self.assertEqual(
                tsconfig["extends"],
                "../../../backend/tsconfig.json",
            )

            resolved = (
                tsconfig_path.parent
                / tsconfig["extends"]
            ).resolve()

            expected = (
                REPOSITORY_ROOT
                / "backend"
                / "tsconfig.json"
            ).resolve()

            self.assertEqual(
                resolved,
                expected,
            )

            self.assertTrue(
                resolved.is_file()
            )

    def test_six_metadata_files_are_generated(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            portfolio = self._materializer(
                Path(directory) / "stage"
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            self.assertEqual(
                6,
                portfolio.plugins[0]
                .generated_file_count,
            )

    def test_copied_hashes_match(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            portfolio = self._materializer(
                Path(directory) / "stage"
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            self.assertTrue(
                all(
                    file.source_sha256
                    == file.staged_sha256
                    for file
                    in portfolio.plugins[0]
                    .copied_files
                )
            )

    def test_existing_workspace_requires_overwrite(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            output = Path(directory) / "stage"

            materializer = (
                self._materializer(output)
            )

            request = MaterializationRequest(
                mode="module",
                module_id="helpdesk",
            )

            materializer.materialize(
                request
            )

            with self.assertRaises(
                MaterializationError
            ):
                materializer.materialize(
                    request
                )

    def test_overwrite_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            output = Path(directory) / "stage"

            materializer = (
                self._materializer(output)
            )

            first = materializer.materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            second = materializer.materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                    overwrite=True,
                )
            )

            self.assertEqual(
                first.plugins[0]
                .workspace_sha256,
                second.plugins[0]
                .workspace_sha256,
            )

    def test_candidate_limit_is_applied(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            portfolio = self._materializer(
                Path(directory) / "stage"
            ).materialize(
                MaterializationRequest(
                    mode="candidates",
                    limit=2,
                )
            )

            self.assertEqual(
                2,
                len(portfolio.plugins),
            )

    def test_output_root_outside_repository_fails(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(
                MaterializationError
            ):
                self._materializer(
                    Path(directory)
                )

    def test_parent_traversal_is_rejected(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            materializer = (
                self._materializer(
                    Path(directory) / "stage"
                )
            )

            workspace = (
                Path(directory)
                / "stage"
                / "helpdesk"
            )

            with self.assertRaises(
                MaterializationError
            ):
                materializer._safe_destination(
                    workspace,
                    "../escape.txt",
                )

    def test_json_output_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            portfolio = self._materializer(
                Path(directory) / "stage"
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            first = (
                format_materialization_json(
                    portfolio
                )
            )

            second = (
                format_materialization_json(
                    portfolio
                )
            )

            self.assertEqual(first, second)

            value = json.loads(first)

            self.assertEqual(
                "1.0.0",
                value["schemaVersion"],
            )

    def test_markdown_output_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            portfolio = self._materializer(
                Path(directory) / "stage"
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            first = (
                format_materialization_markdown(
                    portfolio
                )
            )

            second = (
                format_materialization_markdown(
                    portfolio
                )
            )

            self.assertEqual(first, second)

            self.assertIn(
                "## Plugin: helpdesk",
                first,
            )

    def test_extraction_report_contracts_include_module_roots(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            portfolio = self._materializer(
                Path(directory) / "stage"
            ).materialize(
                MaterializationRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            workspace = (
                REPOSITORY_ROOT
                / portfolio.plugins[0]
                .workspace_path
            )

            report = json.loads(
                (
                    workspace
                    / "extraction-report.json"
                ).read_text(
                    encoding="utf-8"
                )
            )

            contracts = {
                contract["sourceModule"]:
                contract
                for contract
                in report["contracts"]
            }

            self.assertEqual(
                contracts["audit"][
                    "moduleRoot"
                ],
                "backend/src/core/audit",
            )

            self.assertEqual(
                contracts[
                    "database:postgres"
                ]["moduleRoot"],
                (
                    "backend/src/database/"
                    "postgres"
                ),
            )

    def test_invalid_limit_fails(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            with self.assertRaises(
                MaterializationError
            ):
                self._materializer(
                    Path(directory) / "stage"
                ).materialize(
                    MaterializationRequest(
                        mode="candidates",
                        limit=0,
                    )
                )


if __name__ == "__main__":
    unittest.main()
