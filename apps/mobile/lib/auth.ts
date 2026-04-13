import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { makeRedirectUri } from 'expo-auth-session';

const SECURE_STORE_TOKEN_KEY = 'convex_auth_token';

// Google OAuth config — replace with your iOS client ID
const GOOGLE_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth() {
  const redirectUri = makeRedirectUri({ scheme: 'the-library' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery,
  );

  return { request, response, promptAsync };
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_STORE_TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_TOKEN_KEY);
}
