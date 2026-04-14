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
import { useMutation, useQuery } from "convex/react";
import { api } from "@the-library/shared/convex/_generated/api";
import type { Doc, Id } from "@the-library/shared/convex/_generated/dataModel";

export default function AddScreen() {
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Id<"topics">[]>([]);

  const topics = useQuery(api.topics.list, {});
  const createItem = useMutation(api.items.create);

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await createItem({
        url: trimmed,
        topicIds: selectedTopicIds,
      });

      setUrl("");
      setSelectedTopicIds([]);
      Alert.alert("Saved!", "The link has been added to your library.");
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save the link."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleTopic(id: Id<"topics">) {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
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
          Paste a URL and we'll enrich it with AI.
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
          returnKeyType="done"
        />

        {/* Topic selection */}
        {topics && topics.length > 0 && (
          <View style={styles.topicSection}>
            <Text style={styles.topicSectionLabel}>Add to topics</Text>
            <View style={styles.topicGrid}>
              {topics.map((topic: Doc<"topics">) => {
                const selected = selectedTopicIds.includes(topic._id);
                return (
                  <TouchableOpacity
                    key={topic._id}
                    onPress={() => toggleTopic(topic._id)}
                    style={[
                      styles.topicChip,
                      selected && styles.topicChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.topicChipText,
                        selected && styles.topicChipTextSelected,
                      ]}
                    >
                      {topic.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, (!url.trim() || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!url.trim() || isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save to Library</Text>
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
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topicSection: {
    marginBottom: 32,
  },
  topicSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#717977",
    marginBottom: 12,
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    backgroundColor: "#e8e8e6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topicChipSelected: {
    backgroundColor: "#c8e9e3",
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#414847",
  },
  topicChipTextSelected: {
    color: "#00201d",
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
