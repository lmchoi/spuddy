# Milestone: Improve Test Coverage

Increase code coverage for critical logic and screens to ensure reliability.

## Goals
- Increase branch coverage above 80% (currently ~76%).
- Fill gaps in `src/storage.ts` and `src/strongImport.ts`.
- Add test coverage for malformed JSON in `src/programParser.ts`.
- Add tests for screens: `app/(tabs)/settings.tsx`, `app/strong-import.tsx`, and `app/modal.tsx`.

## Commits

### 1. test: add storage gaps
- [ ] Test `getSessionByDate` in `src/storage.ts`.
- [ ] Test duplicate exercise safeguard in `rowsToSessions`.
- [ ] Test `ROLLBACK` logic in `saveSession` (if feasible).

### 2. test: add strong import gaps
- [ ] Test merging sessions on same date with same exercise in `src/strongImport.ts`.
- [ ] Test error handling in `importFromStrong`.

### 3. test: add program parser error paths
- [ ] Test malformed JSON (missing weeks, missing days, no valid programs) in `src/programParser.ts`.

### 4. test: settings screen improvements
- [ ] Test successful and failed Liftosaur import in `settings.tsx`.
- [ ] Test navigation to `strong-import`.

### 5. test: add coverage for strong-import screen
- [ ] Basic rendering and interaction tests for `app/strong-import.tsx`.

### 6. test: add coverage for modal screen
- [ ] Basic rendering tests for `app/modal.tsx`.
