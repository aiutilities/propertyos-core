from __future__ import annotations

import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.contract_package_generator import (
    ContractPackageGenerationError,
)
from tools.knowledge_engine.contract_package_generator import (
    ContractPackageGenerator,
)
from tools.knowledge_engine.contract_package_generator_models import (
    ContractPackageGenerationRequest,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageExportLayout,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageFileLayout,
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


class ContractPackageGeneratorTest(
    unittest.TestCase
):
    def _layout(
        self,
    ) -> ContractPackageLayoutPortfolio:
        audit = (
            ContractPackageModuleLayout(
                module_id="audit",
                directory_name="audit",
                entrypoint_path=(
                    "src/audit/index.ts"
                ),
                exports=(
                    ContractPackageExportLayout(
                        symbol="AuditModule",
                        export_kind="class",
                        source_path=(
                            "backend/src/core/"
                            "audit/audit.module.ts"
                        ),
                        module_id="audit",
                    ),
                    ContractPackageExportLayout(
                        symbol="AuditService",
                        export_kind="class",
                        source_path=(
                            "backend/src/core/"
                            "audit/audit.service.ts"
                        ),
                        module_id="audit",
                    ),
                ),
            )
        )

        scheduler = (
            ContractPackageModuleLayout(
                module_id="scheduler",
                directory_name="scheduler",
                entrypoint_path=(
                    "src/scheduler/index.ts"
                ),
                exports=(
                    ContractPackageExportLayout(
                        symbol="SchedulerJob",
                        export_kind="interface",
                        source_path=(
                            "backend/src/core/"
                            "scheduler/types/"
                            "scheduler.types.ts"
                        ),
                        module_id="scheduler",
                    ),
                    ContractPackageExportLayout(
                        symbol=(
                            "SchedulerJobHandler"
                        ),
                        export_kind="interface",
                        source_path=(
                            "backend/src/core/"
                            "scheduler/types/"
                            "scheduler.types.ts"
                        ),
                        module_id="scheduler",
                    ),
                ),
            )
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
                "src/index.ts"
            ),
            source_strategy=(
                "repository-reexport"
            ),
            publishable=False,
            modules=(
                audit,
                scheduler,
            ),
            files=(
                ContractPackageFileLayout(
                    path="package.json",
                    file_kind=(
                        "package-metadata"
                    ),
                ),
                ContractPackageFileLayout(
                    path="src/audit/index.ts",
                    file_kind=(
                        "module-entrypoint"
                    ),
                ),
                ContractPackageFileLayout(
                    path="src/index.ts",
                    file_kind=(
                        "root-entrypoint"
                    ),
                ),
                ContractPackageFileLayout(
                    path=(
                        "src/scheduler/index.ts"
                    ),
                    file_kind=(
                        "module-entrypoint"
                    ),
                ),
                ContractPackageFileLayout(
                    path="tsconfig.json",
                    file_kind=(
                        "typescript-config"
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
            issues=(),
            summary={},
        )

    def test_dry_run_does_not_write_files(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            result = ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(),
            )

            self.assertTrue(result.valid)

            self.assertEqual(
                result.summary[
                    "writtenFileCount"
                ],
                0,
            )

            self.assertFalse(
                (
                    root
                    / "generated/contracts/"
                    "core-contracts"
                ).exists()
            )

    def test_apply_writes_all_files(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            result = ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            self.assertEqual(
                result.summary["fileCount"],
                5,
            )

            self.assertEqual(
                result.summary[
                    "writtenFileCount"
                ],
                5,
            )

            package_root = (
                root
                / "generated/contracts/"
                "core-contracts"
            )

            self.assertTrue(
                (
                    package_root
                    / "package.json"
                ).is_file()
            )

            self.assertTrue(
                (
                    package_root
                    / "src/index.ts"
                ).is_file()
            )

    def test_tsconfig_resolves_backend_type_definitions(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            config = json.loads(
                (
                    root
                    / "generated/contracts/"
                    "core-contracts/"
                    "tsconfig.json"
                ).read_text(
                    encoding="utf-8"
                )
            )

            self.assertEqual(
                config["compilerOptions"][
                    "typeRoots"
                ],
                [
                    (
                        "../../../backend/"
                        "node_modules/@types"
                    )
                ],
            )

    def test_root_entrypoint_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            content = (
                root
                / "generated/contracts/"
                "core-contracts/src/index.ts"
            ).read_text(
                encoding="utf-8"
            )

            self.assertEqual(
                content,
                (
                    "/* This file is generated. "
                    "Do not edit manually. */\n"
                    "\n"
                    'export * from "./audit";\n'
                    'export * from "./scheduler";\n'
                ),
            )

    def test_runtime_exports_use_normal_export(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            content = (
                root
                / "generated/contracts/"
                "core-contracts/"
                "src/audit/index.ts"
            ).read_text(
                encoding="utf-8"
            )

            self.assertIn(
                "export { AuditModule }",
                content,
            )

            self.assertIn(
                "export { AuditService }",
                content,
            )

            self.assertNotIn(
                "export type",
                content,
            )

    def test_type_exports_use_export_type(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            content = (
                root
                / "generated/contracts/"
                "core-contracts/"
                "src/scheduler/index.ts"
            ).read_text(
                encoding="utf-8"
            )

            self.assertIn(
                "export type {",
                content,
            )

            self.assertIn(
                "SchedulerJob,",
                content,
            )

            self.assertIn(
                "SchedulerJobHandler,",
                content,
            )

    def test_package_is_private_and_not_publishable(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            value = json.loads(
                (
                    root
                    / "generated/contracts/"
                    "core-contracts/"
                    "package.json"
                ).read_text(
                    encoding="utf-8"
                )
            )

            self.assertTrue(
                value["private"]
            )

            self.assertFalse(
                value["propertyos"][
                    "publishable"
                ]
            )

            self.assertEqual(
                value["propertyos"][
                    "sourceStrategy"
                ],
                "repository-reexport",
            )

    def test_second_identical_apply_is_idempotent(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)
            generator = (
                ContractPackageGenerator(
                    repository_root=root
                )
            )

            generator.generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            second = generator.generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            self.assertEqual(
                second.summary[
                    "writtenFileCount"
                ],
                0,
            )

    def test_different_file_requires_overwrite(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)
            destination = (
                root
                / "generated/contracts/"
                "core-contracts/"
                "src/index.ts"
            )

            destination.parent.mkdir(
                parents=True
            )

            destination.write_text(
                "manual content\n",
                encoding="utf-8",
            )

            result = ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True
                ),
            )

            self.assertFalse(result.valid)

            self.assertEqual(
                result.issues[0].code,
                "PACKAGE_GENERATION_FAILED",
            )

            self.assertEqual(
                destination.read_text(
                    encoding="utf-8"
                ),
                "manual content\n",
            )

    def test_overwrite_replaces_different_file(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)
            destination = (
                root
                / "generated/contracts/"
                "core-contracts/"
                "src/index.ts"
            )

            destination.parent.mkdir(
                parents=True
            )

            destination.write_text(
                "manual content\n",
                encoding="utf-8",
            )

            result = ContractPackageGenerator(
                repository_root=root
            ).generate(
                self._layout(),
                ContractPackageGenerationRequest(
                    apply=True,
                    overwrite=True,
                ),
            )

            self.assertTrue(result.valid)

            self.assertNotEqual(
                destination.read_text(
                    encoding="utf-8"
                ),
                "manual content\n",
            )

    def test_invalid_layout_is_rejected(
        self,
    ) -> None:
        layout = (
            ContractPackageLayoutPortfolio(
                schema_version="1.0.0",
                request=(
                    ContractPackageLayoutRequest()
                ),
                packages=(),
                issues=(),
                summary={},
            )
        )

        object.__setattr__(
            layout,
            "issues",
            ("invalid",),
        )

        with tempfile.TemporaryDirectory() as value:
            with self.assertRaises(
                ContractPackageGenerationError
            ):
                ContractPackageGenerator(
                    repository_root=Path(value)
                ).generate(
                    layout,
                    (
                        ContractPackageGenerationRequest()
                    ),
                )


if __name__ == "__main__":
    unittest.main()
