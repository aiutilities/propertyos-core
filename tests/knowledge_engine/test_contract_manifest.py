from __future__ import annotations

import unittest

from dataclasses import FrozenInstanceError

from tools.knowledge_engine.contract_manifest_models import (
    ContractExport,
)
from tools.knowledge_engine.contract_manifest_models import (
    ContractManifestIssue,
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


class ContractManifestModelsTest(
    unittest.TestCase
):
    def _export(
        self,
        symbol: str,
        export_kind: str = "value",
    ) -> ContractExport:
        return ContractExport(
            symbol=symbol,
            source_path=(
                "backend/src/core/audit/"
                "audit.module.ts"
            ),
            export_kind=export_kind,
            target_module="audit",
            package_name=(
                "@propertyos/core-contracts"
            ),
        )

    def test_request_defaults_are_stable(
        self,
    ) -> None:
        request = ContractManifestRequest(
            mode="module",
            module_id="helpdesk",
        )

        self.assertEqual(
            request.package_name,
            "@propertyos/core-contracts",
        )

        self.assertEqual(
            request.package_version,
            "0.1.0",
        )

        self.assertIsNone(request.limit)

    def test_models_are_immutable(
        self,
    ) -> None:
        export = self._export(
            "AuditModule"
        )

        with self.assertRaises(
            FrozenInstanceError
        ):
            export.symbol = "Changed"  # type: ignore[misc]

    def test_module_symbol_count(
        self,
    ) -> None:
        module = ContractModule(
            module_id="audit",
            exports=(
                self._export(
                    "AuditModule"
                ),
                self._export(
                    "AuditService"
                ),
            ),
        )

        self.assertEqual(
            module.symbol_count,
            2,
        )

    def test_package_counts_modules_and_symbols(
        self,
    ) -> None:
        package = ContractPackage(
            package_name=(
                "@propertyos/core-contracts"
            ),
            version="0.1.0",
            modules=(
                ContractModule(
                    module_id="audit",
                    exports=(
                        self._export(
                            "AuditModule"
                        ),
                        self._export(
                            "AuditService"
                        ),
                    ),
                ),
                ContractModule(
                    module_id="scheduler",
                    exports=(
                        ContractExport(
                            symbol=(
                                "SchedulerJob"
                            ),
                            source_path=(
                                "backend/src/core/"
                                "scheduler/types/"
                                "scheduler.types.ts"
                            ),
                            export_kind="type",
                            target_module=(
                                "scheduler"
                            ),
                            package_name=(
                                "@propertyos/"
                                "core-contracts"
                            ),
                        ),
                    ),
                ),
            ),
        )

        self.assertEqual(
            package.module_count,
            2,
        )

        self.assertEqual(
            package.symbol_count,
            3,
        )

    def test_manifest_counts_issues(
        self,
    ) -> None:
        manifest = PluginContractManifest(
            module_id="helpdesk",
            plugin_id="helpdesk",
            workspace_path=(
                "generated/plugin-staging/"
                "helpdesk"
            ),
            packages=(),
            issues=(
                ContractManifestIssue(
                    code="UNRESOLVED_SYMBOL",
                    message=(
                        "Unable to resolve symbol."
                    ),
                    module_id="audit",
                    symbol="MissingAudit",
                ),
                ContractManifestIssue(
                    code="DUPLICATE_SYMBOL",
                    message=(
                        "Duplicate public symbol."
                    ),
                    module_id="audit",
                    symbol="AuditModule",
                ),
            ),
            valid=False,
        )

        self.assertEqual(
            manifest.unresolved_symbol_count,
            1,
        )

        self.assertEqual(
            manifest.duplicate_symbol_count,
            1,
        )

        self.assertEqual(
            manifest.package_count,
            0,
        )

    def test_portfolio_uses_immutable_manifest_tuple(
        self,
    ) -> None:
        manifest = PluginContractManifest(
            module_id="helpdesk",
            plugin_id="helpdesk",
            workspace_path=(
                "generated/plugin-staging/"
                "helpdesk"
            ),
            packages=(),
            issues=(),
            valid=True,
        )

        portfolio = ContractManifestPortfolio(
            schema_version="1.0.0",
            request=ContractManifestRequest(
                mode="module",
                module_id="helpdesk",
            ),
            manifests=(manifest,),
            summary={
                "manifestCount": 1,
                "validManifestCount": 1,
            },
        )

        self.assertIsInstance(
            portfolio.manifests,
            tuple,
        )

        self.assertEqual(
            portfolio.manifests,
            (manifest,),
        )


if __name__ == "__main__":
    unittest.main()
