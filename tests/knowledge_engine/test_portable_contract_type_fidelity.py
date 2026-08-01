from __future__ import annotations

from pathlib import Path
import shutil
import unittest

from tools.knowledge_engine.import_analysis_models import ImportAnalysisRequest
from tools.knowledge_engine.import_analyzer import StagedImportAnalyzer
from tools.knowledge_engine.repository_api import Repository
from tools.knowledge_engine.contract_manifest import ContractManifestGenerator
from tools.knowledge_engine.contract_manifest_models import ContractManifestRequest
from tools.knowledge_engine.contract_package_layout import ContractPackageLayoutPlanner
from tools.knowledge_engine.contract_package_layout_models import ContractPackageLayoutRequest
from tools.knowledge_engine.contract_package_generator import ContractPackageGenerator
from tools.knowledge_engine.contract_package_generator_models import ContractPackageGenerationRequest


class PortableContractTypeFidelityTest(unittest.TestCase):
    def test_platform_declarations_preserve_generics(self) -> None:
        root = Path.cwd()
        proof = root / ".test-portable-contract-type-fidelity"
        shutil.rmtree(proof, ignore_errors=True)

        try:
            analysis = StagedImportAnalyzer(
                repository=Repository.load(root),
                repository_root=root,
                staging_root=root / "generated/plugin-staging",
            ).analyze(
                ImportAnalysisRequest(
                    mode="candidates",
                    module_id=None,
                    limit=None,
                )
            )

            manifest = ContractManifestGenerator(
                repository_root=root
            ).generate(
                import_analysis=analysis,
                request=ContractManifestRequest(
                    mode="candidates",
                    module_id=None,
                    limit=None,
                    package_name="@propertyos/core-contracts",
                    package_version="0.1.0",
                ),
            )

            layout = ContractPackageLayoutPlanner().plan(
                manifest,
                ContractPackageLayoutRequest(
                    output_root=(
                        ".test-portable-contract-type-fidelity/generated"
                    ),
                    package_name="@propertyos/core-contracts",
                    source_strategy="portable-facade",
                ),
            )

            generation = ContractPackageGenerator(
                repository_root=root
            ).generate(
                layout,
                ContractPackageGenerationRequest(
                    apply=True,
                    overwrite=True,
                ),
            )

            self.assertFalse(generation.issues)
            platform = next(proof.rglob("src/platform/index.ts"))
            content = platform.read_text(encoding="utf-8")

            self.assertIn(
                "PaginatedResponseDto<TData = unknown>",
                content,
            )
            self.assertIn("items: TData[];", content)
            self.assertIn("buildPaginatedQuery<TData>", content)
            self.assertIn("toPaginatedResponse<TData>", content)
            self.assertIn("PaginatedResponseDto<TData>", content)
            self.assertIn(
                "abstract new (...args: any[])",
                content,
            )
            self.assertNotIn(
                "export type PaginatedResponseDto = any;",
                content,
            )
        finally:
            shutil.rmtree(proof, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
