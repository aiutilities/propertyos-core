from __future__ import annotations

from dataclasses import replace
from pathlib import Path
from typing import Iterable, Tuple

from .import_analysis_models import (
    ImportAnalysisRequest,
    ImportReference,
)
from .import_analyzer import (
    IMPORT_PATTERN,
    StagedImportAnalyzer,
    _line_column,
)
from .import_rewrite_models import (
    FileImportRewrite,
    ImportRewriteChange,
    ImportRewritePortfolio,
    ImportRewriteRequest,
    PluginImportRewrite,
)
from .repository_api import Repository


class ImportRewriteError(ValueError):
    pass


_SPECIFIER_GROUPS = (
    "specifier",
    "side_effect",
    "export_specifier",
    "require_specifier",
)


class StagedImportRewriter:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        repository: Repository,
        repository_root: Path,
        staging_root: Path,
    ) -> None:
        self.repository = repository
        self.repository_root = (
            repository_root.resolve()
        )

        self.analyzer = StagedImportAnalyzer(
            repository=repository,
            repository_root=(
                self.repository_root
            ),
            staging_root=staging_root,
        )

    def rewrite(
        self,
        request: ImportRewriteRequest,
    ) -> ImportRewritePortfolio:
        analysis_request = (
            ImportAnalysisRequest(
                mode=request.mode,
                module_id=request.module_id,
                limit=request.limit,
            )
        )

        before = self.analyzer.analyze(
            analysis_request
        )

        self._validate_analysis(before)

        plugin_results = []

        for analysis in before.analyses:
            workspace = (
                self.repository_root
                / analysis.workspace_path
            ).resolve()

            try:
                workspace.relative_to(
                    self.analyzer.staging_root
                )
            except ValueError as error:
                raise ImportRewriteError(
                    "Plugin workspace escaped the "
                    "configured staging root."
                ) from error

            file_results = []

            for file_analysis in analysis.files:
                references = tuple(
                    reference
                    for reference
                    in file_analysis.imports
                    if reference.rewrite_required
                )

                if not references:
                    continue

                file_path = (
                    workspace
                    / file_analysis.staged_path
                ).resolve()

                try:
                    file_path.relative_to(
                        workspace
                    )
                except ValueError as error:
                    raise ImportRewriteError(
                        "Staged source file escaped "
                        "its plugin workspace."
                    ) from error

                if not file_path.is_file():
                    raise ImportRewriteError(
                        "Staged source file no longer "
                        f"exists: {file_path}"
                    )

                original_bytes = (
                    file_path.read_bytes()
                )

                try:
                    original_text = (
                        original_bytes.decode(
                            "utf-8"
                        )
                    )
                except UnicodeDecodeError as error:
                    raise ImportRewriteError(
                        "Staged TypeScript source is "
                        "not valid UTF-8: "
                        f"{file_path}"
                    ) from error

                rewritten_text, changes = (
                    self._rewrite_text(
                        text=original_text,
                        references=references,
                        apply=request.apply,
                    )
                )

                changed = (
                    rewritten_text
                    != original_text
                )

                if (
                    request.apply
                    and changed
                ):
                    file_path.write_bytes(
                        rewritten_text.encode(
                            "utf-8"
                        )
                    )

                file_results.append(
                    FileImportRewrite(
                        staged_path=(
                            file_analysis
                            .staged_path
                        ),
                        planned_rewrite_count=(
                            len(references)
                        ),
                        applied_rewrite_count=(
                            len(changes)
                            if request.apply
                            else 0
                        ),
                        changed=(
                            changed
                            if request.apply
                            else False
                        ),
                        changes=changes,
                    )
                )

            plugin_results.append(
                self._plugin_result(
                    analysis=analysis,
                    files=tuple(
                        file_results
                    ),
                    apply=request.apply,
                )
            )

        if request.apply:
            after = self.analyzer.analyze(
                analysis_request
            )

            after_by_module = {
                analysis.module_id: analysis
                for analysis
                in after.analyses
            }

            plugin_results = [
                replace(
                    result,
                    remaining_rewrite_count=(
                        after_by_module[
                            result.module_id
                        ].rewrite_count
                    ),
                    unresolved_count=(
                        after_by_module[
                            result.module_id
                        ].unresolved_count
                    ),
                    valid=(
                        after_by_module[
                            result.module_id
                        ].rewrite_count
                        == 0
                        and after_by_module[
                            result.module_id
                        ].unresolved_count
                        == 0
                    ),
                )
                for result
                in plugin_results
            ]

        analyses = tuple(
            plugin_results
        )

        summary = {
            "pluginCount": len(
                analyses
            ),
            "sourceFileCount": sum(
                analysis.source_file_count
                for analysis in analyses
            ),
            "plannedRewriteCount": sum(
                analysis
                .planned_rewrite_count
                for analysis in analyses
            ),
            "appliedRewriteCount": sum(
                analysis
                .applied_rewrite_count
                for analysis in analyses
            ),
            "modifiedFileCount": sum(
                analysis
                .modified_file_count
                for analysis in analyses
            ),
            "remainingRewriteCount": sum(
                analysis
                .remaining_rewrite_count
                for analysis in analyses
            ),
            "unresolvedCount": sum(
                analysis.unresolved_count
                for analysis in analyses
            ),
            "validPluginCount": sum(
                1
                for analysis in analyses
                if analysis.valid
            ),
            "invalidPluginCount": sum(
                1
                for analysis in analyses
                if not analysis.valid
            ),
            "applied": request.apply,
        }

        return ImportRewritePortfolio(
            schema_version=(
                self.SCHEMA_VERSION
            ),
            request=request,
            analyses=analyses,
            summary=summary,
        )

    def _validate_analysis(
        self,
        portfolio,
    ) -> None:
        if portfolio.summary[
            "unresolvedCount"
        ]:
            raise ImportRewriteError(
                "Import rewriting requires an "
                "analysis with zero unresolved "
                "imports."
            )

        same_module_contracts = [
            reference
            for analysis
            in portfolio.analyses
            for file_analysis
            in analysis.files
            for reference
            in file_analysis.imports
            if (
                reference.rewrite_required
                and reference.classification
                == "plugin-contract"
                and reference.target_module
                == analysis.module_id
            )
        ]

        if same_module_contracts:
            raise ImportRewriteError(
                "The staged workspace is not "
                "dependency-closed. "
                f"{len(same_module_contracts)} "
                "same-module import(s) would be "
                "rewritten as plugin contracts. "
                "Run dependency closure with "
                "--apply before rewriting."
            )

        invalid_rewrites = [
            reference
            for analysis
            in portfolio.analyses
            for file_analysis
            in analysis.files
            for reference
            in file_analysis.imports
            if (
                reference.rewrite_required
                and (
                    not reference
                    .proposed_specifier
                    or reference
                    .proposed_specifier
                    == reference
                    .original_specifier
                )
            )
        ]

        if invalid_rewrites:
            raise ImportRewriteError(
                "Import analysis contains "
                f"{len(invalid_rewrites)} invalid "
                "rewrite plan(s)."
            )

    def _plugin_result(
        self,
        analysis,
        files: Tuple[
            FileImportRewrite,
            ...,
        ],
        apply: bool,
    ) -> PluginImportRewrite:
        planned = sum(
            file.planned_rewrite_count
            for file in files
        )

        applied = sum(
            file.applied_rewrite_count
            for file in files
        )

        modified = sum(
            1
            for file in files
            if file.changed
        )

        warnings = []

        if planned and not apply:
            warnings.append(
                f"{analysis.module_id} has "
                f"{planned} planned import "
                "rewrite(s)."
            )

        return PluginImportRewrite(
            module_id=analysis.module_id,
            plugin_id=analysis.plugin_id,
            workspace_path=(
                analysis.workspace_path
            ),
            source_file_count=(
                analysis.source_file_count
            ),
            planned_rewrite_count=planned,
            applied_rewrite_count=applied,
            modified_file_count=modified,
            unresolved_count=(
                analysis.unresolved_count
            ),
            remaining_rewrite_count=(
                0
                if not apply
                else planned
            ),
            files=files,
            warnings=tuple(warnings),
            valid=(
                analysis.unresolved_count
                == 0
            ),
        )

    @classmethod
    def _rewrite_text(
        cls,
        text: str,
        references: Iterable[
            ImportReference
        ],
        apply: bool,
    ) -> tuple[
        str,
        Tuple[
            ImportRewriteChange,
            ...,
        ],
    ]:
        matches = {}

        for match in (
            IMPORT_PATTERN.finditer(text)
        ):
            line, column = _line_column(
                text,
                match.start(),
            )

            group = cls._specifier_group(
                match
            )

            specifier = match.group(
                group
            )

            key = (
                line,
                column,
                specifier,
            )

            if key in matches:
                raise ImportRewriteError(
                    "Duplicate import match at "
                    f"line {line}, column "
                    f"{column}: {specifier}"
                )

            matches[key] = (
                match.span(group)
            )

        replacements = []
        changes = []

        for reference in references:
            key = (
                reference.line,
                reference.column,
                reference.original_specifier,
            )

            span = matches.get(key)

            if span is None:
                raise ImportRewriteError(
                    "Stale import rewrite plan for "
                    f"{reference.source_file}:"
                    f"{reference.line}:"
                    f"{reference.column}. Expected "
                    f"specifier "
                    f"'{reference.original_specifier}'."
                )

            start, end = span

            actual = text[start:end]

            if (
                actual
                != reference
                .original_specifier
            ):
                raise ImportRewriteError(
                    "Import source changed after "
                    "analysis for "
                    f"{reference.source_file}:"
                    f"{reference.line}."
                )

            replacements.append(
                (
                    start,
                    end,
                    reference
                    .proposed_specifier,
                )
            )

            changes.append(
                ImportRewriteChange(
                    source_file=(
                        reference.source_file
                    ),
                    line=reference.line,
                    column=reference.column,
                    syntax=reference.syntax,
                    original_specifier=(
                        reference
                        .original_specifier
                    ),
                    proposed_specifier=(
                        reference
                        .proposed_specifier
                    ),
                    target_module=(
                        reference.target_module
                    ),
                    applied=apply,
                )
            )

        rewritten = text

        if apply:
            for (
                start,
                end,
                proposed,
            ) in sorted(
                replacements,
                key=lambda item: item[0],
                reverse=True,
            ):
                rewritten = (
                    rewritten[:start]
                    + proposed
                    + rewritten[end:]
                )

        return (
            rewritten,
            tuple(changes),
        )

    @staticmethod
    def _specifier_group(
        match,
    ) -> str:
        groups = [
            group
            for group
            in _SPECIFIER_GROUPS
            if match.group(group)
            is not None
        ]

        if len(groups) != 1:
            raise ImportRewriteError(
                "Could not identify exactly one "
                "module specifier in an import "
                "statement."
            )

        return groups[0]
