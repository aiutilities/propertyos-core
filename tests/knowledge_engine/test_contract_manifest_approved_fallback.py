from __future__ import annotations

from pathlib import Path
import json
import tempfile
import unittest

from tools.knowledge_engine.contract_manifest import ContractManifestGenerator
from tools.knowledge_engine.import_analysis_models import ImportReference


class ContractManifestApprovedFallbackTest(unittest.TestCase):
    @staticmethod
    def _write_surface(root: Path) -> None:
        path = root / "tools/knowledge_engine/contracts/approved_host_surface.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({
            "schemaVersion": "1.0.0",
            "packageName": "@propertyos/core-contracts",
            "hostApiVersion": "0.1.0",
            "sourceStrategy": "portable-facade",
            "policy": {
                "defaultDecision": "deny",
                "repositoryImplementationExportsAllowed": False,
                "unlistedSymbolsAllowed": False
            },
            "modules": [{
                "moduleId": "platform",
                "symbols": [{
                    "symbol": "PaginationQueryDto",
                    "kind": "runtime",
                    "sourcePath": "../../../../../backend/src/core/platform/dto/pagination-query.dto",
                    "portable": True
                }]
            }]
        }, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    @staticmethod
    def _reference(symbol: str) -> ImportReference:
        return ImportReference(
            source_file="src/plugin.ts",
            line=1,
            column=1,
            syntax="named-import",
            imported_symbols=(symbol,),
            original_specifier="@propertyos/core-contracts",
            classification="propertyos-package",
            resolution_status="resolved-package",
            resolved_path="",
            target_module="",
            proposed_specifier="@propertyos/core-contracts",
            rewrite_required=False,
            reason="PropertyOS package import.",
        )

    def test_approved_symbol_resolves(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)
            self._write_surface(root)
            source = root / "backend/src/core/platform/dto/pagination-query.dto.ts"
            source.parent.mkdir(parents=True, exist_ok=True)
            source.write_text("export class PaginationQueryDto {}\n", encoding="utf-8")
            generator = ContractManifestGenerator(repository_root=root)
            resolved = generator._approved_package_symbol(
                reference=self._reference("PaginationQueryDto"),
                symbol="PaginationQueryDto",
                package_name="@propertyos/core-contracts",
            )
            self.assertIsNotNone(resolved)
            assert resolved is not None
            self.assertEqual(resolved.target_module, "platform")

    def test_unapproved_symbol_is_denied(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)
            self._write_surface(root)
            generator = ContractManifestGenerator(repository_root=root)
            self.assertIsNone(generator._approved_package_symbol(
                reference=self._reference("UnknownSymbol"),
                symbol="UnknownSymbol",
                package_name="@propertyos/core-contracts",
            ))

    def test_other_package_is_denied(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)
            self._write_surface(root)
            generator = ContractManifestGenerator(repository_root=root)
            self.assertIsNone(generator._approved_package_symbol(
                reference=self._reference("PaginationQueryDto"),
                symbol="PaginationQueryDto",
                package_name="@propertyos/other",
            ))


if __name__ == "__main__":
    unittest.main()
