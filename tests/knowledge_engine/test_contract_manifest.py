from __future__ import annotations

import unittest

import tempfile

from pathlib import Path

from tools.knowledge_engine.contract_manifest import (
    ContractManifestError,
)
from tools.knowledge_engine.contract_manifest import (
    ContractManifestGenerator,
)
from tools.knowledge_engine.import_analysis_models import (
    FileImportAnalysis,
)
from tools.knowledge_engine.import_analysis_models import (
    ImportAnalysisPortfolio,
)
from tools.knowledge_engine.import_analysis_models import (
    ImportAnalysisRequest,
)
from tools.knowledge_engine.import_analysis_models import (
    ImportReference,
)
from tools.knowledge_engine.import_analysis_models import (
    PluginImportAnalysis,
)

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


class ContractManifestGeneratorTest(
    unittest.TestCase
):
    def _reference(
        self,
        resolved_path: str,
        symbols: tuple[str, ...],
        target_module: str = "audit",
        classification: str = (
            "platform-contract"
        ),
    ) -> ImportReference:
        return ImportReference(
            source_file=(
                "generated/plugin-staging/"
                "helpdesk/src/helpdesk.service.ts"
            ),
            line=1,
            column=1,
            syntax="named-import",
            imported_symbols=symbols,
            original_specifier=(
                "../../audit/audit.service"
            ),
            classification=classification,
            resolution_status="resolved",
            resolved_path=resolved_path,
            target_module=target_module,
            proposed_specifier=(
                "@propertyos/core-contracts"
            ),
            rewrite_required=True,
            reason="Platform contract.",
        )

    def _portfolio(
        self,
        references: tuple[
            ImportReference,
            ...,
        ],
    ) -> ImportAnalysisPortfolio:
        return ImportAnalysisPortfolio(
            schema_version="1.0.0",
            request=ImportAnalysisRequest(
                mode="module",
                module_id="helpdesk",
            ),
            analyses=(
                PluginImportAnalysis(
                    module_id="helpdesk",
                    plugin_id="helpdesk",
                    workspace_path=(
                        "generated/plugin-staging/"
                        "helpdesk"
                    ),
                    source_file_count=1,
                    import_count=len(
                        references
                    ),
                    rewrite_count=len(
                        references
                    ),
                    unresolved_count=0,
                    files=(
                        FileImportAnalysis(
                            staged_path=(
                                "src/helpdesk.service.ts"
                            ),
                            import_count=len(
                                references
                            ),
                            rewrite_count=len(
                                references
                            ),
                            unresolved_count=0,
                            imports=references,
                        ),
                    ),
                    warnings=(),
                    valid=True,
                ),
            ),
            summary={},
        )

    def _request(
        self,
    ) -> ContractManifestRequest:
        return ContractManifestRequest(
            mode="module",
            module_id="helpdesk",
        )

    def test_generates_value_and_type_exports(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            source = (
                root
                / "backend/src/core/audit/"
                "contracts.ts"
            )

            source.parent.mkdir(
                parents=True
            )

            source.write_text(
                "export class AuditService {}\n"
                "export interface AuditRecord {}\n"
                "export type AuditId = string;\n",
                encoding="utf-8",
            )

            portfolio = self._portfolio(
                (
                    self._reference(
                        (
                            "backend/src/core/"
                            "audit/contracts.ts"
                        ),
                        (
                            "AuditService",
                            "AuditRecord",
                            "AuditId",
                        ),
                    ),
                )
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    portfolio,
                    self._request(),
                )
            )

            manifest = result.manifests[0]
            package = manifest.packages[0]
            module = package.modules[0]

            self.assertTrue(manifest.valid)

            self.assertEqual(
                tuple(
                    (
                        export.symbol,
                        export.export_kind,
                    )
                    for export in module.exports
                ),
                (
                    ("AuditId", "type"),
                    (
                        "AuditRecord",
                        "interface",
                    ),
                    (
                        "AuditService",
                        "class",
                    ),
                ),
            )

    def test_repeated_usage_is_deduplicated(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            source = root / "audit.service.ts"

            source.write_text(
                "export class AuditService {}\n",
                encoding="utf-8",
            )

            reference = self._reference(
                "audit.service.ts",
                ("AuditService",),
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (
                            reference,
                            reference,
                        )
                    ),
                    self._request(),
                )
            )

            manifest = result.manifests[0]

            self.assertEqual(
                manifest.symbol_count,
                1,
            )

            self.assertEqual(
                manifest.duplicate_symbol_count,
                0,
            )

    def test_conflicting_declarations_report_duplicate(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            first = root / "first.ts"
            second = root / "second.ts"

            first.write_text(
                "export class SharedContract {}\n",
                encoding="utf-8",
            )

            second.write_text(
                "export interface SharedContract {}\n",
                encoding="utf-8",
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (
                            self._reference(
                                "first.ts",
                                (
                                    "SharedContract",
                                ),
                            ),
                            self._reference(
                                "second.ts",
                                (
                                    "SharedContract",
                                ),
                            ),
                        )
                    ),
                    self._request(),
                )
            )

            manifest = result.manifests[0]

            self.assertFalse(manifest.valid)

            self.assertEqual(
                manifest.duplicate_symbol_count,
                1,
            )

            self.assertEqual(
                manifest.symbol_count,
                1,
            )

    def test_missing_file_reports_unresolved_symbol(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (
                            self._reference(
                                "missing.ts",
                                ("MissingContract",),
                            ),
                        )
                    ),
                    self._request(),
                )
            )

            manifest = result.manifests[0]

            self.assertFalse(manifest.valid)

            self.assertEqual(
                manifest.unresolved_symbol_count,
                1,
            )

            self.assertEqual(
                manifest.symbol_count,
                0,
            )

    def test_missing_export_reports_unresolved_symbol(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            source = root / "audit.ts"

            source.write_text(
                "class HiddenAuditService {}\n",
                encoding="utf-8",
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (
                            self._reference(
                                "audit.ts",
                                (
                                    "HiddenAuditService",
                                ),
                            ),
                        )
                    ),
                    self._request(),
                )
            )

            manifest = result.manifests[0]

            self.assertFalse(manifest.valid)

            self.assertEqual(
                manifest.unresolved_symbol_count,
                1,
            )

    def test_non_platform_imports_are_ignored(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            source = root / "external.ts"

            source.write_text(
                "export class ExternalValue {}\n",
                encoding="utf-8",
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (
                            self._reference(
                                "external.ts",
                                ("ExternalValue",),
                                classification=(
                                    "external-package"
                                ),
                            ),
                        )
                    ),
                    self._request(),
                )
            )

            manifest = result.manifests[0]

            self.assertTrue(manifest.valid)

            self.assertEqual(
                manifest.symbol_count,
                0,
            )

            self.assertEqual(
                manifest.package_count,
                0,
            )

    def test_modules_and_symbols_are_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            audit = root / "audit.ts"
            scheduler = root / "scheduler.ts"

            audit.write_text(
                "export class AuditService {}\n",
                encoding="utf-8",
            )

            scheduler.write_text(
                "export interface SchedulerJob {}\n",
                encoding="utf-8",
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (
                            self._reference(
                                "scheduler.ts",
                                ("SchedulerJob",),
                                target_module=(
                                    "scheduler"
                                ),
                            ),
                            self._reference(
                                "audit.ts",
                                ("AuditService",),
                                target_module="audit",
                            ),
                        )
                    ),
                    self._request(),
                )
            )

            modules = (
                result.manifests[0]
                .packages[0]
                .modules
            )

            self.assertEqual(
                tuple(
                    module.module_id
                    for module in modules
                ),
                (
                    "audit",
                    "scheduler",
                ),
            )

    def test_summary_contains_manifest_totals(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            source = root / "audit.ts"

            source.write_text(
                "export class AuditService {}\n",
                encoding="utf-8",
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (
                            self._reference(
                                "audit.ts",
                                ("AuditService",),
                            ),
                        )
                    ),
                    self._request(),
                )
            )

            self.assertEqual(
                result.summary,
                {
                    "manifestCount": 1,
                    "validManifestCount": 1,
                    "invalidManifestCount": 0,
                    "packageCount": 1,
                    "moduleCount": 1,
                    "symbolCount": 1,
                    "issueCount": 0,
                    "unresolvedSymbolCount": 0,
                    "duplicateSymbolCount": 0,
                },
            )

    def test_invalid_mode_is_rejected(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            with self.assertRaises(
                ContractManifestError
            ):
                ContractManifestGenerator(
                    repository_root=Path(value)
                ).generate(
                    self._portfolio(()),
                    ContractManifestRequest(
                        mode="unsupported"
                    ),
                )


if __name__ == "__main__":
    unittest.main()
