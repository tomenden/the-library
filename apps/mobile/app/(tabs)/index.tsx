import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@the-library/shared/convex/_generated/api";
import type { Doc, Id } from "@the-library/shared/convex/_generated/dataModel";

type Tab = "all" | "unread" | "favorites" | "archive";

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "unread", label: "UNREAD" },
  { key: "favorites", label: "FAVORITES" },
  { key: "archive", label: "ARCHIVE" },
];

function getFilter(tab: Tab) {
  switch (tab) {
    case "unread":
      return { status: "saved" as const };
    case "favorites":
      return { isFavorite: true as const };
    case "archive":
      return { status: "done" as const };
    default:
      return {};
  }
}

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | undefined>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const filter = { ...getFilter(activeTab), topicId: selectedTopicId };
  const items = useQuery(api.items.list, filter);
  const topics = useQuery(api.topics.list, {});

  function getTopicNames(topicIds: Id<"topics">[]) {
    if (!topics) return [];
    return topicIds
      .map((tid) => topics.find((t) => t._id === tid)?.name)
      .filter(Boolean) as string[];
  }

  const renderItem = useCallback(({ item }: { item: Doc<"items"> }) => {
    const topicName = getTopicNames(item.topicIds)[0];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/item/${item._id}`)}
      >
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        )}
        <View style={styles.cardContent}>
          {topicName && (
            <Text style={styles.topicLabel}>{topicName}</Text>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title ?? "Untitled"}
          </Text>
          {item.summary && (
            <Text style={styles.cardSummary} numberOfLines={2}>
              {item.summary}
            </Text>
          )}
          {item.sourceName && (
            <Text style={styles.sourceName}>{item.sourceName}</Text>
          )}
        </View>
        {item.isFavorite && (
          <Text style={styles.favoriteStar}>★</Text>
        )}
      </TouchableOpacity>
    );
  }, [topics, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>Library</Text>

      <View style={styles.tabBar}>
        {tabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => {
              setActiveTab(key);
              setSelectedTopicId(undefined);
            }}
            style={[styles.tab, activeTab === key && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {topics && topics.length > 0 && (
        <View style={styles.topicBar}>
          {topics.map((topic: Doc<"topics">) => {
            const active = selectedTopicId === topic._id;
            return (
              <TouchableOpacity
                key={topic._id}
                onPress={() =>
                  setSelectedTopicId(active ? undefined : topic._id)
                }
                style={[styles.topicPill, active && styles.topicPillActive]}
              >
                <Text
                  style={[
                    styles.topicPillText,
                    active && styles.topicPillTextActive,
                  ]}
                >
                  {topic.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          {selectedTopicId && (
            <TouchableOpacity
              onPress={() => setSelectedTopicId(undefined)}
              style={styles.clearPill}
            >
              <Text style={styles.clearPillText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {items === undefined ? (
        <ActivityIndicator style={styles.loader} color="#032421" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {activeTab === "archive"
                  ? "No archived items yet."
                  : activeTab === "favorites"
                    ? "No favorites yet."
                    : activeTab === "unread"
                      ? "Nothing unread."
                      : selectedTopicId
                        ? "No items with this tag."
                        : "Your library is empty."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f7",
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1c1b",
    textAlign: "center",
    paddingVertical: 12,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e3e1",
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#1b3a36",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#717977",
  },
  tabTextActive: {
    color: "#1b3a36",
  },
  topicBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 12,
  },
  topicPill: {
    backgroundColor: "#e8e8e6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicPillActive: {
    backgroundColor: "#c8e9e3",
  },
  topicPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#414847",
  },
  topicPillTextActive: {
    color: "#00201d",
  },
  clearPill: {
    backgroundColor: "rgba(255, 218, 214, 0.3)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearPillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#ba1a1a",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardImage: {
    width: "100%",
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  topicLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#717977",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1c1b",
    lineHeight: 22,
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 13,
    color: "#414847",
    lineHeight: 18,
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#71797780",
  },
  favoriteStar: {
    position: "absolute",
    top: 12,
    right: 12,
    fontSize: 16,
    color: "#accdc7",
  },
  empty: {
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#414847",
  },
});
