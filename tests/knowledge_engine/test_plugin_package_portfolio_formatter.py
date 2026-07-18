from __future__ import annotations

import json
import unittest
from pathlib import PurePosixPath

from tools.knowledge_engine.plugin_package_portfolio_formatter import (
    format_plugin_package_portfolio,
)
from tools.knowledge_engine.plugin_package_portfolio_models import (
    PackagingStage,
    PackagingStageResult,
    PackagingStageStatus,
    PluginPackageArtifact,
    PluginPackagePortfolio,
    PluginPackagePortfolioRequest,
)


def portfolio() -> PluginPackagePortfolio:
    request = PluginPackagePortfolioRequest(
        module_ids=("helpdesk",),
        artifact_root=PurePosixPath(
            "generated/plugin-artifacts"
        ),
        overwrite=True,
    )

    stages = tuple(
        PackagingStageResult(
            stage=stage,
            status=(
                PackagingStageStatus.PASSED
            ),
            duration_seconds=0.125,
            detail=(
                '[{"files": ["large payload"]}]'
                if stage == PackagingStage.PACK
                else "completed"
            ),
            command=(
                "npm",
                "run",
                "build",
            )
            if stage == PackagingStage.BUILD
            else (
                (
                    "npm",
                    "pack",
                    "--json",
                )
                if stage == PackagingStage.PACK
                else ()
            ),
            exit_code=(
                0
                if stage
                != PackagingStage.VERIFY
                else None
            ),
        )
        for stage in PackagingStage
    )

    artifact = PluginPackageArtifact(
        module_id="helpdesk",
        plugin_id="helpdesk",
        package_name=(
            "@propertyos/plugin-helpdesk"
        ),
        version="0.1.0",
        workspace=PurePosixPath(
            "generated/plugin-staging/helpdesk"
        ),
        stages=stages,
        artifact_path=PurePosixPath(
            "generated/plugin-artifacts/"
            "propertyos-plugin-helpdesk-0.1.0.tgz"
        ),
        filename=(
            "propertyos-plugin-helpdesk-0.1.0.tgz"
        ),
        size_bytes=30030,
        unpacked_size_bytes=211137,
        file_count=72,
        shasum="a" * 40,
        integrity="sha512-example",
        sha256="b" * 64,
    )

    return PluginPackagePortfolio(
        schema_version="1.0.0",
        request=request,
        artifacts=(artifact,),
    )


class PluginPackagePortfolioFormatterTest(
    unittest.TestCase
):
    def test_json_matches_domain_serialization(
        self,
    ) -> None:
        result = format_plugin_package_portfolio(
            portfolio(),
            "json",
        )

        self.assertEqual(
            portfolio().to_dict(),
            json.loads(result),
        )

    def test_markdown_contains_summary(
        self,
    ) -> None:
        result = format_plugin_package_portfolio(
            portfolio(),
            "markdown",
        )

        self.assertIn(
            "# PropertyOS Plugin Package Portfolio",
            result,
        )
        self.assertIn(
            "- Passed: `1`",
            result,
        )
        self.assertIn(
            "- Portfolio result: `passed`",
            result,
        )

    def test_markdown_contains_artifact_metadata(
        self,
    ) -> None:
        result = format_plugin_package_portfolio(
            portfolio(),
            "markdown",
        )

        self.assertIn(
            "@propertyos/plugin-helpdesk",
            result,
        )
        self.assertIn(
            "29.3 KiB",
            result,
        )
        self.assertIn(
            "propertyos-plugin-helpdesk-0.1.0.tgz",
            result,
        )
        self.assertIn(
            "72",
            result,
        )

    def test_markdown_suppresses_raw_pack_payload(
        self,
    ) -> None:
        result = format_plugin_package_portfolio(
            portfolio(),
            "markdown",
        )

        self.assertNotIn(
            "large payload",
            result,
        )
        self.assertIn(
            "Command completed successfully.",
            result,
        )

    def test_rejects_unknown_format(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            format_plugin_package_portfolio(
                portfolio(),
                "yaml",
            )

    def test_markdown_is_deterministic(
        self,
    ) -> None:
        first = format_plugin_package_portfolio(
            portfolio(),
            "markdown",
        )
        second = format_plugin_package_portfolio(
            portfolio(),
            "markdown",
        )

        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
