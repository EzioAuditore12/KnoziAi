import { fetch } from 'react-native-nitro-fetch';
import * as s from 'standard-parse';

import type { TypedFetchProps } from './type';
import { buildQueryParams } from './utils';

/**
 * Type-safe fetch wrapper that validates the response JSON against a
 * Standard Schema (Zod-compatible). Throws on HTTP errors or validation failures.
 */
const typedFetch = async <S extends s.StandardSchemaV1>({
  url,
  schema,
  headers,
  query,
  method,
  body,
  contentType = 'application/json',
  ...props
}: TypedFetchProps<S>): Promise<s.StandardSchemaV1.InferOutput<S>> => {
  const typedFetchHeader: Record<string, string> = {
    ...((headers as Record<string, string>) || {}),
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && contentType !== null && !typedFetchHeader['Content-Type']) {
    typedFetchHeader['Content-Type'] = contentType;
  }

  const paramsValues = buildQueryParams(query);

  if (paramsValues) url = url + (url.includes('?') ? '&' : '?') + paramsValues;

  const response = await fetch(url, {
    headers: typedFetchHeader,
    method: method,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    ...props,
  });

  // Try to extract a structured error message from the response body
  if (!response.ok) {
    const errorBody = await response.text();
    try {
      const errorJson = JSON.parse(errorBody);
      throw new Error(errorJson.message || JSON.stringify(errorJson));
    } catch {
      throw new Error(errorBody || response.statusText);
    }
  }

  const json = await response.json();

  // Validate the parsed JSON against the provided schema
  const result = s.safeParse(schema, json);

  if (result.issues) throw new Error(JSON.stringify(result.issues));

  // @ts-ignore
  return result.value;
};

export { fetch, typedFetch };
