import { env } from 'src/env';

export const OPEN_WEATHER_PROVIDER = 'OPEN_WEATHER_PROVIDER';

export interface OpenWeatherProviderValues {
  baseUrl: string;
  apiKey: string;
  defaultLocation: string;
}

export interface OpenWeatherProviderOptions {
  provide: string;
  useValue: OpenWeatherProviderValues;
}

export const OpenWeatherProvider: OpenWeatherProviderOptions = {
  provide: OPEN_WEATHER_PROVIDER,
  useValue: {
    baseUrl: env.OPENWEATHER_BASE_URL,
    apiKey: env.OPENWEATHER_API_KEY,
    defaultLocation: env.WEATHER_DEFAULT_LOCATION,
  },
};
