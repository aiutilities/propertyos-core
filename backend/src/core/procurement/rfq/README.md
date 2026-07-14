# Procurement RFQ bounded context

The RFQ implementation must enforce these rules:

1. An RFQ can only be created from an APPROVED purchase request.
2. The purchase request items are copied into RFQ items.
3. At least one vendor must be invited.
4. Duplicate vendor invitations are not allowed.
5. Only active vendors may be invited.
6. Draft RFQs may be edited.
7. Issuing an RFQ records issueDate, issuedAt, and issuedByPersonId.
8. An issued RFQ transitions to OPEN.
9. OPEN or ISSUED RFQs may be CLOSED, CANCELLED, or EXPIRED.
10. Awarding is deferred until quotation and comparison contexts exist.
11. Creating the RFQ moves the source purchase request to CONVERTED_TO_RFQ.
12. Every transition writes status history, audit, and EventBus records.
