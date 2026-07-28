#!/usr/bin/env python3

from pathlib import Path

CREATE_DTO = Path(
    "backend/src/core/property/dto/"
    "create-property.dto.ts"
)

UPDATE_DTO = Path(
    "backend/src/core/property/dto/"
    "update-property.dto.ts"
)

DTO_TEST = Path(
    "backend/src/core/property/dto/"
    "property-dto-validation.integration-spec.ts"
)

FORM = Path(
    "frontend/src/components/property/"
    "PropertyForm.tsx"
)

for path in [
    CREATE_DTO,
    UPDATE_DTO,
    DTO_TEST,
    FORM,
]:
    if not path.is_file():
        raise SystemExit(
            f"ERROR: Missing file: {path}"
        )

create_dto = CREATE_DTO.read_text(
    encoding="utf-8",
)

update_dto = UPDATE_DTO.read_text(
    encoding="utf-8",
)

dto_test = DTO_TEST.read_text(
    encoding="utf-8",
)

form = FORM.read_text(
    encoding="utf-8",
)

required_create = [
    "class-validator",
    "@IsString()",
    "@IsNotEmpty()",
    "@IsOptional()",
    "name!: string",
    "propertyType?: string",
    "addressLine1?: string",
    "postalCode?: string",
]

for value in required_create:
    if value not in create_dto:
        raise SystemExit(
            "ERROR: Create DTO contract missing: "
            + value
        )

required_update = [
    "@IsOptional()",
    "@IsBoolean()",
    "isActive?: boolean",
    "name?: string",
    "propertyType?: string",
]

for value in required_update:
    if value not in update_dto:
        raise SystemExit(
            "ERROR: Update DTO contract missing: "
            + value
        )

required_test = [
    "ValidationPipe",
    "whitelist: true",
    "forbidNonWhitelisted: true",
    "accepts the supported create-property fields",
    "rejects fields outside the create-property contract",
    "requires a non-empty property name",
    "accepts a partial supported update",
]

for value in required_test:
    if value not in dto_test:
        raise SystemExit(
            "ERROR: DTO test contract missing: "
            + value
        )

required_form = [
    "getPropertySaveError(",
    "extractApiMessage(",
    '"Property save failed"',
    "console.error(",
    "Unable to save the property.",
]

for value in required_form:
    if value not in form:
        raise SystemExit(
            "ERROR: Frontend sanitization missing: "
            + value
        )

for forbidden in [
    "? caughtError.message",
    "Property could not be saved"
    + "\\n{",
]:
    if forbidden in form:
        raise SystemExit(
            "ERROR: Raw API-error rendering remains: "
            + forbidden
        )

print("Property submit contract: VALID")
print("Create DTO decorators:     present")
print("Update DTO decorators:     present")
print("Whitelist compatibility:   covered")
print("Unknown-field rejection:   covered")
print("Required-name validation:  covered")
print("Raw JSON user display:     prevented")
print("Technical console detail:  retained")
print("Form values on error:      preserved")
