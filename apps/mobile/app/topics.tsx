import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, Modal } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Edit3 } from 'lucide-react-native';
import type { Id } from '@convex/_generated/dataModel';

export default function TopicManagerScreen() {
  const router = useRouter();
  const topics = useQuery(api.topics.list);
  const createTopic = useMutation(api.topics.create);
  const renameTopic = useMutation(api.topics.rename);
  const deleteTopic = useMutation(api.topics.remove);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<{ id: Id<'topics'>; name: string } | null>(null);
  const [renameText, setRenameText] = useState('');

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createTopic({ name: trimmed });
    setNewName('');
  };

  const handleDelete = (id: Id<'topics'>, name: string) => {
    Alert.alert('Delete Topic', `Delete "${name}"? Items won't be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTopic({ id }),
      },
    ]);
  };

  const startRename = (id: Id<'topics'>, currentName: string) => {
    setRenaming({ id, name: currentName });
    setRenameText(currentName);
  };

  const confirmRename = () => {
    if (renaming && renameText.trim()) {
      renameTopic({ id: renaming.id, name: renameText.trim() });
    }
    setRenaming(null);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-14 pb-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#1C1B1F" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Topics</Text>
      </View>

      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TextInput
          className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-base mr-2"
          placeholder="New topic name"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <Pressable
          className={`p-2 rounded-lg ${newName.trim() ? 'bg-purple-600' : 'bg-gray-200'}`}
          onPress={handleCreate}
          disabled={!newName.trim()}
        >
          <Plus size={20} color={newName.trim() ? '#fff' : '#999'} />
        </Pressable>
      </View>

      <FlatList
        data={topics ?? []}
        keyExtractor={(t) => t._id}
        renderItem={({ item: topic }) => (
          <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-50">
            <Text className="flex-1 text-base text-gray-900">{topic.name}</Text>
            <Pressable onPress={() => startRename(topic._id, topic.name)} className="p-2">
              <Edit3 size={18} color="#666" />
            </Pressable>
            <Pressable onPress={() => handleDelete(topic._id, topic.name)} className="p-2">
              <Trash2 size={18} color="#D32F2F" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 mt-8">No topics yet</Text>
        }
      />

      {/* Rename modal — cross-platform (Alert.prompt is iOS-only) */}
      <Modal visible={!!renaming} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center px-8"
          onPress={() => setRenaming(null)}
        >
          <Pressable className="bg-white rounded-xl p-5 w-full" onPress={() => {}}>
            <Text className="text-lg font-semibold text-gray-900 mb-3">Rename Topic</Text>
            <TextInput
              className="bg-gray-50 rounded-lg px-3 py-2 text-base mb-4 border border-gray-200"
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              onSubmitEditing={confirmRename}
              returnKeyType="done"
            />
            <View className="flex-row justify-end gap-3">
              <Pressable onPress={() => setRenaming(null)} className="px-4 py-2">
                <Text className="text-gray-500">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmRename}
                className="bg-purple-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Rename</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
