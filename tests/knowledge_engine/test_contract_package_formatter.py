from __future__ import annotations

import json
import unittest

from tools.knowledge_engine.contract_package_formatter import (
    contract_package_report_to_dict,
)
from tools.knowledge_engine.contract_package_formatter import (
    format_contract_package_json,
)
from tools.knowledge_engine.contract_package_formatter import (
    format_contract_package_markdown,
)
from tools.knowledge_engine.contract_package_generator_models import (
    ContractPackageGenerationIssue,
)
from tools.knowledge_engine.contract_package_generator_models import (
    ContractPackageGenerationPortfolio,
)
from tools.knowledge_engine.contract_package_generator_models import (
    ContractPackageGenerationRequest,
)
from tools.knowledge_engine.contract_package_generator_models import (
    GeneratedContractPackage,
)
from tools.knowledge_engine.contract_package_generator_models import (
    GeneratedContractPackageFile,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageExportLayout,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageFileLayout,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageLayoutIssue,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageLayoutPortfolio,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageLayoutRequest,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageModuleLayout,
)
from tools.knowledge_engine.contract_package_layout_models import (
    PlannedContractPackage,
)


class ContractPackageFormatterTest(
    unittest.TestCase
):
    def _layout(
        self,
        issues: tuple[
            ContractPackageLayoutIssue,
            ...,
        ] = (),
    ) -> ContractPackageLayoutPortfolio:
        module = ContractPackageModuleLayout(
            module_id="audit",
            directory_name="audit",
            entrypoint_path=(
                "generated/contracts/"
                "core-contracts/"
                "src/audit/index.ts"
            ),
            exports=(
                ContractPackageExportLayout(
                    symbol="AuditModule",
                    export_kind="value",
                    source_path=(
                        "backend/src/core/"
                        "audit/audit.module.ts"
                    ),
                    module_id="audit",
                ),
            ),
        )

        package = PlannedContractPackage(
            package_name=(
                "@propertyos/core-contracts"
            ),
            version="0.1.0",
            package_directory=(
                "generated/contracts/"
                "core-contracts"
            ),
            root_entrypoint_path=(
                "generated/contracts/"
                "core-contracts/src/index.ts"
            ),
            source_strategy=(
                "repository-reexport"
            ),
            publishable=False,
            modules=(module,),
            files=(
                ContractPackageFileLayout(
                    path=(
                        "generated/contracts/"
                        "core-contracts/"
                        "package.json"
                    ),
                    file_kind=(
                        "package-metadata"
                    ),
                ),
            ),
        )

        return ContractPackageLayoutPortfolio(
            schema_version="1.0.0",
            request=(
                ContractPackageLayoutRequest()
            ),
            packages=(package,),
            issues=issues,
            summary={
                "packageCount": 1,
                "moduleCount": 1,
                "symbolCount": 1,
                "fileCount": 1,
                "issueCount": len(issues),
                "publishablePackageCount": 0,
                "repositoryBackedPackageCount": 1,
            },
        )

    def _generation(
        self,
        issues: tuple[
            ContractPackageGenerationIssue,
            ...,
        ] = (),
    ) -> ContractPackageGenerationPortfolio:
        file = GeneratedContractPackageFile(
            path=(
                "generated/contracts/"
                "core-contracts/package.json"
            ),
            file_kind="package-metadata",
            sha256="abc123",
            size_bytes=123,
            written=False,
        )

        package = GeneratedContractPackage(
            package_name=(
                "@propertyos/core-contracts"
            ),
            version="0.1.0",
            package_directory=(
                "generated/contracts/"
                "core-contracts"
            ),
            source_strategy=(
                "repository-reexport"
            ),
            publishable=False,
            files=(file,),
            valid=not issues,
        )

        return (
            ContractPackageGenerationPortfolio(
                schema_version="1.0.0",
                request=(
                    ContractPackageGenerationRequest()
                ),
                packages=(package,),
                issues=issues,
                summary={
                    "packageCount": 1,
                    "fileCount": 1,
                    "writtenFileCount": 0,
                    "issueCount": len(issues),
                    "validPackageCount": (
                        0 if issues else 1
                    ),
                    "invalidPackageCount": (
                        1 if issues else 0
                    ),
                },
            )
        )

    def test_report_contains_combined_summary(
        self,
    ) -> None:
        report = (
            contract_package_report_to_dict(
                self._layout(),
                self._generation(),
            )
        )

        self.assertEqual(
            report["summary"],
            {
                "packageCount": 1,
                "moduleCount": 1,
                "symbolCount": 1,
                "fileCount": 1,
                "writtenFileCount": 0,
                "layoutIssueCount": 0,
                "generationIssueCount": 0,
                "valid": True,
            },
        )

    def test_json_is_valid_and_deterministic(
        self,
    ) -> None:
        first = format_contract_package_json(
            self._layout(),
            self._generation(),
        )

        second = format_contract_package_json(
            self._layout(),
            self._generation(),
        )

        self.assertEqual(first, second)

        parsed = json.loads(first)

        self.assertEqual(
            parsed["layout"]["packages"][0][
                "moduleCount"
            ],
            1,
        )

        self.assertEqual(
            parsed["generation"]["packages"][0][
                "files"
            ][0]["sha256"],
            "abc123",
        )

    def test_markdown_contains_package_report(
        self,
    ) -> None:
        output = (
            format_contract_package_markdown(
                self._layout(),
                self._generation(),
            )
        )

        self.assertIn(
            "# PropertyOS Contract Package Report",
            output,
        )

        self.assertIn(
            "## Package: "
            "@propertyos/core-contracts",
            output,
        )

        self.assertIn(
            "`repository-reexport`",
            output,
        )

        self.assertIn(
            "\"symbol\": \"AuditModule\"",
            format_contract_package_json(
                self._layout(),
                self._generation(),
            ),
        )

    def test_report_is_invalid_when_layout_has_issue(
        self,
    ) -> None:
        layout = self._layout(
            issues=(
                ContractPackageLayoutIssue(
                    code="duplicate-symbol",
                    message="Duplicate symbol.",
                    package_name=(
                        "@propertyos/core-contracts"
                    ),
                    module_id="audit",
                    symbol="AuditModule",
                ),
            )
        )

        report = (
            contract_package_report_to_dict(
                layout,
                self._generation(),
            )
        )

        self.assertFalse(
            report["summary"]["valid"]
        )

        self.assertEqual(
            report["summary"][
                "layoutIssueCount"
            ],
            1,
        )

    def test_markdown_contains_generation_issues(
        self,
    ) -> None:
        generation = self._generation(
            issues=(
                ContractPackageGenerationIssue(
                    code="existing-file",
                    message=(
                        "Refusing to overwrite file."
                    ),
                    package_name=(
                        "@propertyos/core-contracts"
                    ),
                    path=(
                        "generated/contracts/"
                        "core-contracts/"
                        "package.json"
                    ),
                ),
            )
        )

        output = (
            format_contract_package_markdown(
                self._layout(),
                generation,
            )
        )

        self.assertIn(
            "## Generation Issues",
            output,
        )

        self.assertIn(
            "`existing-file`",
            output,
        )


if __name__ == "__main__":
    unittest.main()
