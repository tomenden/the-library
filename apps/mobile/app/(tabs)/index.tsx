import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

export default function LibraryScreen() {
  const items = useQuery(api.items.list, { status: "saved" });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>
        {items === undefined ? 'Connecting to Convex...' : `${items.length} items`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
});
