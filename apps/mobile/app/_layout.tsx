import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { ConvexProvider } from 'convex/react';
import { convex } from '../lib/convex';

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="item/[id]"
          options={{ headerShown: true, title: 'Item', presentation: 'card' }}
        />
      </Stack>
    </ConvexProvider>
  );
}
