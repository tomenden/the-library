import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Archive } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';

type Item = Doc<'items'>;

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();
  const toggleFavorite = useMutation(api.items.toggleFavorite);
  const updateItem = useMutation(api.items.update);

  const renderLeftActions = () => (
    <Pressable
      className="bg-purple-600 justify-center items-center px-6 mb-3 mx-0 rounded-xl"
      style={{ marginLeft: 16 }}
      onPress={() => toggleFavorite({ id: item._id })}
    >
      <Heart size={24} color="#fff" fill={item.isFavorite ? '#fff' : 'transparent'} />
      <Text className="text-white text-xs mt-1 font-medium">
        {item.isFavorite ? 'Unfavorite' : 'Favorite'}
      </Text>
    </Pressable>
  );

  const renderRightActions = () => (
    <Pressable
      className="bg-gray-400 justify-center items-center px-6 mb-3 mx-0 rounded-xl"
      style={{ marginRight: 16 }}
      onPress={() => updateItem({ id: item._id, status: 'done' })}
    >
      <Archive size={24} color="#fff" />
      <Text className="text-white text-xs mt-1 font-medium">Archive</Text>
    </Pressable>
  );

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <Pressable
        className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100"
        onPress={() => router.push(`/item/${item._id}`)}
      >
        <View className="flex-row">
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-16 h-16 rounded-lg mr-3"
              resizeMode="cover"
            />
          )}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
              {item.title || item.url}
            </Text>
            {item.summary && (
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                {item.summary}
              </Text>
            )}
            <View className="flex-row items-center mt-2">
              {item.contentType && (
                <View className="bg-purple-50 px-2 py-0.5 rounded-full mr-2">
                  <Text className="text-xs text-purple-700">{item.contentType}</Text>
                </View>
              )}
              {item.isFavorite && <Heart size={14} color="#E91E63" fill="#E91E63" />}
            </View>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}
