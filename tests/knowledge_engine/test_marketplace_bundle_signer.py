from __future__ import annotations

import json
import os
import stat
import subprocess
import tempfile
import unittest
import zipfile
from pathlib import Path

from tools.knowledge_engine.marketplace_bundle_signer import (
    MarketplaceBundleSigner,
    MarketplaceBundleSigningError,
)


class MarketplaceBundleSignerTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.temporary = (
            tempfile.TemporaryDirectory()
        )
        self.temporary_root = Path(
            self.temporary.name
        )
        self.repository_root = (
            self.temporary_root
            / "repository"
        )
        self.source_root = (
            self.repository_root
            / "generated/plugin-bundles"
        )
        self.output_root = (
            self.repository_root
            / "generated/plugin-signed-bundles"
        )
        self.source_root.mkdir(
            parents=True
        )
        self.source_bundle = (
            self.source_root
            / "visitor-1.0.0.zip"
        )
        self._write_source_bundle(
            self.source_bundle
        )

        self.private_key = (
            self.temporary_root
            / "signing.private.pem"
        )
        self._run_openssl(
            "genpkey",
            "-algorithm",
            "RSA",
            "-pkeyopt",
            "rsa_keygen_bits:2048",
            "-out",
            str(self.private_key),
        )
        os.chmod(
            self.private_key,
            stat.S_IRUSR |
            stat.S_IWUSR,
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _signer(
        self,
        private_key: Path | None = None,
    ) -> MarketplaceBundleSigner:
        return MarketplaceBundleSigner(
            repository_root=(
                self.repository_root
            ),
            source_root=(
                self.source_root
            ),
            output_root=(
                self.output_root
            ),
            publisher_id="propertyos",
            key_id="release-2026",
            private_key_path=(
                private_key
                or self.private_key
            ),
        )

    def test_signs_and_self_verifies_bundle(
        self,
    ) -> None:
        result = self._signer().sign()
        bundle = result["bundles"][0]
        signed_path = (
            self.repository_root
            / bundle["signedPath"]
        )

        self.assertTrue(
            signed_path.is_file()
        )
        self.assertTrue(
            bundle["verified"]
        )
        self.assertRegex(
            result[
                "publicKeyFingerprintSha256"
            ],
            r"^[a-f0-9]{64}$",
        )

        with zipfile.ZipFile(
            signed_path
        ) as archive:
            names = archive.namelist()
            integrity_bytes = (
                archive.read(
                    "plugin.integrity.json"
                )
            )
            integrity = json.loads(
                integrity_bytes
            )
            signature = archive.read(
                "plugin.signature"
            )

        self.assertEqual(
            sorted(names),
            names,
        )
        self.assertIn(
            "plugin.integrity.json",
            names,
        )
        self.assertIn(
            "plugin.signature",
            names,
        )
        self.assertNotIn(
            "signature.public.pem",
            names,
        )
        self.assertTrue(signature)
        self.assertEqual(
            "propertyos",
            integrity["publisherId"],
        )
        self.assertEqual(
            "release-2026",
            integrity["keyId"],
        )
        self.assertEqual(
            "RSA-SHA256",
            integrity["algorithm"],
        )
        self.assertEqual(
            [
                "README.md",
                "bundle-manifest.json",
                "dist/index.js",
                "package.json",
                "plugin.json",
            ],
            [
                entry["path"]
                for entry
                in integrity["files"]
            ],
        )

    def test_signed_output_is_deterministic(
        self,
    ) -> None:
        first = self._signer().sign(
            overwrite=True
        )["bundles"][0]["sha256"]
        second = self._signer().sign(
            overwrite=True
        )["bundles"][0]["sha256"]

        self.assertEqual(
            first,
            second,
        )

    def test_detects_tampered_signed_file(
        self,
    ) -> None:
        result = self._signer().sign()
        signed_path = (
            self.repository_root
            / result["bundles"][0][
                "signedPath"
            ]
        )

        with zipfile.ZipFile(
            signed_path
        ) as source:
            files = {
                info.filename:
                    source.read(info)
                for info in source.infolist()
                if not info.is_dir()
            }

        files["dist/index.js"] = (
            b"tampered"
        )

        with zipfile.ZipFile(
            signed_path,
            mode="w",
            compression=(
                zipfile.ZIP_DEFLATED
            ),
        ) as target:
            for name in sorted(files):
                target.writestr(
                    name,
                    files[name],
                )

        with self.assertRaisesRegex(
            MarketplaceBundleSigningError,
            "integrity mismatch",
        ):
            self._signer().verify_signed_bundle(
                signed_path
            )

    def test_rejects_private_key_inside_repository(
        self,
    ) -> None:
        unsafe_key = (
            self.repository_root
            / "signing.private.pem"
        )
        unsafe_key.write_bytes(
            self.private_key.read_bytes()
        )
        os.chmod(
            unsafe_key,
            stat.S_IRUSR |
            stat.S_IWUSR,
        )

        with self.assertRaisesRegex(
            MarketplaceBundleSigningError,
            "outside the repository",
        ):
            self._signer(
                unsafe_key
            )

    def test_rejects_permissive_key_permissions(
        self,
    ) -> None:
        os.chmod(
            self.private_key,
            stat.S_IRUSR |
            stat.S_IWUSR |
            stat.S_IRGRP,
        )

        with self.assertRaisesRegex(
            MarketplaceBundleSigningError,
            "permissions",
        ):
            self._signer()

    def test_rejects_already_signed_source(
        self,
    ) -> None:
        self._write_source_bundle(
            self.source_bundle,
            extra={
                "plugin.signature":
                    b"untrusted",
            },
        )

        with self.assertRaisesRegex(
            MarketplaceBundleSigningError,
            "already signed",
        ):
            self._signer().sign()

    @staticmethod
    def _write_source_bundle(
        path: Path,
        extra: dict[str, bytes] |
        None = None,
    ) -> None:
        files = {
            "README.md":
                b"# Visitor\n",
            "bundle-manifest.json":
                b'{"version":"1.0.0"}\n',
            "dist/index.js":
                b'"use strict";\n',
            "package.json":
                b'{"name":"visitor"}\n',
            "plugin.json":
                b'{"id":"visitor"}\n',
            **(extra or {}),
        }

        with zipfile.ZipFile(
            path,
            mode="w",
            compression=(
                zipfile.ZIP_DEFLATED
            ),
            compresslevel=9,
        ) as archive:
            for name in sorted(files):
                info = zipfile.ZipInfo(
                    filename=name,
                    date_time=(
                        1980,
                        1,
                        1,
                        0,
                        0,
                        0,
                    ),
                )
                info.compress_type = (
                    zipfile.ZIP_DEFLATED
                )
                info.external_attr = (
                    0o100644 << 16
                )
                info.create_system = 3
                archive.writestr(
                    info,
                    files[name],
                    compress_type=(
                        zipfile.ZIP_DEFLATED
                    ),
                    compresslevel=9,
                )

    @staticmethod
    def _run_openssl(
        *arguments: str,
    ) -> None:
        subprocess.run(
            (
                "openssl",
                *arguments,
            ),
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


if __name__ == "__main__":
    unittest.main()
