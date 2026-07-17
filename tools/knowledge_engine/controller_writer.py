from __future__ import annotations

import json
from pathlib import Path

from tools.knowledge_engine.controller_models import (
    ControllerKnowledgeManifest,
)


class ControllerKnowledgeWriter:
    def __init__(self, output_directory: Path) -> None:
        self.output_directory = output_directory

    def write(
        self,
        manifest: ControllerKnowledgeManifest,
    ) -> Path:
        self.output_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_file = (
            self.output_directory
            / "controllers.json"
        )

        content = json.dumps(
            manifest.to_dict(),
            indent=2,
            sort_keys=False,
            ensure_ascii=False,
        )

        output_file.write_text(
            content + "\n",
            encoding="utf-8",
        )

        return output_file
