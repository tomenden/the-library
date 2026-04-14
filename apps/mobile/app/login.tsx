import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Redirect, useRouter } from "expo-router";

const REDIRECT_URI = Linking.createURL("/");

export default function LoginScreen() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      const result = await signIn("google", { redirectTo: REDIRECT_URI });
      if (result.redirect) {
        const browserResult = await WebBrowser.openAuthSessionAsync(
          result.redirect.toString(),
          REDIRECT_URI,
        );
        if (browserResult.type === "success" && browserResult.url) {
          const url = new URL(browserResult.url);
          const code = url.searchParams.get("code");
          if (code) {
            await signIn("google", { code });
            router.replace("/(tabs)");
          }
        }
      } else if (result.signingIn) {
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("Sign in error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>The Library</Text>
          <Text style={styles.subtitle}>YOUR PERSONAL KNOWLEDGE BASE</Text>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#1a1c1b" />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f7",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 48,
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "300",
    fontStyle: "italic",
    color: "#1b3a36",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#414847",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#eeeeec",
    borderWidth: 1,
    borderColor: "#c1c8c6",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1c1b",
  },
});
