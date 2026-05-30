import { initDB, type DrizzleDB } from './storage';

let _dbPromise: Promise<DrizzleDB> | null = null;

export function getDB(): Promise<DrizzleDB> {
  if (!_dbPromise) {
    _dbPromise = initDB().catch(err => {
      _dbPromise = null;
      throw err;
    });
  }
  return _dbPromise;
}
