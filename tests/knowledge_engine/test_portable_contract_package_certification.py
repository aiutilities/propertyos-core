from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import tarfile
import unittest

from pathlib import Path

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


REPOSITORY_ROOT = Path.cwd().resolve()

CERTIFICATION_ROOTS = (
    REPOSITORY_ROOT
    / ".phase21b22d-certification-a",
    REPOSITORY_ROOT
    / ".phase21b22d-certification-b",
    REPOSITORY_ROOT
    / ".phase21b22d-certification-build",
)


def create_portfolio(
    output_root: Path,
) -> ContractPackageLayoutPortfolio:
    modules = (
        ContractPackageModuleLayout(
            module_id="audit",
            directory_name="audit",
            entrypoint_path=(
                "src/audit/index.ts"
            ),
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
        ),
        ContractPackageModuleLayout(
            module_id="eventbus",
            directory_name="eventbus",
            entrypoint_path=(
                "src/eventbus/index.ts"
            ),
            exports=(
                ContractPackageExportLayout(
                    symbol="EventBusModule",
                    export_kind="value",
                    source_path=(
                        "backend/src/core/eventbus/"
                        "eventbus.module.ts"
                    ),
                    module_id="eventbus",
                ),
                ContractPackageExportLayout(
                    symbol="EventBusService",
                    export_kind="value",
                    source_path=(
                        "backend/src/core/eventbus/"
                        "eventbus.service.ts"
                    ),
                    module_id="eventbus",
                ),
            ),
        ),
    )

    files = [
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
    ]

    for module in modules:
        files.append(
            ContractPackageFileLayout(
                path=module.entrypoint_path,
                file_kind="module-entrypoint",
            )
        )

    package_root = (
        output_root
        / "core-contracts"
    )

    package = PlannedContractPackage(
        package_name=(
            "@propertyos/core-contracts"
        ),
        version="0.1.0",
        package_directory=str(
            package_root
        ),
        root_entrypoint_path=(
            "src/index.ts"
        ),
        source_strategy=(
            "portable-facade"
        ),
        publishable=True,
        modules=modules,
        files=tuple(files),
    )

    return ContractPackageLayoutPortfolio(
        schema_version="1.0.0",
        request=ContractPackageLayoutRequest(
            output_root=str(output_root),
            source_strategy=(
                "portable-facade"
            ),
        ),
        packages=(package,),
        issues=(),
        summary={},
    )


def generate_package(
    output_root: Path,
) -> Path:
    generator = ContractPackageGenerator(
        repository_root=REPOSITORY_ROOT,
    )

    result = generator.generate(
        create_portfolio(output_root),
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

    return output_root / "core-contracts"


def source_digest(
    package_root: Path,
) -> dict[str, str]:
    digest: dict[str, str] = {}

    for path in sorted(
        package_root.rglob("*")
    ):
        if not path.is_file():
            continue

        if (
            "node_modules" in path.parts
            or "dist" in path.parts
            or path.name == "package-lock.json"
        ):
            continue

        relative = str(
            path.relative_to(package_root)
        )

        digest[relative] = hashlib.sha256(
            path.read_bytes()
        ).hexdigest()

    return digest


class PortableContractPackageCertificationTest(
    unittest.TestCase
):
    @classmethod
    def tearDownClass(cls) -> None:
        for root in CERTIFICATION_ROOTS:
            shutil.rmtree(
                root,
                ignore_errors=True,
            )

    def setUp(self) -> None:
        for root in CERTIFICATION_ROOTS:
            shutil.rmtree(
                root,
                ignore_errors=True,
            )

    def tearDown(self) -> None:
        for root in CERTIFICATION_ROOTS:
            shutil.rmtree(
                root,
                ignore_errors=True,
            )

    def test_generation_is_deterministic(
        self,
    ) -> None:
        first = generate_package(
            CERTIFICATION_ROOTS[0]
        )
        second = generate_package(
            CERTIFICATION_ROOTS[1]
        )

        self.assertEqual(
            source_digest(first),
            source_digest(second),
        )

    def test_generated_package_has_no_repository_escape(
        self,
    ) -> None:
        package_root = generate_package(
            CERTIFICATION_ROOTS[0]
        )

        forbidden = (
            "backend/src",
            "backend/tsconfig",
            "propertyos-core",
            "/Users/",
        )

        for path in package_root.rglob("*"):
            if not path.is_file():
                continue

            text = path.read_text(
                encoding="utf-8"
            )

            for marker in forbidden:
                self.assertNotIn(
                    marker,
                    text,
                    msg=f"{marker} found in {path}",
                )

    def test_metadata_is_publishable_and_node16(
        self,
    ) -> None:
        package_root = generate_package(
            CERTIFICATION_ROOTS[0]
        )

        package = json.loads(
            (
                package_root
                / "package.json"
            ).read_text(
                encoding="utf-8"
            )
        )

        tsconfig = json.loads(
            (
                package_root
                / "tsconfig.json"
            ).read_text(
                encoding="utf-8"
            )
        )

        self.assertFalse(
            package["private"]
        )
        self.assertEqual(
            package["files"],
            ["dist"],
        )
        self.assertEqual(
            package["propertyos"][
                "sourceStrategy"
            ],
            "portable-facade",
        )
        self.assertTrue(
            package["propertyos"][
                "publishable"
            ]
        )
        self.assertEqual(
            package["propertyos"][
                "hostApiVersion"
            ],
            "0.1.0",
        )

        compiler = tsconfig[
            "compilerOptions"
        ]

        self.assertEqual(
            compiler["module"],
            "Node16",
        )
        self.assertEqual(
            compiler[
                "moduleResolution"
            ],
            "Node16",
        )
        self.assertNotIn(
            "extends",
            tsconfig,
        )

    def test_package_builds_and_packs_in_isolation(
        self,
    ) -> None:
        package_root = generate_package(
            CERTIFICATION_ROOTS[2]
        )

        subprocess.run(
            [
                "npm",
                "install",
                "--ignore-scripts",
            ],
            cwd=package_root,
            check=True,
        )

        subprocess.run(
            [
                "npm",
                "run",
                "typecheck",
            ],
            cwd=package_root,
            check=True,
        )

        subprocess.run(
            [
                "npm",
                "run",
                "build",
            ],
            cwd=package_root,
            check=True,
        )

        subprocess.run(
            [
                "npm",
                "pack",
                "--pack-destination",
                str(
                    CERTIFICATION_ROOTS[2]
                ),
            ],
            cwd=package_root,
            check=True,
        )

        archives = list(
            CERTIFICATION_ROOTS[2]
            .glob("*.tgz")
        )

        self.assertEqual(
            len(archives),
            1,
        )

        with tarfile.open(
            archives[0],
            mode="r:gz",
        ) as archive:
            names = sorted(
                archive.getnames()
            )

        required = {
            "package/package.json",
            "package/dist/index.js",
            "package/dist/index.d.ts",
            (
                "package/dist/"
                "host-runtime.js"
            ),
            (
                "package/dist/"
                "audit/index.js"
            ),
            (
                "package/dist/"
                "eventbus/index.js"
            ),
        }

        self.assertTrue(
            required.issubset(
                set(names)
            )
        )

        self.assertFalse(
            any(
                item.startswith(
                    "package/src/"
                )
                or item.startswith(
                    "package/backend/"
                )
                or item.startswith(
                    "package/node_modules/"
                )
                for item in names
            )
        )


if __name__ == "__main__":
    unittest.main()
