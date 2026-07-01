# PropertyOS Plugin Manifest Specification

## Purpose

The Plugin Manifest defines the metadata required for PropertyOS to identify, validate, install, activate and manage plugins.

Every plugin must provide a valid manifest file.

Manifest filename:

```text
manifest.json
```

Location:

```text
plugin-root/manifest.json
```

---

# Objectives

The manifest allows PropertyOS to:

* Identify plugins
* Validate compatibility
* Register permissions
* Register events
* Register workflows
* Register menus
* Register UI screens
* Validate dependencies
* Manage upgrades
* Manage rollbacks

---

# Required Fields

## plugin_id

Unique plugin identifier.

Example:

```json
"plugin_id": "visitor-management"
```

Rules:

* Must be globally unique
* Lowercase only
* Hyphen separated

---

## name

Human readable plugin name.

Example:

```json
"name": "Visitor Management"
```

---

## version

Semantic version.

Example:

```json
"version": "1.0.0"
```

Format:

```text
MAJOR.MINOR.PATCH
```

---

## description

Short plugin description.

Example:

```json
"description": "Visitor access management using QR and PIN verification."
```

---

## author

Plugin author.

Example:

```json
"author": "PropertyOS Team"
```

---

## license

Plugin license.

Example:

```json
"license": "MIT"
```

---

## propertyos_version

Minimum PropertyOS version required.

Example:

```json
"propertyos_version": "0.1.0"
```

---

# Optional Fields

## website

Plugin website.

Example:

```json
"website": "https://propertyos.org"
```

---

## repository

Source repository.

Example:

```json
"repository": "https://github.com/propertyos/visitor-management"
```

---

## dependencies

Required plugins.

Example:

```json
"dependencies": [
  "whatsapp-plugin"
]
```

---

## permissions

Permissions registered by plugin.

Example:

```json
"permissions": [
  "visitor.create",
  "visitor.view",
  "visitor.checkin"
]
```

---

## events_published

Events emitted by plugin.

Example:

```json
"events_published": [
  "visitor.invited",
  "visitor.checkedin"
]
```

---

## events_subscribed

Events consumed by plugin.

Example:

```json
"events_subscribed": [
  "person.created"
]
```

---

## menus

Menus added to admin interface.

Example:

```json
"menus": [
  "Visitors"
]
```

---

## screens

UI screens registered by plugin.

Example:

```json
"screens": [
  "Visitor Dashboard",
  "Visitor History"
]
```

---

# Sample Manifest

```json
{
  "plugin_id": "visitor-management",
  "name": "Visitor Management",
  "version": "0.1.0",
  "description": "Visitor access management using QR and PIN verification.",
  "author": "PropertyOS Team",
  "license": "MIT",
  "propertyos_version": "0.1.0",
  "permissions": [
    "visitor.create",
    "visitor.view",
    "visitor.checkin",
    "visitor.checkout"
  ],
  "events_published": [
    "visitor.invited",
    "visitor.checkedin",
    "visitor.checkedout"
  ]
}
```

---

# Validation Rules

PropertyOS must reject installation if:

* plugin_id missing
* name missing
* version missing
* incompatible PropertyOS version
* malformed manifest
* duplicate plugin_id
* invalid dependency

---

# Plugin Package Structure

```text
plugin.zip
│
├── manifest.json
├── README.md
├── backend/
├── frontend/
├── workflows/
├── events/
├── permissions/
├── migrations/
└── tests/
```

---

# Lifecycle Integration

Manifest is used during:

```text
Upload
↓
Validate
↓
Install
↓
Activate
↓
Update
↓
Rollback
↓
Uninstall
```

---

# Future Fields

Potential future additions:

* marketplace_id
* billing_plan
* digital_signature
* plugin_rating
* support_contact
* update_channel

---

# End of Document

