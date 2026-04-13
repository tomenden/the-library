import { View, Text, ScrollView, Pressable, Image, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Trash2,
  BookOpen,
  CheckCircle,
  Bookmark,
} from 'lucide-react-native';

const STATUS_ICONS = {
  saved: Bookmark,
  in_progress: BookOpen,
  done: CheckCircle,
} as const;

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useQuery(api.items.get, { id: id as Id<'items'> });
  const updateItem = useMutation(api.items.update);
  const toggleFav = useMutation(api.items.toggleFavorite);
  const deleteItem = useMutation(api.items.remove);
  const topics = useQuery(api.topics.list);

  if (!item) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  const toggleFavorite = () => {
    toggleFav({ id: item._id });
  };

  const cycleStatus = () => {
    const statuses = ['saved', 'in_progress', 'done'] as const;
    const currentIndex = statuses.indexOf(item.status as typeof statuses[number]);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updateItem({ id: item._id, status: nextStatus });
  };

  const handleDelete = () => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem({ id: item._id });
          router.back();
        },
      },
    ]);
  };

  const itemTopics = topics?.filter((t) => item.topicIds?.includes(t._id));
  const StatusIcon = STATUS_ICONS[item.status as keyof typeof STATUS_ICONS] || Bookmark;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-14 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#1C1B1F" />
        </Pressable>
        <View className="flex-1" />
        <Pressable onPress={toggleFavorite} className="p-2">
          <Heart
            size={22}
            color={item.isFavorite ? '#E91E63' : '#666'}
            fill={item.isFavorite ? '#E91E63' : 'none'}
          />
        </Pressable>
        <Pressable onPress={handleDelete} className="p-2">
          <Trash2 size={22} color="#666" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-full h-48 rounded-xl mb-4"
            resizeMode="cover"
          />
        )}

        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {item.title || item.url}
        </Text>

        <View className="flex-row items-center mb-4">
          {item.sourceName && (
            <Text className="text-sm text-gray-500 mr-3">{item.sourceName}</Text>
          )}
          {item.contentType && (
            <View className="bg-purple-50 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-purple-700">{item.contentType}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={cycleStatus}
          className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-4"
        >
          <StatusIcon size={18} color="#6750A4" />
          <Text className="ml-2 text-purple-700 font-medium capitalize">{item.status}</Text>
          <Text className="ml-auto text-xs text-gray-400">Tap to change</Text>
        </Pressable>

        {itemTopics && itemTopics.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {itemTopics.map((t) => (
              <View key={t._id} className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-sm text-gray-700">{t.name}</Text>
              </View>
            ))}
          </View>
        )}

        {item.summary && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-500 mb-1">Summary</Text>
            <Text className="text-base text-gray-800 leading-6">{item.summary}</Text>
          </View>
        )}

        {item.notes && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-500 mb-1">Notes</Text>
            <Text className="text-base text-gray-800 leading-6">{item.notes}</Text>
          </View>
        )}

        <Pressable
          className="flex-row items-center justify-center bg-purple-600 rounded-xl py-3 mb-8"
          onPress={() => Linking.openURL(item.url)}
        >
          <ExternalLink size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Open in Browser</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
