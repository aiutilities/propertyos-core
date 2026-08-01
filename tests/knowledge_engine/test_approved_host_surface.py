from __future__ import annotations

from pathlib import Path
import json
import unittest

from tools.knowledge_engine.approved_host_surface import (
    ApprovedHostSurfaceError,
)
from tools.knowledge_engine.approved_host_surface import (
    load_approved_host_surface,
)


MANIFEST = Path(
    "tools/knowledge_engine/contracts/"
    "approved_host_surface.json"
)


class ApprovedHostSurfaceTest(unittest.TestCase):
    def test_manifest_loads(self) -> None:
        surface = load_approved_host_surface(
            MANIFEST
        )

        self.assertEqual(
            surface.source_strategy,
            "portable-facade",
        )
        self.assertEqual(
            surface.default_decision,
            "deny",
        )
        self.assertFalse(
            surface.unlisted_symbols_allowed
        )
        self.assertFalse(
            surface
            .repository_implementation_exports_allowed
        )
        self.assertGreater(
            len(surface.symbols),
            0,
        )

    def test_all_symbols_are_unique(
        self,
    ) -> None:
        surface = load_approved_host_surface(
            MANIFEST
        )

        keys = [
            (
                item.module_id,
                item.symbol,
                item.kind,
            )
            for item in surface.symbols
        ]

        self.assertEqual(
            len(keys),
            len(set(keys)),
        )

    def test_unlisted_symbol_is_denied(
        self,
    ) -> None:
        surface = load_approved_host_surface(
            MANIFEST
        )

        self.assertFalse(
            surface.permits(
                module_id="unknown",
                symbol="UnknownSymbol",
                kind="runtime",
            )
        )

    def test_manifest_is_deterministically_sorted(
        self,
    ) -> None:
        data = json.loads(
            MANIFEST.read_text(encoding="utf-8")
        )

        module_ids = [
            module["moduleId"]
            for module in data["modules"]
        ]

        self.assertEqual(
            module_ids,
            sorted(module_ids),
        )

        for module in data["modules"]:
            symbols = module["symbols"]
            expected = sorted(
                symbols,
                key=lambda item: (
                    item["symbol"],
                    item["kind"],
                    item["sourcePath"],
                ),
            )

            self.assertEqual(
                symbols,
                expected,
            )

    def test_invalid_strategy_is_rejected(
        self,
    ) -> None:
        data = json.loads(
            MANIFEST.read_text(encoding="utf-8")
        )
        data["sourceStrategy"] = (
            "repository-reexport"
        )

        temporary = Path(
            "/tmp/propertyos-invalid-host-surface.json"
        )
        temporary.write_text(
            json.dumps(data),
            encoding="utf-8",
        )

        try:
            with self.assertRaises(
                ApprovedHostSurfaceError
            ):
                load_approved_host_surface(
                    temporary
                )
        finally:
            temporary.unlink(
                missing_ok=True
            )


if __name__ == "__main__":
    unittest.main()
