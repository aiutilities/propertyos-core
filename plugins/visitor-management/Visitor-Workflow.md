# Visitor Management Workflow

## Overview

This document describes the operational workflow of the Visitor Management Plugin.

The workflow must function across residential, commercial, educational and managed property environments while remaining independent of PropertyOS Core business logic.

---

# Primary Workflow

Host
↓
Create Invitation
↓
Approval (Optional)
↓
Generate Visitor Entry Token
(QR Code + PIN Code)
↓
Send Notification
↓
Visitor Arrives
↓
Security Verification
↓
Check-In
↓
Notify Host
↓
Visitor Activity
↓
Check-Out
↓
Notify Host
↓
Audit Trail Complete

---

# Workflow 1 - Visitor Invitation

## Trigger

Host creates a visitor invitation.

## Inputs

* Visitor Name
* Mobile Number
* Visitor Type
* Visit Date
* Expected Arrival Time
* Destination Space
* Notes (Optional)

## Actions

* Create Visitor Record
* Generate Visit Identifier
* Publish Event

## Event

visitor.invited

---

# Workflow 2 - Approval

## Trigger

Property requires visitor approval.

## Actions

* Notify Approver
* Approve or Reject Request
* Record Decision

## Events

visitor.approved

visitor.rejected

## Notes

Properties may disable approval requirements.

---

# Workflow 3 - Entry Token Generation

## Trigger

Visitor invitation approved.

## Actions

Generate:

* QR Code
* Numeric PIN Code

## Rules

* PIN and QR represent the same visit
* PIN must be unique
* PIN expires with invitation
* QR expires with invitation

## Event

visitor.token.generated

---

# Workflow 4 - Notification Delivery

## Trigger

Entry token generated.

## Actions

Send:

* QR Code
* PIN Code
* Visit Details

## Channels

* WhatsApp
* SMS
* Email
* Future Channels

## Event

visitor.notification.sent

---

# Workflow 5 - Visitor Arrival

## Trigger

Visitor arrives at gate.

## Security Options

### Option 1

Scan QR Code.

### Option 2

Enter PIN Code manually.

## Validation

System validates:

* Invitation exists
* Invitation active
* Not expired
* Not already checked in

## Events

visitor.qr.scanned

visitor.pin.verified

---

# Workflow 6 - Visitor Check-In

## Trigger

Successful verification.

## Actions

* Record arrival timestamp
* Record operator
* Record security station
* Mark visitor as checked in

## Notifications

Notify Host.

## Event

visitor.checkedin

---

# Workflow 7 - Visitor Check-Out

## Trigger

Visitor exits property.

## Verification

* QR Scan
* PIN Entry
* Manual Selection

## Actions

* Record exit timestamp
* Record operator
* Mark visit completed

## Notifications

Notify Host.

## Event

visitor.checkedout

---

# Workflow 8 - Expired Visitor

## Trigger

Visitor arrives after invitation expiry.

## Actions

* Deny entry
* Record attempt
* Notify Host

## Event

visitor.expired

---

# Workflow 9 - Rejected Visitor

## Trigger

Visitor invitation rejected.

## Actions

* Deny entry
* Record reason

## Event

visitor.rejected

---

# Workflow 10 - Walk-In Visitor

## Trigger

Visitor arrives without invitation.

## Actions

* Create visitor request
* Contact host
* Approve or reject
* Generate temporary token if approved

## Events

visitor.walkin.created

visitor.walkin.approved

visitor.walkin.rejected

---

# Workflow 11 - Audit Trail

The system shall record:

* Invitation Created
* Invitation Approved
* Invitation Rejected
* Token Generated
* Notification Sent
* QR Scanned
* PIN Verified
* Check-In
* Check-Out
* Expiry
* Denial

All records shall be immutable.

---

# Advaith's Nest Validation Scenarios

The workflow must successfully support:

1. Prospective Tenant Visit
2. Electrician Visit
3. Housekeeping Visit
4. Friend or Family Visit
5. Courier Delivery
6. Vendor Visit

No custom workflow shall be required for any of these scenarios.

---

# End of Document

