import { useEffect } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import { Stack, useRouter, useSegments } from "expo-router";
import { convex } from "../lib/convex";
import { secureStorage } from "../lib/storage";

function ShareIntentHandler({ children }: { children: React.ReactNode }) {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (hasShareIntent && segments[0] !== "share") {
      router.push("/share");
    }
  }, [hasShareIntent]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <ConvexAuthProvider client={convex} storage={secureStorage}>
        <ShareIntentHandler>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen
              name="share"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen name="[...unmatched]" options={{ headerShown: false }} />
          </Stack>
        </ShareIntentHandler>
      </ConvexAuthProvider>
    </ShareIntentProvider>
  );
}
