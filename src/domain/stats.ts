import { getSetStatus } from './status';
import type { Session } from '../types';

export type SessionStats = {
  working: number;
  hits: number;
  exceeded: number;
  below: number;
  onTarget: number; // percentage 0–100
  totalReps: number;
  volumeKg: number; // excludes bodyweight sets
};

export function computeStats(session: Session): SessionStats {
  let working = 0, hits = 0, exceeded = 0, below = 0, totalReps = 0, volumeKg = 0;
  for (const ex of session.exercises) {
    const workingSets = ex.sets.filter(s => !s.isWarmup);
    for (let i = 0; i < workingSets.length; i++) {
      const s = workingSets[i];
      working++;
      totalReps += s.reps;
      if (!s.isBodyweight) volumeKg += s.reps * s.weight;
      const st = getSetStatus(s, ex.targets[i]);
      if (st === 'hit') hits++;
      else if (st === 'exceeded') exceeded++;
      else if (st === 'below') below++;
    }
  }
  const onTarget = working ? Math.round(((hits + exceeded) / working) * 100) : 0;
  return { working, hits, exceeded, below, onTarget, totalReps, volumeKg };
}

export function coachLine(stats: SessionStats): string {
  if (stats.working === 0) return 'No sets logged for this session.';
  if (stats.onTarget === 100) return 'Perfect session — every set hit its target.';
  if (stats.exceeded > stats.hits + stats.below) return `Strong session — ${stats.onTarget}% on target, with extra reps to spare.`;
  if (stats.onTarget >= 80) return `Solid work — ${stats.onTarget}% of sets on target.`;
  return `${stats.onTarget}% on target. Focus on the sets that fell short next time.`;
}
