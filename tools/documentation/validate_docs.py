#!/usr/bin/env python3
"""
PropertyOS Documentation Validator

Validates Markdown documentation for common issues.

Usage:

    python3 tools/documentation/validate_docs.py

Exit code:
    0 = success
    1 = validation errors
"""

from pathlib import Path
import re
import sys

DOCS_ROOT = Path("docs")

PLACEHOLDER_PATTERN = re.compile(
    r"\b(TODO|TBD|PLACEHOLDER|FIXME)\b",
    re.IGNORECASE,
)


def validate_markdown(path: Path):
    errors = []

    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    if not text.strip():
        errors.append("Empty document")
        return errors

    first_content_index = 0

    if lines and lines[0].strip() == "---":
        try:
            closing_index = next(
                index
                for index, line in enumerate(
                    lines[1:],
                    start=1,
                )
                if line.strip() == "---"
            )

            first_content_index = closing_index + 1
        except StopIteration:
            errors.append(
                "Front matter is missing a closing delimiter"
            )
            return errors

    first_content = next(
        (
            line
            for line in lines[first_content_index:]
            if line.strip()
        ),
        "",
    )

    if not first_content.startswith("# "):
        errors.append("Missing H1 heading")

    if not text.endswith("\n"):
        errors.append("Missing final newline")

    if text.endswith("\n\n"):
        errors.append("Extra blank line at end of file")

    for line_no, line in enumerate(lines, start=1):

        if line.rstrip() != line:
            errors.append(
                f"Line {line_no}: trailing whitespace"
            )

        if PLACEHOLDER_PATTERN.search(line):
            errors.append(
                f"Line {line_no}: placeholder marker found"
            )

    return errors


def main():

    if not DOCS_ROOT.exists():
        print("docs/ directory not found.")
        return 1

    markdown_files = sorted(
        DOCS_ROOT.rglob("*.md")
    )

    total = len(markdown_files)
    total_errors = 0

    print(f"Scanning {total} Markdown documents...\n")

    for md in markdown_files:

        issues = validate_markdown(md)

        if issues:

            total_errors += len(issues)

            print(md)

            for issue in issues:
                print(f"  - {issue}")

            print()

    if total_errors:

        print(
            f"Validation failed ({total_errors} issue(s))."
        )
        return 1

    print("Documentation validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
