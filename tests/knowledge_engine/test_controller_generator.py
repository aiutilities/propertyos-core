from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

CONTROLLER_CLI = (
    REPOSITORY_ROOT
    / "tools"
    / "knowledge_engine"
    / "controller_cli.py"
)

CANONICAL_PATH = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
    / "controllers.json"
)

AST_PARITY_PATH = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
    / "controllers.ast.json"
)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(
        path.read_text(encoding="utf-8")
    )


def run_generator(
    output: Path,
    engine: str | None = None,
) -> subprocess.CompletedProcess[str]:
    command = [
        "python3",
        "-m",
        "tools.knowledge_engine.controller_cli",
        "--repository-root",
        str(REPOSITORY_ROOT),
        "--output",
        str(output),
    ]

    if engine is not None:
        command.extend(
            ["--engine", engine]
        )

    return subprocess.run(
        command,
        cwd=REPOSITORY_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )


class ControllerGeneratorTest(unittest.TestCase):
    def test_default_engine_is_ast(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = (
                Path(directory)
                / "controllers.json"
            )

            completed = run_generator(output)

            self.assertEqual(
                0,
                completed.returncode,
                msg=(
                    f"STDOUT:\n{completed.stdout}\n"
                    f"STDERR:\n{completed.stderr}"
                ),
            )

            self.assertIn(
                "Engine:      ast",
                completed.stdout,
            )

            self.assertEqual(
                load_json(CANONICAL_PATH),
                load_json(output),
            )

    def test_ast_engine_matches_canonical(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = (
                Path(directory)
                / "controllers.ast.json"
            )

            completed = run_generator(
                output,
                engine="ast",
            )

            self.assertEqual(
                0,
                completed.returncode,
                msg=completed.stderr,
            )

            self.assertEqual(
                load_json(CANONICAL_PATH),
                load_json(output),
            )

    def test_regex_engine_remains_available(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = (
                Path(directory)
                / "controllers.regex.json"
            )

            completed = run_generator(
                output,
                engine="regex",
            )

            self.assertEqual(
                0,
                completed.returncode,
                msg=completed.stderr,
            )

            self.assertIn(
                "Engine:      regex",
                completed.stdout,
            )

            self.assertEqual(
                load_json(CANONICAL_PATH),
                load_json(output),
            )

    def test_ast_parity_artifact_matches_canonical(
        self,
    ) -> None:
        self.assertEqual(
            load_json(CANONICAL_PATH),
            load_json(AST_PARITY_PATH),
        )


if __name__ == "__main__":
    unittest.main()
