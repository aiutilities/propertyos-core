# Identity Module Design

## Purpose

The Identity Module provides the foundation for authentication, authorization and membership management within PropertyOS.

It manages people, roles, permissions and memberships.

All plugins and core modules depend on Identity.

The Identity Module must remain generic and reusable across all PropertyOS distributions.

---

# Core Principle

Identity determines:

Who is the user?

What role does the user have?

What permissions does the user have?

Where do those permissions apply?

---

# Core Objects

## Person

Represents a human being interacting with the system.

Examples:

* Property Owner
* Tenant
* Resident
* Security Guard
* Employee
* Vendor
* Visitor Host

### Attributes

* person_id
* first_name
* last_name
* mobile_number
* email
* status
* created_at
* updated_at

---

## Role

Represents a collection of permissions.

Examples:

* Administrator
* Property Manager
* Host
* Security Personnel
* Resident
* Tenant

### Attributes

* role_id
* role_name
* description
* status

---

## Permission

Represents an allowed action.

Examples:

* visitor.create
* visitor.approve
* property.create
* property.update

### Attributes

* permission_id
* permission_name
* description
* status

---

## Membership

Represents the relationship between a Person and a Property context.

This is one of the most important objects in PropertyOS.

A Person may have different roles in different properties.

### Example

Anand

* Owner at Property A
* Property Manager at Property B
* Resident at Property C

Without Membership, this cannot be modeled correctly.

### Attributes

* membership_id
* person_id
* property_id
* zone_id (optional)
* space_id (optional)
* role_id
* start_date
* end_date
* status

---

# Identity Relationships

```text
Person
   │
   ├── Membership
   │
   └── Role
          │
          └── Permission
```

---

# APIs

## Person APIs

* Create Person
* View Person
* Update Person
* Deactivate Person
* Search Person

---

## Role APIs

* Create Role
* View Role
* Update Role
* Deactivate Role

---

## Permission APIs

* Create Permission
* View Permission
* Update Permission
* Deactivate Permission

---

## Membership APIs

* Create Membership
* View Membership
* Update Membership
* Revoke Membership
* Search Membership

---

# Events

## Person Events

* person.created
* person.updated
* person.deactivated

---

## Role Events

* role.created
* role.updated
* role.deactivated

---

## Permission Events

* permission.created
* permission.updated
* permission.deactivated

---

## Membership Events

* membership.created
* membership.updated
* membership.revoked

---

# Permission Resolution

Permission checks should follow:

```text
User
↓
Membership
↓
Role
↓
Permission
↓
Access Decision
```

Example:

```text
User requests visitor approval
↓
Find active membership
↓
Find assigned role
↓
Check visitor.approve permission
↓
Allow or deny
```

---

# Design Rules

1. Person must not contain permissions directly.
2. Permissions must be assigned through roles.
3. Membership determines context.
4. A person may have multiple memberships.
5. Roles must be reusable.
6. Permission checks must be server-side.
7. Identity must remain plugin-neutral.

---

# Database Tables

Initial tables:

```text
persons
roles
permissions
role_permissions
memberships
```

---

# Future Enhancements

Future versions may include:

* Groups
* Teams
* Departments
* External Identity Providers
* Single Sign-On
* Multi-Factor Authentication
* Delegated Administration

---

# Success Criteria

The Identity Module succeeds when:

* A person can exist in multiple properties.
* Different roles can be assigned per property.
* Permissions are reusable across plugins.
* Visitor Plugin can rely entirely on Identity.
* Core remains generic and extensible.

---

# End of Document

