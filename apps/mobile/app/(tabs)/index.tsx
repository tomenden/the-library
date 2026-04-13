import { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ItemCard } from '../../components/ItemCard';
import { FilterBar } from '../../components/FilterBar';

const STATUS_OPTIONS = [
  { label: 'Saved', value: 'saved' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const CONTENT_TYPE_OPTIONS = [
  { label: 'Article', value: 'article' },
  { label: 'Video', value: 'video' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Tweet', value: 'tweet' },
  { label: 'Newsletter', value: 'newsletter' },
];

type Tab = 'all' | 'favorites';

export default function LibraryScreen() {
  const [tab, setTab] = useState<Tab>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [contentTypeFilter, setContentTypeFilter] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const queryArgs: Record<string, unknown> = {};
  if (statusFilter) queryArgs.status = statusFilter;
  if (contentTypeFilter) queryArgs.contentType = contentTypeFilter;
  if (topicFilter) queryArgs.topicId = topicFilter;
  if (tab === 'favorites') queryArgs.isFavorite = true;

  const items = useQuery(api.items.list, queryArgs);
  const topics = useQuery(api.topics.list);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {/* Header */}
      <View className="px-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Library</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-2">
        <Pressable
          className={`mr-4 pb-2 ${tab === 'all' ? 'border-b-2 border-purple-600' : ''}`}
          onPress={() => setTab('all')}
        >
          <Text className={tab === 'all' ? 'text-purple-600 font-semibold' : 'text-gray-500'}>
            All Items
          </Text>
        </Pressable>
        <Pressable
          className={`pb-2 ${tab === 'favorites' ? 'border-b-2 border-purple-600' : ''}`}
          onPress={() => setTab('favorites')}
        >
          <Text
            className={tab === 'favorites' ? 'text-purple-600 font-semibold' : 'text-gray-500'}
          >
            Favorites
          </Text>
        </Pressable>
      </View>

      {/* Filters */}
      <FilterBar options={STATUS_OPTIONS} selected={statusFilter} onSelect={setStatusFilter} />
      <FilterBar options={CONTENT_TYPE_OPTIONS} selected={contentTypeFilter} onSelect={setContentTypeFilter} />
      {topics && topics.length > 0 && (
        <FilterBar
          options={topics.map((t) => ({ label: t.name, value: t._id }))}
          selected={topicFilter}
          onSelect={setTopicFilter}
        />
      )}

      {/* Item list */}
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ItemCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center pt-20">
            <Text className="text-gray-400 text-base">
              {items === undefined ? 'Loading...' : 'No items found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
