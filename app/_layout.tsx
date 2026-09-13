import { SplashScreen, Stack } from "expo-router";
import { useFonts } from 'expo-font';
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import './globals.css';
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";

export { ErrorBoundary } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading completes
SplashScreen.preventAutoHideAsync().catch(() => {});

Sentry.init({
  dsn: 'https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208',
  sendDefaultPii: true,
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default Sentry.wrap(function RootLayout() {
  const { isLoading, fetchAuthenticatedUser } = useAuthStore();

  const [fontsLoaded, error] = useFonts({
    "Quicksand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "Quicksand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "Quicksand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "Quicksand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "Quicksand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
    "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.warn("Font loading error:", error);
      SplashScreen.hideAsync().catch(() => {});
    }
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    fetchAuthenticatedUser();
  }, [fetchAuthenticatedUser]);

  if (!fontsLoaded) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#FE8C00" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
});

