import { handleRestNotificationResponse } from '@/src/notificationHandler';
import { loadDraft, saveDraft } from '@/src/sessionDraft';
import { logSet } from '@/src/domain/sessionLogger';
import { cancelRestNotification, NEXT_SET_ACTION, REST_TIMER_ID } from '@/src/notifications';
import type { RestNotificationPayload } from '@/src/domain/restNotification';
import type { SessionState } from '@/src/domain/sessionLogger';

jest.mock('@/src/sessionDraft', () => ({
  draftKey: jest.fn((name: string, idx: number) => `draft_session__${name}__${idx}`),
  loadDraft: jest.fn(),
  saveDraft: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/src/domain/sessionLogger', () => ({
  ...jest.requireActual('@/src/domain/sessionLogger'),
  logSet: jest.fn(),
}));

jest.mock('@/src/notifications', () => ({
  cancelRestNotification: jest.fn().mockResolvedValue(undefined),
  NEXT_SET_ACTION: 'NEXT_SET',
  REST_TIMER_ID: 'rest-timer',
}));

const mockPush = jest.fn();
const router = { push: mockPush } as any;

const payload: RestNotificationPayload = {
  exerciseName: 'Squat',
  reps: 5,
  weight: 100,
  programName: 'SL5x5',
  dayIndex: 0,
  exerciseIdx: 0,
};

const existingSession: SessionState = {
  loggedSets: [[{ reps: 5, weight: 100 }], []],
  targetCounts: [2, 1],
  extraSetCounts: [0, 0],
  currentExerciseIdx: 0,
  isResting: true,
  startedAt: 1000,
};

function makeResponse(actionIdentifier: string, notificationId = REST_TIMER_ID) {
  return {
    actionIdentifier,
    notification: {
      request: {
        identifier: notificationId,
        content: { data: payload },
      },
    },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  (loadDraft as jest.Mock).mockResolvedValue(existingSession);
  (logSet as jest.Mock).mockImplementation(jest.requireActual('@/src/domain/sessionLogger').logSet);
});

describe('handleRestNotificationResponse', () => {
  describe('NEXT_SET action', () => {
    it('loads the draft keyed by programName + dayIndex', async () => {
      await handleRestNotificationResponse(makeResponse(NEXT_SET_ACTION), router);
      expect(loadDraft).toHaveBeenCalledWith('draft_session__SL5x5__0');
    });

    it('calls logSet with the payload reps and weight', async () => {
      await handleRestNotificationResponse(makeResponse(NEXT_SET_ACTION), router);
      expect(logSet).toHaveBeenCalledWith(existingSession, 0, 5, 100);
    });

    it('saves the updated draft after logSet', async () => {
      await handleRestNotificationResponse(makeResponse(NEXT_SET_ACTION), router);
      expect(saveDraft).toHaveBeenCalledTimes(1);
      const key = (saveDraft as jest.Mock).mock.calls[0][0];
      expect(key).toBe('draft_session__SL5x5__0');
    });

    it('cancels the notification after logging', async () => {
      await handleRestNotificationResponse(makeResponse(NEXT_SET_ACTION), router);
      expect(cancelRestNotification).toHaveBeenCalledTimes(1);
    });

    it('does not navigate when action is NEXT_SET', async () => {
      await handleRestNotificationResponse(makeResponse(NEXT_SET_ACTION), router);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does nothing when draft is missing (session already cleared)', async () => {
      (loadDraft as jest.Mock).mockResolvedValue(null);
      await handleRestNotificationResponse(makeResponse(NEXT_SET_ACTION), router);
      expect(logSet).not.toHaveBeenCalled();
      expect(saveDraft).not.toHaveBeenCalled();
    });
  });

  describe('default tap (notification body or OPEN_APP)', () => {
    it('navigates to log-session screen', async () => {
      await handleRestNotificationResponse(makeResponse('DEFAULT'), router);
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/log-session' })
      );
    });

    it('passes programName and dayIndex as route params', async () => {
      await handleRestNotificationResponse(makeResponse('DEFAULT'), router);
      const call = mockPush.mock.calls[0][0];
      expect(call.params).toMatchObject({ programName: 'SL5x5', dayIndex: 0 });
    });

    it('does not load the draft on a default tap', async () => {
      await handleRestNotificationResponse(makeResponse('DEFAULT'), router);
      expect(loadDraft).not.toHaveBeenCalled();
    });
  });

  describe('unrelated notification', () => {
    it('ignores responses for non-rest-timer notifications', async () => {
      await handleRestNotificationResponse(makeResponse('DEFAULT', 'some-other-id'), router);
      expect(mockPush).not.toHaveBeenCalled();
      expect(logSet).not.toHaveBeenCalled();
    });
  });
});
