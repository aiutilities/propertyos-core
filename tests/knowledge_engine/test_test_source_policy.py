from __future__ import annotations

import unittest
from pathlib import PurePosixPath

from tools.knowledge_engine.test_source_policy import (
    TEST_SOURCE_SUFFIXES,
)
from tools.knowledge_engine.test_source_policy import (
    is_test_source,
)


class TestSourcePolicyTest(
    unittest.TestCase
):
    def test_recognizes_supported_test_suffixes(
        self,
    ) -> None:
        paths = (
            "service.spec.ts",
            "service.test.ts",
            "service.integration-spec.ts",
            "service.e2e-spec.ts",
        )

        self.assertTrue(
            all(
                is_test_source(path)
                for path in paths
            )
        )

    def test_recognizes_nested_paths(
        self,
    ) -> None:
        self.assertTrue(
            is_test_source(
                "backend/src/core/helpdesk/"
                "helpdesk-ai-policy."
                "integration-spec.ts"
            )
        )

    def test_accepts_pure_posix_path(
        self,
    ) -> None:
        self.assertTrue(
            is_test_source(
                PurePosixPath(
                    "src/module/controller.spec.ts"
                )
            )
        )

    def test_rejects_production_sources(
        self,
    ) -> None:
        paths = (
            "service.ts",
            "controller.ts",
            "module.ts",
            "repository.ts",
            "integration-service.ts",
            "specification.ts",
        )

        self.assertFalse(
            any(
                is_test_source(path)
                for path in paths
            )
        )

    def test_suffix_policy_is_deterministic(
        self,
    ) -> None:
        self.assertEqual(
            TEST_SOURCE_SUFFIXES,
            (
                ".integration-spec.ts",
                ".e2e-spec.ts",
                ".spec.ts",
                ".test.ts",
            ),
        )


if __name__ == "__main__":
    unittest.main()
