import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ProgramDay } from '../types';
import { getDB } from '../db';
import { getProgramDay } from '../programStorage';
import { getExercisesLibraryData, type ExerciseLibraryRow } from '../exerciseStorage';

export const SAMPLE_DAY: ProgramDay = {
  name: 'Push Day',
  exercises: [
    {
      name: 'Bench Press',
      targets: [
        { reps: 5, weight: 80, restSeconds: 180 },
        { reps: 5, weight: 80, restSeconds: 180 },
        { reps: 5, weight: 80, restSeconds: 180 },
      ],
    },
    {
      name: 'Overhead Press',
      targets: [
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
      ],
    },
    {
      name: 'Pull-ups',
      targets: [
        { reps: 6, weight: 0 },
        { reps: 6, weight: 0 },
        { reps: 6, weight: 0 },
      ],
    },
    {
      name: 'Squat',
      targets: [],
    },
  ],
};

export function useProgramDay(name: string, idx: number) {
  const [day, setDay] = useState<ProgramDay>(SAMPLE_DAY);
  const [libraryData, setLibraryData] = useState<Map<string, ExerciseLibraryRow>>(new Map());

  useFocusEffect(
    useCallback(() => {
      getDB()
        .then(async db => {
          const d = await getProgramDay(db, name, idx);
          if (d) {
            setDay(d);
            const rows = getExercisesLibraryData(db, d.exercises.map(e => e.name));
            setLibraryData(new Map(rows.map(r => [r.name, r])));
          }
        })
        .catch(console.error);
    }, [name, idx])
  );

  return { day, setDay, libraryData, setLibraryData };
}
