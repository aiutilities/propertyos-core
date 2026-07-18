from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path, PurePosixPath

from tools.knowledge_engine.build_plugin_portfolio import (
    _explicit_modules,
    _staged_modules,
    run,
)
from tools.knowledge_engine.plugin_package_portfolio_models import (
    PackagingStage,
    PackagingStageResult,
    PackagingStageStatus,
    PluginPackageArtifact,
    PluginPackagePortfolio,
    PluginPackagePortfolioRequest,
)


REPOSITORY_ROOT = (
    Path(__file__).resolve().parents[2]
)


class FakeBuilder:
    calls = []

    def __init__(
        self,
        **kwargs,
    ) -> None:
        self.kwargs = kwargs

    def build(
        self,
        module_ids,
        overwrite=False,
    ) -> PluginPackagePortfolio:
        type(self).calls.append(
            (module_ids, overwrite)
        )

        request = PluginPackagePortfolioRequest(
            module_ids=module_ids,
            artifact_root=PurePosixPath(
                "generated/plugin-artifacts"
            ),
            overwrite=overwrite,
        )

        artifacts = tuple(
            PluginPackageArtifact(
                module_id=module_id,
                plugin_id=module_id,
                package_name=(
                    "@propertyos/plugin-"
                    + module_id
                ),
                version="0.1.0",
                workspace=(
                    PurePosixPath(
                        "generated/plugin-staging"
                    )
                    / module_id
                ),
                stages=tuple(
                    PackagingStageResult(
                        stage=stage,
                        status=(
                            PackagingStageStatus.PASSED
                        ),
                        exit_code=(
                            0
                            if stage
                            != PackagingStage.VERIFY
                            else None
                        ),
                    )
                    for stage
                    in PackagingStage
                ),
                artifact_path=(
                    PurePosixPath(
                        "generated/plugin-artifacts"
                    )
                    / (
                        "propertyos-plugin-"
                        + module_id
                        + "-0.1.0.tgz"
                    )
                ),
                filename=(
                    "propertyos-plugin-"
                    + module_id
                    + "-0.1.0.tgz"
                ),
                size_bytes=10,
                unpacked_size_bytes=20,
                file_count=1,
                shasum="a" * 40,
                integrity="sha512-example",
                sha256="b" * 64,
            )
            for module_id in module_ids
        )

        return PluginPackagePortfolio(
            schema_version="1.0.0",
            request=request,
            artifacts=artifacts,
        )


class BuildPluginPortfolioCliTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        FakeBuilder.calls = []

    def test_parses_explicit_modules(
        self,
    ) -> None:
        self.assertEqual(
            (
                "helpdesk",
                "inventory",
            ),
            _explicit_modules(
                "helpdesk, inventory"
            ),
        )

    def test_rejects_duplicate_explicit_modules(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            _explicit_modules(
                "helpdesk,helpdesk"
            )

    def test_discovers_staged_modules_sorted(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            root = Path(temporary)

            for module_id in (
                "vehicle",
                "helpdesk",
            ):
                workspace = root / module_id
                workspace.mkdir()
                (
                    workspace
                    / "package.json"
                ).write_text(
                    "{}",
                    encoding="utf-8",
                )
                (
                    workspace
                    / "plugin.json"
                ).write_text(
                    "{}",
                    encoding="utf-8",
                )

            self.assertEqual(
                (
                    "helpdesk",
                    "vehicle",
                ),
                _staged_modules(root),
            )

    def test_explicit_cli_writes_json_report(
        self,
    ) -> None:
        output = (
            "generated/knowledge/"
            "test-plugin-package-cli.json"
        )
        output_path = (
            REPOSITORY_ROOT
            / output
        )

        try:
            exit_code = run(
                (
                    "--repository-root",
                    str(REPOSITORY_ROOT),
                    "--modules",
                    "helpdesk,inventory",
                    "--format",
                    "json",
                    "--output",
                    output,
                    "--overwrite",
                ),
                builder_type=FakeBuilder,
            )

            self.assertEqual(
                0,
                exit_code,
            )

            report = json.loads(
                output_path.read_text(
                    encoding="utf-8"
                )
            )

            self.assertEqual(
                2,
                report["summary"][
                    "passedCount"
                ],
            )
            self.assertEqual(
                (
                    (
                        "helpdesk",
                        "inventory",
                    ),
                    True,
                ),
                FakeBuilder.calls[0],
            )
        finally:
            output_path.unlink(
                missing_ok=True
            )

    def test_limit_restricts_modules(
        self,
    ) -> None:
        exit_code = run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--modules",
                "helpdesk,inventory",
                "--limit",
                "1",
            ),
            builder_type=FakeBuilder,
        )

        self.assertEqual(0, exit_code)
        self.assertEqual(
            (
                ("helpdesk",),
                False,
            ),
            FakeBuilder.calls[0],
        )

    def test_rejects_nonpositive_limit(
        self,
    ) -> None:
        exit_code = run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--modules",
                "helpdesk",
                "--limit",
                "0",
            ),
            builder_type=FakeBuilder,
        )

        self.assertEqual(
            2,
            exit_code,
        )
        self.assertEqual(
            [],
            FakeBuilder.calls,
        )

    def test_rejects_output_outside_repository(
        self,
    ) -> None:
        exit_code = run(
            (
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--modules",
                "helpdesk",
                "--output",
                "../outside.json",
            ),
            builder_type=FakeBuilder,
        )

        self.assertEqual(
            2,
            exit_code,
        )


if __name__ == "__main__":
    unittest.main()
