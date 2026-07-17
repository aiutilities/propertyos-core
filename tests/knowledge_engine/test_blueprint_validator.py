from __future__ import annotations

import json
import unittest
from pathlib import Path
from unittest.mock import patch

from tools.knowledge_engine.blueprint_validation_formatter import (
    format_validation_json,
    format_validation_markdown,
)
from tools.knowledge_engine.blueprint_validation_models import (
    BlueprintValidationRequest,
)
from tools.knowledge_engine.blueprint_validator import (
    BlueprintValidationError,
    PluginBlueprintValidator,
)
from tools.knowledge_engine.repository_api import (
    Repository,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class BlueprintValidatorTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repository = Repository.load(
            REPOSITORY_ROOT
        )

        cls.validator = (
            PluginBlueprintValidator(
                cls.repository,
                REPOSITORY_ROOT,
            )
        )

    def test_helpdesk_blueprint_is_valid(
        self,
    ) -> None:
        portfolio = self.validator.validate(
            BlueprintValidationRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        self.assertTrue(
            portfolio.valid
        )

        self.assertTrue(
            portfolio.results[0].valid
        )

        self.assertEqual(
            0,
            portfolio.summary[
                "errorCount"
            ],
        )

    def test_helpdesk_operations_are_executable(
        self,
    ) -> None:
        result = self.validator.validate(
            BlueprintValidationRequest(
                mode="module",
                module_id="helpdesk",
            )
        ).results[0]

        self.assertTrue(
            all(
                operation.executable
                for operation
                in result.operations
            )
        )

    def test_inventory_controller_coverage(
        self,
    ) -> None:
        result = self.validator.validate(
            BlueprintValidationRequest(
                mode="module",
                module_id="inventory",
            )
        ).results[0]

        controller_operations = [
            operation
            for operation
            in result.operations
            if operation.file_kind
            == "controller"
        ]

        self.assertEqual(
            8,
            len(controller_operations),
        )

    def test_candidate_validation_count(
        self,
    ) -> None:
        portfolio = self.validator.validate(
            BlueprintValidationRequest(
                mode="candidates"
            )
        )

        self.assertEqual(
            16,
            portfolio.summary[
                "blueprintCount"
            ],
        )

    def test_candidate_limit(
        self,
    ) -> None:
        portfolio = self.validator.validate(
            BlueprintValidationRequest(
                mode="candidates",
                limit=5,
            )
        )

        self.assertEqual(
            5,
            len(portfolio.results),
        )

    def test_missing_source_is_detected(
        self,
    ) -> None:
        with patch.object(
            self.validator,
            "_source_exists",
            return_value=False,
        ):
            portfolio = (
                self.validator.validate(
                    BlueprintValidationRequest(
                        mode="module",
                        module_id="helpdesk",
                    )
                )
            )

        self.assertFalse(
            portfolio.valid
        )

        codes = {
            issue.code
            for issue
            in portfolio.results[0].issues
        }

        self.assertIn(
            "SOURCE_FILE_MISSING",
            codes,
        )

    def test_existing_target_is_detected(
        self,
    ) -> None:
        with patch.object(
            self.validator,
            "_target_exists",
            return_value=True,
        ):
            portfolio = (
                self.validator.validate(
                    BlueprintValidationRequest(
                        mode="module",
                        module_id="helpdesk",
                    )
                )
            )

        self.assertFalse(
            portfolio.valid
        )

        codes = {
            issue.code
            for issue
            in portfolio.results[0].issues
        }

        self.assertIn(
            "TARGET_PATH_EXISTS",
            codes,
        )

    def test_json_is_valid_and_deterministic(
        self,
    ) -> None:
        portfolio = self.validator.validate(
            BlueprintValidationRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        first = format_validation_json(
            portfolio
        )

        second = format_validation_json(
            portfolio
        )

        self.assertEqual(first, second)

        value = json.loads(first)

        self.assertEqual(
            "1.0.0",
            value["schemaVersion"],
        )

        self.assertTrue(value["valid"])

    def test_markdown_is_deterministic(
        self,
    ) -> None:
        portfolio = self.validator.validate(
            BlueprintValidationRequest(
                mode="module",
                module_id="helpdesk",
            )
        )

        first = (
            format_validation_markdown(
                portfolio
            )
        )

        second = (
            format_validation_markdown(
                portfolio
            )
        )

        self.assertEqual(first, second)

        self.assertIn(
            "# PropertyOS Blueprint Validation",
            first,
        )

        self.assertIn(
            "## Module: helpdesk",
            first,
        )

    def test_operation_sequences_are_contiguous(
        self,
    ) -> None:
        result = self.validator.validate(
            BlueprintValidationRequest(
                mode="module",
                module_id="helpdesk",
            )
        ).results[0]

        self.assertEqual(
            tuple(
                range(
                    1,
                    len(result.operations) + 1,
                )
            ),
            tuple(
                operation.sequence
                for operation
                in result.operations
            ),
        )

    def test_missing_module_fails(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            self.validator.validate(
                BlueprintValidationRequest(
                    mode="module"
                )
            )

    def test_invalid_limit_fails(
        self,
    ) -> None:
        with self.assertRaises(
            BlueprintValidationError
        ):
            self.validator.validate(
                BlueprintValidationRequest(
                    mode="candidates",
                    limit=0,
                )
            )


if __name__ == "__main__":
    unittest.main()
