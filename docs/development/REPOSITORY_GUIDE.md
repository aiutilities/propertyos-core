# PropertyOS Repository Guide

Version: 3.0.0
Status: Living Document

---

## Purpose

This guide explains the repository structure and where code and documentation belong.

---

## Repository Layout

    propertyos-core/
    ├── backend/
    ├── frontend/
    ├── docs/
    ├── plugins/
    ├── themes/
    ├── infrastructure/
    ├── scripts/
    └── README.md

---

## Backend

Location: backend/

Contains:
- Domain Services
- Controllers
- DTOs
- Repositories
- Database Migrations
- Integration Tests
- Event Publishing

---

## Frontend

Location: frontend/

Contains:
- Next.js Application
- React Components
- Layouts
- Themes
- Shared UI

---

## Documentation

The docs/ directory is the canonical location for long-lived documentation.

Structure:

- architecture/
- product/
- domains/
- development/
- deployment/
- reference/
- releases/

---

## Documentation Rules

- New documentation belongs under docs/
- Do not create new top-level documentation folders
- Run git diff --check before committing
- Keep documentation aligned with implementation

---

## Related Documents

- STANDARDS.md
- PRODUCT_VISION.md
- DOCUMENTATION_ROADMAP.md
