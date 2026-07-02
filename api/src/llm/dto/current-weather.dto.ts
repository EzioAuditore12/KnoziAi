import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CurrentWeatherDto {
  @Expose()
  city: string;

  @Expose()
  temperature: number;

  @Expose()
  description: string;

  @Expose()
  windSpeed: number;

  @Expose()
  humidity: number;

  @Expose()
  note?: string;
}
