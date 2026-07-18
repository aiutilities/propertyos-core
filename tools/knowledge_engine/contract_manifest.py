from __future__ import annotations

import json
import re

from pathlib import Path
from typing import Dict
from typing import Iterable
from typing import List
from typing import Optional
from typing import Tuple

from .contract_manifest_models import (
    ContractExport,
)
from .contract_manifest_models import (
    ContractManifestIssue,
)
from .contract_manifest_models import (
    ContractManifestPortfolio,
)
from .contract_manifest_models import (
    ContractManifestRequest,
)
from .contract_manifest_models import (
    ContractModule,
)
from .contract_manifest_models import (
    ContractPackage,
)
from .contract_manifest_models import (
    PluginContractManifest,
)
from .import_analysis_models import (
    ImportAnalysisPortfolio,
)
from .import_analysis_models import (
    ImportReference,
)
from .import_analysis_models import (
    PluginImportAnalysis,
)


class ContractManifestError(ValueError):
    pass


_VALUE_PATTERNS = (
    (
        "class",
        re.compile(
            r"\bexport\s+"
            r"(?:declare\s+)?"
            r"(?:abstract\s+)?"
            r"class\s+{symbol}\b"
        ),
    ),
    (
        "enum",
        re.compile(
            r"\bexport\s+"
            r"(?:declare\s+)?"
            r"(?:const\s+)?"
            r"enum\s+{symbol}\b"
        ),
    ),
    (
        "function",
        re.compile(
            r"\bexport\s+"
            r"(?:declare\s+)?"
            r"(?:async\s+)?"
            r"function\s+{symbol}\b"
        ),
    ),
    (
        "value",
        re.compile(
            r"\bexport\s+"
            r"(?:declare\s+)?"
            r"(?:const|let|var)\s+"
            r"{symbol}\b"
        ),
    ),
)

_TYPE_PATTERNS = (
    (
        "interface",
        re.compile(
            r"\bexport\s+"
            r"(?:declare\s+)?"
            r"interface\s+{symbol}\b"
        ),
    ),
    (
        "type",
        re.compile(
            r"\bexport\s+"
            r"type\s+{symbol}\b"
        ),
    ),
)


def _symbol_pattern(
    template: re.Pattern[str],
    symbol: str,
) -> re.Pattern[str]:
    return re.compile(
        template.pattern.format(
            symbol=re.escape(symbol)
        ),
        template.flags,
    )


