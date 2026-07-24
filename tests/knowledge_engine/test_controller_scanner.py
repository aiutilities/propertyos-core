from __future__ import annotations

import json
import tempfile
import unittest
from collections import Counter
from pathlib import Path

from tools.knowledge_engine.controller_scanner import (
    ControllerScanner,
)
from tools.knowledge_engine.controller_writer import (
    ControllerKnowledgeWriter,
)


class ControllerScannerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.repository_root = (
            Path(__file__).resolve().parents[2]
        )

        self.manifest = ControllerScanner(
            self.repository_root
        ).scan()

    def controller(
        self,
        class_name: str,
    ):
        for controller in self.manifest.controllers:
            if controller.class_name == class_name:
                return controller

        self.fail(
            f"Controller not found: {class_name}"
        )

    def test_discovers_all_controller_files(self) -> None:
        self.assertEqual(
            self.manifest.controller_count,
            63,
        )

    def test_discovers_expected_route_count(self) -> None:
        self.assertEqual(
            self.manifest.route_count,
            461,
        )

    def test_discovers_http_method_counts(self) -> None:
        counts = Counter(
            route.http_method
            for controller in self.manifest.controllers
            for route in controller.routes
        )

        self.assertEqual(counts["GET"], 204)
        self.assertEqual(counts["POST"], 219)
        self.assertEqual(counts["PATCH"], 35)
        self.assertEqual(counts["DELETE"], 3)

    def test_inventory_controller_base_path(self) -> None:
        controller = self.controller(
            "InventoryController"
        )

        self.assertEqual(
            controller.module_id,
            "inventory",
        )

        self.assertEqual(
            controller.base_path,
            "/inventory",
        )

        self.assertIn(
            "JwtAuthGuard",
            controller.guards,
        )

        self.assertIn(
            "PermissionGuard",
            controller.guards,
        )

    def test_inventory_items_route(self) -> None:
        controller = self.controller(
            "InventoryController"
        )

        routes = {
            (
                route.http_method,
                route.full_path,
                route.handler,
            )
            for route in controller.routes
        }

        self.assertIn(
            (
                "GET",
                "/inventory/items",
                "listItems",
            ),
            routes,
        )

        self.assertIn(
            (
                "POST",
                "/inventory/items",
                "createItem",
            ),
            routes,
        )

        self.assertIn(
            (
                "PATCH",
                "/inventory/items/:id",
                "updateItem",
            ),
            routes,
        )

    def test_multiline_controller_path(self) -> None:
        controller = self.controller(
            "InventoryMaterialReturnController"
        )

        self.assertEqual(
            controller.base_path,
            "/inventory/material-returns",
        )

    def test_empty_controller_path(self) -> None:
        identity = self.controller(
            "IdentityController"
        )

        self.assertEqual(
            identity.base_path,
            "/",
        )

    def test_plugin_controller_ownership(self) -> None:
        visitor = self.controller(
            "VisitorController"
        )

        self.assertEqual(
            visitor.module_id,
            "plugin:visitor",
        )

        self.assertEqual(
            visitor.base_path,
            "/plugins/visitor",
        )

    def test_route_paths_are_normalised(self) -> None:
        for controller in self.manifest.controllers:
            self.assertTrue(
                controller.base_path.startswith("/")
            )

            for route in controller.routes:
                self.assertTrue(
                    route.full_path.startswith("/")
                )

                self.assertNotIn(
                    "//",
                    route.full_path,
                )

    def test_routes_include_source_lines(self) -> None:
        for controller in self.manifest.controllers:
            self.assertGreater(
                controller.source.line,
                0,
            )

            for route in controller.routes:
                self.assertGreater(
                    route.source.line,
                    0,
                )

    def test_routes_include_controller_class_name(self) -> None:
        for controller in self.manifest.controllers:
            for route in controller.routes:
                self.assertEqual(
                    route.controller_class_name,
                    controller.class_name,
                )

    def test_routes_include_handler_lines(self) -> None:
        for controller in self.manifest.controllers:
            for route in controller.routes:
                self.assertGreater(
                    route.handler_line,
                    route.source.line,
                )

    def test_routes_inherit_controller_bearer_auth(self) -> None:
        for controller in self.manifest.controllers:
            for route in controller.routes:
                self.assertEqual(
                    route.bearer_auth,
                    controller.bearer_auth,
                )

    def test_controller_ids_are_unique(self) -> None:
        controller_ids = [
            controller.id
            for controller in self.manifest.controllers
        ]

        self.assertEqual(
            len(controller_ids),
            len(set(controller_ids)),
        )

    def test_route_ids_are_unique(self) -> None:
        route_ids = [
            route.id
            for controller in self.manifest.controllers
            for route in controller.routes
        ]

        self.assertEqual(
            len(route_ids),
            len(set(route_ids)),
        )

    def test_output_is_deterministic(self) -> None:
        scanner = ControllerScanner(
            self.repository_root
        )

        with tempfile.TemporaryDirectory() as directory:
            writer = ControllerKnowledgeWriter(
                Path(directory)
            )

            first_file = writer.write(
                scanner.scan()
            )
            first_content = first_file.read_bytes()

            second_file = writer.write(
                scanner.scan()
            )
            second_content = second_file.read_bytes()

        self.assertEqual(
            first_content,
            second_content,
        )

    def test_generated_document_is_valid_json(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output_file = ControllerKnowledgeWriter(
                Path(directory)
            ).write(self.manifest)

            document = json.loads(
                output_file.read_text(
                    encoding="utf-8"
                )
            )

        self.assertEqual(
            document["schemaVersion"],
            "1.0.0",
        )

        self.assertEqual(
            document["controllerCount"],
            len(document["controllers"]),
        )

        calculated_route_count = sum(
            controller["routeCount"]
            for controller in document["controllers"]
        )

        self.assertEqual(
            document["routeCount"],
            calculated_route_count,
        )


if __name__ == "__main__":
    unittest.main()
