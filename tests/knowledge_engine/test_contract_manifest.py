from __future__ import annotations

import unittest

import tempfile
import json

from tools.knowledge_engine.contract_manifest_cli import (
    build_parser,
)
from tools.knowledge_engine.contract_manifest_formatter import (
    contract_manifest_to_dict,
)
from tools.knowledge_engine.contract_manifest_formatter import (
    format_contract_manifest_json,
)
from tools.knowledge_engine.contract_manifest_formatter import (
    format_contract_manifest_markdown,
)

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

    def test_post_rewrite_package_import_recovers_contract_provenance(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            source = (
                root
                / "backend/src/core/audit/"
                "audit.service.ts"
            )

            source.parent.mkdir(
                parents=True
            )

            source.write_text(
                "export class AuditService {}\n",
                encoding="utf-8",
            )

            workspace = (
                root
                / "generated/plugin-staging/"
                "helpdesk"
            )

            workspace.mkdir(
                parents=True
            )

            (
                workspace
                / "extraction-report.json"
            ).write_text(
                json.dumps(
                    {
                        "contracts": [
                            {
                                "type": (
                                    "platform-contract"
                                ),
                                "sourceModule": (
                                    "audit"
                                ),
                                "moduleRoot": (
                                    "backend/src/core/"
                                    "audit"
                                ),
                                "targetPackage": (
                                    "@propertyos/"
                                    "core-contracts"
                                ),
                            }
                        ]
                    },
                    indent=2,
                    sort_keys=True,
                )
                + "\n",
                encoding="utf-8",
            )

            rewritten = ImportReference(
                source_file=(
                    "src/helpdesk.service.ts"
                ),
                line=1,
                column=1,
                syntax="named-import",
                imported_symbols=(
                    "AuditService",
                ),
                original_specifier=(
                    "@propertyos/"
                    "core-contracts"
                ),
                classification=(
                    "propertyos-package"
                ),
                resolution_status=(
                    "resolved-package"
                ),
                resolved_path="",
                target_module="",
                proposed_specifier=(
                    "@propertyos/"
                    "core-contracts"
                ),
                rewrite_required=False,
                reason=(
                    "PropertyOS package import."
                ),
            )

            result = (
                ContractManifestGenerator(
                    repository_root=root
                ).generate(
                    self._portfolio(
                        (rewritten,)
                    ),
                    self._request(),
                )
            )

            manifest = result.manifests[0]

            self.assertTrue(
                manifest.valid
            )

            self.assertEqual(
                manifest.symbol_count,
                1,
            )

            export = (
                manifest.packages[0]
                .modules[0]
                .exports[0]
            )

            self.assertEqual(
                export.symbol,
                "AuditService",
            )

            self.assertEqual(
                export.target_module,
                "audit",
            )

            self.assertEqual(
                export.source_path,
                (
                    "backend/src/core/audit/"
                    "audit.service.ts"
                ),
            )

            self.assertEqual(
                export.export_kind,
                "class",
            )

    def test_pre_and_post_rewrite_manifests_match(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)

            source = (
                root
                / "backend/src/core/audit/"
                "audit.service.ts"
            )

            source.parent.mkdir(
                parents=True
            )

            source.write_text(
                "export class AuditService {}\n",
                encoding="utf-8",
            )

            workspace = (
                root
                / "generated/plugin-staging/"
                "helpdesk"
            )

            workspace.mkdir(
                parents=True
            )

            (
                workspace
                / "extraction-report.json"
            ).write_text(
                json.dumps(
                    {
                        "contracts": [
                            {
                                "type": (
                                    "platform-contract"
                                ),
                                "sourceModule": (
                                    "audit"
                                ),
                                "moduleRoot": (
                                    "backend/src/core/"
                                    "audit"
                                ),
                                "targetPackage": (
                                    "@propertyos/"
                                    "core-contracts"
                                ),
                            }
                        ]
                    },
                    indent=2,
                    sort_keys=True,
                )
                + "\n",
                encoding="utf-8",
            )

            pre_rewrite = self._reference(
                (
                    "backend/src/core/audit/"
                    "audit.service.ts"
                ),
                ("AuditService",),
            )

            post_rewrite = ImportReference(
                source_file=(
                    "src/helpdesk.service.ts"
                ),
                line=1,
                column=1,
                syntax="named-import",
                imported_symbols=(
                    "AuditService",
                ),
                original_specifier=(
                    "@propertyos/"
                    "core-contracts"
                ),
                classification=(
                    "propertyos-package"
                ),
                resolution_status=(
                    "resolved-package"
                ),
                resolved_path="",
                target_module="",
                proposed_specifier=(
                    "@propertyos/"
                    "core-contracts"
                ),
                rewrite_required=False,
                reason=(
                    "PropertyOS package import."
                ),
            )

            generator = (
                ContractManifestGenerator(
                    repository_root=root
                )
            )

            before = generator.generate(
                self._portfolio(
                    (pre_rewrite,)
                ),
                self._request(),
            )

            after = generator.generate(
                self._portfolio(
                    (post_rewrite,)
                ),
                self._request(),
            )

            self.assertEqual(
                before.manifests[0].packages,
                after.manifests[0].packages,
            )

            self.assertEqual(
                before.summary,
                after.summary,
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


class ContractManifestFormatterTest(
    unittest.TestCase
):
    def _portfolio(
        self,
    ) -> ContractManifestPortfolio:
        export = ContractExport(
            symbol="AuditService",
            source_path=(
                "backend/src/core/audit/"
                "audit.service.ts"
            ),
            export_kind="class",
            target_module="audit",
            package_name=(
                "@propertyos/core-contracts"
            ),
        )

        return ContractManifestPortfolio(
            schema_version="1.0.0",
            request=ContractManifestRequest(
                mode="module",
                module_id="helpdesk",
            ),
            manifests=(
                PluginContractManifest(
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
                            modules=(
                                ContractModule(
                                    module_id="audit",
                                    exports=(
                                        export,
                                    ),
                                ),
                            ),
                        ),
                    ),
                    issues=(),
                    valid=True,
                ),
            ),
            summary={
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

    def test_dictionary_uses_camel_case(
        self,
    ) -> None:
        value = contract_manifest_to_dict(
            self._portfolio()
        )

        self.assertEqual(
            value["schemaVersion"],
            "1.0.0",
        )

        self.assertEqual(
            value["request"]["moduleId"],
            "helpdesk",
        )

        manifest = value["manifests"][0]

        self.assertEqual(
            manifest["symbolCount"],
            1,
        )

        export = (
            manifest["packages"][0]
            ["modules"][0]
            ["exports"][0]
        )

        self.assertEqual(
            export["sourcePath"],
            (
                "backend/src/core/audit/"
                "audit.service.ts"
            ),
        )

        self.assertEqual(
            export["exportKind"],
            "class",
        )

    def test_json_is_valid_and_deterministic(
        self,
    ) -> None:
        portfolio = self._portfolio()

        first = format_contract_manifest_json(
            portfolio
        )

        second = format_contract_manifest_json(
            portfolio
        )

        self.assertEqual(first, second)

        value = json.loads(first)

        self.assertEqual(
            value["summary"]["symbolCount"],
            1,
        )

        self.assertTrue(
            first.endswith("\n")
        )

    def test_markdown_contains_contract_table(
        self,
    ) -> None:
        output = (
            format_contract_manifest_markdown(
                self._portfolio()
            )
        )

        self.assertIn(
            "# PropertyOS Contract Manifest",
            output,
        )

        self.assertIn(
            "## Plugin: helpdesk",
            output,
        )

        self.assertIn(
            "### Package: "
            "@propertyos/core-contracts",
            output,
        )

        self.assertIn(
            "#### Module: audit",
            output,
        )

        self.assertIn(
            "`AuditService`",
            output,
        )

        self.assertIn(
            "`class`",
            output,
        )


class ContractManifestCliTest(
    unittest.TestCase
):
    def test_parser_accepts_module_request(
        self,
    ) -> None:
        arguments = build_parser().parse_args(
            [
                "--format",
                "markdown",
                "--package-version",
                "0.2.0",
                "module",
                "helpdesk",
            ]
        )

        self.assertEqual(
            arguments.mode,
            "module",
        )

        self.assertEqual(
            arguments.module_id,
            "helpdesk",
        )

        self.assertEqual(
            arguments.format,
            "markdown",
        )

        self.assertEqual(
            arguments.package_version,
            "0.2.0",
        )

    def test_parser_defaults_are_stable(
        self,
    ) -> None:
        arguments = build_parser().parse_args(
            [
                "candidates",
            ]
        )

        self.assertEqual(
            arguments.package_name,
            "@propertyos/core-contracts",
        )

        self.assertEqual(
            arguments.package_version,
            "0.1.0",
        )

        self.assertEqual(
            arguments.format,
            "json",
        )




class ContractManifestBarrelResolutionTest(
    unittest.TestCase
):
    def _reference(
        self,
        resolved_path: str,
        symbol: str,
    ) -> ImportReference:
        return ImportReference(
            source_file=(
                "generated/plugin-staging/"
                "example/src/example.ts"
            ),
            line=1,
            column=1,
            syntax="named-import",
            imported_symbols=(symbol,),
            original_specifier=(
                "../../platform"
            ),
            classification=(
                "platform-contract"
            ),
            resolution_status=(
                "resolved-original"
            ),
            resolved_path=resolved_path,
            target_module="platform",
            proposed_specifier=(
                "@propertyos/core-contracts"
            ),
            rewrite_required=True,
            reason="Platform contract.",
        )

    def test_resolves_unique_declaration_below_barrel(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)

            barrel = (
                root
                / "backend"
                / "src"
                / "core"
                / "platform"
                / "index.ts"
            )

            declaration = (
                barrel.parent
                / "dto"
                / "pagination-query.dto.ts"
            )

            declaration.parent.mkdir(
                parents=True
            )

            barrel.write_text(
                (
                    "export * from "
                    "'./dto/pagination-query.dto';\n"
                ),
                encoding="utf-8",
            )

            declaration.write_text(
                (
                    "export class "
                    "PaginationQueryDto {}\n"
                ),
                encoding="utf-8",
            )

            issues = []

            export = ContractManifestGenerator(
                repository_root=root
            )._resolve_export(
                reference=self._reference(
                    resolved_path=(
                        barrel.relative_to(
                            root
                        ).as_posix()
                    ),
                    symbol=(
                        "PaginationQueryDto"
                    ),
                ),
                symbol="PaginationQueryDto",
                package_name=(
                    "@propertyos/core-contracts"
                ),
                issues=issues,
            )

            self.assertEqual([], issues)
            self.assertIsNotNone(export)

            self.assertEqual(
                (
                    declaration.relative_to(
                        root
                    ).as_posix()
                ),
                export.source_path,
            )

            self.assertEqual(
                "class",
                export.export_kind,
            )

    def test_rejects_ambiguous_declarations_below_barrel(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)

            barrel = (
                root
                / "backend"
                / "src"
                / "core"
                / "platform"
                / "index.ts"
            )

            barrel.parent.mkdir(
                parents=True
            )

            barrel.write_text(
                "export * from './one';\n",
                encoding="utf-8",
            )

            for name in ("one.ts", "two.ts"):
                (
                    barrel.parent
                    / name
                ).write_text(
                    (
                        "export class "
                        "DuplicateContract {}\n"
                    ),
                    encoding="utf-8",
                )

            issues = []

            export = ContractManifestGenerator(
                repository_root=root
            )._resolve_export(
                reference=self._reference(
                    resolved_path=(
                        barrel.relative_to(
                            root
                        ).as_posix()
                    ),
                    symbol=(
                        "DuplicateContract"
                    ),
                ),
                symbol="DuplicateContract",
                package_name=(
                    "@propertyos/core-contracts"
                ),
                issues=issues,
            )

            self.assertIsNone(export)
            self.assertEqual(
                1,
                len(issues),
            )
            self.assertEqual(
                "AMBIGUOUS_SYMBOL",
                issues[0].code,
            )

if __name__ == "__main__":
    unittest.main()
