export type RestNotificationPayload = {
  exerciseName: string;
  reps: number;
  weight: number;
  programName: string;
  dayIndex: number;
  exerciseIdx: number;
};

export function buildRestNotificationContent(payload: RestNotificationPayload): {
  title: string;
  body: string;
} {
  const { exerciseName, reps, weight } = payload;
  const weightStr = weight === 0 ? 'BW' : `${weight} kg`;
  return {
    title: `Rest complete — ${exerciseName}`,
    body: `${reps} reps × ${weightStr} · Tap "Next set" to log the same, or Open App to change.`,
  };
}
