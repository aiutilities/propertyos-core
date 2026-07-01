# Visitor Management Permission Model

## Overview

This document defines the permissions required by the Visitor Management Plugin.

The plugin relies entirely on PropertyOS Core Role and Permission services.

No visitor-specific permission logic shall exist in PropertyOS Core.

---

# Roles

The following standard roles are assumed:

* Administrator
* Property Manager
* Host
* Security Personnel

Additional roles may be added by future plugins.

---

# Permissions

## visitor.create

Allows creation of visitor invitations.

### Assigned To

* Administrator
* Property Manager
* Host

---

## visitor.view

Allows viewing visitor records.

### Assigned To

* Administrator
* Property Manager
* Host

### Restrictions

Hosts may only view visitors related to their assigned spaces.

---

## visitor.approve

Allows approval of visitor requests.

### Assigned To

* Administrator
* Property Manager

---

## visitor.reject

Allows rejection of visitor requests.

### Assigned To

* Administrator
* Property Manager

---

## visitor.checkin

Allows visitor entry processing.

### Assigned To

* Security Personnel
* Administrator

---

## visitor.checkout

Allows visitor exit processing.

### Assigned To

* Security Personnel
* Administrator

---

## visitor.recurring.manage

Allows management of recurring visitors.

### Assigned To

* Administrator
* Property Manager

---

## visitor.audit.view

Allows access to visitor audit trails.

### Assigned To

* Administrator
* Property Manager

---

## visitor.export

Allows export of visitor reports.

### Assigned To

* Administrator
* Property Manager

---

## visitor.admin

Full administrative control over the plugin.

### Assigned To

* Administrator

---

# Permission Matrix

| Permission               | Admin | Manager | Host | Security |
| ------------------------ | ----- | ------- | ---- | -------- |
| visitor.create           | Yes   | Yes     | Yes  | No       |
| visitor.view             | Yes   | Yes     | Yes  | Yes      |
| visitor.approve          | Yes   | Yes     | No   | No       |
| visitor.reject           | Yes   | Yes     | No   | No       |
| visitor.checkin          | Yes   | No      | No   | Yes      |
| visitor.checkout         | Yes   | No      | No   | Yes      |
| visitor.recurring.manage | Yes   | Yes     | No   | No       |
| visitor.audit.view       | Yes   | Yes     | No   | No       |
| visitor.export           | Yes   | Yes     | No   | No       |
| visitor.admin            | Yes   | No      | No   | No       |

---

# Design Rules

1. Permissions belong to PropertyOS Core.
2. Visitor Plugin only registers permission definitions.
3. Roles are assigned by PropertyOS Core.
4. Plugin must not hardcode user access.
5. All access decisions must be permission-based.
6. Future plugins may reuse the same permission framework.

---

# Future Permissions

Potential future permissions:

* visitor.photo.capture
* visitor.vehicle.manage
* visitor.identity.verify
* visitor.blacklist.manage
* visitor.analytics.view

---

# End of Document

