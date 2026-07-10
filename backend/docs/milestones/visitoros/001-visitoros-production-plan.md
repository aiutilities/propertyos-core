# VisitorOS Production Plan

## Goal

Build VisitorOS as the first production-grade PropertyOS plugin.

VisitorOS must prove that PropertyOS supports:

- Plugins
- Workflows
- Events
- Notifications
- Documents
- Search
- Admin dashboards
- Real-world pilot usage

## Phase 1 — Visitor Domain

Core entities:

- Visitor
- Visitor Invite
- Visitor Host
- Visitor Category
- Visitor Company
- Vehicle
- Visitor Pass
- Visit History
- Visitor Status History

## Visitor Types

- Guest
- Vendor
- Delivery
- Prospective Tenant
- Housekeeping
- Electrician
- Plumber
- Family / Friend
- Staff
- Other

## Visitor Workflow

INVITED  
→ APPROVED  
→ ARRIVED  
→ CHECKED_IN  
→ CHECKED_OUT  
→ CLOSED

Exception states:

- REJECTED
- CANCELLED
- EXPIRED
- NO_SHOW
- OVERSTAYED

## Phase 2 — QR Engine

- Generate QR
- Validate QR
- Expiry
- One-time QR
- Multi-entry QR

## Phase 3 — Check-in / Check-out

- QR check-in
- Manual check-in
- Host approval
- Security approval
- Check-out
- Auto check-out rule

## Phase 4 — Notifications

- WhatsApp invite
- Host approval request
- Visitor arrival alert
- Check-in alert
- Check-out alert
- Overstay alert

## Phase 5 — Documents

- Visitor pass
- Entry slip
- Exit slip
- Daily visitor report

## Phase 6 — Search

Search by:

- Name
- Phone
- Host
- Company
- Vehicle
- QR
- Date
- Status

## Phase 7 — Dashboards

Security dashboard:

- Expected today
- Checked in
- Inside now
- Overstayed
- Recently checked out

Admin dashboard:

- Daily visitors
- Category split
- Frequent vendors
- No-shows
- Overstay count

## Phase 8 — Reports

- Daily report
- Weekly report
- Monthly report
- CSV export
- PDF export

## Success Definition

VisitorOS is successful when Advaith's Nest can use it for:

- Prospective tenant visits
- Vendor visits
- Delivery entry
- Housekeeping entry
- Family/friend visits
- Security check-in and check-out
