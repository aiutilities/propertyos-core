from __future__ import annotations

from pathlib import PurePosixPath


TEST_SOURCE_SUFFIXES = (
    ".integration-spec.ts",
    ".e2e-spec.ts",
    ".spec.ts",
    ".test.ts",
)


def is_test_source(
    path: str | PurePosixPath,
) -> bool:
    """
    Return whether a TypeScript path represents a
    test-only source artifact.

    The longest suffixes appear first for clarity,
    although ``str.endswith`` would correctly match
    the complete tuple in any order.
    """

    filename = PurePosixPath(
        str(path).replace("\\", "/")
    ).name

    return filename.endswith(
        TEST_SOURCE_SUFFIXES
    )
