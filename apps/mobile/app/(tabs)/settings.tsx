import { View, Text, Pressable, Alert } from 'react-native';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { LogOut, Key, User } from 'lucide-react-native';

export default function SettingsScreen() {
  const { signOut } = useAuthActions();
  const apiKeys = useQuery(api.apiKeys.list);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>

      <View className="bg-white rounded-xl mb-4 overflow-hidden">
        <View className="flex-row items-center p-4 border-b border-gray-100">
          <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
            <User size={20} color="#6750A4" />
          </View>
          <View className="ml-3">
            <Text className="text-base font-semibold text-gray-900">Account</Text>
            <Text className="text-sm text-gray-500">Signed in with Google</Text>
          </View>
        </View>

        <Pressable className="flex-row items-center p-4 border-b border-gray-100">
          <Key size={20} color="#49454F" />
          <Text className="ml-3 text-base text-gray-900">API Keys</Text>
          <Text className="ml-auto text-sm text-gray-400">
            {apiKeys?.length ?? 0} keys
          </Text>
        </Pressable>

        <Pressable className="flex-row items-center p-4" onPress={handleSignOut}>
          <LogOut size={20} color="#D32F2F" />
          <Text className="ml-3 text-base text-red-600">Sign Out</Text>
        </Pressable>
      </View>

      <Text className="text-center text-xs text-gray-400 mt-4">
        The Library v1.0.0
      </Text>
    </View>
  );
}
