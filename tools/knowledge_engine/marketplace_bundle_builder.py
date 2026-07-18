from __future__ import annotations

import hashlib
import json
import tarfile
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any, Mapping, Tuple


class MarketplaceBundleError(
    ValueError
):
    pass


class MarketplaceBundleBuilder:
    SCHEMA_VERSION = "1.0.0"
    ZIP_TIMESTAMP = (
        1980,
        1,
        1,
        0,
        0,
        0,
    )

    def __init__(
        self,
        repository_root: Path,
        package_portfolio_path: Path,
        marketplace_manifests_path: Path,
        bundle_root: Path,
    ) -> None:
        self.repository_root = (
            repository_root.resolve()
        )
        self.package_portfolio_path = (
            self._safe_path(
                package_portfolio_path,
                "Package portfolio",
            )
        )
        self.marketplace_manifests_path = (
            self._safe_path(
                marketplace_manifests_path,
                "Marketplace manifests",
            )
        )
        self.bundle_root = self._safe_path(
            bundle_root,
            "Bundle root",
        )

    def build(
        self,
        module_ids: Tuple[
            str,
            ...,
        ] | None = None,
        overwrite: bool = False,
    ) -> dict[str, Any]:
        package_portfolio = (
            self._json_object(
                self.package_portfolio_path,
                "Package portfolio",
            )
        )
        manifest_portfolio = (
            self._json_object(
                self.marketplace_manifests_path,
                "Marketplace manifest portfolio",
            )
        )

        artifacts = package_portfolio.get(
            "artifacts"
        )
        manifests = manifest_portfolio.get(
            "manifests"
        )

        if not isinstance(artifacts, list):
            raise MarketplaceBundleError(
                "Package portfolio must contain "
                "an artifacts array."
            )

        if not isinstance(manifests, dict):
            raise MarketplaceBundleError(
                "Marketplace manifest portfolio "
                "must contain a manifests object."
            )

        by_module = {}

        for artifact in artifacts:
            if not isinstance(artifact, dict):
                raise MarketplaceBundleError(
                    "Package artifact must be an "
                    "object."
                )

            module_id = self._string(
                artifact,
                "moduleId",
                "Module ID",
            )

            if module_id in by_module:
                raise MarketplaceBundleError(
                    "Duplicate package artifact: "
                    f"{module_id}"
                )

            by_module[module_id] = artifact

        selected = (
            tuple(sorted(by_module))
            if module_ids is None
            else tuple(module_ids)
        )

        if not selected:
            raise MarketplaceBundleError(
                "At least one module is required."
            )

        if len(set(selected)) != len(
            selected
        ):
            raise MarketplaceBundleError(
                "Module IDs must be unique."
            )

        unknown = tuple(
            module_id
            for module_id in selected
            if module_id not in by_module
            or module_id not in manifests
        )

        if unknown:
            raise MarketplaceBundleError(
                "Unknown marketplace module IDs: "
                + ", ".join(unknown)
            )

        self.bundle_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        bundles = tuple(
            self._build_bundle(
                artifact=by_module[
                    module_id
                ],
                marketplace_manifest=(
                    manifests[module_id]
                ),
                overwrite=overwrite,
            )
            for module_id in selected
        )

        return {
            "schemaVersion": (
                self.SCHEMA_VERSION
            ),
            "bundleRoot": (
                self._display_path(
                    self.bundle_root
                )
            ),
            "bundles": list(bundles),
            "summary": {
                "moduleCount": len(bundles),
                "passedCount": len(bundles),
                "failedCount": 0,
                "totalSizeBytes": sum(
                    bundle["sizeBytes"]
                    for bundle in bundles
                ),
                "totalFileCount": sum(
                    bundle["fileCount"]
                    for bundle in bundles
                ),
                "successful": True,
            },
        }

    def _build_bundle(
        self,
        artifact: Mapping[str, Any],
        marketplace_manifest: object,
        overwrite: bool,
    ) -> dict[str, Any]:
        if not isinstance(
            marketplace_manifest,
            dict,
        ):
            raise MarketplaceBundleError(
                "Marketplace manifest must be an "
                "object."
            )

        module_id = self._string(
            artifact,
            "moduleId",
            "Module ID",
        )
        plugin_id = self._string(
            artifact,
            "pluginId",
            "Plugin ID",
        )
        package_name = self._string(
            artifact,
            "packageName",
            "Package name",
        )
        version = self._string(
            artifact,
            "version",
            "Package version",
        )

        artifact_value = self._string(
            artifact,
            "artifactPath",
            "Package artifact path",
        )
        artifact_path = self._safe_path(
            Path(artifact_value),
            "Package artifact",
        )

        if not artifact_path.is_file():
            raise MarketplaceBundleError(
                "Package artifact does not exist: "
                + artifact_path.as_posix()
            )

        bundle_name = (
            package_name
            .removeprefix("@")
            .replace("/", "-")
            + "-"
            + version
            + ".zip"
        )
        bundle_path = (
            self.bundle_root
            / bundle_name
        )

        if bundle_path.exists():
            if not overwrite:
                raise MarketplaceBundleError(
                    "Marketplace bundle already "
                    "exists: "
                    + bundle_path.as_posix()
                )

            bundle_path.unlink()

        files = self._artifact_files(
            artifact_path
        )

        files["plugin.json"] = (
            json.dumps(
                marketplace_manifest,
                indent=2,
                sort_keys=True,
            )
            + "\n"
        ).encode("utf-8")

        source_sha256 = hashlib.sha256(
            artifact_path.read_bytes()
        ).hexdigest()

        bundle_manifest = {
            "schemaVersion": (
                self.SCHEMA_VERSION
            ),
            "pluginId": plugin_id,
            "moduleId": module_id,
            "packageName": package_name,
            "version": version,
            "entrypoint": "dist/index.js",
            "sourceArtifact": (
                self._display_path(
                    artifact_path
                )
            ),
            "sourceArtifactSha256": (
                source_sha256
            ),
        }

        files["bundle-manifest.json"] = (
            json.dumps(
                bundle_manifest,
                indent=2,
                sort_keys=True,
            )
            + "\n"
        ).encode("utf-8")

        required = (
            "plugin.json",
            "package.json",
            "README.md",
            "dist/index.js",
            "dist/index.d.ts",
            "bundle-manifest.json",
        )

        missing = tuple(
            required_path
            for required_path in required
            if required_path not in files
        )

        if missing:
            raise MarketplaceBundleError(
                "Marketplace bundle is missing "
                "required files: "
                + ", ".join(missing)
            )

        with zipfile.ZipFile(
            bundle_path,
            mode="w",
            compression=(
                zipfile.ZIP_DEFLATED
            ),
            compresslevel=9,
        ) as archive:
            for relative_path in sorted(
                files
            ):
                info = zipfile.ZipInfo(
                    filename=relative_path,
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
                    files[relative_path],
                    compress_type=(
                        zipfile.ZIP_DEFLATED
                    ),
                    compresslevel=9,
                )

        self._verify_bundle(
            bundle_path=bundle_path,
            expected_files=tuple(
                sorted(files)
            ),
        )

        bundle_bytes = (
            bundle_path.read_bytes()
        )

        return {
            "moduleId": module_id,
            "pluginId": plugin_id,
            "packageName": package_name,
            "version": version,
            "filename": bundle_name,
            "bundlePath": (
                self._display_path(
                    bundle_path
                )
            ),
            "sizeBytes": len(
                bundle_bytes
            ),
            "fileCount": len(files),
            "sha256": hashlib.sha256(
                bundle_bytes
            ).hexdigest(),
            "sourceArtifactSha256": (
                source_sha256
            ),
            "entrypoint": "dist/index.js",
            "installerFormat": "zip",
            "verified": True,
        }

    def _artifact_files(
        self,
        artifact_path: Path,
    ) -> dict[str, bytes]:
        files = {}

        try:
            with tarfile.open(
                artifact_path,
                mode="r:gz",
            ) as archive:
                for member in (
                    archive.getmembers()
                ):
                    if not member.isfile():
                        continue

                    member_path = (
                        PurePosixPath(
                            member.name
                        )
                    )

                    if (
                        not member_path.parts
                        or member_path.parts[0]
                        != "package"
                    ):
                        raise (
                            MarketplaceBundleError(
                                "npm artifact entry "
                                "must remain below "
                                "package/: "
                                + member.name
                            )
                        )

                    relative = PurePosixPath(
                        *member_path.parts[1:]
                    )

                    self._validate_entry(
                        relative
                    )

                    stream = (
                        archive.extractfile(
                            member
                        )
                    )

                    if stream is None:
                        raise (
                            MarketplaceBundleError(
                                "Unable to read npm "
                                "artifact entry: "
                                + member.name
                            )
                        )

                    files[
                        relative.as_posix()
                    ] = stream.read()

        except (
            OSError,
            tarfile.TarError,
        ) as error:
            raise MarketplaceBundleError(
                "Unable to read npm package "
                f"artifact: {artifact_path}"
            ) from error

        return files

    @staticmethod
    def _validate_entry(
        path: PurePosixPath,
    ) -> None:
        if (
            path.is_absolute()
            or not path.parts
            or ".." in path.parts
            or "." in path.parts
        ):
            raise MarketplaceBundleError(
                "Unsafe package entry path: "
                + path.as_posix()
            )

    def _verify_bundle(
        self,
        bundle_path: Path,
        expected_files: Tuple[
            str,
            ...,
        ],
    ) -> None:
        try:
            with zipfile.ZipFile(
                bundle_path,
                mode="r",
            ) as archive:
                names = tuple(
                    sorted(
                        info.filename
                        for info
                        in archive.infolist()
                        if not info.is_dir()
                    )
                )

                if names != expected_files:
                    raise (
                        MarketplaceBundleError(
                            "ZIP bundle contents do "
                            "not match the plan."
                        )
                    )

                bad = archive.testzip()

                if bad is not None:
                    raise (
                        MarketplaceBundleError(
                            "ZIP bundle checksum "
                            f"failed: {bad}"
                        )
                    )

        except (
            OSError,
            zipfile.BadZipFile,
        ) as error:
            raise MarketplaceBundleError(
                "Unable to verify marketplace "
                f"bundle: {bundle_path}"
            ) from error

    @staticmethod
    def _json_object(
        path: Path,
        label: str,
    ) -> dict[str, Any]:
        try:
            value = json.loads(
                path.read_text(
                    encoding="utf-8"
                )
            )
        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            raise MarketplaceBundleError(
                f"{label} is unreadable: {path}"
            ) from error

        if not isinstance(value, dict):
            raise MarketplaceBundleError(
                f"{label} must be a JSON object."
            )

        return value

    @staticmethod
    def _string(
        value: Mapping[str, Any],
        key: str,
        label: str,
    ) -> str:
        result = value.get(key)

        if (
            not isinstance(result, str)
            or not result.strip()
        ):
            raise MarketplaceBundleError(
                f"{label} is missing."
            )

        return result.strip()

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
            raise MarketplaceBundleError(
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
