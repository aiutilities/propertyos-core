from __future__ import annotations

import argparse
from pathlib import Path

from .scanner import RepositoryScanner
from .writer import KnowledgeWriter


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate PropertyOS repository knowledge artifacts."
    )

    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
        help="PropertyOS repository root.",
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=Path("generated/knowledge"),
        help="Generated knowledge output directory.",
    )

    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()

    repository_root = arguments.repository_root.resolve()

    output_directory = arguments.output
    if not output_directory.is_absolute():
        output_directory = repository_root / output_directory

    scanner = RepositoryScanner(repository_root)
    manifest = scanner.scan()

    writer = KnowledgeWriter(output_directory)
    output_file = writer.write_modules(manifest)

    print("PropertyOS Knowledge Engine")
    print(f"Repository: {repository_root}")
    print(f"Modules:    {len(manifest.modules)}")
    print(f"Output:     {output_file}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
