# Backend Domain Model

## Purpose

The Domain Model defines the business objects managed by PropertyOS.

All APIs, database tables, events, permissions and plugins must be built around these objects.

---

# Design Principles

PropertyOS Core owns platform objects.

Plugins extend behavior around those objects.

Core objects should remain industry-neutral.

---

# Organization

Represents a legal or operational entity.

Examples:

* Apartment Association
* Property Management Company
* Business
* School
* Hospital
* Coworking Operator

Fields:

```text
id
name
code
type
status
createdAt
updatedAt
```

---

# Property

Represents a physical property.

Examples:

* Apartment Complex
* Office Building
* Industrial Park
* School Campus
* Hostel
* Hotel

Fields:

```text
id
organizationId
name
code
address
status
createdAt
updatedAt
```

Relationship:

```text
Organization
    ↓
Property
```

---

# Zone

Logical grouping inside a property.

Examples:

```text
Block A
Tower B
Floor 5
Parking Area
Club House
```

Fields:

```text
id
propertyId
name
type
status
```

Relationship:

```text
Property
   ↓
Zone
```

---

# Space

Smallest physical unit.

Examples:

```text
Flat
Room
Office
Desk
Warehouse
Shop
Parking Slot
```

Fields:

```text
id
propertyId
zoneId
name
spaceType
status
```

Relationship:

```text
Property
   ↓
Zone
   ↓
Space
```

---

# Person

Human being known to the system.

Examples:

```text
Resident
Tenant
Owner
Employee
Security
Visitor Host
Vendor Contact
```

Fields:

```text
id
firstName
lastName
mobile
email
status
```

---

# Organization Member

Links a person to an organization.

Examples:

```text
Employee
Manager
Administrator
Contractor
```

Fields:

```text
organizationId
personId
role
status
```

---

# Property Member

Links a person to a property.

Examples:

```text
Owner
Tenant
Resident
Manager
Security
Maintenance Staff
```

Fields:

```text
propertyId
personId
role
status
```

---

# Asset

Represents a managed item.

Examples:

```text
Generator
Lift
Camera
Vehicle
Printer
Access Device
```

Fields:

```text
id
propertyId
name
assetType
serialNumber
status
```

---

# Document

Managed file.

Examples:

```text
Agreement
Invoice
Receipt
Visitor Pass
ID Proof
```

Fields:

```text
id
category
entityType
entityId
version
storagePath
```

---

# Event

Represents a platform event.

Examples:

```text
visitor.invited
property.created
plugin.activated
```

Fields:

```text
id
name
source
payload
metadata
createdAt
```

---

# Audit Record

Immutable operational history.

Fields:

```text
id
action
entityType
entityId
actorId
source
createdAt
```

---

# Notification

Represents a communication request.

Fields:

```text
id
channel
recipient
templateKey
status
createdAt
```

---

# Plugin

Installed business extension.

Examples:

```text
Visitor Plugin
WhatsApp Plugin
RentOps Plugin
```

Fields:

```text
id
name
version
status
manifest
config
```

---

# Role

Permission grouping.

Examples:

```text
System Admin
Property Manager
Security
Resident
Tenant
```

Fields:

```text
id
name
description
```

---

# Permission

Action authorization.

Examples:

```text
visitor.create
visitor.check_in
property.update
plugin.activate
```

Fields:

```text
id
code
description
```

---

# Role Permission

Relationship table.

```text
Role
   ↓
Permission
```

---

# User Account

Authentication identity.

Fields:

```text
id
personId
username
email
status
lastLoginAt
```

---

# Core Relationship Diagram

```text
Organization
    ↓
Property
    ↓
Zone
    ↓
Space

Person
    ↓
Property Member

Person
    ↓
Organization Member

Property
    ↓
Asset

Any Entity
    ↓
Document

Any Entity
    ↓
Audit Record

Any Module
    ↓
Event

Any Module
    ↓
Notification

Plugin
    ↓
Event Bus

Role
    ↓
Permission

User Account
    ↓
Person
```

---

# Version 0.1 Core Objects

Only these are mandatory:

```text
Organization
Property
Zone
Space
Person
Role
Permission
User Account
Document
Notification
Event
Audit Record
Plugin
```

Everything else can be added later.

