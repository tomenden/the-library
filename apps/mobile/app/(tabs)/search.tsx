import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ItemCard } from '../../components/ItemCard';
import { Search as SearchIcon, X } from 'lucide-react-native';

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const keywordResults = useQuery(
    api.items.list,
    query.length >= 2 ? { q: query } : 'skip',
  );

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      <View className="px-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Search</Text>
      </View>

      <View className="mx-4 mb-3 flex-row items-center bg-white rounded-xl px-3 border border-gray-200">
        <SearchIcon size={20} color="#999" />
        <TextInput
          className="flex-1 py-3 px-2 text-base text-gray-900"
          placeholder="Search your library..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={clearSearch} className="p-1">
            <X size={18} color="#999" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={keywordResults ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ItemCard item={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center pt-20">
            <Text className="text-gray-400 text-base">
              {query.length === 0
                ? 'Type to search your library'
                : query.length < 2
                  ? 'Keep typing...'
                  : keywordResults === undefined
                    ? 'Searching...'
                    : 'No results found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
