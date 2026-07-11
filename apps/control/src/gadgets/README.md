# Gadgets

Tools the agent can call during a mission. See the `add-gadget` skill for the
procedure; every gadget must be registered in `gadget.registry.ts` to exist.

| Gadget | Params | Does |
|---|---|---|
| `list_invoices` | — | Returns every invoice in the current batch. |
| `compare_invoices` | `invoiceIdA`, `invoiceIdB` | Field-by-field comparison of two invoices with per-field match flags. |
| `flag_invoice` | `invoiceId`, `reason` | Marks an invoice as a duplicate entry; recorded on the mission context and reported in the debrief. |
| `read_document` | — | Returns the text of the PDF attached to the mission (extraction missions). |
| `record_invoice` | `number`, `counterparty`, `amount`, `currency`, `issueDate` | Validates and records the extracted invoice fields; becomes the mission result shown in the debrief. |
