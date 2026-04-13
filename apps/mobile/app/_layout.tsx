import '../global.css';
import 'react-native-get-random-values';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { convex } from '../lib/convex';
import { useEffect } from 'react';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const onLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !onLoginScreen) {
      router.replace('/login');
    } else if (isAuthenticated && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="item/[id]"
            options={{ headerShown: true, title: 'Item', presentation: 'card' }}
          />
        </Stack>
      </AuthGate>
    </ConvexAuthProvider>
  );
}
