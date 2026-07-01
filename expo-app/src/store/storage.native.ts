import { deleteItemAsync, getItem, setItem } from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const mmkVstorage = createMMKV();

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return mmkVstorage.set(name, value);
  },
  getItem: (name) => {
    const value = mmkVstorage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return mmkVstorage.remove(name);
  },
};

export const secureStorage: StateStorage = {
  setItem: (name, value) => {
    setItem(name, value);
  },
  getItem: (name) => {
    const value = getItem(name);
    return value ?? null;
  },
  removeItem: async (name) => {
    await deleteItemAsync(name);
  },
};
