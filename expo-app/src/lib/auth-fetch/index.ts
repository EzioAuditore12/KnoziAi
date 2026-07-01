import * as s from 'standard-parse';

import { executeAuthenticatedRequest } from './executor';
import type { BaseAuthenticatedFetchProps } from './type';

/**
 * Untyped authenticated fetch — automatically detects CSV responses
 * and returns a Blob; otherwise returns parsed JSON.
 */
export const authenticatedFetch = async (props: BaseAuthenticatedFetchProps) => {
  const response = await executeAuthenticatedRequest(props);

  const contentType = response.headers.get('Content-Type');

  if (contentType?.includes('text/csv')) {
    return await response.blob();
  }

  return await response.json();
};

interface TypedAuthenticatedFetchProps<
  S extends s.StandardSchemaV1,
> extends BaseAuthenticatedFetchProps {
  schema: S;
}

/**
 * Schema-validated authenticated fetch — parses response JSON and validates
 * it against a Standard Schema (Zod-compatible). Throws on validation failure.
 */
export const authenticatedTypedFetch = async <S extends s.StandardSchemaV1>({
  schema,

  ...props
}: TypedAuthenticatedFetchProps<S>): Promise<s.StandardSchemaV1.InferOutput<S>> => {
  const response = await executeAuthenticatedRequest(props);

  const json = await response.json();

  const result = s.safeParse(schema, json);

  if (result.issues) {
    throw new Error(JSON.stringify(result.issues));
  }

  // @ts-ignore
  return result.value;
};
