import { useEffect } from 'react';
import { router } from 'expo-router';
import { getDB } from '@/src/db';
import { hasAnySessions } from '@/src/storage';
import { findActiveDraft } from '@/src/sessionDraft';

export default function Index() {
  useEffect(() => {
    findActiveDraft().then(draft => {
      if (draft !== null) {
        router.replace(`/log-session?programId=${draft.programId}&dayIndex=${draft.dayIndex}`);
        return;
      }
      getDB()
        .then(db => hasAnySessions(db))
        .then(hasData => {
          router.replace(hasData ? '/(tabs)/progress' : '/(tabs)/settings');
        })
        .catch(() => {
          router.replace('/(tabs)/settings');
        });
    });
  }, []);

  return null;
}
