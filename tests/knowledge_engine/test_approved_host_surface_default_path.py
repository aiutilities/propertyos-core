from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

from tools.knowledge_engine.approved_host_surface import (
    DEFAULT_APPROVED_HOST_SURFACE_PATH,
)
from tools.knowledge_engine.approved_host_surface import (
    load_approved_host_surface,
)


class ApprovedHostSurfaceDefaultPathTest(
    unittest.TestCase
):
    def test_default_surface_loads_from_tool_package(
        self,
    ) -> None:
        surface = load_approved_host_surface()

        self.assertEqual(
            surface.package_name,
            "@propertyos/core-contracts",
        )
        self.assertEqual(
            surface.host_api_version,
            "0.1.0",
        )
        self.assertEqual(
            len(surface.symbols),
            40,
        )

    def test_default_path_is_not_cwd_dependent(
        self,
    ) -> None:
        original = Path.cwd()

        with tempfile.TemporaryDirectory() as value:
            try:
                import os

                os.chdir(value)
                surface = load_approved_host_surface()
            finally:
                os.chdir(original)

        self.assertEqual(
            len(surface.symbols),
            40,
        )

    def test_default_path_exists(
        self,
    ) -> None:
        self.assertTrue(
            DEFAULT_APPROVED_HOST_SURFACE_PATH.is_file()
        )


if __name__ == "__main__":
    unittest.main()
