import type { FetchOptions } from '../fetch';

interface BaseAuthenticatedFetchProps extends Omit<FetchOptions, 'body' | 'method'> {
  baseUrl?: string;

  url: string;

  responseStatus?: number;

  method: HttpMethods;

  body?: object | FormData;

  query?: object;
}
