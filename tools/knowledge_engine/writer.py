from __future__ import annotations

import json
from pathlib import Path

from .models import KnowledgeManifest


class KnowledgeWriter:
    def __init__(self, output_directory: Path) -> None:
        self.output_directory = output_directory

    def write_modules(self, manifest: KnowledgeManifest) -> Path:
        self.output_directory.mkdir(parents=True, exist_ok=True)

        output_file = self.output_directory / "modules.json"

        payload = manifest.to_dict()

        output_file.write_text(
            json.dumps(
                payload,
                indent=2,
                sort_keys=True,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

        return output_file
