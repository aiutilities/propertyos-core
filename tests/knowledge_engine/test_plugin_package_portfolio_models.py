from __future__ import annotations

import unittest
from pathlib import PurePosixPath

from tools.knowledge_engine.plugin_package_portfolio_models import (
    PackagingStage,
    PackagingStageResult,
    PackagingStageStatus,
    PluginPackageArtifact,
    PluginPackagePortfolio,
    PluginPackagePortfolioRequest,
    PluginPackageStatus,
    PluginPackagingError,
)


def passed_stage(
    stage: PackagingStage,
) -> PackagingStageResult:
    return PackagingStageResult(
        stage=stage,
        status=PackagingStageStatus.PASSED,
        duration_seconds=0.1,
        detail="passed",
        command=("command",),
        exit_code=0,
    )


def passed_artifact(
    module_id: str = "helpdesk",
) -> PluginPackageArtifact:
    return PluginPackageArtifact(
        module_id=module_id,
        plugin_id=module_id,
        package_name=(
            f"@propertyos/plugin-{module_id}"
        ),
        version="0.1.0",
        workspace=PurePosixPath(
            "generated/plugin-staging"
        )
        / module_id,
        stages=tuple(
            passed_stage(stage)
            for stage in PackagingStage
        ),
        artifact_path=(
            PurePosixPath(
                "generated/plugin-artifacts"
            )
            / (
                "propertyos-plugin-"
                f"{module_id}-0.1.0.tgz"
            )
        ),
        filename=(
            "propertyos-plugin-"
            f"{module_id}-0.1.0.tgz"
        ),
        size_bytes=100,
        unpacked_size_bytes=500,
        file_count=10,
        shasum="a" * 40,
        integrity="sha512-example",
        sha256="b" * 64,
    )


class PluginPackagePortfolioRequestTest(
    unittest.TestCase
):
    def test_preserves_module_order(
        self,
    ) -> None:
        request = PluginPackagePortfolioRequest(
            module_ids=(
                "helpdesk",
                "inventory",
            ),
            artifact_root=PurePosixPath(
                "generated/plugin-artifacts"
            ),
        )

        self.assertEqual(
            (
                "helpdesk",
                "inventory",
            ),
            request.module_ids,
        )

    def test_rejects_duplicate_modules(
        self,
    ) -> None:
        with self.assertRaises(
            PluginPackagingError
        ):
            PluginPackagePortfolioRequest(
                module_ids=(
                    "helpdesk",
                    "helpdesk",
                ),
                artifact_root=PurePosixPath(
                    "generated/plugin-artifacts"
                ),
            )

    def test_rejects_empty_module_id(
        self,
    ) -> None:
        with self.assertRaises(
            PluginPackagingError
        ):
            PluginPackagePortfolioRequest(
                module_ids=("helpdesk", ""),
                artifact_root=PurePosixPath(
                    "generated/plugin-artifacts"
                ),
            )

    def test_rejects_escaping_artifact_root(
        self,
    ) -> None:
        with self.assertRaises(
            PluginPackagingError
        ):
            PluginPackagePortfolioRequest(
                module_ids=("helpdesk",),
                artifact_root=PurePosixPath(
                    "../artifacts"
                ),
            )


class PackagingStageResultTest(
    unittest.TestCase
):
    def test_serializes_stage_result(
        self,
    ) -> None:
        result = passed_stage(
            PackagingStage.PACK
        )

        self.assertEqual(
            "pack",
            result.to_dict()["stage"],
        )
        self.assertEqual(
            "passed",
            result.to_dict()["status"],
        )

    def test_rejects_passed_nonzero_exit(
        self,
    ) -> None:
        with self.assertRaises(
            PluginPackagingError
        ):
            PackagingStageResult(
                stage=PackagingStage.BUILD,
                status=(
                    PackagingStageStatus.PASSED
                ),
                exit_code=2,
            )

    def test_rejects_failed_zero_exit(
        self,
    ) -> None:
        with self.assertRaises(
            PluginPackagingError
        ):
            PackagingStageResult(
                stage=PackagingStage.BUILD,
                status=(
                    PackagingStageStatus.FAILED
                ),
                exit_code=0,
            )