class ContractManifestGenerator:
    def __init__(
        self,
        repository_root: Path,
    ) -> None:
        self._repository_root = (
            repository_root.resolve()
        )

    def generate(
        self,
        import_analysis: ImportAnalysisPortfolio,
        request: ContractManifestRequest,
    ) -> ContractManifestPortfolio:
        self._validate_request(request)

        analyses = tuple(
            sorted(
                import_analysis.analyses,
                key=lambda item: (
                    item.module_id,
                    item.plugin_id,
                    item.workspace_path,
                ),
            )
        )

        if request.module_id is not None:
            analyses = tuple(
                analysis
                for analysis in analyses
                if analysis.module_id
                == request.module_id
            )

        if (
            request.limit is not None
            and request.limit >= 0
        ):
            analyses = analyses[
                :request.limit
            ]

        manifests = tuple(
            self._generate_manifest(
                analysis=analysis,
                request=request,
            )
            for analysis in analyses
        )

        summary = self._summary(manifests)

        return ContractManifestPortfolio(
            schema_version="1.0.0",
            request=request,
            manifests=manifests,
            summary=summary,
        )

    @staticmethod
    def _validate_request(
        request: ContractManifestRequest,
    ) -> None:
        if request.mode not in (
            "module",
            "candidates",
        ):
            raise ContractManifestError(
                "Unsupported contract manifest "
                f"mode: {request.mode}"
            )

        if (
            request.mode == "module"
            and not request.module_id
        ):
            raise ContractManifestError(
                "module mode requires module_id."
            )

        if (
            request.limit is not None
            and request.limit < 0
        ):
            raise ContractManifestError(
                "limit must be zero or greater."
            )

        if not request.package_name.strip():
            raise ContractManifestError(
                "package_name cannot be empty."
            )

        if not request.package_version.strip():
            raise ContractManifestError(
                "package_version cannot be empty."
            )

    def _generate_manifest(
        self,
        analysis: PluginImportAnalysis,
        request: ContractManifestRequest,
    ) -> PluginContractManifest:
        issues: List[
            ContractManifestIssue
        ] = []

        exports_by_symbol: Dict[
            str,
            ContractExport,
        ] = {}

        references = tuple(
            sorted(
                self._contract_references(
                    analysis=analysis,
                    package_name=(
                        request.package_name
                    ),
                ),
                key=self._reference_key,
            )
        )

        for reference in references:
            for symbol in sorted(
                set(reference.imported_symbols)
            ):
                export = self._resolve_export(
                    reference=reference,
                    symbol=symbol,
                    package_name=(
                        request.package_name
                    ),
                    issues=issues,
                )

                if export is None:
                    continue

                existing = exports_by_symbol.get(
                    symbol
                )

                if existing is None:
                    exports_by_symbol[
                        symbol
                    ] = export
                    continue

                if existing == export:
                    continue

                issues.append(
                    ContractManifestIssue(
                        code="DUPLICATE_SYMBOL",
                        message=(
                            "Public contract symbol "
                            f"{symbol} resolves to "
                            "multiple declarations."
                        ),
                        module_id=(
                            reference.target_module
                        ),
                        symbol=symbol,
                        source_path=(
                            export.source_path
                        ),
                    )
                )

        modules_by_id: Dict[
            str,
            List[ContractExport],
        ] = {}

        for export in exports_by_symbol.values():
            modules_by_id.setdefault(
                export.target_module,
                [],
            ).append(export)

        modules = tuple(
            ContractModule(
                module_id=module_id,
                exports=tuple(
                    sorted(
                        exports,
                        key=lambda item: (
                            item.symbol,
                            item.source_path,
                            item.export_kind,
                        ),
                    )
                ),
            )
            for module_id, exports
            in sorted(
                modules_by_id.items(),
                key=lambda item: item[0],
            )
        )

        packages: Tuple[
            ContractPackage,
            ...,
        ]

        if modules:
            packages = (
                ContractPackage(
                    package_name=(
                        request.package_name
                    ),
                    version=(
                        request.package_version
                    ),
                    modules=modules,
                ),
            )
        else:
            packages = ()

        ordered_issues = tuple(
            sorted(
                issues,
                key=lambda issue: (
                    issue.code,
                    issue.module_id,
                    issue.symbol,
                    issue.source_path,
                    issue.message,
                ),
            )
        )

        return PluginContractManifest(
            module_id=analysis.module_id,
            plugin_id=analysis.plugin_id,
            workspace_path=(
                analysis.workspace_path
            ),
            packages=packages,
            issues=ordered_issues,
            valid=not ordered_issues,
        )

    def _contract_references(
        self,
        analysis: PluginImportAnalysis,
        package_name: str,
    ) -> Iterable[ImportReference]:
        module_roots = (
            self._contract_module_roots(
                analysis=analysis,
                package_name=package_name,
            )
        )

        for file in analysis.files:
            for reference in file.imports:
                if (
                    reference.classification
                    == "platform-contract"
                ):
                    yield reference
                    continue

                if not (
                    reference.classification
                    == "propertyos-package"
                    and reference.original_specifier
                    == package_name
                ):
                    continue

                for symbol in sorted(
                    set(
                        reference.imported_symbols
                    )
                ):
                    recovered = (
                        self._recover_package_symbol(
                            reference=reference,
                            symbol=symbol,
                            package_name=(
                                package_name
                            ),
                            module_roots=(
                                module_roots
                            ),
                        )
                    )

                    if recovered:
                        yield from recovered
                    else:
                        yield ImportReference(
                            source_file=(
                                reference.source_file
                            ),
                            line=reference.line,
                            column=(
                                reference.column
                            ),
                            syntax=(
                                reference.syntax
                            ),
                            imported_symbols=(
                                (symbol,)
                            ),
                            original_specifier=(
                                package_name
                            ),
                            classification=(
                                "platform-contract"
                            ),
                            resolution_status=(
                                "unresolved"
                            ),
                            resolved_path="",
                            target_module="",
                            proposed_specifier=(
                                package_name
                            ),
                            rewrite_required=False,
                            reason=(
                                "Rewritten platform "
                                "contract symbol could "
                                "not be recovered from "
                                "the extraction report."
                            ),
                        )

    def _contract_module_roots(
        self,
        analysis: PluginImportAnalysis,
        package_name: str,
    ) -> Tuple[
        Tuple[str, str],
        ...,
    ]:
        report_path = (
            self._repository_root
            / analysis.workspace_path
            / "extraction-report.json"
        ).resolve()

        try:
            report_path.relative_to(
                self._repository_root
            )
        except ValueError:
            return ()

        if not report_path.is_file():
            return ()

        try:
            report = json.loads(
                report_path.read_text(
                    encoding="utf-8"
                )
            )
        except (
            json.JSONDecodeError,
            UnicodeDecodeError,
        ):
            return ()

        roots = set()

        for contract in report.get(
            "contracts",
            [],
        ):
            if (
                contract.get(
                    "targetPackage"
                )
                != package_name
            ):
                continue

            if (
                contract.get("type")
                != "platform-contract"
            ):
                continue

            module_id = str(
                contract.get(
                    "sourceModule",
                    "",
                )
            ).strip()

            module_root = str(
                contract.get(
                    "moduleRoot",
                    "",
                )
            ).strip()

            if module_id and module_root:
                roots.add(
                    (
                        module_id,
                        module_root,
                    )
                )

        return tuple(sorted(roots))

    def _recover_package_symbol(
        self,
        reference: ImportReference,
        symbol: str,
        package_name: str,
        module_roots: Tuple[
            Tuple[str, str],
            ...,
        ],
    ) -> Tuple[
        ImportReference,
        ...,
    ]:
        matches = []

        for module_id, module_root in (
            module_roots
        ):
            root = self._absolute_path(
                module_root
            )

            try:
                root.relative_to(
                    self._repository_root
                )
            except ValueError:
                continue

            if not root.is_dir():
                continue

            for source_file in sorted(
                root.rglob("*.ts")
            ):
                try:
                    content = (
                        source_file.read_text(
                            encoding="utf-8"
                        )
                    )
                except UnicodeDecodeError:
                    continue

                if (
                    self._export_kind(
                        content=content,
                        symbol=symbol,
                    )
                    is None
                ):
                    continue

                matches.append(
                    (
                        module_id,
                        self._display_path(
                            source_file
                        ),
                    )
                )

        return tuple(
            ImportReference(
                source_file=(
                    reference.source_file
                ),
                line=reference.line,
                column=reference.column,
                syntax=reference.syntax,
                imported_symbols=(
                    (symbol,)
                ),
                original_specifier=(
                    package_name
                ),
                classification=(
                    "platform-contract"
                ),
                resolution_status=(
                    "resolved-package"
                ),
                resolved_path=(
                    source_path
                ),
                target_module=module_id,
                proposed_specifier=(
                    package_name
                ),
                rewrite_required=False,
                reason=(
                    "Rewritten platform contract "
                    "symbol was recovered from "
                    "extraction provenance."
                ),
            )
            for module_id, source_path
            in sorted(set(matches))
        )

    @staticmethod
    def _reference_key(
        reference: ImportReference,
    ) -> Tuple[
        str,
        int,
        int,
        str,
        str,
        Tuple[str, ...],
    ]:
        return (
            reference.source_file,
            reference.line,
            reference.column,
            reference.target_module,
            reference.resolved_path,
            reference.imported_symbols,
        )

    def _resolve_export(
        self,
        reference: ImportReference,
        symbol: str,
        package_name: str,
        issues: List[
            ContractManifestIssue
        ],
    ) -> Optional[ContractExport]:
        if not symbol.strip():
            return None

        if not reference.target_module:
            issues.append(
                ContractManifestIssue(
                    code="UNRESOLVED_SYMBOL",
                    message=(
                        "Platform contract symbol "
                        f"{symbol} has no target "
                        "module."
                    ),
                    symbol=symbol,
                )
            )
            return None

        if not reference.resolved_path:
            issues.append(
                ContractManifestIssue(
                    code="UNRESOLVED_SYMBOL",
                    message=(
                        "Platform contract symbol "
                        f"{symbol} has no resolved "
                        "source path."
                    ),
                    module_id=(
                        reference.target_module
                    ),
                    symbol=symbol,
                )
            )
            return None

        source_file = self._absolute_path(
            reference.resolved_path
        )

        source_path = self._display_path(
            source_file
        )

        if not source_file.is_file():
            issues.append(
                ContractManifestIssue(
                    code="UNRESOLVED_SYMBOL",
                    message=(
                        "Resolved source file does "
                        f"not exist for {symbol}."
                    ),
                    module_id=(
                        reference.target_module
                    ),
                    symbol=symbol,
                    source_path=source_path,
                )
            )
            return None

        try:
            content = source_file.read_text(
                encoding="utf-8"
            )
        except UnicodeDecodeError:
            issues.append(
                ContractManifestIssue(
                    code="UNRESOLVED_SYMBOL",
                    message=(
                        "Resolved source file is not "
                        f"valid UTF-8 for {symbol}."
                    ),
                    module_id=(
                        reference.target_module
                    ),
                    symbol=symbol,
                    source_path=source_path,
                )
            )
            return None

        export_kind = self._export_kind(
            content=content,
            symbol=symbol,
        )

        if export_kind is None:
            declarations = (
                self._declarations_below(
                    source_file=source_file,
                    symbol=symbol,
                )
            )

            if len(declarations) == 1:
                (
                    source_file,
                    export_kind,
                ) = declarations[0]

                source_path = (
                    self._display_path(
                        source_file
                    )
                )

            elif len(declarations) > 1:
                issues.append(
                    ContractManifestIssue(
                        code=(
                            "AMBIGUOUS_SYMBOL"
                        ),
                        message=(
                            "Multiple exported "
                            "TypeScript declarations "
                            f"were found below the "
                            f"resolved barrel for "
                            f"{symbol}."
                        ),
                        module_id=(
                            reference.target_module
                        ),
                        symbol=symbol,
                        source_path=source_path,
                    )
                )
                return None

            else:
                issues.append(
                    ContractManifestIssue(
                        code="UNRESOLVED_SYMBOL",
                        message=(
                            "No exported TypeScript "
                            "declaration was found for "
                            f"{symbol}."
                        ),
                        module_id=(
                            reference.target_module
                        ),
                        symbol=symbol,
                        source_path=source_path,
                    )
                )
                return None

        return ContractExport(
            symbol=symbol,
            source_path=source_path,
            export_kind=export_kind,
            target_module=(
                reference.target_module
            ),
            package_name=package_name,
        )

    def _declarations_below(
        self,
        source_file: Path,
        symbol: str,
    ) -> Tuple[
        Tuple[Path, str],
        ...,
    ]:
        """
        Resolve a symbol imported through a
        TypeScript barrel.

        The backend already typechecks, so a symbol
        imported from a barrel must be publicly
        reachable. This search locates its unique
        exported declaration below the barrel's
        directory without encoding module-specific
        paths in the contract generator.
        """

        matches = []

        for candidate in sorted(
            source_file.parent.rglob("*.ts")
        ):
            if candidate == source_file:
                continue

            try:
                content = candidate.read_text(
                    encoding="utf-8"
                )
            except (
                OSError,
                UnicodeDecodeError,
            ):
                continue

            export_kind = self._export_kind(
                content=content,
                symbol=symbol,
            )

            if export_kind is None:
                continue

            matches.append(
                (
                    candidate.resolve(),
                    export_kind,
                )
            )

        return tuple(matches)

    @staticmethod
    def _export_kind(
        content: str,
        symbol: str,
    ) -> Optional[str]:
        matches: List[str] = []

        for export_kind, template in (
            _TYPE_PATTERNS
        ):
            if _symbol_pattern(
                template,
                symbol,
            ).search(content):
                matches.append(export_kind)

        for export_kind, template in (
            _VALUE_PATTERNS
        ):
            if _symbol_pattern(
                template,
                symbol,
            ).search(content):
                matches.append(export_kind)

        if not matches:
            return None

        return sorted(matches)[0]

    def _absolute_path(
        self,
        value: str,
    ) -> Path:
        path = Path(value)

        if not path.is_absolute():
            path = (
                self._repository_root
                / path
            )

        return path.resolve()

    def _display_path(
        self,
        path: Path,
    ) -> str:
        try:
            return path.relative_to(
                self._repository_root
            ).as_posix()
        except ValueError:
            return path.as_posix()

    @staticmethod
    def _summary(
        manifests: Tuple[
            PluginContractManifest,
            ...,
        ],
    ) -> dict[str, int]:
        valid_count = sum(
            manifest.valid
            for manifest in manifests
        )

        return {
            "manifestCount": len(manifests),
            "validManifestCount": valid_count,
            "invalidManifestCount": (
                len(manifests) - valid_count
            ),
            "packageCount": sum(
                manifest.package_count
                for manifest in manifests
            ),
            "moduleCount": sum(
                manifest.module_count
                for manifest in manifests
            ),
            "symbolCount": sum(
                manifest.symbol_count
                for manifest in manifests
            ),
            "issueCount": sum(
                len(manifest.issues)
                for manifest in manifests
            ),
            "unresolvedSymbolCount": sum(
                manifest.unresolved_symbol_count
                for manifest in manifests
            ),
            "duplicateSymbolCount": sum(
                manifest.duplicate_symbol_count
                for manifest in manifests
            ),
        }
