# PropertyOS Documentation

PropertyOS documentation is maintained as version-controlled Markdown alongside the source code.

**Indexed documents:** 6

## Start Here

- [Documentation Standards](STANDARDS.md)
- [Repository Guide](development/REPOSITORY_GUIDE.md)
- [Product Vision](product/PRODUCT_VISION.md)
- [Documentation Roadmap](releases/DOCUMENTATION_ROADMAP.md)

## Documentation Policy

The `docs/` directory is the canonical location for new long-lived PropertyOS documentation.

Existing top-level architecture, ADR, PRD, research, and operational documentation is retained until it is reviewed and consolidated.

Swagger/OpenAPI remains the authoritative generated API reference and is exposed by the running backend at `/api/docs`.

## Documentation Index

### General

General documentation and standards.

- [PropertyOS Documentation Standards](STANDARDS.md)

### Architecture

Platform and cross-domain architecture.

- [PropertyOS Platform Architecture](architecture/ARCHITECTURE.md)

### Development

Developer, contributor, testing, and AI-agent guidance.

- [PropertyOS Repository Guide](development/REPOSITORY_GUIDE.md)

### Procurement

Procurement implementation and release documentation.

- [Procurement Frontend Release Audit](procurement/frontend-release-audit.md)

### Product

Product vision, roadmap, editions, and strategy.

- [PropertyOS Product Vision](product/PRODUCT_VISION.md)

### Releases

Documentation milestones and release guidance.

- [PropertyOS Documentation Roadmap](releases/DOCUMENTATION_ROADMAP.md)

## Documentation Tooling

Validate all canonical documentation:

```bash
python3 tools/documentation/validate_docs.py
```

Regenerate this index:

```bash
python3 tools/documentation/generate_index.py
```

Always run the validator and `git diff --check` before committing.
