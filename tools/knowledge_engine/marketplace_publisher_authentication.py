from __future__ import annotations

import base64
import json
import os
import tempfile

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Mapping, Optional, Sequence, Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


class MarketplacePublisherKeyState(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


@dataclass(frozen=True)
class MarketplacePublisherKeyRecord:
    publisher_id: str
    key_id: str
    public_key_pem: str
    state: MarketplacePublisherKeyState

    def to_dict(self) -> Dict[str, Any]:
        return {
            "keyId": self.key_id,
            "publisherId": self.publisher_id,
            "publicKeyPem": self.public_key_pem,
            "state": self.state.value,
        }

    @classmethod
    def from_dict(
        cls,
        value: Mapping[str, Any],
    ) -> "MarketplacePublisherKeyRecord":
        return cls(
            publisher_id=str(
                value["publisherId"]
            ),
            key_id=str(
                value["keyId"]
            ),
            public_key_pem=str(
                value["publicKeyPem"]
            ),
            state=MarketplacePublisherKeyState(
                str(
                    value["state"]
                )
            ),
        )


class MarketplacePublisherKeyRegistry:
    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        path: Path,
    ) -> None:
        self.path = path

    def load(
        self,
    ) -> Dict[str, MarketplacePublisherKeyRecord]:
        if not self.path.exists():
            return {}

        document = json.loads(
            self.path.read_text(
                encoding="utf-8"
            )
        )

        if (
            document.get(
                "schemaVersion"
            )
            != self.SCHEMA_VERSION
        ):
            raise ValueError(
                "Unsupported publisher key registry schema."
            )

        keys = document.get(
            "keys"
        )

        if not isinstance(
            keys,
            list,
        ):
            raise ValueError(
                "Publisher registry keys must be an array."
            )

        result = {}

        for item in keys:
            record = (
                MarketplacePublisherKeyRecord
                .from_dict(
                    item
                )
            )

            if record.key_id in result:
                raise ValueError(
                    "Duplicate publisher key ID: "
                    + record.key_id
                )

            result[
                record.key_id
            ] = record

        return result

    def write(
        self,
        records: Mapping[
            str,
            MarketplacePublisherKeyRecord,
        ],
    ) -> None:
        self.path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        payload = {
            "keys": [
                records[key_id].to_dict()
                for key_id in sorted(records)
            ],
            "schemaVersion": self.SCHEMA_VERSION,
        }

        descriptor, temporary_name = tempfile.mkstemp(
            prefix=self.path.name + ".",
            suffix=".tmp",
            dir=str(
                self.path.parent
            ),
        )

        temporary = Path(
            temporary_name
        )

        try:
            with os.fdopen(
                descriptor,
                "w",
                encoding="utf-8",
            ) as stream:
                stream.write(
                    json.dumps(
                        payload,
                        indent=2,
                        sort_keys=True,
                    )
                    + "\n"
                )
                stream.flush()
                os.fsync(
                    stream.fileno()
                )

            os.replace(
                temporary,
                self.path,
            )
        finally:
            if temporary.exists():
                temporary.unlink()

    def register(
        self,
        record: MarketplacePublisherKeyRecord,
    ) -> None:
        records = self.load()

        existing = records.get(
            record.key_id
        )

        if (
            existing is not None
            and existing != record
        ):
            raise ValueError(
                "Publisher key ID is already registered."
            )

        self._validate_record(
            record
        )

        records[
            record.key_id
        ] = record

        self.write(
            records
        )

    def revoke(
        self,
        *,
        publisher_id: str,
        key_id: str,
    ) -> None:
        records = self.load()

        if key_id not in records:
            raise ValueError(
                "Publisher key is not registered."
            )

        existing = records[
            key_id
        ]

        if (
            existing.publisher_id
            != publisher_id
        ):
            raise ValueError(
                "Publisher does not own the key."
            )

        records[
            key_id
        ] = MarketplacePublisherKeyRecord(
            publisher_id=(
                existing.publisher_id
            ),
            key_id=existing.key_id,
            public_key_pem=(
                existing.public_key_pem
            ),
            state=(
                MarketplacePublisherKeyState.REVOKED
            ),
        )

        self.write(
            records
        )

    @staticmethod
    def _validate_record(
        record: MarketplacePublisherKeyRecord,
    ) -> None:
        if not record.publisher_id:
            raise ValueError(
                "Publisher ID is required."
            )

        if not record.key_id:
            raise ValueError(
                "Key ID is required."
            )

        key = serialization.load_pem_public_key(
            record.public_key_pem.encode(
                "utf-8"
            )
        )

        if not isinstance(
            key,
            Ed25519PublicKey,
        ):
            raise ValueError(
                "Publisher key must be Ed25519."
            )


