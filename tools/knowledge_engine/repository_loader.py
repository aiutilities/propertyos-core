from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class RepositoryArtifacts:
    repository_ir: dict[str, Any]
    dependency_graph: dict[str, Any]
    impact_analysis: dict[str, Any]
    architecture_intelligence: dict[str, Any]


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(
            f"Required knowledge artifact not found: "
            f"{path}"
        )

    try:
        value = json.loads(
            path.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Invalid JSON in knowledge artifact "
            f"{path}: {error}"
        ) from error

    if not isinstance(value, dict):
        raise ValueError(
            f"Knowledge artifact must contain "
            f"a JSON object: {path}"
        )

    return value


def load_repository_artifacts(
    repository_root: Path,
) -> RepositoryArtifacts:
    root = repository_root.resolve()

    knowledge_directory = (
        root
        / "generated"
        / "knowledge"
    )

    return RepositoryArtifacts(
        repository_ir=_load_json(
            knowledge_directory
            / "repository.ir.json"
        ),
        dependency_graph=_load_json(
            knowledge_directory
            / "dependency-graph.json"
        ),
        impact_analysis=_load_json(
            knowledge_directory
            / "impact-analysis.json"
        ),
        architecture_intelligence=_load_json(
            knowledge_directory
            / "architecture-intelligence.json"
        ),
    )
