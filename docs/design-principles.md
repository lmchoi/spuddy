# Design principles

Short rules that guide UI decisions in Spuddy. Add to this when a pattern
proves itself; remove or revise when experience contradicts it.

---

## Labels describe the action, not the state

Button copy should tell the user what will happen when they tap — not name
the current situation.

- "Add another" not "Done"
- "Paste to begin" not "Save" (disabled)
- "Dismiss" not "Cancel" (when dismissing a banner)

If a label makes sense only because the user remembers what screen they're
on, rename it.

---

## Trust the affordance; don't duplicate the explanation

If a placeholder, label, or input shape already communicates the expected
format or action, a separate explanatory card is noise — and it buries the
actual thing to interact with.

Prefer removing the redundant surface. One clear signal beats two competing
ones.

---

## Inline feedback over modal interruption

Validation, conflicts, and parse errors surface inline (banners, chips,
disabled states) rather than as alerts or separate screens. Keep the user
in the flow.

Use modals or alerts only for genuinely destructive, irreversible actions
that require explicit confirmation.

---

## Stable layouts; no surprise resizing

Controls should not jump position or change size based on state. A button
that is sometimes wide and sometimes narrow, or a row that gains and loses
an element, is harder to use and harder to trust.

Prefer: hide/show whole sections, not individual items within a row that
cause siblings to shift. When a control appears in more than one state,
keep it in the same place across those states.
