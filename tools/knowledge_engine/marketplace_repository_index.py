from __future__ import annotations

import base64
import hashlib
import json

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from .marketplace_publisher_authentication import (
    MarketplacePublisherReleaseSigner,
)
from .marketplace_repository_contract import (
    MarketplaceRepositoryContractValidator,
)


@dataclass(frozen=True)
class MarketplaceRepositoryPublisherInput:
    publisher_id: str
    name: str
    key_ids: Tuple[str, ...]


@dataclass(frozen=True)
class MarketplaceRepositoryReleaseInput:
    plugin_id: str
    display_name: str
    summary: str
    publisher_id: str
    version: str
    manifest_url: str
    archive_url: str
    archive_path: Path
    published_at: str
    minimum_host_api: str
    maximum_host_api: str
    signer: MarketplacePublisherReleaseSigner
    yanked: bool = False


@dataclass(frozen=True)
class MarketplaceRepositoryBuildRequest:
    repository_id: str
    repository_name: str
    base_url: str
    generated_at: str
    publishers: Tuple[
        MarketplaceRepositoryPublisherInput,
        ...,
    ]
    releases: Tuple[
        MarketplaceRepositoryReleaseInput,
        ...,
    ]


@dataclass(frozen=True)
class MarketplaceRepositorySignedIndex:
    index: Mapping[str, Any]
    canonical_bytes: bytes
    sha256: str
    signature_algorithm: str
    signature_key_id: str
    signature_value: str

    def envelope(
        self,
    ) -> Mapping[str, Any]:
        return {
            "index": self.index,
            "integrity": {
                "algorithm": "sha256",
                "sha256": self.sha256,
            },
            "signature": {
                "algorithm": self.signature_algorithm,
                "keyId": self.signature_key_id,
                "value": self.signature_value,
            },
        }