@dataclass(frozen=True)
class MarketplacePublisherReleaseSignature:
    algorithm: str
    key_id: str
    value: str

    def to_dict(
        self,
    ) -> Dict[str, str]:
        return {
            "algorithm": self.algorithm,
            "keyId": self.key_id,
            "value": self.value,
        }


class MarketplacePublisherReleaseSigner:
    def __init__(
        self,
        *,
        publisher_id: str,
        key_id: str,
        private_key: Ed25519PrivateKey,
    ) -> None:
        if not publisher_id:
            raise ValueError(
                "Publisher ID is required."
            )

        if not key_id:
            raise ValueError(
                "Key ID is required."
            )

        self.publisher_id = publisher_id
        self.key_id = key_id
        self.private_key = private_key

    def sign(
        self,
        payload: Mapping[
            str,
            Any,
        ],
    ) -> MarketplacePublisherReleaseSignature:
        canonical = canonical_release_bytes(
            payload
        )
        signature = self.private_key.sign(
            canonical
        )

        return MarketplacePublisherReleaseSignature(
            algorithm="ed25519",
            key_id=self.key_id,
            value=base64.b64encode(
                signature
            ).decode(
                "ascii"
            ),
        )

    def public_key_record(
        self,
    ) -> MarketplacePublisherKeyRecord:
        pem = (
            self.private_key
            .public_key()
            .public_bytes(
                encoding=(
                    serialization.Encoding.PEM
                ),
                format=(
                    serialization.PublicFormat.SubjectPublicKeyInfo
                ),
            )
            .decode(
                "utf-8"
            )
        )

        return MarketplacePublisherKeyRecord(
            publisher_id=(
                self.publisher_id
            ),
            key_id=self.key_id,
            public_key_pem=pem,
            state=(
                MarketplacePublisherKeyState.ACTIVE
            ),
        )


class MarketplacePublisherReleaseVerifier:
    def verify(
        self,
        *,
        publisher_id: str,
        payload: Mapping[
            str,
            Any,
        ],
        signature: Mapping[
            str,
            Any,
        ],
        registry: MarketplacePublisherKeyRegistry,
    ) -> None:
        if signature.get(
            "algorithm"
        ) != "ed25519":
            raise ValueError(
                "Publisher signature algorithm must be ed25519."
            )

        key_id = signature.get(
            "keyId"
        )

        if not isinstance(
            key_id,
            str,
        ):
            raise ValueError(
                "Publisher signature key ID is invalid."
            )

        records = registry.load()

        if key_id not in records:
            raise ValueError(
                "Publisher signing key is not registered."
            )

        record = records[
            key_id
        ]

        if (
            record.publisher_id
            != publisher_id
        ):
            raise ValueError(
                "Signing key does not belong to publisher."
            )

        if (
            record.state
            != MarketplacePublisherKeyState.ACTIVE
        ):
            raise ValueError(
                "Publisher signing key is revoked."
            )

        try:
            raw_signature = base64.b64decode(
                str(
                    signature.get(
                        "value"
                    )
                ),
                validate=True,
            )
        except Exception as error:
            raise ValueError(
                "Publisher signature encoding is invalid."
            ) from error

        public_key = serialization.load_pem_public_key(
            record.public_key_pem.encode(
                "utf-8"
            )
        )

        if not isinstance(
            public_key,
            Ed25519PublicKey,
        ):
            raise ValueError(
                "Registered publisher key is not Ed25519."
            )

        try:
            public_key.verify(
                raw_signature,
                canonical_release_bytes(
                    payload
                ),
            )
        except InvalidSignature as error:
            raise ValueError(
                "Publisher release signature is invalid."
            ) from error


def canonical_release_bytes(
    payload: Mapping[
        str,
        Any,
    ],
) -> bytes:
    return json.dumps(
        payload,
        ensure_ascii=False,
        separators=(
            ",",
            ":",
        ),
        sort_keys=True,
    ).encode(
        "utf-8"
    )


def generate_publisher_private_key(
) -> Ed25519PrivateKey:
    return Ed25519PrivateKey.generate()


__all__ = [
    "MarketplacePublisherKeyRecord",
    "MarketplacePublisherKeyRegistry",
    "MarketplacePublisherKeyState",
    "MarketplacePublisherReleaseSignature",
    "MarketplacePublisherReleaseSigner",
    "MarketplacePublisherReleaseVerifier",
    "canonical_release_bytes",
    "generate_publisher_private_key",
]
