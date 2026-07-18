from __future__ import annotations

import io
import json
import tarfile
import tempfile
import unittest
import zipfile
from pathlib import Path

from tools.knowledge_engine.marketplace_bundle_builder import (
    MarketplaceBundleBuilder,
    MarketplaceBundleError,
)


class MarketplaceBundleBuilderTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.temporary = (
            tempfile.TemporaryDirectory()
        )
        self.root = Path(
            self.temporary.name
        )

        artifact_root = (
            self.root
            / "generated/plugin-artifacts"
        )
        artifact_root.mkdir(
            parents=True
        )

        self.artifact_path = (
            artifact_root
            / (
                "propertyos-plugin-"
                "helpdesk-0.1.0.tgz"
            )
        )

        self._write_artifact(
            self.artifact_path
        )

        knowledge = (
            self.root
            / "generated/knowledge"
        )
        knowledge.mkdir(
            parents=True
        )

        self.package_report = (
            knowledge / "packages.json"
        )
        self.package_report.write_text(
            json.dumps(
                {
                    "artifacts": [
                        {
                            "moduleId": (
                                "helpdesk"
                            ),
                            "pluginId": (
                                "helpdesk"
                            ),
                            "packageName": (
                                "@propertyos/"
                                "plugin-helpdesk"
                            ),
                            "version": "0.1.0",
                            "artifactPath": (
                                "generated/"
                                "plugin-artifacts/"
                                "propertyos-plugin-"
                                "helpdesk-0.1.0.tgz"
                            ),
                        }
                    ]
                }
            ),
            encoding="utf-8",
        )

        self.manifest_report = (
            knowledge / "manifests.json"
        )
        self.manifest_report.write_text(
            json.dumps(
                {
                    "manifests": {
                        "helpdesk": {
                            "id": "helpdesk",
                            "name": "Helpdesk",
                            "version": "0.1.0",
                            "provider": (
                                "PropertyOS"
                            ),
                            "entrypoint": (
                                "dist/index.js"
                            ),
                            "bootstrap": (
                                "dist/index.js"
                            ),
                            "dependencies": [],
                            (
                                "platformCapabilities"
                            ): [
                                "auth",
                                "eventbus",
                            ],
                        }
                    }
                }
            ),
            encoding="utf-8",
        )

        self.bundle_root = (
            self.root
            / "generated/plugin-bundles"
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _builder(
        self,
    ) -> MarketplaceBundleBuilder:
        return MarketplaceBundleBuilder(
            repository_root=self.root,
            package_portfolio_path=(
                self.package_report
            ),
            marketplace_manifests_path=(
                self.manifest_report
            ),
            bundle_root=self.bundle_root,
        )

    @staticmethod
    def _write_artifact(
        path: Path,
        unsafe: bool = False,
        omit_index: bool = False,
    ) -> None:
        files = {
            "package/package.json": (
                b'{"name":"@propertyos/'
                b'plugin-helpdesk",'
                b'"version":"0.1.0"}'
            ),
            "package/plugin.json": (
                b'{"id":"old"}'
            ),
            "package/README.md": (
                b"# Helpdesk\n"
            ),
            "package/dist/index.d.ts": (
                b"export {};\n"
            ),
        }

        if not omit_index:
            files[
                "package/dist/index.js"
            ] = b'"use strict";\n'

        if unsafe:
            files[
                "package/../escape.txt"
            ] = b"unsafe"

        with tarfile.open(
            path,
            mode="w:gz",
        ) as archive:
            for name, content in (
                files.items()
            ):
                info = tarfile.TarInfo(
                    name=name
                )
                info.size = len(content)
                archive.addfile(
                    info,
                    io.BytesIO(content),
                )

    def test_builds_verified_zip_bundle(
        self,
    ) -> None:
        result = self._builder().build()

        self.assertTrue(
            result["summary"][
                "successful"
            ]
        )
        self.assertEqual(
            1,
            result["summary"][
                "passedCount"
            ],
        )

        bundle = result["bundles"][0]

        self.assertTrue(
            (
                self.root
                / bundle["bundlePath"]
            ).is_file()
        )
        self.assertEqual(
            "zip",
            bundle["installerFormat"],
        )

    def test_places_manifest_at_zip_root(
        self,
    ) -> None:
        result = self._builder().build()
        path = (
            self.root
            / result["bundles"][0][
                "bundlePath"
            ]
        )

        with zipfile.ZipFile(path) as archive:
            names = archive.namelist()
            manifest = json.loads(
                archive.read(
                    "plugin.json"
                )
            )

        self.assertIn(
            "plugin.json",
            names,
        )
        self.assertNotIn(
            "package/plugin.json",
            names,
        )
        self.assertEqual(
            "PropertyOS",
            manifest["provider"],
        )

    def test_bundle_contains_runtime_entrypoint(
        self,
    ) -> None:
        result = self._builder().build()
        path = (
            self.root
            / result["bundles"][0][
                "bundlePath"
            ]
        )

        with zipfile.ZipFile(path) as archive:
            names = set(
                archive.namelist()
            )

        self.assertIn(
            "dist/index.js",
            names,
        )
        self.assertIn(
            "dist/index.d.ts",
            names,
        )
        self.assertIn(
            "bundle-manifest.json",
            names,
        )

    def test_bundle_is_deterministic(
        self,
    ) -> None:
        first = self._builder().build(
            overwrite=True
        )["bundles"][0]["sha256"]

        second = self._builder().build(
            overwrite=True
        )["bundles"][0]["sha256"]

        self.assertEqual(
            first,
            second,
        )

    def test_requires_overwrite(
        self,
    ) -> None:
        self._builder().build()

        with self.assertRaisesRegex(
            MarketplaceBundleError,
            "already exists",
        ):
            self._builder().build(
                overwrite=False
            )

    def test_rejects_unsafe_tar_entry(
        self,
    ) -> None:
        self._write_artifact(
            self.artifact_path,
            unsafe=True,
        )

        with self.assertRaisesRegex(
            MarketplaceBundleError,
            "Unsafe",
        ):
            self._builder().build()

    def test_rejects_missing_runtime_entrypoint(
        self,
    ) -> None:
        self._write_artifact(
            self.artifact_path,
            omit_index=True,
        )

        with self.assertRaisesRegex(
            MarketplaceBundleError,
            "missing required",
        ):
            self._builder().build()

    def test_rejects_unknown_module_selection(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            MarketplaceBundleError,
            "Unknown",
        ):
            self._builder().build(
                module_ids=("missing",)
            )


if __name__ == "__main__":
    unittest.main()
