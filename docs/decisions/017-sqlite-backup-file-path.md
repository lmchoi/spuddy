# ADR 017: SQLite backup uses `$client.databasePath` not `documentDirectory`

## Context

When implementing the SQLite file export (iteration 1), the initial plan described resolving the source path as `${FileSystem.documentDirectory}SQLite/spuddy.db`. This is the conventional Expo SQLite path on Android.

During device testing this path proved wrong — `FileSystem.copyAsync` threw `FileNotFoundException`. Investigation showed:

1. **`expo-file-system` SDK 56 moved legacy APIs to a subpath.** `documentDirectory`, `cacheDirectory`, and `copyAsync` are no longer exported from `expo-file-system` — they live at `expo-file-system/legacy`. Without this import the copy call silently operates on `undefined`.

2. **The actual database path varies by runtime.** In Expo Go the SQLite file lands under a scoped directory for the Expo Go host app, not the bare `documentDirectory` of the Expo project. Constructing the path manually produces the wrong location.

3. **Drizzle ORM exposes the real path via `$client`.** The Drizzle `db` object wraps an `expo-sqlite` `SQLiteDatabase`. That object's `databasePath` property returns the exact path the SQLite engine opened — correct regardless of runtime (Expo Go, development build, production).

4. **Android raw paths need a `file://` URI prefix.** `databasePath` returns a filesystem path (e.g. `/data/data/.../SQLite/spuddy.db`). `FileSystem.copyAsync` requires a URI, so a `file://` prefix is added with a guard against double-prefixing.

## Decision

The `exportDatabase` function reads the source path from `(db as any).$client.databasePath` and normalises it to a `file://` URI before passing it to `FileSystem.copyAsync`. It imports from `expo-file-system/legacy`.

## Consequences

- The export works correctly in both Expo Go and standalone/production builds.
- `$client` is not typed on the Drizzle public API, hence the `as any` cast. If Drizzle exposes a typed accessor in a future release we should migrate.
- Any code that constructs the SQLite path manually (e.g. for migrations or diagnostics) should also switch to `$client.databasePath` to avoid the same class of bug.
