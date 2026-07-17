from __future__ import annotations

import unittest

from dataclasses import FrozenInstanceError

from tools.knowledge_engine.contract_manifest_models import (
    ContractExport,
)
from tools.knowledge_engine.contract_manifest_models import (
    ContractManifestPortfolio,
)
from tools.knowledge_engine.contract_manifest_models import (
    ContractManifestRequest,
)
from tools.knowledge_engine.contract_manifest_models import (
    ContractModule,
)
from tools.knowledge_engine.contract_manifest_models import (
    ContractPackage,
)
from tools.knowledge_engine.contract_manifest_models import (
    PluginContractManifest,
)
from tools.knowledge_engine.contract_package_layout import (
    ContractPackageLayoutError,
)
from tools.knowledge_engine.contract_package_layout import (
    ContractPackageLayoutPlanner,
)
from tools.knowledge_engine.contract_package_layout_models import (
    ContractPackageLayoutRequest,
)


class ContractPackageLayoutPlannerTest(
    unittest.TestCase
):
    def _export(
        self,
        symbol: str,
        module_id: str,
        source_path: str,
        export_kind: str = "class",
    ) -> ContractExport:
        return ContractExport(
            symbol=symbol,
            source_path=source_path,
            export_kind=export_kind,
            target_module=module_id,
            package_name=(
                "@propertyos/core-contracts"
            ),
        )

    def _portfolio(
        self,
        modules: tuple[
            ContractModule,
            ...,
        ],
        *,
        valid: bool = True,
    ) -> ContractManifestPortfolio:
        manifest = PluginContractManifest(
            module_id="helpdesk",
            plugin_id="helpdesk",
            workspace_path=(
                "generated/plugin-staging/"
                "helpdesk"
            ),
            packages=(
                ContractPackage(
                    package_name=(
                        "@propertyos/"
                        "core-contracts"
                    ),
                    version="0.1.0",
                    modules=modules,
                ),
            ),
            issues=(),
            valid=valid,
        )

        return ContractManifestPortfolio(
            schema_version="1.0.0",
            request=(
                ContractManifestRequest(
                    mode="module",
                    module_id="helpdesk",
                )
            ),
            manifests=(manifest,),
            summary={},
        )

    def test_request_defaults_are_stable(
        self,
    ) -> None:
        request = (
            ContractPackageLayoutRequest()
        )

        self.assertEqual(
            request.output_root,
            "generated/contracts",
        )

        self.assertEqual(
            request.source_strategy,
            "repository-reexport",
        )

        self.assertIsNone(
            request.package_name
        )

    def test_models_are_immutable(
        self,
    ) -> None:
        request = (
            ContractPackageLayoutRequest()
        )

        with self.assertRaises(
            FrozenInstanceError
        ):
            request.output_root = "changed"  # type: ignore[misc]

    def test_plans_per_module_barrels(
        self,
    ) -> None:
        portfolio = self._portfolio(
            (
                ContractModule(
                    module_id="audit",
                    exports=(
                        self._export(
                            "AuditModule",
                            "audit",
                            (
                                "backend/src/core/"
                                "audit/audit.module.ts"
                            ),
                        ),
                        self._export(
                            "AuditService",
                            "audit",
                            (
                                "backend/src/core/"
                                "audit/audit.service.ts"
                            ),
                        ),
                    ),
                ),
                ContractModule(
                    module_id=(
                        "database:postgres"
                    ),
                    exports=(
                        self._export(
                            "POSTGRES_POOL",
                            "database:postgres",
                            (
                                "backend/src/"
                                "database/postgres/"
                                "postgres.types.ts"
                            ),
                            "value",
                        ),
                    ),
                ),
            )
        )

        result = (
            ContractPackageLayoutPlanner()
            .plan(
                portfolio,
                ContractPackageLayoutRequest(),
            )
        )

        self.assertTrue(result.valid)

        self.assertEqual(
            result.summary,
            {
                "packageCount": 1,
                "moduleCount": 2,
                "symbolCount": 3,
                "fileCount": 5,
                "issueCount": 0,
                "publishablePackageCount": 0,
                (
                    "repositoryBacked"
                    "PackageCount"
                ): 1,
            },
        )

        package = result.packages[0]

        self.assertEqual(
            package.package_directory,
            (
                "generated/contracts/"
                "core-contracts"
            ),
        )

        self.assertEqual(
            tuple(
                (
                    module.module_id,
                    module.directory_name,
                    module.entrypoint_path,
                )
                for module
                in package.modules
            ),
            (
                (
                    "audit",
                    "audit",
                    "src/audit/index.ts",
                ),
                (
                    "database:postgres",
                    "database-postgres",
                    (
                        "src/database-postgres/"
                        "index.ts"
                    ),
                ),
            ),
        )

        self.assertEqual(
            tuple(
                file.path
                for file in package.files
            ),
            (
                "package.json",
                "src/audit/index.ts",
                (
                    "src/database-postgres/"
                    "index.ts"
                ),
                "src/index.ts",
                "tsconfig.json",
            ),
        )

        self.assertFalse(
            package.publishable
        )

    def test_symbols_are_deterministic(
        self,
    ) -> None:
        portfolio = self._portfolio(
            (
                ContractModule(
                    module_id="audit",
                    exports=(
                        self._export(
                            "AuditService",
                            "audit",
                            "audit.service.ts",
                        ),
                        self._export(
                            "AuditModule",
                            "audit",
                            "audit.module.ts",
                        ),
                    ),
                ),
            )
        )

        result = (
            ContractPackageLayoutPlanner()
            .plan(
                portfolio,
                ContractPackageLayoutRequest(),
            )
        )

        symbols = tuple(
            export.symbol
            for export
            in result.packages[0]
            .modules[0]
            .exports
        )

        self.assertEqual(
            symbols,
            (
                "AuditModule",
                "AuditService",
            ),
        )

    def test_repeated_identical_exports_are_deduplicated(
        self,
    ) -> None:
        module = ContractModule(
            module_id="audit",
            exports=(
                self._export(
                    "AuditService",
                    "audit",
                    "audit.service.ts",
                ),
            ),
        )

        first = self._portfolio(
            (module,)
        ).manifests[0]

        second = PluginContractManifest(
            module_id="maintenance",
            plugin_id="maintenance",
            workspace_path=(
                "generated/plugin-staging/"
                "maintenance"
            ),
            packages=first.packages,
            issues=(),
            valid=True,
        )

        portfolio = (
            ContractManifestPortfolio(
                schema_version="1.0.0",
                request=(
                    ContractManifestRequest(
                        mode="candidates"
                    )
                ),
                manifests=(
                    second,
                    first,
                ),
                summary={},
            )
        )

        result = (
            ContractPackageLayoutPlanner()
            .plan(
                portfolio,
                ContractPackageLayoutRequest(),
            )
        )

        self.assertTrue(result.valid)

        self.assertEqual(
            result.summary["symbolCount"],
            1,
        )

    def test_conflicting_exports_are_reported(
        self,
    ) -> None:
        first = self._portfolio(
            (
                ContractModule(
                    module_id="audit",
                    exports=(
                        self._export(
                            "AuditService",
                            "audit",
                            "first.ts",
                        ),
                    ),
                ),
            )
        ).manifests[0]

        second = PluginContractManifest(
            module_id="maintenance",
            plugin_id="maintenance",
            workspace_path=(
                "generated/plugin-staging/"
                "maintenance"
            ),
            packages=(
                ContractPackage(
                    package_name=(
                        "@propertyos/"
                        "core-contracts"
                    ),
                    version="0.1.0",
                    modules=(
                        ContractModule(
                            module_id="audit",
                            exports=(
                                self._export(
                                    "AuditService",
                                    "audit",
                                    "second.ts",
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            issues=(),
            valid=True,
        )

        portfolio = (
            ContractManifestPortfolio(
                schema_version="1.0.0",
                request=(
                    ContractManifestRequest(
                        mode="candidates"
                    )
                ),
                manifests=(
                    first,
                    second,
                ),
                summary={},
            )
        )

        result = (
            ContractPackageLayoutPlanner()
            .plan(
                portfolio,
                ContractPackageLayoutRequest(),
            )
        )

        self.assertFalse(result.valid)

        self.assertEqual(
            result.issues[0].code,
            "CONFLICTING_EXPORT",
        )

    def test_invalid_manifest_is_rejected(
        self,
    ) -> None:
        result = (
            ContractPackageLayoutPlanner()
            .plan(
                self._portfolio(
                    (),
                    valid=False,
                ),
                ContractPackageLayoutRequest(),
            )
        )

        self.assertFalse(result.valid)

        self.assertEqual(
            result.issues[0].code,
            (
                "INVALID_CONTRACT_MANIFEST"
            ),
        )

    def test_package_filter_is_applied(
        self,
    ) -> None:
        result = (
            ContractPackageLayoutPlanner()
            .plan(
                self._portfolio(()),
                ContractPackageLayoutRequest(
                    package_name=(
                        "@propertyos/"
                        "another-package"
                    )
                ),
            )
        )

        self.assertEqual(
            result.packages,
            (),
        )

    def test_unsafe_output_root_is_rejected(
        self,
    ) -> None:
        with self.assertRaises(
            ContractPackageLayoutError
        ):
            (
                ContractPackageLayoutPlanner()
                .plan(
                    self._portfolio(()),
                    ContractPackageLayoutRequest(
                        output_root="../outside"
                    ),
                )
            )

    def test_unsupported_source_strategy_is_rejected(
        self,
    ) -> None:
        with self.assertRaises(
            ContractPackageLayoutError
        ):
            (
                ContractPackageLayoutPlanner()
                .plan(
                    self._portfolio(()),
                    ContractPackageLayoutRequest(
                        source_strategy="copy"
                    ),
                )
            )


if __name__ == "__main__":
    unittest.main()
