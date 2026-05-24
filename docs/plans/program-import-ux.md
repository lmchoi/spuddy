# Plan: Program import UX improvements

**Status:** Deferred — document gaps now, fix when program import gets a proper settings redesign  
**File in question:** `app/(tabs)/settings.tsx` — `handleImport` / "Replace Programs" button

---

## Known UX gaps

### 1. No cancel path once the file picker opens

Pressing "Replace Programs" immediately opens the OS document picker (Google Drive / Files on iOS). There is no in-app cancel — the only escape is the OS dismiss gesture. This is fine for power users who know the gesture, but feels like a dead end.

**What we'd want:** nothing before the picker opens (the picker IS the confirmation step for choosing a file), but the picker itself should be cancellable — which it already is technically (`result.canceled` is handled). The problem is purely perception: the button label "Replace Programs" implies destructive intent, and there's no escape hatch visible in-app. Fixing the label (see gap 3) reduces this significantly.

### 2. No confirmation before destructive replace

When a program already exists, pressing the button silently replaces everything. There is no "are you sure?" step. A user who fat-fingers this during a session loses their active program configuration.

**What we'd want:** an `Alert.alert('Replace existing programs?', '...', [{text: 'Cancel'}, {text: 'Replace', style: 'destructive', onPress: …}])` shown BEFORE opening the file picker when `programs.length > 0`.

### 3. "Replace" when "Add" is usually the right behaviour

Most of the time a user importing a new file wants to add another program alongside existing ones, not wipe them. The current design destroys all existing programs on every import. This is correct for the first-time bootstrap case but wrong for every subsequent use.

**What we'd want:** change the import to be additive — programs are merged by name (same name = update, new name = insert). "Replace Programs" becomes "Import Programs" regardless of whether programs exist. A separate destructive "Remove all programs" action can live elsewhere (destructive actions should not be the primary CTA).

This requires a change to `importProgramFromJson` in `src/programImport.ts` — currently it deletes all programs before inserting. The storage layer (`src/programStorage.ts`) would need an upsert-by-name path.

---

## Suggested resolution (when picked up)

1. **Immediate / cheap:** add the confirmation `Alert` before opening the picker when programs exist. One-liner change. Reduces the risk of accidental data loss.

2. **Correct fix:** make import additive (merge by program name). Rename button to "Import Programs" always. Move any "clear all" capability to a danger zone section lower in the settings screen.

3. **Polish:** show the picker sheet with a title ("Choose your Liftosaur export") so the user understands what they're picking, not just a generic Files browser.

---

## Out of scope for this ticket

- Full settings screen redesign
- Per-program delete / reorder
- Import formats beyond Liftosaur JSON
