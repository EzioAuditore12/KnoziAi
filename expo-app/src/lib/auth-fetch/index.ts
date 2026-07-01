import * as s from 'standard-parse';

import { executeAuthenticatedRequest, executeStreamingAuthenticatedRequest } from './executor';
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

/**
 * Authenticated streaming fetch for Server-Sent Events (SSE).
 * Connects to an SSE endpoint and parses the incoming stream chunks,
 * calling the onMessage callback for each correctly parsed JSON payload.
 */

export const authenticatedStreamingSseFetch = async (
  props: BaseAuthenticatedFetchProps,
  onMessage: (text: string) => void
) => {
  const response = await executeStreamingAuthenticatedRequest(props);

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream available in response.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const eventChunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const lines = eventChunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.response) {
                onMessage(parsed.response);
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                // Ignore partial or invalid JSON chunks
                console.warn(`Failed to parse SSE chunk. dataStr: "${dataStr}"`, e);
              } else {
                throw e; // Rethrow actual API errors
              }
            }
          }
        }
      }

      boundary = buffer.indexOf('\n\n');
    }
  }
};
