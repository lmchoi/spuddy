export type ParsedExercise = {
  name: string;
  sets: number;
  weight: number;
  explicitUnit: 'kg' | 'lbs' | null;
};

export type ParsedSection = {
  name: string;
  exercises: ParsedExercise[];
};

export type ParsedNotes = {
  sections: ParsedSection[];
  inferredUnit: 'kg' | 'lbs' | null;
  skippedLines: number;
};

export function parseWorkoutNotes(_text: string): ParsedNotes {
  return {
    sections: [
      {
        name: 'My Workout',
        exercises: [
          { name: 'Example exercise', sets: 3, weight: 60, explicitUnit: null },
        ],
      },
    ],
    inferredUnit: null,
    skippedLines: 0,
  };
}
