import { DynamicStructuredTool } from '@langchain/core/tools';
import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { mapToDto } from 'src/utils/dto-mapper.util';
import { z } from 'zod';

import { CurrentWeatherDto } from '../dto/current-weather.dto';
import { LlmTool } from '../interfaces/llm-tool.interface';
import {
  OPEN_WEATHER_PROVIDER,
  type OpenWeatherProviderValues,
} from '../providers/openweather.provider';

@Injectable()
export class WeatherTool implements LlmTool {
  private readonly logger = new Logger(WeatherTool.name);

  public readonly toolName = 'get_current_weather';

  constructor(
    @Inject(OPEN_WEATHER_PROVIDER)
    private readonly provider: OpenWeatherProviderValues,

    private readonly httpService: HttpService,
  ) {}

  public get(): DynamicStructuredTool {
    return new DynamicStructuredTool({
      name: this.toolName,
      description:
        'Use this tool to get the current weather for a specific city.',
      schema: z.object({
        city: z
          .string()
          .describe('The name of the city to get the weather for'),
      }),
      func: async ({ city }) => {
        const weather = await this.getCurrentWeather(city);
        return this.formatAlert(weather);
      },
    });
  }

  private async getCurrentWeather(
    city: string = this.provider.defaultLocation,
  ): Promise<CurrentWeatherDto> {
    try {
      const data = await this.fetchWeatherFromApi(city);
      return this.mapWeatherDataToDto(data);
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch weather for ${city}`,
        error.response?.data || error.message,
      );

      if (city === this.provider.defaultLocation) {
        throw new Error('Unable to fetch weather data.');
      }

      this.logger.log(
        `Falling back to default location: ${this.provider.defaultLocation}`,
      );
      const fallbackData = await this.fetchFallbackWeather();
      return this.mapWeatherDataToDto(fallbackData, city);
    }
  }

  public formatAlert(weather: CurrentWeatherDto): string {
    let msg = `🌤 WeatherGuard\n\n📍 ${weather.city}\n🌡 Temperature: ${weather.temperature}°C\n☁️ ${weather.description}\n💧 Humidity: ${weather.humidity}%\n💨 Wind: ${weather.windSpeed} km/h\n\nStay safe and have a great day! 🌿`;
    if (weather.note) {
      msg += weather.note;
    }
    return msg;
  }

  private async fetchWeatherFromApi(city: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.provider.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.provider.apiKey,
          units: 'metric',
        },
        timeout: 5000,
      }),
    );
    return response.data;
  }

  private async fetchFallbackWeather() {
    try {
      return await this.fetchWeatherFromApi(this.provider.defaultLocation);
    } catch (fallbackError) {
      throw new ServiceUnavailableException('Unable to fetch weather data.');
    }
  }

  private mapWeatherDataToDto(
    data: any,
    unsupportedCity?: string,
  ): CurrentWeatherDto {
    const description = data.weather[0]?.description || 'Unknown';
    const capitalizedDescription = description
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const note = unsupportedCity
      ? `\n\n⚠️ Note: The weather API does not support your city (${unsupportedCity}). Showing weather for ${this.provider.defaultLocation} instead.`
      : undefined;

    return mapToDto(CurrentWeatherDto, {
      city: data.name,
      temperature: Math.round(data.main.temp),
      description: capitalizedDescription,
      windSpeed: Math.round(data.wind.speed * 3.6),
      humidity: data.main.humidity,
      note,
    });
  }
}
