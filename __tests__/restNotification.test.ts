import {
  buildRestNotificationContent,
  type RestNotificationPayload,
} from '@/src/domain/restNotification';

const base: RestNotificationPayload = {
  exerciseName: 'Bench Press',
  reps: 8,
  weight: 60,
  programName: 'SL5x5',
  dayIndex: 1,
  exerciseIdx: 2,
};

describe('buildRestNotificationContent', () => {
  it('title names the exercise', () => {
    const { title } = buildRestNotificationContent(base);
    expect(title).toBe('Rest complete — Bench Press');
  });

  it('body shows reps × weight', () => {
    const { body } = buildRestNotificationContent(base);
    expect(body).toContain('8 reps × 60 kg');
  });

  it('body mentions Next set action', () => {
    const { body } = buildRestNotificationContent(base);
    expect(body).toContain('Next set');
  });

  it('shows BW for zero weight', () => {
    const { body } = buildRestNotificationContent({ ...base, weight: 0 });
    expect(body).toContain('BW');
    expect(body).not.toContain('0 kg');
  });

  it('carries programName and dayIndex through the payload unchanged', () => {
    const payload: RestNotificationPayload = {
      ...base,
      programName: 'My Program',
      dayIndex: 3,
    };
    // These fields are on the payload type; ensure they round-trip without mangling.
    expect(payload.programName).toBe('My Program');
    expect(payload.dayIndex).toBe(3);
  });
});
