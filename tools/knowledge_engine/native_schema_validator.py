from __future__ import annotations

import json
import re

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Sequence, Tuple
from urllib.parse import urlparse


@dataclass(frozen=True)
class NativeSchemaIssue:
    code: str
    path: str
    message: str

    def sort_key(
        self,
    ) -> tuple[str, str, str]:
        return (
            self.path,
            self.code,
            self.message,
        )


class NativeSchemaValidationError(
    ValueError
):
    def __init__(
        self,
        issues: Sequence[
            NativeSchemaIssue
        ],
    ) -> None:
        ordered = tuple(
            sorted(
                issues,
                key=(
                    lambda issue:
                    issue.sort_key()
                ),
            )
        )

        self.issues = ordered

        super().__init__(
            "; ".join(
                (
                    f"{issue.path}: "
                    f"{issue.code}: "
                    f"{issue.message}"
                )
                for issue in ordered
            )
        )


class NativeSchemaValidator:
    """
    Small, deterministic validator for the subset of
    JSON Schema used by PropertyOS marketplace contracts.

    Supported rules:
    - type
    - required
    - properties
    - additionalProperties
    - const
    - enum
    - pattern
    - minLength
    - maxLength
    - minItems
    - uniqueItems
    - items
    - format: uri
    """

    SUPPORTED_TYPES = frozenset(
        {
            "object",
            "array",
            "string",
            "boolean",
            "integer",
            "number",
            "null",
        }
    )

    def __init__(
        self,
        schema: Mapping[
            str,
            Any,
        ],
    ) -> None:
        self._schema = dict(schema)

    @classmethod
    def from_path(
        cls,
        path: Path,
    ) -> "NativeSchemaValidator":
        schema = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        if not isinstance(
            schema,
            dict,
        ):
            raise ValueError(
                "Schema root must be an object."
            )

        return cls(schema)

    def validate(
        self,
        value: Any,
    ) -> Tuple[
        NativeSchemaIssue,
        ...,
    ]:
        issues: list[
            NativeSchemaIssue
        ] = []

        self._validate_node(
            schema=self._schema,
            value=value,
            path="$",
            issues=issues,
        )

        return tuple(
            sorted(
                issues,
                key=(
                    lambda issue:
                    issue.sort_key()
                ),
            )
        )

    def require_valid(
        self,
        value: Any,
    ) -> None:
        issues = self.validate(
            value
        )

        if issues:
            raise NativeSchemaValidationError(
                issues
            )

    def _validate_node(
        self,
        schema: Mapping[
            str,
            Any,
        ],
        value: Any,
        path: str,
        issues: list[
            NativeSchemaIssue
        ],
    ) -> None:
        self._validate_type(
            schema,
            value,
            path,
            issues,
        )

        expected_type = schema.get(
            "type"
        )

        if (
            expected_type is not None
            and not self._matches_type(
                expected_type,
                value,
            )
        ):
            return

        if "const" in schema:
            if value != schema["const"]:
                issues.append(
                    NativeSchemaIssue(
                        code="CONST_MISMATCH",
                        path=path,
                        message=(
                            "Value does not match "
                            "required constant."
                        ),
                    )
                )

        enum = schema.get(
            "enum"
        )

        if enum is not None:
            if not isinstance(
                enum,
                list,
            ):
                issues.append(
                    NativeSchemaIssue(
                        code="INVALID_SCHEMA",
                        path=path,
                        message=(
                            "Schema enum must be "
                            "an array."
                        ),
                    )
                )
            elif value not in enum:
                issues.append(
                    NativeSchemaIssue(
                        code="ENUM_MISMATCH",
                        path=path,
                        message=(
                            "Value is not in the "
                            "allowed enumeration."
                        ),
                    )
                )

        if isinstance(
            value,
            dict,
        ):
            self._validate_object(
                schema,
                value,
                path,
                issues,
            )

        if isinstance(
            value,
            list,
        ):
            self._validate_array(
                schema,
                value,
                path,
                issues,
            )

        if isinstance(
            value,
            str,
        ):
            self._validate_string(
                schema,
                value,
                path,
                issues,
            )

    def _validate_type(
        self,
        schema: Mapping[
            str,
            Any,
        ],
        value: Any,
        path: str,
        issues: list[
            NativeSchemaIssue
        ],
    ) -> None:
        expected = schema.get(
            "type"
        )

        if expected is None:
            return

        expected_types = (
            [expected]
            if isinstance(
                expected,
                str,
            )
            else expected
        )

        if not isinstance(
            expected_types,
            list,
        ):
            issues.append(
                NativeSchemaIssue(
                    code="INVALID_SCHEMA",
                    path=path,
                    message=(
                        "Schema type must be a "
                        "string or array."
                    ),
                )
            )
            return

        unknown = tuple(
            item
            for item in expected_types
            if item not in (
                self.SUPPORTED_TYPES
            )
        )

        if unknown:
            issues.append(
                NativeSchemaIssue(
                    code="UNSUPPORTED_SCHEMA_TYPE",
                    path=path,
                    message=(
                        "Unsupported schema type: "
                        + ", ".join(
                            sorted(unknown)
                        )
                    ),
                )
            )
            return

        if not any(
            self._matches_type(
                item,
                value,
            )
            for item in expected_types
        ):
            issues.append(
                NativeSchemaIssue(
                    code="TYPE_MISMATCH",
                    path=path,
                    message=(
                        "Expected type "
                        + " or ".join(
                            expected_types
                        )
                        + "."
                    ),
                )
            )

    @staticmethod
    def _matches_type(
        expected: str,
        value: Any,
    ) -> bool:
        if expected == "object":
            return isinstance(
                value,
                dict,
            )

        if expected == "array":
            return isinstance(
                value,
                list,
            )

        if expected == "string":
            return isinstance(
                value,
                str,
            )

        if expected == "boolean":
            return isinstance(
                value,
                bool,
            )

        if expected == "integer":
            return (
                isinstance(
                    value,
                    int,
                )
                and not isinstance(
                    value,
                    bool,
                )
            )

        if expected == "number":
            return (
                isinstance(
                    value,
                    (int, float),
                )
                and not isinstance(
                    value,
                    bool,
                )
            )

        if expected == "null":
            return value is None

        return False

    def _validate_object(
        self,
        schema: Mapping[
            str,
            Any,
        ],
        value: Mapping[
            str,
            Any,
        ],
        path: str,
        issues: list[
            NativeSchemaIssue
        ],
    ) -> None:
        required = schema.get(
            "required",
            [],
        )

        if not isinstance(
            required,
            list,
        ):
            issues.append(
                NativeSchemaIssue(
                    code="INVALID_SCHEMA",
                    path=path,
                    message=(
                        "Schema required must be "
                        "an array."
                    ),
                )
            )
            required = []

        for key in sorted(
            required
        ):
            if key not in value:
                issues.append(
                    NativeSchemaIssue(
                        code="REQUIRED_PROPERTY_MISSING",
                        path=(
                            f"{path}.{key}"
                        ),
                        message=(
                            "Required property is "
                            "missing."
                        ),
                    )
                )

        properties = schema.get(
            "properties",
            {},
        )

        if not isinstance(
            properties,
            dict,
        ):
            issues.append(
                NativeSchemaIssue(
                    code="INVALID_SCHEMA",
                    path=path,
                    message=(
                        "Schema properties must be "
                        "an object."
                    ),
                )
            )
            properties = {}

        additional = schema.get(
            "additionalProperties",
            True,
        )

        for key in sorted(
            value
        ):
            child_path = (
                f"{path}.{key}"
            )

            if key in properties:
                child_schema = properties[
                    key
                ]

                if not isinstance(
                    child_schema,
                    dict,
                ):
                    issues.append(
                        NativeSchemaIssue(
                            code="INVALID_SCHEMA",
                            path=child_path,
                            message=(
                                "Property schema must "
                                "be an object."
                            ),
                        )
                    )
                    continue

                self._validate_node(
                    schema=child_schema,
                    value=value[key],
                    path=child_path,
                    issues=issues,
                )
                continue

            if additional is False:
                issues.append(
                    NativeSchemaIssue(
                        code="UNKNOWN_PROPERTY",
                        path=child_path,
                        message=(
                            "Property is not allowed "
                            "by the closed schema."
                        ),
                    )
                )

    def _validate_array(
        self,
        schema: Mapping[
            str,
            Any,
        ],
        value: Sequence[
            Any,
        ],
        path: str,
        issues: list[
            NativeSchemaIssue
        ],
    ) -> None:
        minimum = schema.get(
            "minItems"
        )

        if (
            isinstance(
                minimum,
                int,
            )
            and len(value) < minimum
        ):
            issues.append(
                NativeSchemaIssue(
                    code="MIN_ITEMS",
                    path=path,
                    message=(
                        f"Array requires at least "
                        f"{minimum} item(s)."
                    ),
                )
            )

        if schema.get(
            "uniqueItems"
        ) is True:
            seen = set()

            for index, item in enumerate(
                value
            ):
                marker = json.dumps(
                    item,
                    sort_keys=True,
                    separators=(
                        ",",
                        ":",
                    ),
                )

                if marker in seen:
                    issues.append(
                        NativeSchemaIssue(
                            code="DUPLICATE_ARRAY_ITEM",
                            path=(
                                f"{path}[{index}]"
                            ),
                            message=(
                                "Array item must be "
                                "unique."
                            ),
                        )
                    )
                else:
                    seen.add(marker)

        item_schema = schema.get(
            "items"
        )

        if isinstance(
            item_schema,
            dict,
        ):
            for index, item in enumerate(
                value
            ):
                self._validate_node(
                    schema=item_schema,
                    value=item,
                    path=(
                        f"{path}[{index}]"
                    ),
                    issues=issues,
                )

    def _validate_string(
        self,
        schema: Mapping[
            str,
            Any,
        ],
        value: str,
        path: str,
        issues: list[
            NativeSchemaIssue
        ],
    ) -> None:
        minimum = schema.get(
            "minLength"
        )

        if (
            isinstance(
                minimum,
                int,
            )
            and len(value) < minimum
        ):
            issues.append(
                NativeSchemaIssue(
                    code="MIN_LENGTH",
                    path=path,
                    message=(
                        f"String requires at least "
                        f"{minimum} character(s)."
                    ),
                )
            )

        maximum = schema.get(
            "maxLength"
        )

        if (
            isinstance(
                maximum,
                int,
            )
            and len(value) > maximum
        ):
            issues.append(
                NativeSchemaIssue(
                    code="MAX_LENGTH",
                    path=path,
                    message=(
                        f"String allows at most "
                        f"{maximum} character(s)."
                    ),
                )
            )

        pattern = schema.get(
            "pattern"
        )

        if isinstance(
            pattern,
            str,
        ):
            try:
                matched = re.fullmatch(
                    pattern,
                    value,
                )
            except re.error:
                issues.append(
                    NativeSchemaIssue(
                        code="INVALID_SCHEMA_PATTERN",
                        path=path,
                        message=(
                            "Schema pattern is not "
                            "a valid regular expression."
                        ),
                    )
                )
            else:
                if matched is None:
                    issues.append(
                        NativeSchemaIssue(
                            code="PATTERN_MISMATCH",
                            path=path,
                            message=(
                                "String does not match "
                                "the required pattern."
                            ),
                        )
                    )

        format_name = schema.get(
            "format"
        )

        if format_name == "uri":
            parsed = urlparse(
                value
            )

            if not (
                parsed.scheme
                and (
                    parsed.netloc
                    or parsed.path
                )
            ):
                issues.append(
                    NativeSchemaIssue(
                        code="INVALID_URI",
                        path=path,
                        message=(
                            "String is not a valid URI."
                        ),
                    )
                )
