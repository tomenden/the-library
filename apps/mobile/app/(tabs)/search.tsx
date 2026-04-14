import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useAction } from "convex/react";
import { api } from "@the-library/shared/convex/_generated/api";
import type { Doc } from "@the-library/shared/convex/_generated/dataModel";

type SearchMode = "keyword" | "semantic";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [semanticResults, setSemanticResults] = useState<Doc<"items">[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const keywordResults = useQuery(
    api.items.list,
    mode === "keyword" ? { q: q.trim() || undefined } : "skip"
  );

  const runSemanticSearch = useAction(api.search.semanticSearch);

  useEffect(() => {
    if (mode !== "semantic") return;
    if (!q.trim()) {
      setSemanticResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await runSemanticSearch({ q: q.trim() });
        setSemanticResults(results as Doc<"items">[]);
      } catch {
        setSemanticResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, mode]);

  const results = mode === "semantic" ? semanticResults : keywordResults;
  const isLoading = mode === "semantic" ? isSearching : results === undefined;

  const renderItem = ({ item }: { item: Doc<"items"> }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/item/${item._id}`)}
    >
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardSource}>{item.sourceName ?? ""}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title ?? "Untitled"}
        </Text>
        {item.summary && (
          <Text style={styles.cardSummary} numberOfLines={2}>
            {item.summary}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={
            mode === "semantic" ? "Ask anything..." : "Search your library..."
          }
          placeholderTextColor="#717977"
          value={q}
          onChangeText={setQ}
          autoCorrect={false}
          returnKeyType="search"
        />
        {q.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setQ("");
              setSemanticResults(null);
            }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === "keyword" && styles.modeButtonActive]}
          onPress={() => {
            setMode("keyword");
            setSemanticResults(null);
          }}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "keyword" && styles.modeButtonTextActive,
            ]}
          >
            Keyword
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === "semantic" && styles.modeButtonActive]}
          onPress={() => setMode("semantic")}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "semantic" && styles.modeButtonTextActive,
            ]}
          >
            ✦ Semantic
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isLoading && q.trim() ? (
        <ActivityIndicator style={styles.loader} color="#032421" />
      ) : (
        <FlatList
          data={results ?? []}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            q.trim() ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No results found.</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {mode === "semantic"
                    ? "Ask a question to explore your library."
                    : "Type to search your library."}
                </Text>
              </View>
            )
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    position: "relative",
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a1c1b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  clearButton: {
    position: "absolute",
    right: 28,
    top: 24,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#717977",
  },
  modeToggle: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#eeeeec",
    borderRadius: 999,
    padding: 4,
    marginTop: 12,
    marginBottom: 8,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modeButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#717977",
  },
  modeButtonTextActive: {
    color: "#1a1c1b",
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
    backgroundColor: "#f4f4f2",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  cardContent: {
    padding: 16,
  },
  cardSource: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#71797799",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1c1b",
    lineHeight: 20,
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 13,
    color: "#414847",
    lineHeight: 18,
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
