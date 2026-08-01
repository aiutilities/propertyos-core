from __future__ import annotations

import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.contract_package_generator import (
    ContractPackageGenerationError,
    ContractPackageGenerator,
)
from tools.knowledge_engine.contract_package_generator_models import (
    ContractPackageGenerationRequest,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageExportLayout,
    ContractPackageFileLayout,
    ContractPackageLayoutPortfolio,
    ContractPackageLayoutRequest,
    ContractPackageModuleLayout,
    PlannedContractPackage,
)


class PortableContractPackageGeneratorTest(
    unittest.TestCase
):
    def test_legacy_generator_does_not_load_manifest(
        self,
    ) -> None:
        generator = ContractPackageGenerator(
            repository_root=Path(
                "/tmp/non-repository-root"
            ),
            approved_host_surface_path=Path(
                "/tmp/missing-host-surface.json"
            ),
        )

        self.assertIsNone(
            generator._approved_host_surface_cache
        )

    def _layout(
        self,
        output_root: str,
        symbol: str = "AuditModule",
    ) -> ContractPackageLayoutPortfolio:
        module = ContractPackageModuleLayout(
            module_id="audit",
            directory_name="audit",
            entrypoint_path="src/audit/index.ts",
            exports=(
                ContractPackageExportLayout(
                    symbol=symbol,
                    export_kind="value",
                    source_path=(
                        "backend/src/core/audit/"
                        "audit.module.ts"
                    ),
                    module_id="audit",
                ),
            ),
        )

        package = PlannedContractPackage(
            package_name="@propertyos/core-contracts",
            version="0.1.0",
            package_directory=(
                f"{output_root}/core-contracts"
            ),
            root_entrypoint_path="src/index.ts",
            source_strategy="portable-facade",
            publishable=True,
            modules=(module,),
            files=(
                ContractPackageFileLayout(
                    path="package.json",
                    file_kind="package-metadata",
                ),
                ContractPackageFileLayout(
                    path="tsconfig.json",
                    file_kind="typescript-config",
                ),
                ContractPackageFileLayout(
                    path="src/index.ts",
                    file_kind="root-entrypoint",
                ),
                ContractPackageFileLayout(
                    path="src/host-runtime.ts",
                    file_kind="host-runtime-bridge",
                ),
                ContractPackageFileLayout(
                    path="src/audit/index.ts",
                    file_kind="module-entrypoint",
                ),
            ),
        )

        return ContractPackageLayoutPortfolio(
            schema_version="1.0.0",
            request=ContractPackageLayoutRequest(
                output_root=output_root,
                source_strategy="portable-facade",
            ),
            packages=(package,),
            issues=(),
            summary={},
        )

    def test_generates_self_contained_package(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory(
            dir="."
        ) as temporary:
            relative_root = str(
                Path(temporary)
            )

            generator = ContractPackageGenerator(
                repository_root=Path.cwd()
            )

            result = generator.generate(
                self._layout(relative_root),
                ContractPackageGenerationRequest(
                    apply=True,
                    overwrite=True,
                ),
            )

            self.assertTrue(result.valid)

            package_root = (
                Path(relative_root)
                / "core-contracts"
            )

            package = json.loads(
                (package_root / "package.json")
                .read_text(encoding="utf-8")
            )

            self.assertFalse(package["private"])
            self.assertEqual(
                package["main"],
                "./dist/index.js",
            )
            self.assertEqual(
                package["propertyos"][
                    "sourceStrategy"
                ],
                "portable-facade",
            )

            tsconfig = (
                package_root / "tsconfig.json"
            ).read_text(encoding="utf-8")

            self.assertNotIn(
                "backend/tsconfig",
                tsconfig,
            )
            self.assertNotIn("../", tsconfig)

            source = (
                package_root
                / "src"
                / "audit"
                / "index.ts"
            ).read_text(encoding="utf-8")

            self.assertNotIn(
                "backend/src",
                source,
            )
            self.assertIn(
                "resolveHostRuntime",
                source,
            )

    def test_rejects_unapproved_symbol(
        self,
    ) -> None:
        generator = ContractPackageGenerator(
            repository_root=Path.cwd()
        )

        result = generator.generate(
            self._layout(
                "generated/contracts-test",
                symbol="UnapprovedRuntime",
            ),
            ContractPackageGenerationRequest(),
        )

        self.assertFalse(result.valid)
        self.assertEqual(
            result.issues[0].code,
            "PACKAGE_GENERATION_FAILED",
        )
        self.assertIn(
            "not approved",
            result.issues[0].message,
        )


if __name__ == "__main__":
    unittest.main()
