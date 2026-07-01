import * as s from 'standard-parse';

export type FetchOptions = RequestInit;

export type HttpMethods = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface TypedFetchProps<S extends s.StandardSchemaV1> extends Omit<
  FetchOptions,
  'method' | 'body'
> {
  url: string;
  schema: S;
  method: HttpMethods;
  query?: object;
  body?: object | FormData;
  contentType?: string | null;
}
