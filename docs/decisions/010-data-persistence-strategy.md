# Strategy: Data Persistence & Seamless Upgrades

This document outlines the requirements for updating the app without losing user data (e.g., local SQLite database).

## 1. Consistent App Identity (Signing)
Android prevents updates if the "Signature" of the new APK doesn't match the installed one. To avoid `INSTALL_FAILED_UPDATE_INCOMPATIBLE`:

- **Requirement:** A permanent Keystore file (`.jks` or `.keystore`).
- **Action:** 
    1. Generate a production-grade Keystore.
    2. Store the Keystore file and its passwords securely (e.g., GitHub Secrets).
    3. Update the GitHub Action (`build-apk.yml`) to sign every build with this specific key instead of a temporary debug key.
- **Outcome:** Android recognizes every build (local or cloud) as the "same developer," allowing `adb install -r` to keep data intact.

## 2. Database Schema Migrations
As the app evolves, the SQLite table structure will change. To prevent crashes:

- **Requirement:** A versioned migration system in `src/db.ts`.
- **Action:**
    1. Use `PRAGMA user_version` to track the current database version.
    2. Wrap table creations and `ALTER TABLE` commands in conditional logic.
- **Pattern:**
    ```typescript
    const currentDbVersion = await db.getFirstAsync('PRAGMA user_version');
    if (currentDbVersion < 2) {
      await db.execAsync('ALTER TABLE exercises ADD COLUMN notes TEXT');
      await db.execAsync('PRAGMA user_version = 2');
    }
    ```

## 3. Transition to Drizzle ORM (Planned)
To improve long-term maintainability and type safety, the app will migrate from manual SQL migrations to **Drizzle ORM**.
- **Action:**
    1. Define schema in TypeScript.
    2. Use `drizzle-kit` to manage versioned `.sql` migration files.
    3. Use Drizzle's `useMigrations` or `migrate()` to handle the bridge from the current version to the Drizzle-managed version.
- **Outcome:** Type-safe queries and automated, less error-prone schema evolution.

## 4. Expo Version Upgrades
When upgrading the `expo` version in `package.json`:

- **Action:** Always run `npx expo prebuild --clean` to regenerate native folders with the correct dependencies before building the new APK.

## 5. Backups (Future-proofing)
Even with migrations, local storage is fragile. 
- **Future Goal:** Implement an "Export/Import JSON" feature or cloud sync (e.g., Google Drive/iCloud) as a safety net before major version upgrades.
