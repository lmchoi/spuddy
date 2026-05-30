import { useEffect } from 'react';
import { router } from 'expo-router';
import { getDB } from '@/src/db';
import { getAllSessions } from '@/src/storage';

export default function Index() {
  useEffect(() => {
    getDB()
      .then(db => getAllSessions(db))
      .then(sessions => {
        router.replace(sessions.length > 0 ? '/(tabs)/progress' : '/(tabs)/settings');
      })
      .catch(() => {
        router.replace('/(tabs)/settings');
      });
  }, []);

  return null;
}
