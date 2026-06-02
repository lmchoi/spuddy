import type { NotificationResponse } from 'expo-notifications';
import type { ImperativeRouter } from 'expo-router';
import { logSet } from './domain/sessionLogger';
import { draftKey, loadDraft, saveDraft } from './sessionDraft';
import { cancelRestNotification, NEXT_SET_ACTION, REST_TIMER_ID } from './notifications';
import type { RestNotificationPayload } from './domain/restNotification';

export async function handleRestNotificationResponse(
  response: NotificationResponse,
  router: Pick<ImperativeRouter, 'push'>
): Promise<void> {
  const { request } = response.notification;
  if (request.identifier !== REST_TIMER_ID) return;

  const payload = request.content.data as RestNotificationPayload;
  const { programName, dayIndex, exerciseIdx, reps, weight } = payload;

  if (response.actionIdentifier === NEXT_SET_ACTION) {
    const key = draftKey(programName, dayIndex);
    const draft = await loadDraft(key);
    if (!draft) return;
    const next = logSet(draft, exerciseIdx, reps, weight);
    await saveDraft(key, next);
    await cancelRestNotification();
    return;
  }

  // Default tap (notification body) or OPEN_APP action → navigate to log-session
  router.push({ pathname: '/log-session', params: { programName, dayIndex } });
}
