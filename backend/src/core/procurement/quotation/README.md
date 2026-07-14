# Procurement quotation bounded context

Core rules for the current Migration 032 model:

1. Quotations may only be created against OPEN RFQs.
2. Only vendors invited to the RFQ may submit quotations.
3. Every quotation item must reference an item belonging to the RFQ.
4. At least one quotation item is required.
5. Quantity and unit price must be greater than zero.
6. Discounts, taxes, and freight must never produce a negative total.
7. Draft quotations may be edited.
8. One quotation is maintained per vendor per RFQ.
9. Submitted quotations may be withdrawn before selection.
10. Procurement managers may select or reject submitted quotations.
11. Submitting a quotation marks the RFQ vendor invitation RESPONDED.
12. Every lifecycle transition writes status history, audit, and EventBus records.
13. Quotation revisions require a future migration and are not part of Migration 032.