class MarketplaceRepositoryIndexBuilder:
    def __init__(
        self,
        validator: MarketplaceRepositoryContractValidator | None = None,
    ) -> None:
        self._validator = (
            validator
            or MarketplaceRepositoryContractValidator()
        )

    def build(
        self,
        request: MarketplaceRepositoryBuildRequest,
    ) -> Mapping[str, Any]:
        publishers = {
            item.publisher_id: item
            for item in request.publishers
        }

        if len(publishers) != len(request.publishers):
            raise ValueError("Duplicate publisher ID.")

        grouped: dict[
            str,
            list[MarketplaceRepositoryReleaseInput],
        ] = {}

        metadata = {}

        for release in request.releases:
            if release.publisher_id not in publishers:
                raise ValueError(
                    "Release references unknown publisher: "
                    + release.publisher_id
                )

            if release.signer.publisher_id != release.publisher_id:
                raise ValueError(
                    "Release signer publisher mismatch."
                )

            if release.signer.key_id not in publishers[
                release.publisher_id
            ].key_ids:
                raise ValueError(
                    "Release signer key is not registered "
                    "for publisher."
                )

            if not release.archive_path.is_file():
                raise ValueError(
                    "Release archive does not exist: "
                    + str(release.archive_path)
                )

            identity = (
                release.display_name,
                release.summary,
                release.publisher_id,
            )

            current = metadata.get(release.plugin_id)

            if current is not None and current != identity:
                raise ValueError(
                    "Plugin metadata is inconsistent: "
                    + release.plugin_id
                )

            metadata[release.plugin_id] = identity
            grouped.setdefault(
                release.plugin_id,
                [],
            ).append(release)

        plugins = []

        for plugin_id in sorted(grouped):
            releases = sorted(
                grouped[plugin_id],
                key=lambda item: self._version_key(
                    item.version
                ),
            )

            versions = tuple(
                item.version
                for item in releases
            )

            if len(versions) != len(set(versions)):
                raise ValueError(
                    "Duplicate plugin release version: "
                    + plugin_id
                )

            display_name, summary, publisher_id = (
                metadata[plugin_id]
            )

            plugins.append(
                {
                    "displayName": display_name,
                    "id": plugin_id,
                    "latestVersion": releases[-1].version,
                    "publisherId": publisher_id,
                    "releases": [
                        self._release_document(
                            release
                        )
                        for release in releases
                    ],
                    "summary": summary,
                }
            )

        document = {
            "plugins": plugins,
            "publishers": [
                {
                    "id": item.publisher_id,
                    "keyIds": sorted(
                        set(item.key_ids)
                    ),
                    "name": item.name,
                }
                for item in sorted(
                    request.publishers,
                    key=lambda item: item.publisher_id,
                )
            ],
            "repository": {
                "baseUrl": request.base_url,
                "generatedAt": request.generated_at,
                "id": request.repository_id,
                "name": request.repository_name,
            },
            "schemaVersion": "1.0.0",
        }

        self._validator.require_valid(document)

        return document

    @staticmethod
    def canonical_bytes(
        document: Mapping[str, Any],
    ) -> bytes:
        return json.dumps(
            document,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")

    @staticmethod
    def sha256(
        content: bytes,
    ) -> str:
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    def _release_document(
        release: MarketplaceRepositoryReleaseInput,
    ) -> Mapping[str, Any]:
        digest = hashlib.sha256(
            release.archive_path.read_bytes()
        ).hexdigest()

        payload = {
            "archiveSha256": digest,
            "archiveUrl": release.archive_url,
            "manifestUrl": release.manifest_url,
            "maximumHostApi": release.maximum_host_api,
            "minimumHostApi": release.minimum_host_api,
            "pluginId": release.plugin_id,
            "publisherId": release.publisher_id,
            "publishedAt": release.published_at,
            "version": release.version,
            "yanked": release.yanked,
        }

        signature = release.signer.sign(payload)

        return {
            "archiveSha256": digest,
            "archiveUrl": release.archive_url,
            "manifestUrl": release.manifest_url,
            "maximumHostApi": release.maximum_host_api,
            "minimumHostApi": release.minimum_host_api,
            "publishedAt": release.published_at,
            "signature": signature.to_dict(),
            "version": release.version,
            "yanked": release.yanked,
        }

    @staticmethod
    def _version_key(
        value: str,
    ) -> Tuple[int, ...]:
        parts = value.split(".")

        if not parts or not all(
            part.isdigit()
            for part in parts
        ):
            raise ValueError(
                "Release version must be numeric dotted form: "
                + value
            )

        return tuple(int(part) for part in parts)


class MarketplaceRepositoryIndexSigner:
    def __init__(
        self,
        *,
        key_id: str,
        private_key: Ed25519PrivateKey,
    ) -> None:
        if not key_id:
            raise ValueError(
                "Repository signing key ID is required."
            )

        self.key_id = key_id
        self.private_key = private_key

    def sign(
        self,
        index: Mapping[str, Any],
    ) -> MarketplaceRepositorySignedIndex:
        canonical = (
            MarketplaceRepositoryIndexBuilder
            .canonical_bytes(index)
        )
        digest = (
            MarketplaceRepositoryIndexBuilder
            .sha256(canonical)
        )
        signature = self.private_key.sign(
            canonical
        )

        return MarketplaceRepositorySignedIndex(
            index=index,
            canonical_bytes=canonical,
            sha256=digest,
            signature_algorithm="ed25519",
            signature_key_id=self.key_id,
            signature_value=base64.b64encode(
                signature
            ).decode("ascii"),
        )


class MarketplaceRepositoryIndexVerifier:
    def verify(
        self,
        envelope: Mapping[str, Any],
        *,
        trusted_keys: Mapping[
            str,
            Ed25519PublicKey,
        ],
    ) -> Mapping[str, Any]:
        index = envelope.get("index")
        integrity = envelope.get("integrity")
        signature = envelope.get("signature")

        if not isinstance(index, Mapping):
            raise ValueError(
                "Signed repository index is missing."
            )

        if not isinstance(integrity, Mapping):
            raise ValueError(
                "Repository integrity block is missing."
            )

        if not isinstance(signature, Mapping):
            raise ValueError(
                "Repository signature block is missing."
            )

        if integrity.get("algorithm") != "sha256":
            raise ValueError(
                "Repository integrity algorithm must be sha256."
            )

        if signature.get("algorithm") != "ed25519":
            raise ValueError(
                "Repository signature algorithm must be ed25519."
            )

        key_id = signature.get("keyId")

        if key_id not in trusted_keys:
            raise ValueError(
                "Repository signing key is not trusted."
            )

        canonical = (
            MarketplaceRepositoryIndexBuilder
            .canonical_bytes(index)
        )
        digest = (
            MarketplaceRepositoryIndexBuilder
            .sha256(canonical)
        )

        if digest != integrity.get("sha256"):
            raise ValueError(
                "Repository index SHA-256 mismatch."
            )

        try:
            raw_signature = base64.b64decode(
                str(signature.get("value")),
                validate=True,
            )
        except Exception as error:
            raise ValueError(
                "Repository signature encoding is invalid."
            ) from error

        try:
            trusted_keys[key_id].verify(
                raw_signature,
                canonical,
            )
        except InvalidSignature as error:
            raise ValueError(
                "Repository signature is invalid."
            ) from error

        MarketplaceRepositoryContractValidator().require_valid(
            index
        )

        return index


__all__ = [
    "MarketplaceRepositoryBuildRequest",
    "MarketplaceRepositoryIndexBuilder",
    "MarketplaceRepositoryIndexSigner",
    "MarketplaceRepositoryIndexVerifier",
    "MarketplaceRepositoryPublisherInput",
    "MarketplaceRepositoryReleaseInput",
    "MarketplaceRepositorySignedIndex",
]
