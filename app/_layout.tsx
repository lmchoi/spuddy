import '../src/global.css';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, useNavigationContainerRef, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { C } from '@/components/spuddy/palette';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { setupNotificationResponseListener } from '@/src/notifications';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/src/config/posthog';
import { trackScreen } from '@/src/analytics/screenTracking';

LogBox.ignoreLogs(['Bridgeless doesn\'t support CatalystInstance']);

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableLogs: true,
  integrations: [navigationIntegration],
  tracesSampleRate: 1.0,
  enableNativeFramesTracking: !isRunningInExpoGo(),
});

const WarmDarkTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg } };

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
});

function RootLayoutNav() {
  const router = useRouter();
  const ref = useNavigationContainerRef();
  useEffect(() => {
    navigationIntegration.registerNavigationContainer(ref);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    return ref.addListener('state', () => {
      trackScreen((ref.getCurrentRoute() as { name?: string } | undefined)?.name);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => setupNotificationResponseListener(() => router.push('/log-session')), [router]);

  return (
    <PostHogProvider client={posthog} autocapture>
    <ThemeProvider value={WarmDarkTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notes-import" options={{ headerShown: false }} />
        <Stack.Screen name="notes-import-review" options={{ headerShown: false }} />
        <Stack.Screen name="strong-import" options={{ title: 'Import from Strong', headerShown: true }} />
        <Stack.Screen name="select-day" options={{ headerShown: false }} />
        <Stack.Screen name="log-session" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
    </PostHogProvider>
  );
}
