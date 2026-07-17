from __future__ import annotations

import unittest

from tools.knowledge_engine.contract_package_cli import (
    _validate_arguments,
)
from tools.knowledge_engine.contract_package_cli import (
    build_parser,
)
from tools.knowledge_engine.contract_package_cli import (
    main,
)


class ContractPackageCliTest(
    unittest.TestCase
):
    def test_parser_defaults_to_dry_run_json(
        self,
    ) -> None:
        arguments = build_parser().parse_args(
            [
                "module",
                "helpdesk",
            ]
        )

        self.assertEqual(
            arguments.mode,
            "module",
        )

        self.assertEqual(
            arguments.module_id,
            "helpdesk",
        )

        self.assertEqual(
            arguments.format,
            "json",
        )

        self.assertFalse(arguments.apply)
        self.assertFalse(arguments.overwrite)

        self.assertEqual(
            arguments.output_root,
            "generated/contracts",
        )

    def test_parser_supports_apply_and_overwrite(
        self,
    ) -> None:
        arguments = build_parser().parse_args(
            [
                "--apply",
                "--overwrite",
                "--format",
                "markdown",
                "module",
                "helpdesk",
            ]
        )

        _validate_arguments(arguments)

        self.assertTrue(arguments.apply)
        self.assertTrue(arguments.overwrite)

        self.assertEqual(
            arguments.format,
            "markdown",
        )

    def test_overwrite_requires_apply(
        self,
    ) -> None:
        arguments = build_parser().parse_args(
            [
                "--overwrite",
                "module",
                "helpdesk",
            ]
        )

        with self.assertRaisesRegex(
            ValueError,
            "--overwrite requires --apply",
        ):
            _validate_arguments(arguments)

    def test_module_mode_requires_module_id(
        self,
    ) -> None:
        arguments = build_parser().parse_args(
            [
                "module",
            ]
        )

        with self.assertRaisesRegex(
            ValueError,
            "module mode requires module_id",
        ):
            _validate_arguments(arguments)

    def test_main_returns_two_for_invalid_options(
        self,
    ) -> None:
        result = main(
            [
                "--overwrite",
                "module",
                "helpdesk",
            ]
        )

        self.assertEqual(result, 2)


if __name__ == "__main__":
    unittest.main()
