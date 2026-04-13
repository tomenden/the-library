import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useShareIntentContext } from 'expo-share-intent';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useRouter } from 'expo-router';
import { Link2, Check } from 'lucide-react-native';

export default function ShareScreen() {
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const createItem = useMutation(api.items.create);
  const router = useRouter();

  const url = shareIntent?.webUrl || shareIntent?.text;

  const handleSave = async () => {
    if (!url) return;

    setIsSaving(true);
    try {
      await createItem({ url });
      setSaved(true);
      setTimeout(() => {
        resetShareIntent();
        router.replace('/(tabs)');
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (url && !isSaving && !saved) {
      handleSave();
    }
  }, [url]);

  const handleCancel = () => {
    resetShareIntent();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      {saved ? (
        <>
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Check size={32} color="#16A34A" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Saved!</Text>
          <Text className="text-sm text-gray-500 mt-1">AI enrichment in progress...</Text>
        </>
      ) : (
        <>
          <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
            {isSaving ? (
              <ActivityIndicator color="#6750A4" />
            ) : (
              <Link2 size={32} color="#6750A4" />
            )}
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {isSaving ? 'Saving...' : 'Save to Library'}
          </Text>
          {url && (
            <Text className="text-sm text-gray-500 text-center mb-6" numberOfLines={2}>
              {url}
            </Text>
          )}
          {!isSaving && (
            <Pressable onPress={handleCancel} className="mt-4">
              <Text className="text-gray-500">Cancel</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
