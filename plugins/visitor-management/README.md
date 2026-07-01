# Visitor Management Plugin

## Overview

The Visitor Management Plugin is the first official business plugin for PropertyOS.

It enables organizations, residential communities, hostels, managed accommodations, commercial facilities and campuses to manage visitor access using QR codes, approvals, notifications and audit trails.

The plugin is designed to operate entirely on top of PropertyOS Core without introducing property-specific functionality into the core platform.

## Objectives

The plugin shall provide:

* Visitor invitation
* Visitor approval workflow
* QR code generation
* QR code validation
* Visitor check-in
* Visitor check-out
* Visitor history
* Visitor audit trail
* Security desk operations
* WhatsApp notifications

## Target Installations

* Apartments
* Gated Communities
* Hostels
* Paying Guest Facilities
* Managed Rentals
* Coworking Spaces
* Commercial Buildings
* Educational Campuses
* Industrial Facilities

## Dependencies on PropertyOS Core

The plugin relies on the following Core services:

### Property

Used to identify the property where a visitor is expected.

### Zone

Used to identify visitor destinations such as blocks, towers or security zones.

### Space

Used to identify apartments, rooms, offices, cabins or other physical destinations.

### Person

Used to identify hosts, visitors and security personnel.

### Role and Permission

Used to control visitor operations and security access.

### Event Bus

Used to publish visitor events to other plugins.

### Notification Engine

Used to send alerts and notifications.

## Dependencies on WhatsApp Plugin

The Visitor Management Plugin does not communicate directly with WhatsApp providers.

Instead it publishes notification requests through PropertyOS Notification Engine.

The WhatsApp Plugin may subscribe to those notifications and deliver messages through supported providers.

## Primary Features

### Visitor Invitation

Hosts can invite visitors before arrival.

### Visitor Approval

Properties may require approval before entry.

### QR Code Generation

Each approved visit generates a unique QR code.

### Security Verification

Security personnel can validate visitor QR codes.

### Visitor Check-In

Entry is recorded with timestamp and operator information.

### Visitor Check-Out

Exit is recorded with timestamp and operator information.

### Visitor History

Authorized users can review visitor records.

### Audit Trail

All important visitor actions are stored as events.

## Out of Scope

The following are intentionally excluded from Version 1:

* Facial recognition
* Vehicle tracking
* Visitor billing
* Marketplace integrations
* AI risk scoring
* Government identity verification
* Multi-property visitor analytics

## Version

Current Status: Design Phase

Plugin Version: 0.1.0

