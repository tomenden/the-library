import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAction } from "convex/react";
import { api } from "@the-library/shared/convex/_generated/api";

export default function AddScreen() {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const ingestItem = useAction(api.actions.ingest.ingestItem);

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      const result = await ingestItem({
        url: trimmed,
        notes: notes.trim() || undefined,
      });

      setUrl("");
      setNotes("");
      if (result?.enrichmentFailed) {
        Alert.alert(
          "Saved with limited info",
          "The link was saved but AI enrichment couldn't process it. You can retry later."
        );
      } else {
        Alert.alert("Saved!", "The link has been added to your library.");
      }
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save the link."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Save a Link</Text>
        <Text style={styles.subtitle}>
          Paste a URL and AI will analyse the content automatically.
        </Text>

        <TextInput
          style={styles.urlInput}
          placeholder="https://..."
          placeholderTextColor="#717977"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="next"
        />

        <TextInput
          style={styles.notesInput}
          placeholder="Add a personal note (optional)"
          placeholderTextColor="#717977"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity
          style={[styles.saveButton, (!url.trim() || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!url.trim() || isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.saveButtonText}>Analysing…</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Save with AI</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f7",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: "300",
    color: "#1a1c1b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#414847",
    marginBottom: 32,
  },
  urlInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1a1c1b",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  notesInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1a1c1b",
    marginBottom: 32,
    minHeight: 60,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButton: {
    backgroundColor: "#032421",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
