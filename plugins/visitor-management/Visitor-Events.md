# Visitor Management Event Catalog

## Overview

This document defines all events published by the Visitor Management Plugin.

All events are published to the PropertyOS Event Bus.

Other plugins may subscribe to these events without direct dependency on the Visitor Management Plugin.

---

# Visitor Lifecycle Events

## visitor.invited

Triggered when a host creates a visitor invitation.

### Payload

* Visit ID
* Visitor Name
* Visitor Type
* Host ID
* Space ID
* Visit Date

---

## visitor.approved

Triggered when a visitor request is approved.

### Payload

* Visit ID
* Approver ID
* Approval Timestamp

---

## visitor.rejected

Triggered when a visitor request is rejected.

### Payload

* Visit ID
* Approver ID
* Rejection Reason

---

## visitor.token.generated

Triggered when a QR and PIN are generated.

### Payload

* Visit ID
* Token Type
* Expiry Time

---

## visitor.notification.sent

Triggered when a notification is delivered.

### Payload

* Visit ID
* Channel
* Delivery Status

---

## visitor.qr.scanned

Triggered when security scans a QR code.

### Payload

* Visit ID
* Operator ID
* Scan Time

---

## visitor.pin.verified

Triggered when security verifies a PIN.

### Payload

* Visit ID
* Operator ID
* Verification Time

---

## visitor.checkedin

Triggered when visitor enters the property.

### Payload

* Visit ID
* Check-In Time
* Operator ID

---

## visitor.checkedout

Triggered when visitor exits the property.

### Payload

* Visit ID
* Check-Out Time
* Operator ID

---

## visitor.expired

Triggered when an expired invitation is used.

### Payload

* Visit ID
* Attempt Time

---

## visitor.denied

Triggered when visitor access is denied.

### Payload

* Visit ID
* Reason
* Operator ID

---

# Walk-In Events

## visitor.walkin.created

Triggered when a walk-in request is created.

## visitor.walkin.approved

Triggered when a walk-in request is approved.

## visitor.walkin.rejected

Triggered when a walk-in request is rejected.

---

# Recurring Visitor Events

## visitor.recurring.created

Triggered when recurring access is created.

## visitor.recurring.updated

Triggered when recurring access is modified.

## visitor.recurring.deactivated

Triggered when recurring access is disabled.

## visitor.recurring.checkedin

Triggered when a recurring visitor enters.

## visitor.recurring.checkedout

Triggered when a recurring visitor exits.

## visitor.recurring.denied

Triggered when recurring access is denied.

---

# Event Design Rules

1. Events are immutable.
2. Events cannot be edited after publishing.
3. Events must contain timestamps.
4. Events must contain actor information where applicable.
5. Events must not contain business logic.
6. Events may be consumed by any plugin.
7. Core must never depend on visitor events.

---

# Future Events

Potential future events:

* visitor.photo.captured
* visitor.vehicle.registered
* visitor.identity.verified
* visitor.blacklisted
* visitor.whitelist.approved

---

# End of Document

