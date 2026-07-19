from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any, Mapping, Sequence


class MarketplaceBundleSigningError(
    ValueError
):
    pass


class MarketplaceBundleSigner:
    SCHEMA_VERSION = "1.0.0"
    INTEGRITY_SCHEMA_VERSION = 1
    ALGORITHM = "RSA-SHA256"
    INTEGRITY_FILE = (
        "plugin.integrity.json"
    )
    SIGNATURE_FILE = "plugin.signature"
    EMBEDDED_KEY_FILE = (
        "signature.public.pem"
    )
    ZIP_TIMESTAMP = (
        1980,
        1,
        1,
        0,
        0,
        0,
    )
    MAXIMUM_ENTRIES = 2048
    MAXIMUM_ENTRY_BYTES = (
        64 * 1024 * 1024
    )
    MAXIMUM_EXPANDED_BYTES = (
        256 * 1024 * 1024
    )
    MAXIMUM_COMPRESSION_RATIO = 100
    IDENTIFIER_PATTERN = re.compile(
        r"^[a-z0-9][a-z0-9._-]{0,149}$"
    )

    def __init__(
        self,
        repository_root: Path,
        source_root: Path,
        output_root: Path,
        publisher_id: str,
        key_id: str,
        private_key_path: Path,
        openssl_executable: str = (
            "openssl"
        ),
    ) -> None:
        self.repository_root = (
            repository_root.resolve()
        )
        self.source_root = self._safe_path(
            source_root,
            "Source bundle root",
        )
        self.output_root = self._safe_path(
            output_root,
            "Signed bundle root",
        )
        self.publisher_id = (
            self._identifier(
                publisher_id,
                "Publisher ID",
            )
        )
        self.key_id = self._identifier(
            key_id,
            "Key ID",
        )
        self.private_key_path = (
            private_key_path.resolve()
        )
        self.openssl_executable = (
            openssl_executable
        )

        self._assert_distinct_roots()
        self._assert_private_key()

    def sign(
        self,
        bundle_names: Sequence[
            str
        ] | None = None,
        overwrite: bool = False,
    ) -> dict[str, Any]:
        sources = self._sources(
            bundle_names
        )
        self.output_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(
                temporary
            )
            public_key_path = (
                temporary_root
                / "public.pem"
            )
            self._derive_public_key(
                public_key_path
            )
            fingerprint = (
                self._public_key_fingerprint(
                    public_key_path
                )
            )

            bundles = tuple(
                self._sign_bundle(
                    source_path=source,
                    output_path=(
                        self.output_root
                        / source.name
                    ),
                    public_key_path=(
                        public_key_path
                    ),
                    temporary_root=(
                        temporary_root
                    ),
                    overwrite=overwrite,
                )
                for source in sources
            )

        return {
            "schemaVersion": (
                self.SCHEMA_VERSION
            ),
            "algorithm": self.ALGORITHM,
            "publisherId": (
                self.publisher_id
            ),
            "keyId": self.key_id,
            "publicKeyFingerprintSha256": (
                fingerprint
            ),
            "sourceRoot": self._display_path(
                self.source_root
            ),
            "outputRoot": self._display_path(
                self.output_root
            ),
            "bundles": list(bundles),
            "summary": {
                "bundleCount": len(bundles),
                "signedCount": len(bundles),
                "failedCount": 0,
                "successful": True,
            },
        }

    def verify_signed_bundle(
        self,
        bundle_path: Path,
    ) -> dict[str, Any]:
        resolved = self._safe_path(
            bundle_path,
            "Signed bundle",
        )

        with tempfile.TemporaryDirectory() as temporary:
            temporary_root = Path(
                temporary
            )
            public_key_path = (
                temporary_root
                / "public.pem"
            )
            self._derive_public_key(
                public_key_path
            )

            files = self._read_zip(
                resolved,
                allow_signature_files=True,
            )
            self._verify_signed_files(
                files=files,
                public_key_path=(
                    public_key_path
                ),
                temporary_root=(
                    temporary_root
                ),
            )

        data = resolved.read_bytes()

        return {
            "bundlePath": (
                self._display_path(
                    resolved
                )
            ),
            "sha256": hashlib.sha256(
                data
            ).hexdigest(),
            "sizeBytes": len(data),
            "verified": True,
        }

    def _sign_bundle(
        self,
        source_path: Path,
        output_path: Path,
        public_key_path: Path,
        temporary_root: Path,
        overwrite: bool,
    ) -> dict[str, Any]:
        if output_path.exists():
            if not overwrite:
                raise (
                    MarketplaceBundleSigningError(
                        "Signed bundle already "
                        "exists: "
                        + output_path.as_posix()
                    )
                )

            output_path.unlink()

        files = self._read_zip(
            source_path,
            allow_signature_files=False,
        )
        integrity_bytes = (
            self._integrity_manifest(
                files
            )
        )

        integrity_path = (
            temporary_root
            / (
                source_path.stem
                + ".integrity.json"
            )
        )
        signature_path = (
            temporary_root
            / (
                source_path.stem
                + ".signature"
            )
        )

        integrity_path.write_bytes(
            integrity_bytes
        )
        self._openssl(
            (
                "dgst",
                "-sha256",
                "-sign",
                str(
                    self.private_key_path
                ),
                "-out",
                str(signature_path),
                str(integrity_path),
            ),
            "Unable to sign plugin bundle",
        )

        signature = (
            signature_path.read_bytes()
        )

        if not signature:
            raise MarketplaceBundleSigningError(
                "OpenSSL produced an empty "
                "plugin signature."
            )

        files[self.INTEGRITY_FILE] = (
            integrity_bytes
        )
        files[self.SIGNATURE_FILE] = (
            signature
        )

        self._write_zip(
            output_path,
            files,
        )
        verified = (
            self.verify_signed_bundle(
                output_path
            )
        )

        output_bytes = (
            output_path.read_bytes()
        )

        return {
            "filename": output_path.name,
            "sourcePath": (
                self._display_path(
                    source_path
                )
            ),
            "signedPath": (
                self._display_path(
                    output_path
                )
            ),
            "sha256": hashlib.sha256(
                output_bytes
            ).hexdigest(),
            "integritySha256": (
                hashlib.sha256(
                    integrity_bytes
                ).hexdigest()
            ),
            "sizeBytes": len(
                output_bytes
            ),
            "fileCount": len(files),
            "verified": bool(
                verified["verified"]
            ),
        }

    def _integrity_manifest(
        self,
        files: Mapping[str, bytes],
    ) -> bytes:
        entries = [
            {
                "path": path,
                "sha256": hashlib.sha256(
                    files[path]
                ).hexdigest(),
                "size": len(files[path]),
            }
            for path in sorted(files)
        ]

        value = {
            "schemaVersion": (
                self
                .INTEGRITY_SCHEMA_VERSION
            ),
            "publisherId": (
                self.publisher_id
            ),
            "keyId": self.key_id,
            "algorithm": self.ALGORITHM,
            "files": entries,
        }

        return (
            json.dumps(
                value,
                sort_keys=True,
                separators=(",", ":"),
                ensure_ascii=False,
            )
            + "\n"
        ).encode("utf-8")

    def _verify_signed_files(
        self,
        files: Mapping[str, bytes],
        public_key_path: Path,
        temporary_root: Path,
    ) -> None:
        integrity_bytes = files.get(
            self.INTEGRITY_FILE
        )
        signature = files.get(
            self.SIGNATURE_FILE
        )

        if integrity_bytes is None:
            raise MarketplaceBundleSigningError(
                "Signed bundle is missing "
                + self.INTEGRITY_FILE
            )

        if not signature:
            raise MarketplaceBundleSigningError(
                "Signed bundle is missing "
                + self.SIGNATURE_FILE
            )

        try:
            integrity = json.loads(
                integrity_bytes
            )
        except (
            UnicodeDecodeError,
            json.JSONDecodeError,
        ) as error:
            raise MarketplaceBundleSigningError(
                "Plugin integrity manifest is "
                "invalid."
            ) from error

        if not isinstance(
            integrity,
            dict,
        ):
            raise MarketplaceBundleSigningError(
                "Plugin integrity manifest must "
                "be an object."
            )

        if (
            integrity.get(
                "schemaVersion"
            )
            != self.INTEGRITY_SCHEMA_VERSION
            or integrity.get(
                "publisherId"
            )
            != self.publisher_id
            or integrity.get("keyId")
            != self.key_id
            or integrity.get(
                "algorithm"
            )
            != self.ALGORITHM
        ):
            raise MarketplaceBundleSigningError(
                "Plugin integrity signing "
                "identity does not match."
            )

        entries = integrity.get("files")

        if not isinstance(entries, list):
            raise MarketplaceBundleSigningError(
                "Plugin integrity files must be "
                "an array."
            )

        expected_paths = tuple(
            sorted(
                path
                for path in files
                if path
                not in (
                    self.INTEGRITY_FILE,
                    self.SIGNATURE_FILE,
                )
            )
        )
        actual_paths = []
        previous = None

        for entry in entries:
            if not isinstance(entry, dict):
                raise (
                    MarketplaceBundleSigningError(
                        "Plugin integrity file "
                        "entry must be an object."
                    )
                )

            path = entry.get("path")

            if (
                not isinstance(path, str)
                or path not in files
            ):
                raise (
                    MarketplaceBundleSigningError(
                        "Plugin integrity file "
                        "path is invalid."
                    )
                )

            if (
                previous is not None
                and previous >= path
            ):
                raise (
                    MarketplaceBundleSigningError(
                        "Plugin integrity file "
                        "entries are not uniquely "
                        "sorted."
                    )
                )

            data = files[path]
            digest = hashlib.sha256(
                data
            ).hexdigest()

            if (
                entry.get("sha256")
                != digest
                or entry.get("size")
                != len(data)
            ):
                raise (
                    MarketplaceBundleSigningError(
                        "Plugin integrity mismatch "
                        f"for {path}."
                    )
                )

            actual_paths.append(path)
            previous = path

        if tuple(actual_paths) != (
            expected_paths
        ):
            raise MarketplaceBundleSigningError(
                "Signed bundle file inventory "
                "does not match."
            )

        integrity_path = (
            temporary_root
            / "verify.integrity.json"
        )
        signature_path = (
            temporary_root
            / "verify.signature"
        )
        integrity_path.write_bytes(
            integrity_bytes
        )
        signature_path.write_bytes(
            signature
        )

        self._openssl(
            (
                "dgst",
                "-sha256",
                "-verify",
                str(public_key_path),
                "-signature",
                str(signature_path),
                str(integrity_path),
            ),
            "Plugin bundle signature "
            "verification failed",
        )

    def _read_zip(
        self,
        path: Path,
        allow_signature_files: bool,
    ) -> dict[str, bytes]:
        if not path.is_file():
            raise MarketplaceBundleSigningError(
                "Marketplace bundle does not "
                "exist: "
                + path.as_posix()
            )

        files: dict[str, bytes] = {}
        expanded_bytes = 0

        try:
            with zipfile.ZipFile(
                path,
                mode="r",
            ) as archive:
                entries = tuple(
                    info
                    for info
                    in archive.infolist()
                    if not info.is_dir()
                )

                if not entries:
                    raise (
                        MarketplaceBundleSigningError(
                            "Marketplace bundle is "
                            "empty."
                        )
                    )

                if (
                    len(entries)
                    > self.MAXIMUM_ENTRIES
                ):
                    raise (
                        MarketplaceBundleSigningError(
                            "Marketplace bundle "
                            "contains too many "
                            "entries."
                        )
                    )

                for info in entries:
                    relative = PurePosixPath(
                        info.filename
                    )
                    self._validate_entry(
                        relative
                    )
                    name = relative.as_posix()

                    if name in files:
                        raise (
                            MarketplaceBundleSigningError(
                                "Marketplace bundle "
                                "contains duplicate "
                                f"entry: {name}"
                            )
                        )

                    mode = (
                        info.external_attr
                        >> 16
                    ) & 0xFFFF

                    if stat.S_ISLNK(mode):
                        raise (
                            MarketplaceBundleSigningError(
                                "Marketplace bundle "
                                "contains a symbolic "
                                f"link: {name}"
                            )
                        )

                    if (
                        name
                        == self.EMBEDDED_KEY_FILE
                    ):
                        raise (
                            MarketplaceBundleSigningError(
                                "Marketplace bundle "
                                "contains a forbidden "
                                "embedded public key."
                            )
                        )

                    if (
                        not allow_signature_files
                        and name
                        in (
                            self.INTEGRITY_FILE,
                            self.SIGNATURE_FILE,
                        )
                    ):
                        raise (
                            MarketplaceBundleSigningError(
                                "Source bundle is "
                                "already signed."
                            )
                        )

                    if (
                        info.file_size
                        > self
                        .MAXIMUM_ENTRY_BYTES
                    ):
                        raise (
                            MarketplaceBundleSigningError(
                                "Marketplace bundle "
                                "entry is too large: "
                                + name
                            )
                        )

                    expanded_bytes += (
                        info.file_size
                    )

                    if (
                        expanded_bytes
                        > self
                        .MAXIMUM_EXPANDED_BYTES
                    ):
                        raise (
                            MarketplaceBundleSigningError(
                                "Marketplace bundle "
                                "expanded size is too "
                                "large."
                            )
                        )

                    if (
                        info.file_size > 0
                        and (
                            info.compress_size == 0
                            or (
                                info.file_size
                                / info.compress_size
                            )
                            > self
                            .MAXIMUM_COMPRESSION_RATIO
                        )
                    ):
                        raise (
                            MarketplaceBundleSigningError(
                                "Marketplace bundle "
                                "entry compression "
                                "ratio is unsafe: "
                                + name
                            )
                        )

                    files[name] = (
                        archive.read(info)
                    )

                bad = archive.testzip()

                if bad is not None:
                    raise (
                        MarketplaceBundleSigningError(
                            "Marketplace bundle ZIP "
                            "checksum failed: "
                            + bad
                        )
                    )
        except zipfile.BadZipFile as error:
            raise MarketplaceBundleSigningError(
                "Marketplace bundle is not a "
                "valid ZIP file."
            ) from error

        return files

    def _write_zip(
        self,
        path: Path,
        files: Mapping[str, bytes],
    ) -> None:
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
                        self.ZIP_TIMESTAMP
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

    def _sources(
        self,
        bundle_names: Sequence[
            str
        ] | None,
    ) -> tuple[Path, ...]:
        if not self.source_root.is_dir():
            raise MarketplaceBundleSigningError(
                "Source bundle root does not "
                "exist: "
                + self.source_root.as_posix()
            )

        if bundle_names is None:
            sources = tuple(
                sorted(
                    self.source_root.glob(
                        "*.zip"
                    ),
                    key=lambda path:
                        path.name,
                )
            )
        else:
            if not bundle_names:
                raise (
                    MarketplaceBundleSigningError(
                        "At least one bundle name "
                        "is required."
                    )
                )

            if (
                len(set(bundle_names))
                != len(bundle_names)
            ):
                raise (
                    MarketplaceBundleSigningError(
                        "Bundle names must be "
                        "unique."
                    )
                )

            sources = tuple(
                self._bundle_path(name)
                for name in bundle_names
            )

        if not sources:
            raise MarketplaceBundleSigningError(
                "No marketplace ZIP bundles "
                "were found."
            )

        return sources

    def _bundle_path(
        self,
        name: str,
    ) -> Path:
        if (
            not name
            or Path(name).name != name
            or not name.endswith(".zip")
        ):
            raise MarketplaceBundleSigningError(
                "Bundle name is unsafe: "
                + repr(name)
            )

        return self.source_root / name

    def _derive_public_key(
        self,
        output_path: Path,
    ) -> None:
        self._openssl(
            (
                "pkey",
                "-in",
                str(
                    self.private_key_path
                ),
                "-pubout",
                "-out",
                str(output_path),
            ),
            "Unable to derive signing public key",
        )

    def _public_key_fingerprint(
        self,
        public_key_path: Path,
    ) -> str:
        der_path = (
            public_key_path
            .with_suffix(".der")
        )
        self._openssl(
            (
                "pkey",
                "-pubin",
                "-in",
                str(public_key_path),
                "-outform",
                "DER",
                "-out",
                str(der_path),
            ),
            "Unable to encode signing public key",
        )

        return hashlib.sha256(
            der_path.read_bytes()
        ).hexdigest()

    def _openssl(
        self,
        arguments: Sequence[str],
        failure_message: str,
    ) -> None:
        try:
            result = subprocess.run(
                (
                    self.openssl_executable,
                    *arguments,
                ),
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
        except OSError as error:
            raise MarketplaceBundleSigningError(
                failure_message
            ) from error

        if result.returncode != 0:
            raise MarketplaceBundleSigningError(
                failure_message
            )

    def _assert_private_key(
        self,
    ) -> None:
        if not self.private_key_path.is_file():
            raise MarketplaceBundleSigningError(
                "Private signing key does not "
                "exist or is not a regular file."
            )

        if self.private_key_path.is_symlink():
            raise MarketplaceBundleSigningError(
                "Private signing key must not be "
                "a symbolic link."
            )

        try:
            self.private_key_path.relative_to(
                self.repository_root
            )
        except ValueError:
            pass
        else:
            raise MarketplaceBundleSigningError(
                "Private signing key must remain "
                "outside the repository."
            )

        mode = stat.S_IMODE(
            self.private_key_path
            .stat().st_mode
        )

        if mode & (
            stat.S_IRWXG |
            stat.S_IRWXO
        ):
            raise MarketplaceBundleSigningError(
                "Private signing key permissions "
                "must not allow group or other "
                "access."
            )

    def _assert_distinct_roots(
        self,
    ) -> None:
        if self.source_root == (
            self.output_root
        ):
            raise MarketplaceBundleSigningError(
                "Source and signed bundle roots "
                "must differ."
            )

    @classmethod
    def _identifier(
        cls,
        value: str,
        label: str,
    ) -> str:
        if not cls.IDENTIFIER_PATTERN.fullmatch(
            value
        ):
            raise MarketplaceBundleSigningError(
                f"{label} is invalid."
            )

        return value

    @staticmethod
    def _validate_entry(
        path: PurePosixPath,
    ) -> None:
        if (
            path.is_absolute()
            or not path.parts
            or ".." in path.parts
            or "." in path.parts
            or "\\" in path.as_posix()
            or "\x00" in path.as_posix()
        ):
            raise MarketplaceBundleSigningError(
                "Unsafe marketplace bundle "
                "entry: "
                + path.as_posix()
            )

    def _safe_path(
        self,
        path: Path,
        label: str,
    ) -> Path:
        resolved = (
            path.resolve()
            if path.is_absolute()
            else (
                self.repository_root
                / path
            ).resolve()
        )

        try:
            resolved.relative_to(
                self.repository_root
            )
        except ValueError as error:
            raise MarketplaceBundleSigningError(
                f"{label} must remain inside the "
                "repository."
            ) from error

        return resolved

    def _display_path(
        self,
        path: Path,
    ) -> str:
        return (
            path.resolve()
            .relative_to(
                self.repository_root
            )
            .as_posix()
        )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Sign deterministic PropertyOS "
            "marketplace plugin bundles."
        )
    )
    parser.add_argument(
        "--repository-root",
        type=Path,
        default=Path.cwd(),
    )
    parser.add_argument(
        "--source-root",
        type=Path,
        default=Path(
            "generated/plugin-bundles"
        ),
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=Path(
            "generated/plugin-signed-bundles"
        ),
    )
    parser.add_argument(
        "--publisher-id",
        required=True,
    )
    parser.add_argument(
        "--key-id",
        required=True,
    )
    parser.add_argument(
        "--private-key",
        type=Path,
        required=True,
    )
    parser.add_argument(
        "--bundle",
        action="append",
        dest="bundles",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
    )
    parser.add_argument(
        "--output",
        type=Path,
    )
    return parser


