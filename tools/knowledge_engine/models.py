from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class SourceReference:
    path: str
    line: int | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ComponentKnowledge:
    id: str
    name: str
    kind: str
    class_name: str
    module_id: str
    source: SourceReference

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "className": self.class_name,
            "moduleId": self.module_id,
            "source": self.source.to_dict(),
        }


@dataclass(frozen=True)
class ModuleKnowledge:
    id: str
    name: str
    kind: str
    class_name: str
    source: SourceReference
    controllers: tuple[str, ...] = field(default_factory=tuple)
    services: tuple[str, ...] = field(default_factory=tuple)
    components: tuple[ComponentKnowledge, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "className": self.class_name,
            "source": self.source.to_dict(),
            "controllers": list(self.controllers),
            "services": list(self.services),
            "componentCount": len(self.components),
            "components": [
                component.to_dict()
                for component in self.components
            ],
        }


@dataclass(frozen=True)
class KnowledgeManifest:
    schema_version: str
    generator: str
    modules: tuple[ModuleKnowledge, ...]

    def to_dict(self) -> dict[str, Any]:
        component_count = sum(
            len(module.components)
            for module in self.modules
        )

        return {
            "schemaVersion": self.schema_version,
            "generator": self.generator,
            "moduleCount": len(self.modules),
            "componentCount": component_count,
            "modules": [
                module.to_dict()
                for module in self.modules
            ],
        }
