import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import type { Doc } from '@convex/_generated/dataModel';

type Item = Doc<'items'>;

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();

  return (
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
  );
}
