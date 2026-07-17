from __future__ import annotations

import json
import re
from pathlib import Path, PurePosixPath
from typing import Iterable, Optional, Tuple

from .import_analysis_models import (
    FileImportAnalysis,
    ImportAnalysisPortfolio,
    ImportAnalysisRequest,
    ImportReference,
    PluginImportAnalysis,
)
from .repository_api import Repository


class ImportAnalysisError(ValueError):
    pass


IMPORT_PATTERN = re.compile(
    r"""
    (?P<statement>
        import
        \s+
        (?P<body>[\s\S]*?)
        \s+
        from
        \s*
        ['"]
        (?P<specifier>[^'"]+)
        ['"]
        \s*;?
        |
        import
        \s*
        ['"]
        (?P<side_effect>[^'"]+)
        ['"]
        \s*;?
        |
        export
        \s+
        (?P<export_body>[\s\S]*?)
        \s+
        from
        \s*
        ['"]
        (?P<export_specifier>[^'"]+)
        ['"]
        \s*;?
        |
        require
        \s*
        \(
        \s*
        ['"]
        (?P<require_specifier>[^'"]+)
        ['"]
        \s*
        \)
    )
    """,
    re.VERBOSE,
)


NODE_BUILTINS = {
    "assert",
    "buffer",
    "child_process",
    "crypto",
    "events",
    "fs",
    "http",
    "https",
    "module",
    "os",
    "path",
    "stream",
    "url",
    "util",
    "worker_threads",
    "zlib",
}


def _unique_sorted(
    values: Iterable[str],
) -> Tuple[str, ...]:
    return tuple(sorted(set(values)))


def _line_column(
    text: str,
    position: int,
) -> Tuple[int, int]:
    before = text[:position]

    line = before.count("\n") + 1

    last_newline = before.rfind("\n")

    if last_newline < 0:
        column = position + 1
    else:
        column = (
            position - last_newline
        )

    return line, column


def _extract_symbols(
    statement: str,
) -> Tuple[str, ...]:
    statement = statement.strip()

    if statement.startswith(
        "require"
    ):
        return ()

    if statement.startswith(
        "import '"
    ) or statement.startswith(
        'import "'
    ):
        return ()

    if statement.startswith("export"):
        body = statement[
            len("export"):
        ].split(" from ", 1)[0]
    else:
        body = statement[
            len("import"):
        ].split(" from ", 1)[0]

    symbols = []

    default_match = re.match(
        r"\s*([A-Za-z_$][\w$]*)",
        body,
    )

    if (
        default_match
        and not body.strip().startswith(
            ("{", "*")
        )
    ):
        symbols.append(
            default_match.group(1)
        )

    namespace_match = re.search(
        r"\*\s+as\s+"
        r"([A-Za-z_$][\w$]*)",
        body,
    )

    if namespace_match:
        symbols.append(
            namespace_match.group(1)
        )

    named_match = re.search(
        r"\{([\s\S]*?)\}",
        body,
    )

    if named_match:
        for item in (
            named_match.group(1)
            .split(",")
        ):
            item = item.strip()

            if not item:
                continue

            if " as " in item:
                item = item.split(
                    " as ",
                    1,
                )[1].strip()

            symbols.append(item)

    return _unique_sorted(symbols)


