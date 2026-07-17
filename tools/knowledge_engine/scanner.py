from __future__ import annotations

import re
from pathlib import Path

from .models import KnowledgeManifest, ModuleKnowledge, SourceReference


MODULE_FILE_SUFFIX = ".module.ts"

MODULE_CLASS_PATTERN = re.compile(
    r"export\s+class\s+([A-Za-z_][A-Za-z0-9_]*)"
)

CONTROLLER_PATTERN = re.compile(
    r"\b([A-Za-z_][A-Za-z0-9_]*Controller)\b"
)

SERVICE_PATTERN = re.compile(
    r"\b([A-Za-z_][A-Za-z0-9_]*Service)\b"
)


class RepositoryScanner:
    SCHEMA_VERSION = "1.0.0"
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
        modules: list[ModuleKnowledge] = []

        for kind, root in self.discovery_roots:
            if not root.exists():
                continue

            for module_file in sorted(root.rglob(f"*{MODULE_FILE_SUFFIX}")):
                modules.append(self._scan_module(module_file, kind))

        modules.sort(key=lambda item: (item.kind, item.id, item.source.path))

        return KnowledgeManifest(
            schema_version=self.SCHEMA_VERSION,
            generator=self.GENERATOR_NAME,
            modules=tuple(modules),
        )

    def _scan_module(self, module_file: Path, kind: str) -> ModuleKnowledge:
        source = module_file.read_text(encoding="utf-8")

        class_match = MODULE_CLASS_PATTERN.search(source)
        class_name = (
            class_match.group(1)
            if class_match
            else self._fallback_class_name(module_file)
        )

        module_id = self._module_id(module_file, kind)
        name = self._display_name(module_id)

        controllers = tuple(sorted(set(CONTROLLER_PATTERN.findall(source))))
        services = tuple(sorted(set(SERVICE_PATTERN.findall(source))))

        relative_path = module_file.relative_to(self.repository_root).as_posix()

        return ModuleKnowledge(
            id=module_id,
            name=name,
            kind=kind,
            class_name=class_name,
            source=SourceReference(path=relative_path),
            controllers=controllers,
            services=services,
        )

    def _module_id(self, module_file: Path, kind: str) -> str:
        filename = module_file.name.removesuffix(MODULE_FILE_SUFFIX)

        if kind == "plugin":
            return f"plugin:{filename}"

        if kind == "configuration":
            return f"configuration:{filename}"

        if kind == "database":
            return f"database:{filename}"

        return filename

    @staticmethod
    def _display_name(module_id: str) -> str:
        raw_name = module_id.split(":", maxsplit=1)[-1]

        return " ".join(
            part.capitalize()
            for part in raw_name.replace("_", "-").split("-")
            if part
        )

    @staticmethod
    def _fallback_class_name(module_file: Path) -> str:
        base = module_file.name.removesuffix(MODULE_FILE_SUFFIX)

        return "".join(
            part.capitalize()
            for part in base.replace("_", "-").split("-")
            if part
        ) + "Module"
