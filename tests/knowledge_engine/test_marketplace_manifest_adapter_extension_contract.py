from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACT = ROOT / "tools/knowledge_engine/contracts/marketplace_manifest_adapter_extension.json"
SCHEMA = ROOT / "tools/knowledge_engine/contracts/marketplace_plugin_manifest.schema.json"


class MarketplaceManifestAdapterExtensionContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
        self.schema = json.loads(SCHEMA.read_text(encoding="utf-8"))

    def test_contract_version(self) -> None:
        self.assertEqual(self.contract["schemaVersion"], "1.0.0")

    def test_target_is_closed_v1_schema(self) -> None:
        target = self.contract["targetContract"]
        self.assertEqual(target["schemaVersion"], self.schema["properties"]["schemaVersion"]["const"])
        self.assertTrue(target["closed"])
        self.assertFalse(self.schema["additionalProperties"])

    def test_existing_adapter_is_preserved_without_jsonschema(self) -> None:
        boundary = self.contract["implementationBoundary"]
        self.assertTrue(boundary["existingAdapterPreserved"])
        self.assertFalse(boundary["externalJsonSchemaDependencyAllowed"])

    def test_required_source_fields(self) -> None:
        self.assertEqual(
            set(self.contract["sourceContract"]["requiredFields"]),
            {"id", "name", "version", "dependencies", "permissions"},
        )

    def test_required_target_fields_are_produced(self) -> None:
        produced = {
            item["target"] for item in self.contract["fieldMappings"]
            if item["target"] is not None
        }
        produced.update(
            item["target"].split(".", 1)[0]
            for item in self.contract["contextInjections"]
        )
        self.assertEqual(set(self.schema["required"]) - produced, set())

    def test_repository_metadata_is_dropped(self) -> None:
        dropped = {
            item["source"] for item in self.contract["fieldMappings"]
            if item["target"] is None
        }
        self.assertEqual(dropped, {"controllers", "materialization", "moduleClass", "package", "routes", "type"})

    def test_default_deny(self) -> None:
        policy = self.contract["failurePolicy"]
        self.assertEqual(policy["mode"], "default-deny")
        self.assertFalse(policy["partialManifestAllowed"])
        self.assertFalse(policy["mutationBeforeValidation"])
        decisions = {v for k, v in policy.items() if k not in {"mode", "partialManifestAllowed", "mutationBeforeValidation"}}
        self.assertEqual(decisions, {"reject"})

    def test_validation_order(self) -> None:
        self.assertEqual(self.contract["validationStages"][-2:], ["target-schema", "determinism"])


if __name__ == "__main__":
    unittest.main()
