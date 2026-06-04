import '../src/global.css';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { C } from '@/components/spuddy/palette';
import * as Sentry from '@sentry/react-native';
import { setupNotificationResponseListener } from '@/src/notifications';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableLogs: true,
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
  useEffect(() => setupNotificationResponseListener(() => router.push('/log-session')), [router.push]);

  return (
    <ThemeProvider value={WarmDarkTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notes-import" options={{ headerShown: false }} />
        <Stack.Screen name="notes-import-review" options={{ headerShown: false }} />
        <Stack.Screen name="strong-import" options={{ title: 'Import from Strong', headerShown: true }} />
        <Stack.Screen name="select-day" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
