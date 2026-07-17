from __future__ import annotations

import json
import os
import subprocess
import unittest
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

LEGACY_PATH = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
    / "controllers.json"
)

AST_PATH = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
    / "controllers.ast.json"
)

AST_CLI = (
    REPOSITORY_ROOT
    / "tools"
    / "knowledge_engine"
    / "ast_controller_cli.py"
)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


class AstControllerExtractorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        environment = dict(os.environ)

        completed = subprocess.run(
            [
                "python3",
                str(AST_CLI),
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--output",
                str(AST_PATH),
            ],
            cwd=REPOSITORY_ROOT,
            env=environment,
            check=False,
            capture_output=True,
            text=True,
        )

        if completed.returncode != 0:
            raise RuntimeError(
                "AST controller extraction failed.\n"
                f"STDOUT:\n{completed.stdout}\n"
                f"STDERR:\n{completed.stderr}"
            )

        cls.legacy = load_json(LEGACY_PATH)
        cls.ast = load_json(AST_PATH)

    def test_manifest_matches_legacy_output(self) -> None:
        self.assertEqual(self.legacy, self.ast)

    def test_expected_controller_count(self) -> None:
        self.assertEqual(
            59,
            self.ast["controllerCount"],
        )

    def test_expected_route_count(self) -> None:
        self.assertEqual(
            449,
            self.ast["routeCount"],
        )

    def test_schema_version_is_preserved(self) -> None:
        self.assertEqual(
            "1.0.0",
            self.ast["schemaVersion"],
        )

    def test_generation_is_deterministic(self) -> None:
        first = AST_PATH.read_bytes()

        completed = subprocess.run(
            [
                "python3",
                str(AST_CLI),
                "--repository-root",
                str(REPOSITORY_ROOT),
                "--output",
                str(AST_PATH),
            ],
            cwd=REPOSITORY_ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(
            0,
            completed.returncode,
            msg=(
                f"STDOUT:\n{completed.stdout}\n"
                f"STDERR:\n{completed.stderr}"
            ),
        )

        second = AST_PATH.read_bytes()

        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
