# PropertyOS System Architecture

## Purpose

This document defines the high-level architecture of PropertyOS.

PropertyOS is an open-source platform for managing properties, communities, shared spaces, and managed facilities through a core platform, plugins, themes, workflows, and integrations.

---

## Architecture Model

PropertyOS follows a WordPress-inspired architecture.

PropertyOS Core

* Plugin Ecosystem
* Theme Ecosystem
* Workflow Engine
* API Layer
* Event Bus
* AI Provider Layer
* Self Hosted Deployment
* Cloud Hosted Deployment
* Marketplace

---

## PropertyOS Core

PropertyOS Core provides shared platform infrastructure.

Core should remain property-type neutral.

Core should not contain business-specific modules such as apartment billing, coworking plans, visitor policy rules, or facility-specific workflows.

---

## Core Engines

### 1. Identity Engine

Manages users, roles, permissions, and access control.

### 2. Organization Engine

Manages organizations using the platform.

### 3. Property Engine

Manages properties, buildings, zones, and spaces.

### 4. People Engine

Manages people connected to properties.

Examples:

* Residents
* Visitors
* Staff
* Vendors
* Owners
* Tenants

### 5. Workflow Engine

Manages repeatable operational processes.

Examples:

* Visitor approval
* Asset maintenance
* Complaint handling
* Vendor onboarding

### 6. Event Bus

Publishes and consumes system events.

Examples:

* visitor.invited
* visitor.checked_in
* asset.created
* workflow.approved

### 7. Notification Engine

Sends messages through supported channels.

Channels:

* WhatsApp
* Email
* SMS
* Push Notification

### 8. Plugin Engine

Allows administrators to install, activate, deactivate, update, configure, and roll back plugins from the admin panel.

### 9. Theme Engine

Allows administrators to install, preview, and activate themes.

### 10. AI Provider Layer

Allows AI capabilities to be added without locking PropertyOS to a single AI provider.

---

## Plugins

Plugins provide business functionality.

Examples:

* Visitor Management Plugin
* Asset Management Plugin
* Helpdesk Plugin
* Facility Management Plugin
* Booking Plugin

Plugins should use core APIs, events, workflows, and permissions.

Plugins should not bypass core rules.

---

## Themes

Themes control user experience, layout, branding, and presentation.

Themes should not contain business logic.

---

## Distributions

Distributions are packaged solutions built on PropertyOS Core.

Examples:

* CommunityOS
* CommercialOS
* CoworkOS

A distribution may include selected plugins, themes, workflows, and default configurations.

---

## Marketplace

The marketplace allows discovery and installation of approved plugins and themes.

Marketplace publishing must require human approval.

---

## Deployment Model

PropertyOS must support:

* Self-hosted deployment
* Cloud-hosted deployment

Users should retain ownership and control of their data.

---

## Admin Installable Requirement

Administrators must be able to manage plugins and themes from the admin panel.

Administrators should be able to:

* Browse plugins
* Upload plugin packages
* Install plugins
* Activate plugins
* Deactivate plugins
* Update plugins
* Roll back plugins
* Configure plugins
* Browse themes
* Install themes
* Preview themes
* Activate themes

No server login should be required for normal plugin or theme management.

---

## First Version Scope

Version 0.1 should focus on platform foundations.

Included:

* Login
* Organization
* Property
* Building
* Zone
* Space
* Person
* Role
* Permission
* Event Bus
* Notification Engine
* Plugin Engine
* Theme Engine Foundation

Business-specific functionality should be delivered through plugins.

---

## Non Goals For Initial Architecture

Do not start with:

* Full ERP
* Accounting
* CRM
* Marketplace-first development
* Native mobile applications
* Complex SaaS multi-tenancy
* Kubernetes
* Over-engineered microservices

