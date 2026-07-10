# Property Module Design

## Purpose

The Property Module manages the physical structure of PropertyOS.

It defines how properties, zones and spaces are represented across apartments, hostels, coworking spaces, commercial buildings, campuses and managed facilities.

---

# Core Principle

PropertyOS must model physical space generically.

Core must not contain apartment-specific, hostel-specific, coworking-specific or commercial-specific assumptions.

---

# Core Objects

## Property

A Property is the top-level physical location.

Examples:

* Apartment Community
* Hostel
* Paying Guest Facility
* Commercial Complex
* Coworking Space
* Educational Campus
* Industrial Facility
* Managed Rental Property

### Attributes

* property_id
* property_name
* property_type
* address
* city
* state
* country
* status
* created_at
* updated_at

---

## Zone

A Zone is a logical or physical section inside a property.

Examples:

* Block
* Tower
* Floor
* Wing
* Security Zone
* Building Section

### Attributes

* zone_id
* property_id
* zone_name
* zone_type
* parent_zone_id
* status
* created_at
* updated_at

---

## Space

A Space is a usable unit inside a property.

Examples:

* Room
* Apartment
* Office
* Cabin
* Shop
* Parking Slot
* Storage Area
* Meeting Room

### Attributes

* space_id
* property_id
* zone_id
* space_name
* space_type
* space_number
* status
* created_at
* updated_at

---

# Property Hierarchy

```text
Property
   │
   ├── Zone
   │     │
   │     └── Space
   │
   └── Space
```

A Space may belong directly to a Property or through a Zone.

---

# APIs

## Property APIs

* Create Property
* View Property
* Update Property
* Deactivate Property
* Search Properties

## Zone APIs

* Create Zone
* View Zone
* Update Zone
* Deactivate Zone
* Search Zones

## Space APIs

* Create Space
* View Space
* Update Space
* Deactivate Space
* Search Spaces

---

# Events

## Property Events

* property.created
* property.updated
* property.deactivated

## Zone Events

* zone.created
* zone.updated
* zone.deactivated

## Space Events

* space.created
* space.updated
* space.deactivated

---

# Design Rules

1. Property is the top-level physical container.
2. Zone is optional.
3. Space is the main usable unit.
4. Core must not hardcode apartment, hostel or coworking logic.
5. Plugins may attach business logic to Property, Zone or Space.
6. Property Module must remain plugin-neutral.
7. Spaces must support future relationships with tenants, visitors, assets, documents and workflows.

---

# Database Tables

Initial tables:

```text
properties
zones
spaces
```

---

# Advaith's Nest Example

```text
Property:
Advaith's Nest

Zones:
Ground Floor
First Floor
Second Floor

Spaces:
Room 101
Room 102
Room 201
Room 202
```

---

# Visitor Plugin Usage

Visitor Plugin may use:

* property_id to identify the property
* zone_id to identify the destination zone
* space_id to identify the room, office or destination

Visitor Plugin must not require visitor-specific columns inside Property, Zone or Space tables.

---

# Future Enhancements

Future versions may include:

* Space capacity
* Space amenities
* Floor plans
* Geo coordinates
* Asset mapping
* Occupancy status
* Space availability calendar

---

# Success Criteria

The Property Module succeeds when:

* Advaith's Nest can be modeled cleanly.
* Apartments can be modeled cleanly.
* Commercial buildings can be modeled cleanly.
* Coworking spaces can be modeled cleanly.
* Visitor Plugin can use Property, Zone and Space without Core changes.
* RentOps can later use Space without redesigning Core.

---

# End of Document

