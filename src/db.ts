import { initDB, type DB } from './storage';

let _dbPromise: Promise<DB> | null = null;

export function getDB(): Promise<DB> {
  if (!_dbPromise) _dbPromise = initDB();
  return _dbPromise;
}
