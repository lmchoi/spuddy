import { preferences } from './db/schema';
import type { DrizzleDB } from './storage';

export type Preferences = {
  notificationSound: boolean;
};

export async function getPreferences(db: DrizzleDB): Promise<Preferences> {
  const rows = db.select().from(preferences).all();
  if (rows[0]) return { notificationSound: rows[0].notificationSound };
  db.insert(preferences).values({ notificationSound: false }).run();
  return { notificationSound: false };
}

export async function setNotificationSound(db: DrizzleDB, on: boolean): Promise<void> {
  const rows = db.select().from(preferences).all();
  if (rows[0]) {
    db.update(preferences).set({ notificationSound: on }).run();
  } else {
    db.insert(preferences).values({ notificationSound: on }).run();
  }
}
