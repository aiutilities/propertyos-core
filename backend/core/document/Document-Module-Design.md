# Document Module Design

## 1. Purpose

The Document Module is responsible for managing files and documents across PropertyOS.

It provides a unified document layer for:

* Core modules
* Plugins
* Workflows
* Notifications
* Audit records
* Future AI services

The Document Module stores metadata about documents and manages document lifecycle.

---

## 2. Why Document Module Is Needed

Every property operation eventually produces documents.

Examples:

```text
Visitor Pass
Rental Agreement
ID Proof
Maintenance Invoice
Asset Warranty
Security Incident Report
Tenant Notice
Organization Registration Certificate
```

Without a common document module, every plugin will create its own file storage mechanism.

That creates duplication and inconsistency.

---

## 3. Core Responsibilities

The Document Module is responsible for:

1. Uploading documents
2. Storing document metadata
3. Version tracking
4. Downloading documents
5. Linking documents to entities
6. Managing document categories
7. Supporting future OCR and AI processing
8. Publishing document events

---

## 4. Initial Scope

Version 0.1 should support:

* Upload document
* Download document
* Delete document
* Document metadata
* Entity attachment
* Document categories
* Event Bus integration
* Local storage support

Do not build document approval workflows now.

Do not build OCR now.

Do not build electronic signatures now.

---

## 5. Document Definition

A document is any uploaded file managed by PropertyOS.

Examples:

```text
PDF
Image
Word Document
Spreadsheet
Text File
ZIP Archive
```

The Document Module should manage metadata regardless of file type.

---

## 6. Document Object Structure

```ts
export interface PropertyOSDocument {
  id: string;
  name: string;
  originalFileName: string;
  category: string;
  mimeType: string;
  sizeInBytes: number;
  storagePath: string;
  entityType?: string;
  entityId?: string;
  version: number;
  uploadedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

## 7. Example Document

```json
{
  "id": "doc_001",
  "name": "visitor-pass-ravi",
  "originalFileName": "visitor-pass.pdf",
  "category": "visitor_pass",
  "mimeType": "application/pdf",
  "sizeInBytes": 150245,
  "storagePath": "/documents/2026/07/visitor-pass.pdf",
  "entityType": "visitor",
  "entityId": "visitor_001",
  "version": 1,
  "uploadedBy": "person_001",
  "createdAt": "2026-07-01T10:00:00Z"
}
```

---

## 8. Document Categories

Initial categories:

```text
identity_document
visitor_pass
rental_agreement
invoice
receipt
asset_document
property_document
organization_document
system_document
other
```

New categories may be added later.

---

## 9. Entity Attachment

Documents may belong to an entity.

Examples:

```text
Person
Organization
Property
Zone
Space
Visitor
Asset
Workflow
```

Example:

```text
identity_document
     ↓
Person
     ↓
person_001
```

Document metadata stores the relationship.

---

## 10. Storage Strategy

Version 0.1 storage:

```text
Local filesystem
```

Example:

```text
storage/
└── documents/
    └── 2026/
        └── 07/
            └── file.pdf
```

Future storage:

```text
AWS S3
MinIO
Azure Blob
Google Cloud Storage
```

Storage implementation must be abstracted.

---

## 11. Backend Folder Structure

```text
backend/core/document/
├── README.md
├── Document-Module-Design.md
├── document.module.ts
├── document.service.ts
├── document.controller.ts
├── document.repository.ts
├── document.types.ts
├── storage/
│   ├── storage-provider.interface.ts
│   ├── local-storage.provider.ts
│   └── s3-storage.provider.ts
└── dto/
    ├── upload-document.dto.ts
    └── update-document.dto.ts
```

---

## 12. Main Service Design

```ts
upload(file): Promise<PropertyOSDocument>

download(documentId): Promise<File>

delete(documentId): Promise<void>

getDocument(documentId): Promise<PropertyOSDocument>

listDocuments(filters): Promise<PropertyOSDocument[]>
```

---

## 13. Document Events

The Document Module should publish:

```text
document.uploaded
document.updated
document.deleted
document.downloaded
```

Examples:

```text
document.uploaded
document.deleted
```

These events allow plugins to react.

---

## 14. Event Bus Integration

Document Module should publish:

```text
document.uploaded
document.updated
document.deleted
```

Document Module may listen to:

```text
visitor.checked_out
workflow.completed
audit.recorded
```

Future plugins may automatically generate documents.

---

## 15. Document Metadata Table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  size_in_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 16. File Naming Rules

Never trust user file names.

Generate unique file names.

Example:

```text
visitor-pass.pdf
```

Stored as:

```text
doc_f93d11a2.pdf
```

Keep original name in metadata.

---

## 17. Versioning Strategy

Version 0.1:

```text
Version number only
```

Example:

```text
v1
v2
v3
```

Actual version storage can be added later.

For now, version metadata is sufficient.

---

## 18. Download Rules

Before download:

1. Verify document exists.
2. Verify permission.
3. Log access.
4. Stream file.
5. Publish document.downloaded event.

Never expose storage path directly.

---

## 19. Security Rules

Allowed:

```text
PDF
JPG
PNG
DOCX
XLSX
TXT
ZIP
```

Blocked:

```text
Executable files
Unknown dangerous formats
```

Validate:

* MIME type
* Extension
* File size

Future antivirus scanning can be added.

---

## 20. Permission Model

Examples:

```text
Admin → Full access
Property Manager → Assigned property access
Security → Visitor documents only
Resident → Own documents only
```

Actual permission enforcement belongs to Identity/Permission modules.

Document Module only consumes permission checks.

---

## 21. Document Module And Notification Module

Notifications may include:

```text
Visitor Pass PDF
Invoice PDF
Agreement PDF
```

Notification Module should request document links rather than storing copies.

---

## 22. Document Module And Audit Module

Audit Module should record:

```text
document.uploaded
document.deleted
document.downloaded
```

Document Module publishes events.

Audit Module records them.

---

## 23. Document Module And Plugin Engine

Plugins should not build their own file storage.

Plugins should use:

```ts
documentService.upload()
documentService.download()
documentService.listDocuments()
```

This creates consistency across the platform.

---

## 24. API Endpoints

Initial endpoints:

```text
POST   /core/document/upload
GET    /core/document/:id
GET    /core/document/:id/download
DELETE /core/document/:id
GET    /core/document
```

Admin APIs only initially.

---

## 25. Future Enhancements

Future versions may support:

```text
OCR
AI extraction
Digital signatures
Document approval workflows
PDF generation
Watermarking
Document retention rules
Legal hold
Document expiration
Document sharing links
S3 storage
MinIO storage
Virus scanning
```

Do not build these now.

---

## 26. Non-Goals

The Document Module should not:

* Manage workflows
* Manage approvals
* Manage permissions
* Send notifications
* Perform OCR
* Replace DMS systems
* Become a CMS

It is a document storage and metadata service.

---

## 27. Version 0.1 Success Criteria

The Document Module is successful when:

1. File can be uploaded.
2. Metadata is stored.
3. File can be downloaded.
4. File can be deleted.
5. Entity relationship can be stored.
6. Event Bus receives document events.
7. Plugins can attach documents.
8. Audit Module can record document activity.
9. Notification Module can reference documents.
10. Local filesystem storage works.

---

## 28. Simple Mental Model

Think of Document Module as the filing cabinet of PropertyOS.

Modules say:

```text
Store this document.
```

Document Module says:

```text
I will store it safely,
track it,
version it,
and make it retrievable later.
```

Every plugin should use the same filing cabinet.

That is the purpose of the Document Module.

