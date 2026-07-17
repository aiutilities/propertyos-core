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
class ModuleKnowledge:
    id: str
    name: str
    kind: str
    class_name: str
    source: SourceReference
    controllers: tuple[str, ...] = field(default_factory=tuple)
    services: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "className": self.class_name,
            "source": self.source.to_dict(),
            "controllers": list(self.controllers),
            "services": list(self.services),
        }


@dataclass(frozen=True)
class KnowledgeManifest:
    schema_version: str
    generator: str
    modules: tuple[ModuleKnowledge, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generator": self.generator,
            "moduleCount": len(self.modules),
            "modules": [module.to_dict() for module in self.modules],
        }
