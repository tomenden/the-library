import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Link2, Sparkles } from 'lucide-react-native';

export default function AddItemScreen() {
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const createItem = useMutation(api.items.create);

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please enter a URL starting with http:// or https://');
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    try {
      await createItem({ url: trimmed });
      setUrl('');
      Alert.alert('Saved!', 'Item saved. AI enrichment will process it shortly.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Save Item</Text>
      <Text className="text-base text-gray-500 mb-6">
        Paste a URL and AI will extract the title, summary, and topics.
      </Text>

      <View className="bg-white rounded-xl p-4 border border-gray-200">
        <View className="flex-row items-center mb-4">
          <Link2 size={20} color="#6750A4" />
          <Text className="ml-2 text-sm font-medium text-gray-700">URL</Text>
        </View>

        <TextInput
          className="text-base text-gray-900 bg-gray-50 rounded-lg px-4 py-3 mb-4"
          placeholder="https://example.com/article"
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleSave}
        />

        <Pressable
          className={`flex-row items-center justify-center py-3.5 rounded-xl ${
            isSaving || !url.trim() ? 'bg-purple-300' : 'bg-purple-600'
          }`}
          onPress={handleSave}
          disabled={isSaving || !url.trim()}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Sparkles size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Save with AI</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
