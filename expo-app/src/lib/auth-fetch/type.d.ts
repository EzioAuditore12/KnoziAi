import type { FetchOptions } from '../fetch';
import { HttpMethods } from '../fetch/type';

interface BaseAuthenticatedFetchProps extends Omit<FetchOptions, 'body' | 'method'> {
  baseUrl?: string;

  url: string;

  responseStatus?: number;

  method: HttpMethods;

  body?: object | FormData;

  query?: object;
}
