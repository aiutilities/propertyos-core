from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .authorization_analyzer import analyze_authorization
from .authorization_formatter import format_json, format_markdown


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Analyze PropertyOS controller authorization coverage."
        )
    )

    parser.add_argument(
        "--repository-root",
        default=".",
        help="Repository root directory.",
    )

    parser.add_argument(
        "--output-dir",
        default="generated/knowledge",
        help="Generated report output directory.",
    )

    parser.add_argument(
        "--check",
        action="store_true",
        help="Return a non-zero exit code for blocking violations.",
    )

    parser.add_argument(
        "--verify-generated",
        action="store_true",
        help="Verify committed reports match freshly generated output.",
    )

    return parser


def main() -> int:
    args = build_parser().parse_args()

    repository_root = Path(
        args.repository_root
    ).resolve()

    output_dir = (
        repository_root
        / args.output_dir
    )

    report = analyze_authorization(
        repository_root=repository_root,
        permission_registry=(
            repository_root
            / "backend/src/core/auth/constants/permissions.ts"
        ),
        controller_roots=[
            repository_root / "backend/src/core",
            repository_root / "backend/src/plugins",
        ],
        source_root=(
            repository_root
            / "backend/src"
        ),
    )

    json_output = format_json(report)
    markdown_output = format_markdown(report)

    json_path = (
        output_dir
        / "authorization-report.json"
    )

    markdown_path = (
        output_dir
        / "authorization-report.md"
    )

    if args.verify_generated:
        missing = [
            path
            for path in (
                json_path,
                markdown_path,
            )
            if not path.exists()
        ]

        if missing:
            for path in missing:
                print(
                    f"Missing generated report: {path}",
                    file=sys.stderr,
                )

            return 1

        generated_matches = (
            json_path.read_text(
                encoding="utf-8"
            )
            == json_output
            and markdown_path.read_text(
                encoding="utf-8"
            )
            == markdown_output
        )

        if not generated_matches:
            print(
                "Generated authorization reports are stale.",
                file=sys.stderr,
            )

            return 1

        print(
            "Generated authorization reports are current."
        )
    else:
        output_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        json_path.write_text(
            json_output,
            encoding="utf-8",
        )

        markdown_path.write_text(
            markdown_output,
            encoding="utf-8",
        )

        print(
            f"Authorization status: {report.status}"
        )
        print(
            f"Controllers: {report.controller_count}"
        )
        print(
            f"Endpoints: {report.endpoint_count}"
        )
        print(
            f"Blocking violations: {len(report.violations)}"
        )
        print(
            f"JSON report: {json_path}"
        )
        print(
            f"Markdown report: {markdown_path}"
        )

    if args.check and report.violations:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
