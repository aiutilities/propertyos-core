from __future__ import annotations

import copy
import json
import unittest

from pathlib import Path

from tools.knowledge_engine.native_schema_validator import (
    NativeSchemaIssue,
    NativeSchemaValidationError,
    NativeSchemaValidator,
)


ROOT = Path(__file__).resolve().parents[2]

SCHEMA_PATH = (
    ROOT
    / "tools"
    / "knowledge_engine"
    / "contracts"
    / "marketplace_plugin_manifest.schema.json"
)

EXAMPLE_PATH = (
    ROOT
    / "tools"
    / "knowledge_engine"
    / "contracts"
    / "examples"
    / "marketplace_plugin_manifest.example.json"
)


def load_json(
    path: Path,
):
    return json.loads(
        path.read_text(
            encoding="utf-8"
        )
    )


class NativeSchemaValidatorTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.validator = (
            NativeSchemaValidator
            .from_path(
                SCHEMA_PATH
            )
        )

        self.example = load_json(
            EXAMPLE_PATH
        )

    def test_accepts_canonical_example(
        self,
    ) -> None:
        self.assertEqual(
            self.validator.validate(
                self.example
            ),
            (),
        )

    def test_require_valid_accepts_example(
        self,
    ) -> None:
        self.validator.require_valid(
            self.example
        )

    def test_rejects_missing_required_property(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        del candidate[
            "publisher"
        ]

        issues = self.validator.validate(
            candidate
        )

        self.assertIn(
            NativeSchemaIssue(
                code="REQUIRED_PROPERTY_MISSING",
                path="$.publisher",
                message=(
                    "Required property is missing."
                ),
            ),
            issues,
        )

    def test_rejects_unknown_top_level_property(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "repositoryOnly"
        ] = True

        issues = self.validator.validate(
            candidate
        )

        self.assertIn(
            NativeSchemaIssue(
                code="UNKNOWN_PROPERTY",
                path="$.repositoryOnly",
                message=(
                    "Property is not allowed by "
                    "the closed schema."
                ),
            ),
            issues,
        )

    def test_rejects_unknown_nested_property(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "publisher"
        ][
            "repositoryOnly"
        ] = True

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "UNKNOWN_PROPERTY"
                and issue.path
                == "$.publisher.repositoryOnly"
                for issue in issues
            )
        )

    def test_rejects_invalid_schema_version(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "schemaVersion"
        ] = "2.0.0"

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "CONST_MISMATCH"
                and issue.path
                == "$.schemaVersion"
                for issue in issues
            )
        )

    def test_rejects_invalid_plugin_id_pattern(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate["id"] = "Bad ID"

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "PATTERN_MISMATCH"
                and issue.path
                == "$.id"
                for issue in issues
            )
        )

    def test_rejects_invalid_enum(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "migrations"
        ][
            "strategy"
        ] = "custom"

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "ENUM_MISMATCH"
                and issue.path
                == "$.migrations.strategy"
                for issue in issues
            )
        )

    def test_rejects_duplicate_array_items(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "permissions"
        ].append(
            candidate[
                "permissions"
            ][0]
        )

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "DUPLICATE_ARRAY_ITEM"
                and issue.path
                == "$.permissions[3]"
                for issue in issues
            )
        )

    def test_rejects_empty_contracts(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "contracts"
        ] = []

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "MIN_ITEMS"
                and issue.path
                == "$.contracts"
                for issue in issues
            )
        )

    def test_rejects_wrong_primitive_type(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "permissions"
        ] = "agreement:read"

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "TYPE_MISMATCH"
                and issue.path
                == "$.permissions"
                for issue in issues
            )
        )

    def test_rejects_invalid_uri(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "homepage"
        ] = ""

        issues = self.validator.validate(
            candidate
        )

        self.assertTrue(
            any(
                issue.code
                == "INVALID_URI"
                and issue.path
                == "$.homepage"
                for issue in issues
            )
        )

    def test_issue_order_is_deterministic(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "schemaVersion"
        ] = "2.0.0"

        candidate[
            "id"
        ] = "Bad ID"

        candidate[
            "unknown"
        ] = True

        first = self.validator.validate(
            candidate
        )

        second = self.validator.validate(
            candidate
        )

        self.assertEqual(
            first,
            second,
        )

        self.assertEqual(
            tuple(
                sorted(
                    first,
                    key=(
                        lambda issue:
                        issue.sort_key()
                    ),
                )
            ),
            first,
        )

    def test_require_valid_raises_sorted_error(
        self,
    ) -> None:
        candidate = copy.deepcopy(
            self.example
        )

        candidate[
            "schemaVersion"
        ] = "2.0.0"

        candidate[
            "unknown"
        ] = True

        with self.assertRaises(
            NativeSchemaValidationError
        ) as context:
            self.validator.require_valid(
                candidate
            )

        self.assertEqual(
            context.exception.issues,
            tuple(
                sorted(
                    context.exception.issues,
                    key=(
                        lambda issue:
                        issue.sort_key()
                    ),
                )
            ),
        )


if __name__ == "__main__":
    unittest.main()
