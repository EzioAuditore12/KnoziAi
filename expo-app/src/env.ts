import { Platform } from 'react-native';

export const env = {
  API_URL:
    Platform.OS === 'web' ? process.env.EXPO_PUBLIC_WEB_URL! : process.env.EXPO_PUBLIC_MOBILE_URL!,
};
