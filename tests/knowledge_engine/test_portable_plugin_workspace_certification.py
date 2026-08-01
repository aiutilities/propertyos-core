from __future__ import annotations

import json
import shutil
import subprocess
import tarfile
import unittest

from pathlib import Path

from tools.knowledge_engine.blueprint_generator import (
    PluginBlueprintGenerator,
)
from tools.knowledge_engine.blueprint_models import (
    BlueprintRequest,
)
from tools.knowledge_engine.contract_package_generator import (
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
from tools.knowledge_engine.plugin_workspace_generator import (
    PluginWorkspaceGenerator,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path.cwd().resolve()

CERTIFICATION_ROOT = (
    REPOSITORY_ROOT
    / ".phase21b22e3-workspace-certification"
)


def generate_contract_package(
    root: Path,
) -> Path:
    output = root / "contracts" / "core-contracts"

    module = ContractPackageModuleLayout(
        module_id="audit",
        directory_name="audit",
        entrypoint_path="src/audit/index.ts",
        exports=(
            ContractPackageExportLayout(
                symbol="AuditModule",
                export_kind="value",
                source_path=(
                    "backend/src/core/audit/"
                    "audit.module.ts"
                ),
                module_id="audit",
            ),
            ContractPackageExportLayout(
                symbol="AuditService",
                export_kind="value",
                source_path=(
                    "backend/src/core/audit/"
                    "audit.service.ts"
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
        package_directory=str(output),
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

    portfolio = ContractPackageLayoutPortfolio(
        schema_version="1.0.0",
        request=ContractPackageLayoutRequest(
            output_root=str(root / "contracts"),
            source_strategy="portable-facade",
        ),
        packages=(package,),
        issues=(),
        summary={},
    )

    result = ContractPackageGenerator(
        repository_root=REPOSITORY_ROOT,
    ).generate(
        portfolio,
        ContractPackageGenerationRequest(
            apply=True,
            overwrite=True,
        ),
    )

    if not result.valid:
        issues = "\n".join(
            f"{item.code}: {item.message}"
            for item in result.issues
        )
        raise AssertionError(issues)

    subprocess.run(
        [
            "npm",
            "install",
            "--ignore-scripts",
        ],
        cwd=output,
        check=True,
    )

    subprocess.run(
        [
            "npm",
            "run",
            "typecheck",
        ],
        cwd=output,
        check=True,
    )

    subprocess.run(
        [
            "npm",
            "run",
            "build",
        ],
        cwd=output,
        check=True,
    )

    subprocess.run(
        [
            "npm",
            "pack",
            "--pack-destination",
            str(root),
        ],
        cwd=output,
        check=True,
    )

    archives = sorted(
        root.glob(
            "propertyos-core-contracts-*.tgz"
        )
    )

    if len(archives) != 1:
        raise AssertionError(
            "Expected one packed core-contract archive"
        )

    return archives[0]


def generate_workspace(
    root: Path,
    archive: Path,
) -> Path:
    repository = Repository.load(
        REPOSITORY_ROOT
    )

    portfolio = PluginBlueprintGenerator(
        repository
    ).generate(
        BlueprintRequest(
            mode="module",
            module_id="helpdesk",
        )
    )

    blueprint = portfolio.blueprints[0]
    workspace = root / "plugin-helpdesk"

    content = PluginWorkspaceGenerator(
        repository=repository,
        repository_root=REPOSITORY_ROOT,
    ).generate(
        blueprint=blueprint,
        copied_files=(),
        workspace=workspace,
        source_strategy="portable-facade",
        portable_contract_package=archive,
    )

    for relative, data in content.items():
        target = workspace / relative

        target.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        target.write_bytes(data)

    source = workspace / "src" / "index.ts"

    source.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    source.write_text(
        "import { AuditModule } "
        "from '@propertyos/core-contracts/audit';\n"
        "\n"
        "export const PortableWorkspaceAuditModule "
        "= AuditModule;\n",
        encoding="utf-8",
    )

    return workspace


class PortablePluginWorkspaceCertificationTest(
    unittest.TestCase
):
    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(
            CERTIFICATION_ROOT,
            ignore_errors=True,
        )

    def setUp(self) -> None:
        shutil.rmtree(
            CERTIFICATION_ROOT,
            ignore_errors=True,
        )

        CERTIFICATION_ROOT.mkdir(
            parents=True,
            exist_ok=True,
        )

    def tearDown(self) -> None:
        shutil.rmtree(
            CERTIFICATION_ROOT,
            ignore_errors=True,
        )

    def test_workspace_metadata_is_portable(
        self,
    ) -> None:
        archive = generate_contract_package(
            CERTIFICATION_ROOT
        )

        workspace = generate_workspace(
            CERTIFICATION_ROOT,
            archive,
        )

        package = json.loads(
            (
                workspace
                / "package.json"
            ).read_text(
                encoding="utf-8"
            )
        )

        tsconfig = json.loads(
            (
                workspace
                / "tsconfig.json"
            ).read_text(
                encoding="utf-8"
            )
        )

        self.assertEqual(
            package["propertyos"][
                "sourceStrategy"
            ],
            "portable-facade",
        )

        self.assertEqual(
            package["propertyos"][
                "hostApiVersion"
            ],
            "0.1.0",
        )

        self.assertTrue(
            package["propertyos"][
                "portable"
            ]
        )

        self.assertTrue(
            package["dependencies"][
                "@propertyos/core-contracts"
            ].endswith(".tgz")
        )

        self.assertNotIn(
            "extends",
            tsconfig,
        )

        self.assertEqual(
            tsconfig["compilerOptions"][
                "module"
            ],
            "Node16",
        )

        self.assertEqual(
            tsconfig["compilerOptions"][
                "moduleResolution"
            ],
            "Node16",
        )

    def test_build_critical_files_have_no_repository_escape(
        self,
    ) -> None:
        archive = generate_contract_package(
            CERTIFICATION_ROOT
        )

        workspace = generate_workspace(
            CERTIFICATION_ROOT,
            archive,
        )

        files = (
            workspace / "package.json",
            workspace / "tsconfig.json",
            workspace / "src" / "index.ts",
        )

        forbidden = (
            "backend/tsconfig",
            "backend/src",
            "/Users/",
        )

        for path in files:
            text = path.read_text(
                encoding="utf-8"
            )

            for marker in forbidden:
                self.assertNotIn(
                    marker,
                    text,
                    msg=f"{marker} found in {path}",
                )

    def test_extraction_report_is_provenance_only(
        self,
    ) -> None:
        archive = generate_contract_package(
            CERTIFICATION_ROOT
        )

        workspace = generate_workspace(
            CERTIFICATION_ROOT,
            archive,
        )

        report = json.loads(
            (
                workspace
                / "extraction-report.json"
            ).read_text(
                encoding="utf-8"
            )
        )

        serialized = json.dumps(report)

        self.assertIn(
            "backend/src",
            serialized,
        )

        tsconfig = (
            workspace
            / "tsconfig.json"
        ).read_text(
            encoding="utf-8"
        )

        package = (
            workspace
            / "package.json"
        ).read_text(
            encoding="utf-8"
        )

        self.assertNotIn(
            "backend/src",
            tsconfig,
        )

        self.assertNotIn(
            "backend/src",
            package,
        )

    def test_workspace_installs_typechecks_builds_and_packs(
        self,
    ) -> None:
        archive = generate_contract_package(
            CERTIFICATION_ROOT
        )

        workspace = generate_workspace(
            CERTIFICATION_ROOT,
            archive,
        )

        subprocess.run(
            [
                "npm",
                "install",
                "--ignore-scripts",
            ],
            cwd=workspace,
            check=True,
        )

        subprocess.run(
            [
                "npm",
                "run",
                "typecheck",
            ],
            cwd=workspace,
            check=True,
        )

        subprocess.run(
            [
                "npm",
                "run",
                "build",
            ],
            cwd=workspace,
            check=True,
        )

        subprocess.run(
            [
                "npm",
                "pack",
                "--pack-destination",
                str(CERTIFICATION_ROOT),
            ],
            cwd=workspace,
            check=True,
        )

        self.assertTrue(
            (
                workspace
                / "dist"
                / "index.js"
            ).is_file()
        )

        self.assertTrue(
            (
                workspace
                / "dist"
                / "index.d.ts"
            ).is_file()
        )

        archives = sorted(
            CERTIFICATION_ROOT.glob(
                "propertyos-plugin-helpdesk-*.tgz"
            )
        )

        self.assertEqual(
            len(archives),
            1,
        )

        with tarfile.open(
            archives[0],
            mode="r:gz",
        ) as archive_file:
            names = set(
                archive_file.getnames()
            )

        self.assertIn(
            "package/package.json",
            names,
        )

        self.assertIn(
            "package/dist/index.js",
            names,
        )

        self.assertIn(
            "package/dist/index.d.ts",
            names,
        )


if __name__ == "__main__":
    unittest.main()
