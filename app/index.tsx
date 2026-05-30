import { useEffect } from 'react';
import { router } from 'expo-router';
import { getDB } from '@/src/db';
import { hasAnySessions } from '@/src/storage';

export default function Index() {
  useEffect(() => {
    getDB()
      .then(db => hasAnySessions(db))
      .then(hasData => {
        router.replace(hasData ? '/(tabs)/progress' : '/(tabs)/settings');
      })
      .catch(() => {
        router.replace('/(tabs)/settings');
      });
  }, []);

  return null;
}
