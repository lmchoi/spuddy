import { makeInMemoryDB } from './helpers/makeInMemoryDB';
import { getPreferences, setNotificationSound } from '../src/preferences';
import type { DrizzleDB } from '../src/storage';

describe('getPreferences', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  it('returns a default row with notificationSound false on first call', async () => {
    const prefs = await getPreferences(db);
    expect(prefs.notificationSound).toBe(false);
  });

  it('creates only one row when called multiple times', async () => {
    await getPreferences(db);
    await getPreferences(db);
    const prefs = await getPreferences(db);
    expect(prefs.notificationSound).toBe(false);
  });
});

describe('setNotificationSound', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  it('sets notificationSound to true and round-trips correctly', async () => {
    await setNotificationSound(db, true);
    const prefs = await getPreferences(db);
    expect(prefs.notificationSound).toBe(true);
  });

  it('sets notificationSound to false after it was true', async () => {
    await setNotificationSound(db, true);
    await setNotificationSound(db, false);
    const prefs = await getPreferences(db);
    expect(prefs.notificationSound).toBe(false);
  });
});