class StagedImportAnalyzer:
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

        if staging_root.is_absolute():
            resolved = (
                staging_root.resolve()
            )
        else:
            resolved = (
                self.repository_root
                / staging_root
            ).resolve()

        try:
            resolved.relative_to(
                self.repository_root
            )
        except ValueError as error:
            raise ImportAnalysisError(
                "Staging root must remain inside "
                "the repository."
            ) from error

        self.staging_root = resolved

    def analyze(
        self,
        request: ImportAnalysisRequest,
    ) -> ImportAnalysisPortfolio:
        if (
            request.limit is not None
            and request.limit <= 0
        ):
            raise ImportAnalysisError(
                "Import analysis limit must be "
                "greater than zero."
            )

        module_ids = self._module_ids(
            request
        )

        analyses = tuple(
            self._analyze_plugin(
                module_id
            )
            for module_id in module_ids
        )

        return ImportAnalysisPortfolio(
            schema_version=(
                self.SCHEMA_VERSION
            ),
            request=request,
            analyses=analyses,
            summary={
                "pluginCount": len(
                    analyses
                ),
                "sourceFileCount": sum(
                    analysis.source_file_count
                    for analysis in analyses
                ),
                "importCount": sum(
                    analysis.import_count
                    for analysis in analyses
                ),
                "rewriteCount": sum(
                    analysis.rewrite_count
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
            },
        )

    def _module_ids(
        self,
        request: ImportAnalysisRequest,
    ) -> Tuple[str, ...]:
        mode = request.mode.strip().lower()

        if mode == "module":
            if not request.module_id:
                raise ImportAnalysisError(
                    "Module import analysis "
                    "requires a module ID."
                )

            self.repository.module(
                request.module_id
            )

            return (
                request.module_id,
            )

        if mode == "candidates":
            candidates = tuple(
                module.id
                for module
                in self.repository
                .plugin_candidates()
            )

            if request.limit is not None:
                candidates = candidates[
                    :request.limit
                ]

            return candidates

        raise ImportAnalysisError(
            "Unsupported import analysis mode: "
            f"{request.mode}"
        )

    def _analyze_plugin(
        self,
        module_id: str,
    ) -> PluginImportAnalysis:
        module = self.repository.module(
            module_id
        )

        plugin_id = (
            module_id.lower()
            .replace(":", "-")
        )

        workspace = (
            self.staging_root
            / plugin_id
        ).resolve()

        try:
            workspace.relative_to(
                self.staging_root
            )
        except ValueError as error:
            raise ImportAnalysisError(
                "Plugin workspace escaped the "
                "staging root."
            ) from error

        if not workspace.is_dir():
            raise ImportAnalysisError(
                "Staged workspace does not exist: "
                f"{workspace.relative_to(self.repository_root)}"
            )

        source_root = workspace / "src"

        if not source_root.is_dir():
            raise ImportAnalysisError(
                "Staged workspace has no src "
                f"directory: {plugin_id}"
            )

        files = tuple(
            self._analyze_file(
                module_id=module_id,
                plugin_id=plugin_id,
                workspace=workspace,
                path=path,
            )
            for path in sorted(
                source_root.rglob("*.ts")
            )
        )

        unresolved_count = sum(
            file.unresolved_count
            for file in files
        )

        rewrite_count = sum(
            file.rewrite_count
            for file in files
        )

        warnings = []

        if unresolved_count:
            warnings.append(
                f"{module_id} contains "
                f"{unresolved_count} unresolved "
                "staged import(s)."
            )

        if rewrite_count:
            warnings.append(
                f"{module_id} requires "
                f"{rewrite_count} import "
                "rewrite(s) before promotion."
            )

        return PluginImportAnalysis(
            module_id=module_id,
            plugin_id=plugin_id,
            workspace_path=(
                workspace.relative_to(
                    self.repository_root
                ).as_posix()
            ),
            source_file_count=len(files),
            import_count=sum(
                file.import_count
                for file in files
            ),
            rewrite_count=rewrite_count,
            unresolved_count=(
                unresolved_count
            ),
            files=files,
            warnings=tuple(
                sorted(warnings)
            ),
            valid=(
                unresolved_count == 0
            ),
        )

    def _analyze_file(
        self,
        module_id: str,
        plugin_id: str,
        workspace: Path,
        path: Path,
    ) -> FileImportAnalysis:
        text = path.read_text(
            encoding="utf-8"
        )

        references = []

        for match in (
            IMPORT_PATTERN.finditer(text)
        ):
            statement = (
                match.group("statement")
            )

            specifier = (
                match.group("specifier")
                or match.group(
                    "side_effect"
                )
                or match.group(
                    "export_specifier"
                )
                or match.group(
                    "require_specifier"
                )
            )

            line, column = _line_column(
                text,
                match.start(),
            )

            references.append(
                self._classify_import(
                    module_id=module_id,
                    plugin_id=plugin_id,
                    workspace=workspace,
                    source_file=path,
                    line=line,
                    column=column,
                    statement=statement,
                    specifier=specifier,
                )
            )

        references = tuple(
            sorted(
                references,
                key=lambda item: (
                    item.line,
                    item.column,
                    item.original_specifier,
                ),
            )
        )

        return FileImportAnalysis(
            staged_path=(
                path.relative_to(
                    workspace
                ).as_posix()
            ),
            import_count=len(
                references
            ),
            rewrite_count=sum(
                1
                for reference
                in references
                if reference
                .rewrite_required
            ),
            unresolved_count=sum(
                1
                for reference
                in references
                if reference
                .resolution_status
                == "unresolved"
            ),
            imports=references,
        )

    def _classify_import(
        self,
        module_id: str,
        plugin_id: str,
        workspace: Path,
        source_file: Path,
        line: int,
        column: int,
        statement: str,
        specifier: str,
    ) -> ImportReference:
        syntax = self._syntax(
            statement
        )

        symbols = _extract_symbols(
            statement
        )

        if specifier.startswith("."):
            return self._relative_import(
                module_id=module_id,
                plugin_id=plugin_id,
                workspace=workspace,
                source_file=source_file,
                line=line,
                column=column,
                syntax=syntax,
                symbols=symbols,
                specifier=specifier,
            )

        if (
            specifier.startswith(
                "@propertyos/"
            )
        ):
            return ImportReference(
                source_file=(
                    source_file
                    .relative_to(workspace)
                    .as_posix()
                ),
                line=line,
                column=column,
                syntax=syntax,
                imported_symbols=symbols,
                original_specifier=specifier,
                classification=(
                    "propertyos-package"
                ),
                resolution_status=(
                    "package"
                ),
                resolved_path="",
                target_module="",
                proposed_specifier=(
                    specifier
                ),
                rewrite_required=False,
                reason=(
                    "Existing PropertyOS package "
                    "import can remain unchanged."
                ),
            )

        package_root = (
            specifier.split("/", 1)[0]
            if not specifier.startswith("@")
            else "/".join(
                specifier.split("/")[:2]
            )
        )

        classification = (
            "node-builtin"
            if package_root
            in NODE_BUILTINS
            or package_root.startswith(
                "node:"
            )
            else "external-package"
        )

        return ImportReference(
            source_file=(
                source_file
                .relative_to(workspace)
                .as_posix()
            ),
            line=line,
            column=column,
            syntax=syntax,
            imported_symbols=symbols,
            original_specifier=specifier,
            classification=classification,
            resolution_status="package",
            resolved_path="",
            target_module="",
            proposed_specifier=specifier,
            rewrite_required=False,
            reason=(
                "External package import can "
                "remain unchanged."
            ),
        )

    def _relative_import(
        self,
        module_id: str,
        plugin_id: str,
        workspace: Path,
        source_file: Path,
        line: int,
        column: int,
        syntax: str,
        symbols: Tuple[str, ...],
        specifier: str,
    ) -> ImportReference:
        source_relative = (
            source_file.relative_to(
                workspace
            ).as_posix()
        )

        candidate = (
            source_file.parent
            / specifier
        ).resolve()

        staged_resolution = (
            self._resolve_typescript(
                candidate
            )
        )

        if (
            staged_resolution is not None
            and self._inside(
                staged_resolution,
                workspace,
            )
        ):
            return ImportReference(
                source_file=source_relative,
                line=line,
                column=column,
                syntax=syntax,
                imported_symbols=symbols,
                original_specifier=specifier,
                classification=(
                    "staged-internal"
                ),
                resolution_status=(
                    "resolved"
                ),
                resolved_path=(
                    staged_resolution
                    .relative_to(workspace)
                    .as_posix()
                ),
                target_module=module_id,
                proposed_specifier=(
                    specifier
                ),
                rewrite_required=False,
                reason=(
                    "Relative import resolves "
                    "inside the staged plugin."
                ),
            )

        original_source = (
            self._original_source_for(
                workspace=workspace,
                staged_file=source_file,
            )
        )

        repository_resolution = None

        if original_source is not None:
            repository_candidate = (
                original_source.parent
                / specifier
            ).resolve()

            repository_resolution = (
                self._resolve_typescript(
                    repository_candidate
                )
            )

        if repository_resolution is None:
            return ImportReference(
                source_file=source_relative,
                line=line,
                column=column,
                syntax=syntax,
                imported_symbols=symbols,
                original_specifier=specifier,
                classification=(
                    "unresolved-relative"
                ),
                resolution_status=(
                    "unresolved"
                ),
                resolved_path="",
                target_module="",
                proposed_specifier="",
                rewrite_required=True,
                reason=(
                    "Relative import resolves "
                    "neither in staging nor in "
                    "the original repository."
                ),
            )

        target_module = (
            self._module_for_path(
                repository_resolution
            )
        )

        if target_module is None:
            return ImportReference(
                source_file=source_relative,
                line=line,
                column=column,
                syntax=syntax,
                imported_symbols=symbols,
                original_specifier=specifier,
                classification=(
                    "repository-internal"
                ),
                resolution_status=(
                    "resolved-original"
                ),
                resolved_path=(
                    repository_resolution
                    .relative_to(
                        self.repository_root
                    )
                    .as_posix()
                ),
                target_module="",
                proposed_specifier="",
                rewrite_required=True,
                reason=(
                    "Import resolves in the "
                    "repository but has no known "
                    "module owner."
                ),
            )

        target = self.repository.module(
            target_module
        )

        if target_module == module_id:
            proposed = (
                self._relative_to_staged_target(
                    plugin_id=plugin_id,
                    workspace=workspace,
                    source_file=source_file,
                    repository_target=(
                        repository_resolution
                    ),
                    module_id=module_id,
                )
            )

            if proposed:
                return ImportReference(
                    source_file=(
                        source_relative
                    ),
                    line=line,
                    column=column,
                    syntax=syntax,
                    imported_symbols=symbols,
                    original_specifier=(
                        specifier
                    ),
                    classification=(
                        "staged-path-rewrite"
                    ),
                    resolution_status=(
                        "resolved-original"
                    ),
                    resolved_path=(
                        repository_resolution
                        .relative_to(
                            self.repository_root
                        )
                        .as_posix()
                    ),
                    target_module=(
                        target_module
                    ),
                    proposed_specifier=(
                        proposed
                    ),
                    rewrite_required=True,
                    reason=(
                        "Module-owned source exists "
                        "in staging at a different "
                        "relative location."
                    ),
                )

        if target.architectural_role in {
            "platform",
            "database",
        }:
            proposed = (
                "@propertyos/core-contracts"
            )

            classification = (
                "platform-contract"
            )
        else:
            target_plugin = (
                target_module.lower()
                .replace(":", "-")
            )

            proposed = (
                "@propertyos/plugin-"
                f"{target_plugin}"
            )

            classification = (
                "plugin-contract"
            )

        return ImportReference(
            source_file=source_relative,
            line=line,
            column=column,
            syntax=syntax,
            imported_symbols=symbols,
            original_specifier=specifier,
            classification=classification,
            resolution_status=(
                "resolved-original"
            ),
            resolved_path=(
                repository_resolution
                .relative_to(
                    self.repository_root
                )
                .as_posix()
            ),
            target_module=target_module,
            proposed_specifier=proposed,
            rewrite_required=True,
            reason=(
                "Cross-module implementation "
                "import must be replaced by a "
                "stable package contract."
            ),
        )

    def _original_source_for(
        self,
        workspace: Path,
        staged_file: Path,
    ) -> Optional[Path]:
        report_path = (
            workspace
            / "extraction-report.json"
        )

        if not report_path.is_file():
            return None

        report = json.loads(
            report_path.read_text(
                encoding="utf-8"
            )
        )

        staged_relative = (
            staged_file
            .relative_to(workspace)
            .as_posix()
        )

        for file in report.get(
            "files",
            [],
        ):
            if (
                file.get("stagedPath")
                == staged_relative
            ):
                source_path = file.get(
                    "sourcePath"
                )

                if source_path:
                    return (
                        self.repository_root
                        / source_path
                    ).resolve()

        return None

    def _module_for_path(
        self,
        path: Path,
    ) -> Optional[str]:
        try:
            relative = path.relative_to(
                self.repository_root
            ).as_posix()
        except ValueError:
            return None

        matches = []

        for module in (
            self.repository.modules
        ):
            module_paths = {
                module.source.path,
                *(
                    component.source.path
                    for component
                    in module.components
                ),
                *(
                    controller.source.path
                    for controller
                    in module.controllers
                ),
                *(
                    route.source.path
                    for route
                    in module.routes
                ),
            }

            if relative in module_paths:
                matches.append(
                    module.id
                )

        if not matches:
            return None

        return sorted(matches)[0]

    def _relative_to_staged_target(
        self,
        plugin_id: str,
        workspace: Path,
        source_file: Path,
        repository_target: Path,
        module_id: str,
    ) -> str:
        del plugin_id

        module = self.repository.module(
            module_id
        )

        module_root = (
            self.repository_root
            / module.source.path
        ).parent

        try:
            source_relative = (
                repository_target
                .relative_to(module_root)
            )
        except ValueError:
            return ""

        staged_target = (
            workspace
            / "src"
            / source_relative
        )

        if not (
            staged_target.is_file()
            or staged_target
            .with_suffix(".ts")
            .is_file()
        ):
            return ""

        relative = Path(
            re.sub(
                r"\.ts$",
                "",
                Path(
                    re.sub(
                        r"\\",
                        "/",
                        str(
                            staged_target
                            .relative_to(
                                source_file.parent
                            )
                        ),
                    )
                ).as_posix(),
            )
        ).as_posix()

        if not relative.startswith("."):
            relative = "./" + relative

        return relative

    @staticmethod
    def _resolve_typescript(
        candidate: Path,
    ) -> Optional[Path]:
        candidates = [
            candidate,
            candidate.with_suffix(".ts"),
            candidate / "index.ts",
        ]

        for value in candidates:
            if value.is_file():
                return value.resolve()

        return None

    @staticmethod
    def _inside(
        path: Path,
        root: Path,
    ) -> bool:
        try:
            path.resolve().relative_to(
                root.resolve()
            )

            return True
        except ValueError:
            return False

    @staticmethod
    def _syntax(
        statement: str,
    ) -> str:
        stripped = statement.strip()

        if stripped.startswith(
            "export"
        ):
            return "export-from"

        if stripped.startswith(
            "require"
        ):
            return "require"

        if re.match(
            r"import\s*['\"]",
            stripped,
        ):
            return "side-effect-import"

        return "import"
