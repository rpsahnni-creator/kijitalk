import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Where the refresh token lives: the device keychain/keystore on phones.
 * expo-secure-store has no web implementation, so Expo web falls back to
 * AsyncStorage (localStorage) — acceptable for local testing only.
 */
const KEY = 'kijitalk.refresh';

export const refreshTokenStore = {
  async get(): Promise<string | null> {
    try {
      return Platform.OS === 'web' ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') await AsyncStorage.setItem(KEY, token);
    else await SecureStore.setItemAsync(KEY, token);
  },
  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') await AsyncStorage.removeItem(KEY);
      else await SecureStore.deleteItemAsync(KEY);
    } catch {
      /* nothing stored */
    }
  },
};
