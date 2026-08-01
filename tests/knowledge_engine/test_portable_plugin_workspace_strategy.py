from __future__ import annotations

import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.plugin_workspace_generator import (
    PluginWorkspaceGenerationError,
    PluginWorkspaceGenerator,
)


class PortablePluginWorkspaceStrategyTest(
    unittest.TestCase
):
    def _generator(
        self,
        repository_root: Path,
    ) -> PluginWorkspaceGenerator:
        generator = PluginWorkspaceGenerator.__new__(
            PluginWorkspaceGenerator
        )
        generator.repository_root = (
            repository_root.resolve()
        )
        generator.contract_package_path = (
            generator.repository_root
            / "generated"
            / "contracts"
            / "core-contracts"
        )
        return generator

    def test_portable_tsconfig_is_standalone(
        self,
    ) -> None:
        generator = self._generator(Path.cwd())

        config = generator._tsconfig(
            source_strategy="portable-facade",
        )

        self.assertNotIn("extends", config)
        self.assertEqual(
            config["compilerOptions"]["module"],
            "Node16",
        )
        self.assertEqual(
            config["compilerOptions"][
                "moduleResolution"
            ],
            "Node16",
        )

    def test_legacy_tsconfig_is_preserved(
        self,
    ) -> None:
        generator = self._generator(Path.cwd())

        config = generator._tsconfig()

        self.assertEqual(
            config["extends"],
            "../../../backend/tsconfig.json",
        )

    def test_portable_contract_dependency_uses_archive(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir="."
        ) as temporary:
            root = Path(temporary).resolve()
            workspace = root / "plugin"
            workspace.mkdir()

            archive = (
                root
                / "propertyos-core-contracts-0.1.0.tgz"
            )
            archive.write_bytes(b"portable")

            generator = self._generator(root)

            dependency = generator._contract_dependency(
                workspace=workspace,
                source_strategy="portable-facade",
                portable_contract_package=archive,
            )

            self.assertEqual(
                dependency,
                "file:../propertyos-core-contracts-0.1.0.tgz",
            )

    def test_portable_dependency_requires_archive(
        self,
    ) -> None:
        generator = self._generator(Path.cwd())

        with self.assertRaisesRegex(
            PluginWorkspaceGenerationError,
            "requires a packed",
        ):
            generator._contract_dependency(
                workspace=Path.cwd(),
                source_strategy="portable-facade",
            )

    def test_portable_dependency_rejects_directory(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir="."
        ) as temporary:
            root = Path(temporary).resolve()
            archive = root / "contracts.tgz"
            archive.mkdir()

            generator = self._generator(root)

            with self.assertRaisesRegex(
                PluginWorkspaceGenerationError,
                "existing .tgz",
            ):
                generator._contract_dependency(
                    workspace=root,
                    source_strategy="portable-facade",
                    portable_contract_package=archive,
                )


if __name__ == "__main__":
    unittest.main()
