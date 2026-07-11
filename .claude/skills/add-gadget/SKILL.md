---
name: add-gadget
description: End-to-end procedure for adding a new gadget (agent tool) to Double-O Agent — contract, file locations, registry, SSE events, and HQ rendering. Use whenever adding, modifying, or debugging a gadget/tool the agent can call.
---

# Add a Gadget

> **Aspirational until Phase 1–2:** this documents the convention the scaffold will implement. Update file paths/snippets against real code once the gadget registry exists.

A **gadget** is a tool the agent can call during a mission (LLM function calling). Adding one touches Control (definition + registration), `libs/shared` (event payload types, only if the gadget introduces new result shapes), and HQ (rendering its events).

## The gadget contract

Every gadget is a class in `apps/control/src/gadgets/` implementing:

```ts
export interface Gadget<TParams, TResult> {
  name: string;             // snake_case, English, engineering-plain: 'find_duplicates'
  description: string;      // what the LLM reads to decide when to call it — write for the model
  paramsSchema: JSONSchema; // JSON schema for TParams; the LLM fills this
  execute(params: TParams, ctx: MissionContext): Promise<TResult>;
}
```

Rules:
- `name`/`description` are **English and literal** (tone guardrail: lore never enters tool definitions — the LLM needs clarity, not jokes). Lore appears only in the HQ rendering layer.
- `description` is a prompt: state what the gadget does, when to use it, and what it returns. Vague descriptions cause wrong tool choices.
- `execute` never calls the LLM (that's the agent loop's job) and never throws raw — wrap failures into a typed error result so the loop can emit an `error`/`gadget_result` event and let the agent recover.

## Checklist

1. **Define** `apps/control/src/gadgets/<gadget-name>.gadget.ts` implementing the contract above.
2. **Types**: params/result interfaces next to the gadget; if HQ must render a new result shape, the shape goes in `libs/shared` (it's crossing the wire inside `gadget_result`).
3. **Register** the gadget in the gadget registry (`apps/control/src/gadgets/gadget.registry.ts`) — the registry is the single list the agent loop exposes to the LLM. Unregistered gadgets don't exist.
4. **SSE events** — no new code needed: the agent loop automatically emits
   - `gadget_call` (`{ gadget: name, params }`) when the LLM invokes it,
   - `gadget_result` (`{ gadget: name, result }` or error info) when `execute` settles.
5. **HQ rendering**: the feed's `@switch` on event type already renders generic call/result lines. If this gadget deserves bespoke rendering (a table of duplicates, an extracted-invoice card), add a case in the feed dispatch keyed on `event.gadget` and build the component per the `modern-best-practice-angular-components` + `spy-theme` skills.
6. **Test**: unit-test `execute` with plain inputs (no LLM involved); add one agent-loop test asserting the gadget is listed in the tools sent to the LLM.
7. **Docs**: one line in the gadget table in `apps/control/src/gadgets/README.md`.

## Example gadget ideas (mission: duplicate hunt)

`list_invoices`, `find_duplicates(threshold)`, `extract_invoice_fields(invoiceId)`, `flag_invoice(invoiceId, reason)`.
