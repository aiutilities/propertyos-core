from __future__ import annotations

from pathlib import Path

from tools.knowledge_engine.controller_scanner import (
    ControllerScanner,
)
from tools.knowledge_engine.controller_writer import (
    ControllerKnowledgeWriter,
)


def main() -> None:
    repository_root = Path.cwd().resolve()

    manifest = ControllerScanner(
        repository_root
    ).scan()

    output_file = ControllerKnowledgeWriter(
        repository_root
        / "generated"
        / "knowledge"
    ).write(manifest)

    print("PropertyOS Controller Knowledge Engine")
    print(f"Repository:  {repository_root}")
    print(f"Controllers: {manifest.controller_count}")
    print(f"Routes:      {manifest.route_count}")
    print(f"Output:      {output_file}")


if __name__ == "__main__":
    main()
