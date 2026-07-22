from __future__ import annotations

from tools.knowledge_engine.test_source_policy import is_test_source

import re
from dataclasses import dataclass
from pathlib import Path

from .models import (
    ComponentKnowledge,
    KnowledgeManifest,
    ModuleKnowledge,
    SourceReference,
)


MODULE_FILE_SUFFIX = ".module.ts"

CLASS_PATTERN = re.compile(
    r"(?:export\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)"
)


@dataclass(frozen=True)
class DiscoveredModule:
    id: str
    name: str
    kind: str
    class_name: str
    source_path: Path
    relative_source_path: str


class RepositoryScanner:
    SCHEMA_VERSION = "1.1.0"
    GENERATOR_NAME = "propertyos-knowledge-engine"

    def __init__(self, repository_root: Path) -> None:
        self.repository_root = repository_root.resolve()

        self.discovery_roots = (
            ("core", self.repository_root / "backend/src/core"),
            ("plugin", self.repository_root / "backend/src/plugins"),
            ("configuration", self.repository_root / "backend/src/config"),
            ("database", self.repository_root / "backend/src/database"),
        )

    def scan(self) -> KnowledgeManifest:
        discovered_modules = self._discover_modules()
        assigned_components = self._discover_components(
            discovered_modules
        )

        modules: list[ModuleKnowledge] = []

        for discovered_module in discovered_modules:
            components = tuple(
                sorted(
                    assigned_components.get(
                        discovered_module.id,
                        [],
                    ),
                    key=lambda component: (
                        component.kind,
                        component.id,
                        component.source.path,
                    ),
                )
            )

            controllers = tuple(
                sorted(
                    component.class_name
                    for component in components
                    if component.kind == "controller"
                )
            )

            services = tuple(
                sorted(
                    component.class_name
                    for component in components
                    if component.kind in {
                        "service",
                        "bootstrap-service",
                        "scheduler-service",
                        "search-provider",
                    }
                )
            )

            modules.append(
                ModuleKnowledge(
                    id=discovered_module.id,
                    name=discovered_module.name,
                    kind=discovered_module.kind,
                    class_name=discovered_module.class_name,
                    source=SourceReference(
                        path=discovered_module.relative_source_path
                    ),
                    controllers=controllers,
                    services=services,
                    components=components,
                )
            )

        modules.sort(
            key=lambda item: (
                item.kind,
                item.id,
                item.source.path,
            )
        )

        return KnowledgeManifest(
            schema_version=self.SCHEMA_VERSION,
            generator=self.GENERATOR_NAME,
            modules=tuple(modules),
        )

    def _discover_modules(self) -> list[DiscoveredModule]:
        modules: list[DiscoveredModule] = []

        for kind, root in self.discovery_roots:
            if not root.exists():
                continue

            for module_file in sorted(
                root.rglob(f"*{MODULE_FILE_SUFFIX}")
            ):
                source = module_file.read_text(
                    encoding="utf-8"
                )

                class_name = self._extract_class_name(
                    source,
                    self._fallback_class_name(module_file),
                )

                module_id = self._module_id(
                    module_file,
                    kind,
                )

                modules.append(
                    DiscoveredModule(
                        id=module_id,
                        name=self._display_name(module_id),
                        kind=kind,
                        class_name=class_name,
                        source_path=module_file.resolve(),
                        relative_source_path=(
                            module_file
                            .relative_to(self.repository_root)
                            .as_posix()
                        ),
                    )
                )

        modules.sort(
            key=lambda module: (
                module.kind,
                module.id,
                module.relative_source_path,
            )
        )

        return modules

    def _discover_components(
        self,
        modules: list[DiscoveredModule],
    ) -> dict[str, list[ComponentKnowledge]]:
        assigned: dict[str, list[ComponentKnowledge]] = {
            module.id: []
            for module in modules
        }

        seen_paths: set[Path] = set()

        for _, root in self.discovery_roots:
            if not root.exists():
                continue

            for source_file in sorted(root.rglob("*.ts")):
                resolved_file = source_file.resolve()

                if resolved_file in seen_paths:
                    continue

                seen_paths.add(resolved_file)

                component_kind = self._component_kind(
                    source_file
                )

                if component_kind is None:
                    continue

                owner = self._nearest_module(
                    source_file,
                    modules,
                )

                if owner is None:
                    continue

                source = source_file.read_text(
                    encoding="utf-8"
                )

                fallback_class_name = (
                    self._fallback_component_class_name(
                        source_file
                    )
                )

                class_name = self._extract_class_name(
                    source,
                    fallback_class_name,
                )

                relative_path = (
                    source_file
                    .relative_to(self.repository_root)
                    .as_posix()
                )

                component_id = (
                    f"{owner.id}:"
                    f"{component_kind}:"
                    f"{self._component_slug(source_file)}"
                )

                assigned[owner.id].append(
                    ComponentKnowledge(
                        id=component_id,
                        name=self._display_component_name(
                            class_name
                        ),
                        kind=component_kind,
                        class_name=class_name,
                        module_id=owner.id,
                        source=SourceReference(
                            path=relative_path
                        ),
                    )
                )

        return assigned

    @staticmethod
    def _nearest_module(
        source_file: Path,
        modules: list[DiscoveredModule],
    ) -> DiscoveredModule | None:
        candidates: list[DiscoveredModule] = []
        resolved_file = source_file.resolve()

        for module in modules:
            module_directory = module.source_path.parent

            try:
                resolved_file.relative_to(module_directory)
            except ValueError:
                continue

            candidates.append(module)

        if not candidates:
            return None

        return max(
            candidates,
            key=lambda module: len(
                module.source_path.parent.parts
            ),
        )

    @staticmethod
    def _component_kind(
        source_file: Path,
    ) -> str | None:
        filename = source_file.name
        path_parts = {
            part.lower()
            for part in source_file.parts
        }

        if is_test_source(filename):
            return None

        if is_test_source(filename):
            return None

        if filename.endswith(MODULE_FILE_SUFFIX):
            return None

        if filename.endswith(".controller.ts"):
            return "controller"

        if not filename.endswith(".service.ts"):
            return None

        if filename.endswith(
            "-search-provider.service.ts"
        ):
            return "search-provider"

        if "bootstrap" in path_parts:
            return "bootstrap-service"

        if "scheduler" in filename.lower():
            return "scheduler-service"

        return "service"

    def _module_id(
        self,
        module_file: Path,
        kind: str,
    ) -> str:
        filename = module_file.name.removesuffix(
            MODULE_FILE_SUFFIX
        )

        if kind == "plugin":
            return f"plugin:{filename}"

        if kind == "configuration":
            return f"configuration:{filename}"

        if kind == "database":
            return f"database:{filename}"

        return filename

    @staticmethod
    def _extract_class_name(
        source: str,
        fallback: str,
    ) -> str:
        match = CLASS_PATTERN.search(source)

        if match:
            return match.group(1)

        return fallback

    @staticmethod
    def _display_name(module_id: str) -> str:
        raw_name = module_id.split(":", maxsplit=1)[-1]

        return " ".join(
            part.capitalize()
            for part in raw_name.replace("_", "-").split("-")
            if part
        )

    @staticmethod
    def _display_component_name(
        class_name: str,
    ) -> str:
        words = re.sub(
            r"(?<!^)(?=[A-Z])",
            " ",
            class_name,
        )

        return words.strip()

    @staticmethod
    def _component_slug(
        source_file: Path,
    ) -> str:
        filename = source_file.name

        for suffix in (
            ".controller.ts",
            ".service.ts",
            ".ts",
        ):
            if filename.endswith(suffix):
                return filename.removesuffix(suffix)

        return source_file.stem

    @staticmethod
    def _fallback_class_name(
        module_file: Path,
    ) -> str:
        base = module_file.name.removesuffix(
            MODULE_FILE_SUFFIX
        )

        return "".join(
            part.capitalize()
            for part in base.replace("_", "-").split("-")
            if part
        ) + "Module"

    @staticmethod
    def _fallback_component_class_name(
        source_file: Path,
    ) -> str:
        base = source_file.name

        for suffix in (
            ".controller.ts",
            ".service.ts",
            ".ts",
        ):
            if base.endswith(suffix):
                base = base.removesuffix(suffix)
                break

        return "".join(
            part.capitalize()
            for part in base.replace("_", "-").split("-")
            if part
        )
