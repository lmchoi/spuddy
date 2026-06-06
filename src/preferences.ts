import { eq } from 'drizzle-orm';
import { preferences } from './db/schema';
import type { DrizzleDB } from './storage';

export type Preferences = {
  notificationSound: boolean;
};

export async function getPreferences(db: DrizzleDB): Promise<Preferences> {
  const row = db.select().from(preferences).get();
  if (row) return { notificationSound: row.notificationSound };
  db.insert(preferences).values({ notificationSound: false }).run();
  return { notificationSound: false };
}

export async function setNotificationSound(db: DrizzleDB, on: boolean): Promise<void> {
  const row = db.select().from(preferences).get();
  if (row) {
    db.update(preferences).set({ notificationSound: on }).where(eq(preferences.id, row.id)).run();
  } else {
    db.insert(preferences).values({ notificationSound: on }).run();
  }
}
