import { initDB, type DB } from './storage';

let _db: DB | null = null;

export async function getDB(): Promise<DB> {
  if (!_db) _db = await initDB();
  return _db;
}
