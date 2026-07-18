from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.plugin_package_portfolio import (
    PackagingCommandResult,
    PluginPackagePortfolioBuilder,
)
from tools.knowledge_engine.plugin_package_portfolio_models import (
    PackagingStage,
    PackagingStageStatus,
    PluginPackageStatus,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = (
    Path(__file__).resolve().parents[2]
)


class FakePackagingRunner:
    def __init__(
        self,
        fail_marker: str = "",
        invalid_json: bool = False,
    ) -> None:
        self.fail_marker = fail_marker
        self.invalid_json = invalid_json
        self.calls = []
        self.packed_packages = []

    def __call__(
        self,
        command,
        cwd,
    ) -> PackagingCommandResult:
        self.calls.append(
            (command, cwd)
        )

        command_text = " ".join(command)

        if (
            self.fail_marker
            and self.fail_marker
            in command_text
        ):
            return PackagingCommandResult(
                exit_code=2,
                duration_seconds=0.1,
                stderr="simulated failure",
            )

        if " pack " not in (
            " " + command_text + " "
        ):
            return PackagingCommandResult(
                exit_code=0,
                duration_seconds=0.1,
                stdout="build passed",
            )

        if self.invalid_json:
            return PackagingCommandResult(
                exit_code=0,
                duration_seconds=0.1,
                stdout="not-json",
            )

        artifact_root = Path(
            command[
                command.index(
                    "--pack-destination"
                )
                + 1
            ]
        )

        package = json.loads(
            (cwd / "package.json").read_text(
                encoding="utf-8"
            )
        )
        self.packed_packages.append(
            package
        )

        filename = (
            package["name"]
            .removeprefix("@")
            .replace("/", "-")
            + "-"
            + package["version"]
            + ".tgz"
        )

        artifact = (
            artifact_root
            / filename
        )
        artifact_root.mkdir(
            parents=True,
            exist_ok=True,
        )
        artifact.write_bytes(
            b"fake-package-content"
        )

        output = [
            {
                "filename": filename,
                "size": (
                    artifact.stat().st_size
                ),
                "unpackedSize": 100,
                "shasum": "a" * 40,
                "integrity": "sha512-example",
                "files": [
                    {
                        "path": "package.json"
                    }
                ],
            }
        ]

        return PackagingCommandResult(
            exit_code=0,
            duration_seconds=0.1,
            stdout=json.dumps(output),
        )


class PluginPackagePortfolioBuilderTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

    def _builder(
        self,
        artifact_root: Path,
        runner,
    ) -> PluginPackagePortfolioBuilder:
        return PluginPackagePortfolioBuilder(
            repository=self.repository,
            repository_root=(
                REPOSITORY_ROOT
            ),
            staging_root=(
                Path(
                    "generated/plugin-staging"
                )
            ),
            artifact_root=artifact_root,
            command_runner=runner,
            npm_executable="npm-test",
        )

    def test_builds_and_verifies_artifact(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            artifact_root = Path(temporary)

            runner = FakePackagingRunner()

            portfolio = self._builder(
                artifact_root,
                runner,
            ).build(
                module_ids=("helpdesk",)
            )

            artifact = (
                portfolio.artifacts[0]
            )

            self.assertEqual(
                PluginPackageStatus.PASSED,
                artifact.status,
            )
            self.assertTrue(
                portfolio.successful
            )
            self.assertEqual(
                hashlib.sha256(
                    b"fake-package-content"
                ).hexdigest(),
                artifact.sha256,
            )
            self.assertEqual(
                2,
                len(runner.calls),
            )
            self.assertEqual(
                "Package archive created.",
                artifact.stage(
                    PackagingStage.PACK
                ).detail,
            )
            self.assertNotIn(
                '"files"',
                artifact.stage(
                    PackagingStage.PACK
                ).detail,
            )

    def test_build_failure_blocks_pack_and_verify(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            portfolio = self._builder(
                Path(temporary),
                FakePackagingRunner(
                    fail_marker="run build"
                ),
            ).build(
                module_ids=("helpdesk",)
            )

            artifact = (
                portfolio.artifacts[0]
            )

            self.assertEqual(
                PluginPackageStatus.FAILED,
                artifact.status,
            )
            self.assertEqual(
                PackagingStageStatus.BLOCKED,
                artifact.stage(
                    PackagingStage.PACK
                ).status,
            )

    def test_pack_failure_blocks_verify(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            portfolio = self._builder(
                Path(temporary),
                FakePackagingRunner(
                    fail_marker="npm-test pack"
                ),
            ).build(
                module_ids=("helpdesk",)
            )

            artifact = (
                portfolio.artifacts[0]
            )

            self.assertEqual(
                PackagingStageStatus.FAILED,
                artifact.stage(
                    PackagingStage.PACK
                ).status,
            )
            self.assertEqual(
                PackagingStageStatus.BLOCKED,
                artifact.stage(
                    PackagingStage.VERIFY
                ).status,
            )

    def test_invalid_pack_json_fails_verify(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            portfolio = self._builder(
                Path(temporary),
                FakePackagingRunner(
                    invalid_json=True
                ),
            ).build(
                module_ids=("helpdesk",)
            )

            verify = (
                portfolio.artifacts[0]
                .stage(
                    PackagingStage.VERIFY
                )
            )

            self.assertEqual(
                PackagingStageStatus.FAILED,
                verify.status,
            )
            self.assertIn(
                "valid JSON",
                verify.detail,
            )

    def test_existing_artifact_requires_overwrite(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            artifact_root = Path(temporary)
            existing = (
                artifact_root
                / (
                    "propertyos-plugin-"
                    "helpdesk-0.1.0.tgz"
                )
            )
            existing.write_bytes(b"existing")

            portfolio = self._builder(
                artifact_root,
                FakePackagingRunner(),
            ).build(
                module_ids=("helpdesk",),
                overwrite=False,
            )

            self.assertEqual(
                PackagingStageStatus.FAILED,
                portfolio.artifacts[0]
                .stage(
                    PackagingStage.PACK
                ).status,
            )

    def test_overwrite_replaces_existing_artifact(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            artifact_root = Path(temporary)
            existing = (
                artifact_root
                / (
                    "propertyos-plugin-"
                    "helpdesk-0.1.0.tgz"
                )
            )
            existing.write_bytes(b"existing")

            portfolio = self._builder(
                artifact_root,
                FakePackagingRunner(),
            ).build(
                module_ids=("helpdesk",),
                overwrite=True,
            )

            self.assertTrue(
                portfolio.successful
            )
            self.assertEqual(
                b"fake-package-content",
                existing.read_bytes(),
            )

    def test_preserves_requested_module_order(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            portfolio = self._builder(
                Path(temporary),
                FakePackagingRunner(),
            ).build(
                module_ids=(
                    "helpdesk",
                    "inventory",
                )
            )

            self.assertEqual(
                (
                    "helpdesk",
                    "inventory",
                ),
                tuple(
                    artifact.module_id
                    for artifact
                    in portfolio.artifacts
                ),
            )


    def test_converts_core_contract_file_dependency(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            runner = FakePackagingRunner()

            portfolio = self._builder(
                Path(temporary),
                runner,
            ).build(
                module_ids=("helpdesk",)
            )

            self.assertTrue(
                portfolio.successful
            )

            package = runner.packed_packages[0]
            version = package[
                "dependencies"
            ][
                "@propertyos/core-contracts"
            ]

            self.assertFalse(
                version.startswith("file:")
            )
            self.assertEqual(
                "0.1.0",
                version,
            )

    def test_converts_plugin_file_dependency(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            runner = FakePackagingRunner()

            portfolio = self._builder(
                Path(temporary),
                runner,
            ).build(
                module_ids=("procurement",)
            )

            self.assertTrue(
                portfolio.successful
            )

            package = runner.packed_packages[0]

            self.assertEqual(
                "0.1.0",
                package[
                    "dependencies"
                ][
                    "@propertyos/plugin-inventory"
                ],
            )

    def test_packages_only_runtime_files(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as temporary:
            runner = FakePackagingRunner()

            portfolio = self._builder(
                Path(temporary),
                runner,
            ).build(
                module_ids=("helpdesk",)
            )

            self.assertTrue(
                portfolio.successful
            )
            self.assertEqual(
                [
                    "dist",
                    "plugin.json",
                    "README.md",
                ],
                runner.packed_packages[0][
                    "files"
                ],
            )


if __name__ == "__main__":
    unittest.main()