class PluginPackageArtifactTest(
    unittest.TestCase
):
    def test_complete_artifact_passes(
        self,
    ) -> None:
        artifact = passed_artifact()

        self.assertEqual(
            PluginPackageStatus.PASSED,
            artifact.status,
        )
        self.assertEqual(
            "propertyos-plugin-helpdesk-0.1.0.tgz",
            artifact.filename,
        )

    def test_failed_stage_fails_artifact(
        self,
    ) -> None:
        artifact = PluginPackageArtifact(
            module_id="helpdesk",
            plugin_id="helpdesk",
            package_name=(
                "@propertyos/plugin-helpdesk"
            ),
            version="0.1.0",
            workspace=PurePosixPath(
                "generated/plugin-staging/"
                "helpdesk"
            ),
            stages=(
                PackagingStageResult(
                    stage=PackagingStage.BUILD,
                    status=(
                        PackagingStageStatus.FAILED
                    ),
                    exit_code=2,
                ),
            ),
        )

        self.assertEqual(
            PluginPackageStatus.FAILED,
            artifact.status,
        )

    def test_incomplete_stages_are_pending(
        self,
    ) -> None:
        artifact = PluginPackageArtifact(
            module_id="helpdesk",
            plugin_id="helpdesk",
            package_name=(
                "@propertyos/plugin-helpdesk"
            ),
            version="0.1.0",
            workspace=PurePosixPath(
                "generated/plugin-staging/"
                "helpdesk"
            ),
            stages=(
                passed_stage(
                    PackagingStage.BUILD
                ),
            ),
        )

        self.assertEqual(
            PluginPackageStatus.PENDING,
            artifact.status,
        )

    def test_passed_artifact_requires_metadata(
        self,
    ) -> None:
        with self.assertRaises(
            PluginPackagingError
        ):
            PluginPackageArtifact(
                module_id="helpdesk",
                plugin_id="helpdesk",
                package_name=(
                    "@propertyos/plugin-helpdesk"
                ),
                version="0.1.0",
                workspace=PurePosixPath(
                    "generated/plugin-staging/"
                    "helpdesk"
                ),
                stages=tuple(
                    passed_stage(stage)
                    for stage in PackagingStage
                ),
            )


class PluginPackagePortfolioTest(
    unittest.TestCase
):
    def test_summarizes_successful_portfolio(
        self,
    ) -> None:
        request = PluginPackagePortfolioRequest(
            module_ids=(
                "helpdesk",
                "inventory",
            ),
            artifact_root=PurePosixPath(
                "generated/plugin-artifacts"
            ),
        )

        portfolio = PluginPackagePortfolio(
            schema_version="1.0.0",
            request=request,
            artifacts=(
                passed_artifact("helpdesk"),
                passed_artifact("inventory"),
            ),
        )

        summary = portfolio.to_dict()[
            "summary"
        ]

        self.assertTrue(
            portfolio.successful
        )
        self.assertEqual(
            2,
            summary["passedCount"],
        )
        self.assertEqual(
            200,
            summary["totalSizeBytes"],
        )

    def test_rejects_artifact_order_mismatch(
        self,
    ) -> None:
        request = PluginPackagePortfolioRequest(
            module_ids=(
                "helpdesk",
                "inventory",
            ),
            artifact_root=PurePosixPath(
                "generated/plugin-artifacts"
            ),
        )

        with self.assertRaises(
            PluginPackagingError
        ):
            PluginPackagePortfolio(
                schema_version="1.0.0",
                request=request,
                artifacts=(
                    passed_artifact("inventory"),
                    passed_artifact("helpdesk"),
                ),
            )


if __name__ == "__main__":
    unittest.main()
