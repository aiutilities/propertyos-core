#!/usr/bin/env python3
"""
Generate the canonical PropertyOS documentation index.

Usage:

    python3 tools/documentation/generate_index.py
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
import re
import sys


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DOCS_ROOT = REPOSITORY_ROOT / "docs"
INDEX_PATH = DOCS_ROOT / "README.md"

EXCLUDED_FILES = {
    INDEX_PATH.resolve(),
}

CATEGORY_DESCRIPTIONS = {
    ".": "General documentation and standards",
    "architecture": "Platform and cross-domain architecture",
    "deployment": "Installation, deployment, backup, and operations",
    "development": "Developer, contributor, testing, and AI-agent guidance",
    "domains": "Business-domain documentation",
    "procurement": "Procurement implementation and release documentation",
    "product": "Product vision, roadmap, editions, and strategy",
    "reference": "Catalogs, glossary, inventories, and reference material",
    "releases": "Documentation milestones and release guidance",
}

TITLE_PATTERN = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)


def read_title(path: Path) -> str:
    """Return the first H1 title, or a readable filename fallback."""
    text = path.read_text(encoding="utf-8")

    match = TITLE_PATTERN.search(text)

    if match:
        return match.group(1).strip()

    return (
        path.stem
        .replace("_", " ")
        .replace("-", " ")
        .title()
    )


def relative_link(path: Path) -> str:
    """Return a POSIX path relative to docs/."""
    return path.relative_to(DOCS_ROOT).as_posix()


def category_for(path: Path) -> str:
    """Return the first-level docs category."""
    relative = path.relative_to(DOCS_ROOT)

    if len(relative.parts) == 1:
        return "."

    return relative.parts[0]


def collect_documents() -> dict[str, list[Path]]:
    """Collect Markdown documents grouped by first-level directory."""
    grouped: dict[str, list[Path]] = defaultdict(list)

    for path in sorted(DOCS_ROOT.rglob("*.md")):
        if path.resolve() in EXCLUDED_FILES:
            continue

        grouped[category_for(path)].append(path)

    return dict(grouped)


def detect_duplicate_titles(
    grouped: dict[str, list[Path]],
) -> list[str]:
    """Return warnings for repeated document titles."""
    titles: dict[str, list[Path]] = defaultdict(list)

    for paths in grouped.values():
        for path in paths:
            titles[read_title(path).casefold()].append(path)

    warnings = []

    for paths in titles.values():
        if len(paths) < 2:
            continue

        display_paths = ", ".join(
            relative_link(path)
            for path in paths
        )

        warnings.append(
            f"Duplicate title '{read_title(paths[0])}': "
            f"{display_paths}"
        )

    return warnings


def build_index(
    grouped: dict[str, list[Path]],
) -> str:
    """Generate docs/README.md content."""
    document_count = sum(
        len(paths)
        for paths in grouped.values()
    )

    lines = [
        "# PropertyOS Documentation",
        "",
        (
            "PropertyOS documentation is maintained as "
            "version-controlled Markdown alongside the source code."
        ),
        "",
        f"**Indexed documents:** {document_count}",
        "",
        "## Start Here",
        "",
        "- [Documentation Standards](STANDARDS.md)",
        (
            "- [Repository Guide]"
            "(development/REPOSITORY_GUIDE.md)"
        ),
        "- [Product Vision](product/PRODUCT_VISION.md)",
        (
            "- [Documentation Roadmap]"
            "(releases/DOCUMENTATION_ROADMAP.md)"
        ),
        "",
        "## Documentation Policy",
        "",
        (
            "The `docs/` directory is the canonical location for "
            "new long-lived PropertyOS documentation."
        ),
        "",
        (
            "Existing top-level architecture, ADR, PRD, research, "
            "and operational documentation is retained until it is "
            "reviewed and consolidated."
        ),
        "",
        (
            "Swagger/OpenAPI remains the authoritative generated "
            "API reference and is exposed by the running backend at "
            "`/api/docs`."
        ),
        "",
        "## Documentation Index",
        "",
    ]

    ordered_categories = sorted(
        grouped,
        key=lambda value: (
            value != ".",
            value,
        ),
    )

    for category in ordered_categories:
        paths = grouped[category]

        if category == ".":
            heading = "General"
        else:
            heading = category.replace("-", " ").title()

        description = CATEGORY_DESCRIPTIONS.get(
            category,
            "PropertyOS documentation",
        )

        lines.extend(
            [
                f"### {heading}",
                "",
                description + ".",
                "",
            ]
        )

        for path in sorted(
            paths,
            key=lambda item: (
                read_title(item).casefold(),
                relative_link(item),
            ),
        ):
            title = read_title(path)
            link = relative_link(path)

            lines.append(
                f"- [{title}]({link})"
            )

        lines.append("")

    lines.extend(
        [
            "## Documentation Tooling",
            "",
            "Validate all canonical documentation:",
            "",
            "```bash",
            "python3 tools/documentation/validate_docs.py",
            "```",
            "",
            "Regenerate this index:",
            "",
            "```bash",
            "python3 tools/documentation/generate_index.py",
            "```",
            "",
            "Always run the validator and `git diff --check` before committing.",
        ]
    )

    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    if not DOCS_ROOT.exists():
        print(
            "ERROR: docs/ directory not found.",
            file=sys.stderr,
        )
        return 1

    grouped = collect_documents()

    if not grouped:
        print(
            "ERROR: No Markdown documents found under docs/.",
            file=sys.stderr,
        )
        return 1

    warnings = detect_duplicate_titles(grouped)

    content = build_index(grouped)

    INDEX_PATH.write_text(
        content,
        encoding="utf-8",
    )

    print(
        f"Generated: {INDEX_PATH.relative_to(REPOSITORY_ROOT)}"
    )

    document_count = sum(
        len(paths)
        for paths in grouped.values()
    )

    print(f"Indexed documents: {document_count}")
    print(f"Categories: {len(grouped)}")

    if warnings:
        print()
        print("Warnings:")

        for warning in warnings:
            print(f"- {warning}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
