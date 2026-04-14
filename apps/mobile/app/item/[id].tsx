import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@the-library/shared/convex/_generated/api";
import type { Id } from "@the-library/shared/convex/_generated/dataModel";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const item = useQuery(api.items.get, { id: id as Id<"items"> });
  const topics = useQuery(api.topics.list, {});
  const updateItem = useMutation(api.items.update);
  const toggleFav = useMutation(api.items.toggleFavorite);
  const deleteItem = useMutation(api.items.remove);

  if (item === undefined) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#032421" />
      </View>
    );
  }

  if (item === null) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>Item not found.</Text>
      </View>
    );
  }

  function getTopicNames(topicIds: Id<"topics">[]) {
    if (!topics) return [];
    return topicIds
      .map((tid) => topics.find((t) => t._id === tid)?.name)
      .filter(Boolean) as string[];
  }

  async function toggleFavorite() {
    if (!item) return;
    await toggleFav({ id: item._id });
  }

  async function toggleStatus() {
    if (!item) return;
    const nextStatus = item.status === "done" ? "saved" : "done";
    await updateItem({ id: item._id, status: nextStatus });
  }

  function handleDelete() {
    Alert.alert("Delete Item", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!item) return;
          await deleteItem({ id: item._id });
          router.back();
        },
      },
    ]);
  }

  const topicNames = getTopicNames(item.topicIds);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />
      )}

      <View style={styles.body}>
        {/* Topic chips */}
        {topicNames.length > 0 && (
          <View style={styles.topicRow}>
            {topicNames.map((name) => (
              <View key={name} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.title}>{item.title ?? "Untitled"}</Text>

        {item.sourceName && (
          <Text style={styles.source}>{item.sourceName}</Text>
        )}

        {item.summary && (
          <Text style={styles.summary}>{item.summary}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => item.url && Linking.openURL(item.url)}
          >
            <Text style={styles.actionButtonText}>Open in Browser</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.chipButton, item.isFavorite && styles.chipButtonActive]}
              onPress={toggleFavorite}
            >
              <Text
                style={[
                  styles.chipButtonText,
                  item.isFavorite && styles.chipButtonTextActive,
                ]}
              >
                {item.isFavorite ? "★ Favorited" : "☆ Favorite"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chipButton, item.status === "done" && styles.chipButtonActive]}
              onPress={toggleStatus}
            >
              <Text
                style={[
                  styles.chipButtonText,
                  item.status === "done" && styles.chipButtonTextActive,
                ]}
              >
                {item.status === "done" ? "✓ Archived" : "Archive"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f7",
  },
  content: {
    paddingBottom: 48,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f7",
  },
  emptyText: {
    fontSize: 14,
    color: "#414847",
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 10,
  },
  body: {
    padding: 24,
  },
  topicRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  topicChip: {
    backgroundColor: "#c8e9e3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topicChipText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#00201d",
  },
  title: {
    fontSize: 24,
    fontWeight: "300",
    color: "#1a1c1b",
    lineHeight: 32,
    marginBottom: 8,
  },
  source: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#717977",
    marginBottom: 16,
  },
  summary: {
    fontSize: 15,
    color: "#414847",
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#032421",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  chipButton: {
    flex: 1,
    backgroundColor: "#eeeeec",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  chipButtonActive: {
    backgroundColor: "#c8e9e3",
  },
  chipButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#414847",
  },
  chipButtonTextActive: {
    color: "#00201d",
  },
  deleteButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ba1a1a",
  },
});
