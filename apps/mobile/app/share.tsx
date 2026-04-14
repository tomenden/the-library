import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@the-library/shared/convex/_generated/api";

type Status = "saving" | "success" | "error" | "no-url";

export default function ShareScreen() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const { isAuthenticated } = useConvexAuth();
  const ingestItem = useAction(api.actions.ingest.ingestItem);

  const [status, setStatus] = useState<Status>("saving");
  const [errorMsg, setErrorMsg] = useState("");
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);

  const url = shareIntent?.webUrl || shareIntent?.text || null;

  useEffect(() => {
    if (!hasShareIntent || !url) {
      setStatus("no-url");
      return;
    }
    if (!isAuthenticated) {
      setStatus("error");
      setErrorMsg("Please sign in first.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await ingestItem({ url });
        if (cancelled) return;
        if (result?.enrichmentFailed) {
          setEnrichmentFailed(true);
        }
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Failed to save");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasShareIntent, url, isAuthenticated]);

  function handleDone() {
    resetShareIntent();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === "saving" && (
          <>
            <ActivityIndicator size="large" color="#032421" />
            <Text style={styles.title}>Saving to Library...</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {url}
            </Text>
            <Text style={styles.hint}>AI is analysing the content</Text>
          </>
        )}

        {status === "success" && (
          <>
            <Text style={styles.icon}>
              {enrichmentFailed ? "⚠️" : "✅"}
            </Text>
            <Text style={styles.title}>
              {enrichmentFailed ? "Saved with limited info" : "Saved!"}
            </Text>
            {enrichmentFailed && (
              <Text style={styles.subtitle}>
                AI enrichment couldn't process this link. You can retry later.
              </Text>
            )}
            <TouchableOpacity style={styles.button} onPress={handleDone}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </>
        )}

        {status === "error" && (
          <>
            <Text style={styles.icon}>{"❌"}</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>{errorMsg}</Text>
            <TouchableOpacity style={styles.button} onPress={handleDone}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </>
        )}

        {status === "no-url" && (
          <>
            <Text style={styles.icon}>{"🔗"}</Text>
            <Text style={styles.title}>No URL found</Text>
            <Text style={styles.subtitle}>
              Share a link from your browser or another app.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleDone}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#f9f9f7",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: "300",
    color: "#1a1c1b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#414847",
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    color: "#717977",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#032421",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
