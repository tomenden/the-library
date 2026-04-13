import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '../lib/auth';
import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';

export default function LoginScreen() {
  const router = useRouter();
  const { request, response, promptAsync } = useGoogleAuth();
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        // Exchange Google token with Convex Auth
        signIn("google", { token: id_token });
      }
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Library</Text>
      <Text style={styles.subtitle}>Your personal knowledge base</Text>
      <Pressable
        style={[styles.button, !request && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFBFE',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#49454F',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#6750A4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
