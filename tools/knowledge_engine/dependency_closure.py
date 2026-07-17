from __future__ import annotations

import hashlib
import json
import re
import shutil

from collections import deque
from pathlib import Path
from typing import Iterable
from typing import Optional

from tools.knowledge_engine.dependency_closure_models import (
    ClosureDependency,
)
from tools.knowledge_engine.dependency_closure_models import (
    ClosurePluginAnalysis,
)
from tools.knowledge_engine.dependency_closure_models import (
    DependencyClosurePortfolio,
)
from tools.knowledge_engine.dependency_closure_models import (
    DependencyClosureRequest,
)
from tools.knowledge_engine.dependency_closure_models import (
    ExternalDependency,
)
from tools.knowledge_engine.dependency_closure_models import (
    repository_relative,
)


IMPORT_PATTERN = re.compile(
    r"""
    (?:
        import
        (?:[\s\S]*?)
        from
        \s*
        |
        export
        (?:[\s\S]*?)
        from
        \s*
        |
        import
        \s*
    )
    ["']
    (?P<specifier>[^"']+)
    ["']
    """,
    re.VERBOSE,
)

DYNAMIC_IMPORT_PATTERN = re.compile(
    r"""
    import
    \s*
    \(
    \s*
    ["']
    (?P<specifier>[^"']+)
    ["']
    \s*
    \)
    """,
    re.VERBOSE,
)

REQUIRE_PATTERN = re.compile(
    r"""
    require
    \s*
    \(
    \s*
    ["']
    (?P<specifier>[^"']+)
    ["']
    \s*
    \)
    """,
    re.VERBOSE,
)

SOURCE_SUFFIXES = (
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
)

INDEX_NAMES = tuple(
    f"index{suffix}"
    for suffix in SOURCE_SUFFIXES
)


class DependencyClosureError(RuntimeError):
    pass


