import { initDB, type DB } from './storage';

let _dbPromise: Promise<DB> | null = null;

function isReleasedError(err: unknown): boolean {
  return String((err as Error)?.message).includes('already released');
}

function wrapWithReset(db: DB, shouldReset: () => boolean): DB {
  const reset = () => { if (shouldReset()) _dbPromise = null; };
  return {
    run: async (sql, params) => {
      try {
        return await db.run(sql, params);
      } catch (err) {
        if (isReleasedError(err)) reset();
        throw err;
      }
    },
    all: async <T>(sql: string, params?: unknown[]) => {
      try {
        return await db.all<T>(sql, params);
      } catch (err) {
        if (isReleasedError(err)) reset();
        throw err;
      }
    },
  };
}

export function getDB(): Promise<DB> {
  if (!_dbPromise) {
    const p: Promise<DB> = initDB()
      .then(db => wrapWithReset(db, () => _dbPromise === p))
      .catch(err => {
        if (_dbPromise === p) _dbPromise = null;
        throw err;
      });
    _dbPromise = p;
  }
  return _dbPromise;
}