def run(
    argv: Sequence[str] | None = None,
) -> int:
    arguments = _parser().parse_args(
        argv
    )

    try:
        signer = MarketplaceBundleSigner(
            repository_root=(
                arguments
                .repository_root
            ),
            source_root=(
                arguments.source_root
            ),
            output_root=(
                arguments.output_root
            ),
            publisher_id=(
                arguments.publisher_id
            ),
            key_id=arguments.key_id,
            private_key_path=(
                arguments.private_key
            ),
        )
        result = signer.sign(
            bundle_names=(
                arguments.bundles
            ),
            overwrite=(
                arguments.overwrite
            ),
        )
        report = (
            json.dumps(
                result,
                indent=2,
                sort_keys=True,
            )
            + "\n"
        )

        if arguments.output:
            output_path = (
                arguments.output.resolve()
                if arguments.output
                .is_absolute()
                else (
                    signer.repository_root
                    / arguments.output
                ).resolve()
            )

            try:
                output_path.relative_to(
                    signer.repository_root
                )
            except ValueError as error:
                raise (
                    MarketplaceBundleSigningError(
                        "Output report must remain "
                        "inside the repository."
                    )
                ) from error

            output_path.parent.mkdir(
                parents=True,
                exist_ok=True,
            )
            output_path.write_text(
                report,
                encoding="utf-8",
            )
        else:
            print(
                report,
                end="",
            )

        return 0
    except MarketplaceBundleSigningError as error:
        print(
            "Marketplace bundle signing error: "
            + str(error),
            file=sys.stderr,
        )
        return 2


def main() -> None:
    raise SystemExit(run())


if __name__ == "__main__":
    main()
