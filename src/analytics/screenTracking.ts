import { posthog } from '@/src/config/posthog';

export function trackScreen(routeName: string | undefined): void {
  if (routeName) posthog.screen(routeName);
}