class TransitiveDependencyClosure:
    def __init__(
        self,
        repository_root: Path,
        staging_root: Path,
    ) -> None:
        self.repository_root = (
            repository_root.resolve()
        )

        self.staging_root = (
            staging_root.resolve()
        )

        self.backend_source_root = (
            self.repository_root
            / "backend"
            / "src"
        ).resolve()

    def analyze(
        self,
        request: DependencyClosureRequest,
    ) -> DependencyClosurePortfolio:
        self._validate_request(request)

        module_ids = self._module_ids(request)

        analyses = tuple(
            self._analyze_plugin(
                module_id=module_id,
                apply=request.apply,
                overwrite=request.overwrite,
            )
            for module_id in module_ids
        )

        return DependencyClosurePortfolio(
            repository_root=(
                self.repository_root.as_posix()
            ),
            staging_root=(
                repository_relative(
                    self.repository_root,
                    self.staging_root,
                )
            ),
            plugin_count=len(analyses),
            seed_file_count=sum(
                item.seed_file_count
                for item in analyses
            ),
            closure_file_count=sum(
                item.closure_file_count
                for item in analyses
            ),
            added_file_count=sum(
                item.added_file_count
                for item in analyses
            ),
            external_dependency_count=sum(
                item.external_dependency_count
                for item in analyses
            ),
            valid_plugin_count=sum(
                1
                for item in analyses
                if item.valid
            ),
            invalid_plugin_count=sum(
                1
                for item in analyses
                if not item.valid
            ),
            analyses=analyses,
        )

    def _validate_request(
        self,
        request: DependencyClosureRequest,
    ) -> None:
        if request.mode not in {
            "module",
            "candidates",
            "all",
        }:
            raise DependencyClosureError(
                "Mode must be module, "
                "candidates, or all."
            )

        if (
            request.mode == "module"
            and not request.module_id
        ):
            raise DependencyClosureError(
                "module mode requires module_id."
            )

        if (
            request.limit is not None
            and request.limit <= 0
        ):
            raise DependencyClosureError(
                "limit must be greater than zero."
            )

        try:
            self.staging_root.relative_to(
                self.repository_root
            )
        except ValueError as error:
            raise DependencyClosureError(
                "staging root must be inside "
                "the repository."
            ) from error

        if not self.staging_root.exists():
            raise DependencyClosureError(
                "staging root does not exist: "
                f"{self.staging_root}"
            )

    def _module_ids(
        self,
        request: DependencyClosureRequest,
    ) -> tuple[str, ...]:
        available = tuple(
            sorted(
                path.name
                for path in self.staging_root.iterdir()
                if path.is_dir()
                and (
                    path
                    / "extraction-report.json"
                ).exists()
            )
        )

        if request.mode == "module":
            assert request.module_id is not None

            if request.module_id not in available:
                raise DependencyClosureError(
                    "staged plugin workspace "
                    "does not exist: "
                    f"{request.module_id}"
                )

            return (
                request.module_id,
            )

        selected = available

        if request.limit is not None:
            selected = selected[
                : request.limit
            ]

        return selected

    def _analyze_plugin(
        self,
        module_id: str,
        apply: bool,
        overwrite: bool,
    ) -> ClosurePluginAnalysis:
        workspace = (
            self.staging_root
            / module_id
        )

        extraction_report_path = (
            workspace
            / "extraction-report.json"
        )

        report = json.loads(
            extraction_report_path.read_text(
                encoding="utf-8"
            )
        )

        plugin_id = str(
            report.get(
                "pluginId",
                module_id,
            )
        )

        package_name = str(
            report.get(
                "packageName",
                f"@propertyos/plugin-{plugin_id}",
            )
        )

        copied_files = self._copied_files(
            report
        )

        module_root = self._module_root(
            module_id=module_id,
            copied_files=copied_files,
        )

        seed_sources = tuple(
            sorted(
                {
                    (
                        self.repository_root
                        / item["source"]
                    ).resolve()
                    for item in copied_files
                    if (
                        item.get("source")
                        and not item.get(
                            "closureAdded",
                            False,
                        )
                    )
                },
                key=lambda path: path.as_posix(),
            )
        )

        if not seed_sources:
            raise DependencyClosureError(
                f"{module_id} has no copied "
                "source files."
            )

        for seed in seed_sources:
            if not seed.exists():
                raise DependencyClosureError(
                    "seed source does not exist: "
                    f"{seed}"
                )

        dependencies, external = (
            self._discover_closure(
                module_root=module_root,
                seed_sources=seed_sources,
            )
        )

        existing_targets = {
            (
                workspace
                / item["staged"]
            ).resolve()
            for item in copied_files
            if item.get("staged")
        }

        addition_map: dict[
            str,
            ClosureDependency,
        ] = {}

        for item in dependencies:
            target = (
                workspace
                / item.staged_target
            ).resolve()

            if target in existing_targets:
                continue

            current = addition_map.get(
                item.staged_target
            )

            if current is None:
                addition_map[
                    item.staged_target
                ] = item
                continue

            if (
                current.resolved_source
                != item.resolved_source
            ):
                raise DependencyClosureError(
                    "multiple source files map "
                    "to the same staged target: "
                    f"{item.staged_target}"
                )

        additions = tuple(
            sorted(
                addition_map.values(),
                key=lambda item: (
                    item.staged_target,
                    item.resolved_source,
                ),
            )
        )

        warnings: list[str] = []

        if not dependencies:
            warnings.append(
                f"{module_id} produced an "
                "empty module dependency closure."
            )

        if apply:
            self._apply_dependencies(
                workspace=workspace,
                additions=additions,
                overwrite=overwrite,
            )

        analysis = ClosurePluginAnalysis(
            module_id=module_id,
            plugin_id=plugin_id,
            package_name=package_name,
            module_root=repository_relative(
                self.repository_root,
                module_root,
            ),
            workspace=repository_relative(
                self.repository_root,
                workspace,
            ),
            seed_file_count=len(seed_sources),
            closure_file_count=len(
                {
                    item.resolved_source
                    for item in dependencies
                }
                | {
                    repository_relative(
                        self.repository_root,
                        seed,
                    )
                    for seed in seed_sources
                }
            ),
            added_file_count=len(additions),
            external_dependency_count=(
                len(external)
            ),
            maximum_depth=max(
                (
                    item.depth
                    for item in dependencies
                ),
                default=0,
            ),
            dependencies=dependencies,
            external_dependencies=external,
            applied=apply,
            valid=True,
            warnings=tuple(warnings),
        )

        if apply:
            self._write_report(
                workspace=workspace,
                analysis=analysis,
            )

        return analysis

    def _copied_files(
        self,
        report: dict,
    ) -> tuple[dict, ...]:
        files = report.get(
            "files",
            [],
        )

        if not isinstance(files, list):
            raise DependencyClosureError(
                "extraction report files "
                "must be a list."
            )

        normalised: list[
            dict[str, str]
        ] = []

        for item in files:
            if not isinstance(item, dict):
                continue

            source = (
                item.get("sourcePath")
                or item.get("source")
                or item.get("source_path")
            )

            staged = (
                item.get("stagedPath")
                or item.get("staged")
                or item.get("targetPath")
                or item.get("target")
                or item.get("target_path")
            )

            if not source or not staged:
                continue

            normalised.append(
                {
                    "source": str(source),
                    "staged": str(staged),
                    "closureAdded": bool(
                        item.get(
                            "closureAdded",
                            False,
                        )
                    ),
                }
            )

        expected_count = report.get(
            "copiedFileCount"
        )

        if (
            expected_count is not None
            and expected_count
            != len(normalised)
        ):
            raise DependencyClosureError(
                "extraction report copied-file "
                "count does not match the file "
                "mapping count: "
                f"expected {expected_count}, "
                f"found {len(normalised)}."
            )

        if not normalised:
            raise DependencyClosureError(
                "extraction report contains "
                "no copied-file mappings."
            )

        return tuple(
            sorted(
                normalised,
                key=lambda item: (
                    item["source"],
                    item["staged"],
                ),
            )
        )

    def _module_root(
        self,
        module_id: str,
        copied_files: tuple[dict, ...],
    ) -> Path:
        preferred = (
            self.backend_source_root
            / "core"
            / module_id
        ).resolve()

        if preferred.exists():
            return preferred

        source_paths = tuple(
            (
                self.repository_root
                / item["source"]
            ).resolve()
            for item in copied_files
        )

        common = Path(
            self._common_path(
                source_paths
            )
        ).resolve()

        if common.is_file():
            common = common.parent

        if not common.exists():
            raise DependencyClosureError(
                "module root does not exist: "
                f"{common}"
            )

        return common

    def _common_path(
        self,
        paths: Iterable[Path],
    ) -> str:
        import os

        return os.path.commonpath(
            [
                path.as_posix()
                for path in paths
            ]
        )

    def _discover_closure(
        self,
        module_root: Path,
        seed_sources: tuple[Path, ...],
    ) -> tuple[
        tuple[ClosureDependency, ...],
        tuple[ExternalDependency, ...],
    ]:
        queue = deque(
            (
                source,
                0,
            )
            for source in seed_sources
        )

        visited: set[Path] = set()
        dependencies: dict[
            tuple[str, str, str],
            ClosureDependency,
        ] = {}
        external: dict[
            tuple[str, str],
            ExternalDependency,
        ] = {}

        while queue:
            source_file, depth = (
                queue.popleft()
            )

            source_file = (
                source_file.resolve()
            )

            if source_file in visited:
                continue

            visited.add(source_file)

            text = source_file.read_text(
                encoding="utf-8"
            )

            for specifier in self._imports(
                text
            ):
                if not specifier.startswith(
                    "."
                ):
                    external[
                        (
                            repository_relative(
                                self.repository_root,
                                source_file,
                            ),
                            specifier,
                        )
                    ] = ExternalDependency(
                        source_file=(
                            repository_relative(
                                self.repository_root,
                                source_file,
                            )
                        ),
                        import_specifier=specifier,
                        classification=(
                            self._external_classification(
                                specifier
                            )
                        ),
                    )

                    continue

                resolved = (
                    self._resolve_relative(
                        source_file=source_file,
                        specifier=specifier,
                    )
                )

                if resolved is None:
                    external[
                        (
                            repository_relative(
                                self.repository_root,
                                source_file,
                            ),
                            specifier,
                        )
                    ] = ExternalDependency(
                        source_file=(
                            repository_relative(
                                self.repository_root,
                                source_file,
                            )
                        ),
                        import_specifier=specifier,
                        classification=(
                            "unresolved-relative"
                        ),
                    )

                    continue

                try:
                    relative_to_module = (
                        resolved.relative_to(
                            module_root
                        )
                    )
                except ValueError:
                    external[
                        (
                            repository_relative(
                                self.repository_root,
                                source_file,
                            ),
                            specifier,
                        )
                    ] = ExternalDependency(
                        source_file=(
                            repository_relative(
                                self.repository_root,
                                source_file,
                            )
                        ),
                        import_specifier=specifier,
                        classification=(
                            "cross-module"
                        ),
                    )

                    continue

                target = (
                    Path("src")
                    / relative_to_module
                ).as_posix()

                key = (
                    repository_relative(
                        self.repository_root,
                        source_file,
                    ),
                    specifier,
                    repository_relative(
                        self.repository_root,
                        resolved,
                    ),
                )

                dependencies[key] = (
                    ClosureDependency(
                        source_file=(
                            repository_relative(
                                self.repository_root,
                                source_file,
                            )
                        ),
                        import_specifier=specifier,
                        resolved_source=(
                            repository_relative(
                                self.repository_root,
                                resolved,
                            )
                        ),
                        staged_target=target,
                        depth=depth + 1,
                        discovered_from=(
                            repository_relative(
                                self.repository_root,
                                source_file,
                            )
                        ),
                    )
                )

                if resolved not in visited:
                    queue.append(
                        (
                            resolved,
                            depth + 1,
                        )
                    )

        return (
            tuple(
                sorted(
                    dependencies.values(),
                    key=lambda item: (
                        item.depth,
                        item.resolved_source,
                        item.source_file,
                        item.import_specifier,
                    ),
                )
            ),
            tuple(
                sorted(
                    external.values(),
                    key=lambda item: (
                        item.classification,
                        item.source_file,
                        item.import_specifier,
                    ),
                )
            ),
        )

    def _imports(
        self,
        text: str,
    ) -> tuple[str, ...]:
        values = {
            match.group("specifier")
            for pattern in (
                IMPORT_PATTERN,
                DYNAMIC_IMPORT_PATTERN,
                REQUIRE_PATTERN,
            )
            for match in pattern.finditer(
                text
            )
        }

        return tuple(
            sorted(values)
        )

    def _resolve_relative(
        self,
        source_file: Path,
        specifier: str,
    ) -> Optional[Path]:
        base = (
            source_file.parent
            / specifier
        ).resolve()

        candidates = [
            base,
            *(
                Path(
                    f"{base}{suffix}"
                )
                for suffix in SOURCE_SUFFIXES
            ),
            *(
                base
                / name
                for name in INDEX_NAMES
            ),
        ]

        for candidate in candidates:
            if (
                candidate.exists()
                and candidate.is_file()
            ):
                return candidate.resolve()

        return None

    def _external_classification(
        self,
        specifier: str,
    ) -> str:
        if specifier.startswith(
            "@propertyos/"
        ):
            return "propertyos-package"

        if specifier.startswith(
            "node:"
        ):
            return "node-builtin"

        if specifier in {
            "assert",
            "buffer",
            "child_process",
            "crypto",
            "events",
            "fs",
            "http",
            "https",
            "os",
            "path",
            "stream",
            "url",
            "util",
            "worker_threads",
            "zlib",
        }:
            return "node-builtin"

        return "external-package"

    def _apply_dependencies(
        self,
        workspace: Path,
        additions: tuple[
            ClosureDependency,
            ...
        ],
        overwrite: bool,
    ) -> None:
        for item in additions:
            source = (
                self.repository_root
                / item.resolved_source
            ).resolve()

            target = (
                workspace
                / item.staged_target
            ).resolve()

            try:
                target.relative_to(
                    workspace.resolve()
                )
            except ValueError as error:
                raise DependencyClosureError(
                    "closure target escapes "
                    "workspace: "
                    f"{target}"
                ) from error

            if target.exists():
                if (
                    not overwrite
                    and self._hash(source)
                    != self._hash(target)
                ):
                    raise DependencyClosureError(
                        "closure target already "
                        "exists with different "
                        "content: "
                        f"{target}"
                    )

                if (
                    not overwrite
                    and self._hash(source)
                    == self._hash(target)
                ):
                    continue

            target.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            shutil.copy2(
                source,
                target,
            )

        if additions:
            self._update_extraction_report(
                workspace=workspace,
                additions=additions,
            )


    def _update_extraction_report(
        self,
        workspace: Path,
        additions: tuple[
            ClosureDependency,
            ...
        ],
    ) -> None:
        report_path = (
            workspace
            / "extraction-report.json"
        )

        report = json.loads(
            report_path.read_text(
                encoding="utf-8"
            )
        )

        files = list(
            report.get(
                "files",
                [],
            )
        )

        existing = {
            item["stagedPath"]: item
            for item in files
            if "stagedPath" in item
        }

        for dependency in additions:
            target = (
                workspace
                / dependency.staged_target
            )

            name = target.name

            if name.endswith(".controller.ts"):
                kind = "controller"
            elif name.endswith(".service.ts"):
                kind = "service"
            elif name.endswith(".module.ts"):
                kind = "module"
            elif name.endswith(".repository.ts"):
                kind = "repository"
            elif "/dto/" in dependency.staged_target:
                kind = "dto"
            elif "/handlers/" in dependency.staged_target:
                kind = "handler"
            else:
                kind = "source"

            existing[
                dependency.staged_target
            ] = {
                "closureAdded": True,
                "fileKind": kind,
                "sha256": self._hash(target),
                "sizeBytes": target.stat().st_size,
                "sourcePath": dependency.resolved_source,
                "stagedPath": dependency.staged_target,
            }

        report["files"] = sorted(
            existing.values(),
            key=lambda item: item["stagedPath"],
        )

        report["copiedFileCount"] = len(
            report["files"]
        )

        report_path.write_text(
            json.dumps(
                report,
                indent=2,
                sort_keys=True,
            )
            + "\n",
            encoding="utf-8",
        )

    def _write_report(
        self,
        workspace: Path,
        analysis: ClosurePluginAnalysis,
    ) -> None:
        path = (
            workspace
            / "dependency-closure-report.json"
        )

        payload = {
            "schemaVersion": "1.0.0",
            **analysis.to_dict(),
        }

        path.write_text(
            json.dumps(
                payload,
                indent=2,
                sort_keys=True,
            )
            + "\n",
            encoding="utf-8",
        )

    def _hash(
        self,
        path: Path,
    ) -> str:
        return hashlib.sha256(
            path.read_bytes()
        ).hexdigest()
