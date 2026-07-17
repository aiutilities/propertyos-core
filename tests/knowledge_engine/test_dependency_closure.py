from __future__ import annotations

import hashlib
import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.dependency_closure import (
    DependencyClosureError,
)
from tools.knowledge_engine.dependency_closure import (
    TransitiveDependencyClosure,
)
from tools.knowledge_engine.dependency_closure_formatter import (
    format_json,
)
from tools.knowledge_engine.dependency_closure_formatter import (
    format_markdown,
)
from tools.knowledge_engine.dependency_closure_models import (
    DependencyClosureRequest,
)
from tools.knowledge_engine.materializer import (
    StagedPluginMaterializer,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)
from tools.knowledge_engine.materialization_models import (
    MaterializationRequest,
)


REPOSITORY_ROOT = Path(
    __file__
).resolve().parents[2]


REPOSITORY = Repository.load(
    REPOSITORY_ROOT
)


class DependencyClosureTest(
    unittest.TestCase
):
    def _prepare(
        self,
        directory: str,
    ) -> tuple[
        TransitiveDependencyClosure,
        Path,
    ]:
        staging_root = (
            Path(directory)
            / "plugin-staging"
        )

        StagedPluginMaterializer(
            repository=REPOSITORY,
            repository_root=REPOSITORY_ROOT,
            output_root=staging_root,
        ).materialize(
            MaterializationRequest(
                mode="module",
                module_id="helpdesk",
                overwrite=False,
            )
        )

        return (
            TransitiveDependencyClosure(
                repository_root=(
                    REPOSITORY_ROOT
                ),
                staging_root=staging_root,
            ),
            staging_root,
        )

    def test_helpdesk_closure_is_discovered(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            analysis = closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            self.assertGreater(
                analysis.closure_file_count,
                analysis.seed_file_count,
            )

            self.assertGreater(
                analysis.added_file_count,
                0,
            )

    def test_helpdesk_dtos_are_included(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            analysis = closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            targets = {
                item.staged_target
                for item in analysis.dependencies
            }

            self.assertIn(
                (
                    "src/dto/"
                    "create-helpdesk-ticket.dto.ts"
                ),
                targets,
            )

    def test_helpdesk_repository_is_included(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            analysis = closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            targets = {
                item.staged_target
                for item in analysis.dependencies
            }

            self.assertIn(
                (
                    "src/repositories/"
                    "helpdesk.repository.ts"
                ),
                targets,
            )

    def test_helpdesk_handlers_are_included(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            analysis = closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            targets = {
                item.staged_target
                for item in analysis.dependencies
            }

            self.assertTrue(
                any(
                    target.startswith(
                        "src/handlers/"
                    )
                    for target in targets
                )
            )

    def test_cross_module_dependencies_are_not_copied(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            analysis = closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ).analyses[0]

            classifications = {
                item.classification
                for item in (
                    analysis.external_dependencies
                )
            }

            self.assertIn(
                "cross-module",
                classifications,
            )

            self.assertFalse(
                any(
                    "/audit/"
                    in item.staged_target
                    for item in (
                        analysis.dependencies
                    )
                )
            )

    def test_dry_run_does_not_add_files(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, staging_root = (
                self._prepare(
                    directory
                )
            )

            before = self._digest(
                staging_root
            )

            closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            after = self._digest(
                staging_root
            )

            self.assertEqual(
                before,
                after,
            )

    def test_apply_adds_dependency_files(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, staging_root = (
                self._prepare(
                    directory
                )
            )

            analysis = closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=True,
                )
            ).analyses[0]

            self.assertTrue(
                (
                    staging_root
                    / "helpdesk"
                    / "src"
                    / "dto"
                    / (
                        "create-helpdesk-"
                        "ticket.dto.ts"
                    )
                ).exists()
            )

            self.assertTrue(
                analysis.applied
            )

    def test_apply_updates_extraction_report(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, staging_root = (
                self._prepare(
                    directory
                )
            )

            closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=True,
                )
            )

            report = json.loads(
                (
                    staging_root
                    / "helpdesk"
                    / "extraction-report.json"
                ).read_text(
                    encoding="utf-8"
                )
            )

            self.assertEqual(
                report["copiedFileCount"],
                len(report["files"]),
            )

            staged = {
                item["stagedPath"]
                for item in report["files"]
            }

            self.assertIn(
                "src/handlers/helpdesk-sla-breach-job.handler.ts",
                staged,
            )

            self.assertIn(
                "src/repositories/postgres-helpdesk.repository.ts",
                staged,
            )

            mappings = {
                item["stagedPath"]: item
                for item in report["files"]
            }

            self.assertTrue(
                mappings[
                    (
                        "src/handlers/"
                        "helpdesk-sla-breach-job.handler.ts"
                    )
                ]["closureAdded"]
            )

            self.assertNotIn(
                "closureAdded",
                mappings[
                    "src/helpdesk.module.ts"
                ],
            )


    def test_apply_writes_report(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, staging_root = (
                self._prepare(
                    directory
                )
            )

            closure.analyze(
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=True,
                )
            )

            report = (
                staging_root
                / "helpdesk"
                / (
                    "dependency-closure-"
                    "report.json"
                )
            )

            data = json.loads(
                report.read_text(
                    encoding="utf-8"
                )
            )

            self.assertEqual(
                "helpdesk",
                data["moduleId"],
            )

    def test_apply_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, staging_root = (
                self._prepare(
                    directory
                )
            )

            request = (
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                    apply=True,
                    overwrite=True,
                )
            )

            closure.analyze(request)

            first_workspace = (
                staging_root / "helpdesk"
            )

            first_extraction = (
                first_workspace
                / "extraction-report.json"
            ).read_text(
                encoding="utf-8"
            )

            closure.analyze(request)

            second_workspace = (
                staging_root / "helpdesk"
            )

            second_extraction = (
                second_workspace
                / "extraction-report.json"
            ).read_text(
                encoding="utf-8"
            )

            self.assertEqual(
                first_extraction,
                second_extraction,
            )

    def test_json_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            request = (
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            first = format_json(
                closure.analyze(request)
            )

            second = format_json(
                closure.analyze(request)
            )

            self.assertEqual(
                first,
                second,
            )

    def test_markdown_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            request = (
                DependencyClosureRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )

            first = format_markdown(
                closure.analyze(request)
            )

            second = format_markdown(
                closure.analyze(request)
            )

            self.assertEqual(
                first,
                second,
            )

    def test_invalid_limit_fails(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT,
        ) as directory:
            closure, _ = self._prepare(
                directory
            )

            with self.assertRaises(
                DependencyClosureError
            ):
                closure.analyze(
                    DependencyClosureRequest(
                        mode="candidates",
                        limit=0,
                    )
                )

    def _digest(
        self,
        root: Path,
    ) -> str:
        digest = hashlib.sha256()

        for path in sorted(
            item
            for item in root.rglob("*")
            if item.is_file()
        ):
            digest.update(
                path.relative_to(root)
                .as_posix()
                .encode("utf-8")
            )

            digest.update(b"\0")
            digest.update(
                path.read_bytes()
            )
            digest.update(b"\0")

        return digest.hexdigest()


if __name__ == "__main__":
    unittest.main()
