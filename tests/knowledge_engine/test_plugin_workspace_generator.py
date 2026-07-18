from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.blueprint_generator import (
    PluginBlueprintGenerator,
)
from tools.knowledge_engine.blueprint_models import (
    BlueprintRequest,
)
from tools.knowledge_engine.materialization_models import (
    MaterializedFile,
)
from tools.knowledge_engine.plugin_workspace_generator import (
    PluginWorkspaceGenerator,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = (
    Path(__file__).resolve().parents[2]
)


class PluginWorkspaceGeneratorTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

        portfolio = (
            PluginBlueprintGenerator(
                cls.repository
            ).generate(
                BlueprintRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            )
        )

        cls.blueprint = (
            portfolio.blueprints[0]
        )

        cls.backend_package = json.loads(
            (
                REPOSITORY_ROOT
                / "backend"
                / "package.json"
            ).read_text(
                encoding="utf-8"
            )
        )

    def _generator(
        self,
    ) -> PluginWorkspaceGenerator:
        return PluginWorkspaceGenerator(
            repository=self.repository,
            repository_root=(
                REPOSITORY_ROOT
            ),
        )

    def _copied_files(
        self,
    ) -> tuple[MaterializedFile, ...]:
        return ()

    def test_package_uses_backend_runtime_versions(
        self,
    ) -> None:
        workspace = (
            REPOSITORY_ROOT
            / "generated"
            / "plugin-staging"
            / "helpdesk"
        )

        content = self._generator().generate(
            blueprint=self.blueprint,
            copied_files=(
                self._copied_files()
            ),
            workspace=workspace,
        )

        package = json.loads(
            content[
                "package.json"
            ].decode("utf-8")
        )

        backend_dependencies = (
            self.backend_package[
                "dependencies"
            ]
        )

        for dependency in (
            "@nestjs/common",
            "@nestjs/core",
            "@nestjs/swagger",
            "pg",
            "reflect-metadata",
            "rxjs",
        ):
            self.assertEqual(
                backend_dependencies[
                    dependency
                ],
                package[
                    "dependencies"
                ][dependency],
            )

    def test_package_uses_backend_dev_versions(
        self,
    ) -> None:
        workspace = (
            REPOSITORY_ROOT
            / "generated"
            / "plugin-staging"
            / "helpdesk"
        )

        content = self._generator().generate(
            blueprint=self.blueprint,
            copied_files=(
                self._copied_files()
            ),
            workspace=workspace,
        )

        package = json.loads(
            content[
                "package.json"
            ].decode("utf-8")
        )

        backend_dev_dependencies = (
            self.backend_package[
                "devDependencies"
            ]
        )

        for dependency in (
            "@types/node",
            "@types/pg",
            "typescript",
        ):
            self.assertEqual(
                backend_dev_dependencies[
                    dependency
                ],
                package[
                    "devDependencies"
                ][dependency],
            )

    def test_contract_dependency_is_relative_to_workspace(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir=REPOSITORY_ROOT
        ) as directory:
            workspace = (
                Path(directory)
                / "stage"
                / "helpdesk"
            )

            content = (
                self._generator().generate(
                    blueprint=self.blueprint,
                    copied_files=(
                        self._copied_files()
                    ),
                    workspace=workspace,
                )
            )

            package = json.loads(
                content[
                    "package.json"
                ].decode("utf-8")
            )

            dependency = package[
                "dependencies"
            ][
                "@propertyos/core-contracts"
            ]

            self.assertTrue(
                dependency.startswith("file:")
            )

            relative = dependency.removeprefix(
                "file:"
            )

            resolved = (
                workspace
                / relative
            ).resolve()

            expected = (
                REPOSITORY_ROOT
                / "generated"
                / "contracts"
                / "core-contracts"
            ).resolve()

            self.assertEqual(
                expected,
                resolved,
            )

    def test_peer_dependencies_match_runtime_versions(
        self,
    ) -> None:
        workspace = (
            REPOSITORY_ROOT
            / "generated"
            / "plugin-staging"
            / "helpdesk"
        )

        content = self._generator().generate(
            blueprint=self.blueprint,
            copied_files=(
                self._copied_files()
            ),
            workspace=workspace,
        )

        package = json.loads(
            content[
                "package.json"
            ].decode("utf-8")
        )

        self.assertEqual(
            package["dependencies"][
                "@nestjs/common"
            ],
            package["peerDependencies"][
                "@nestjs/common"
            ],
        )

        self.assertEqual(
            package["dependencies"][
                "@nestjs/core"
            ],
            package["peerDependencies"][
                "@nestjs/core"
            ],
        )

    def test_package_generation_is_deterministic(
        self,
    ) -> None:
        workspace = (
            REPOSITORY_ROOT
            / "generated"
            / "plugin-staging"
            / "helpdesk"
        )

        generator = self._generator()

        first = generator.generate(
            blueprint=self.blueprint,
            copied_files=(
                self._copied_files()
            ),
            workspace=workspace,
        )

        second = generator.generate(
            blueprint=self.blueprint,
            copied_files=(
                self._copied_files()
            ),
            workspace=workspace,
        )

        self.assertEqual(
            first["package.json"],
            second["package.json"],
        )


if __name__ == "__main__":
    unittest.main()
