import { ClassConstructor, plainToInstance } from 'class-transformer';

export function mapToDto<T, V>(dtoClass: ClassConstructor<T>, data: V[]): T[];
export function mapToDto<T, V>(dtoClass: ClassConstructor<T>, data: V): T;
export function mapToDto<T, V>(
  dtoClass: ClassConstructor<T>,
  data: V | V[],
): T | T[] {
  if (!data) return data as any;

  // Handle Arrays
  if (Array.isArray(data)) {
    const plainArray = data.map((item) =>
      item && typeof (item as any).toObject === 'function'
        ? (item as any).toObject()
        : item,
    );
    return plainToInstance(dtoClass, plainArray, {
      excludeExtraneousValues: true,
    });
  }

  // Handle single Objects / Mongoose Documents
  const plainData =
    typeof (data as any).toObject === 'function'
      ? (data as any).toObject()
      : data;

  return plainToInstance(dtoClass, plainData, {
    excludeExtraneousValues: true,
  });
}
