import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AddTab() {
  useEffect(() => {
    router.replace('/select-day');
  }, []);
  return null;
}
