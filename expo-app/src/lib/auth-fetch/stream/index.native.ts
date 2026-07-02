import { fetch } from 'react-native-nitro-fetch';
import { TextDecoder } from 'react-native-nitro-text-decoder';

import { env } from '@/env';
import { useAuthStore } from '@/store/auth';
import { buildQueryParams } from '../../fetch/utils';
import { refreshAccessToken } from '../tokens-manager';
import { BaseAuthenticatedFetchProps } from '../type';

/**
 * Authenticated streaming fetch for Server-Sent Events (SSE).
 * Connects to an SSE endpoint and parses the incoming stream chunks,
 * calling the onMessage callback for each correctly parsed JSON payload.
 */
export const executeStreamingAuthenticatedRequest = async ({
  baseUrl = env.API_URL,
  url,
  headers,
  responseStatus = 401,
  body,
  query,
  method,
  ...props
}: BaseAuthenticatedFetchProps) => {
  const accessToken = useAuthStore.getState().tokens?.accessToken;

  if (!accessToken) {
    throw new Error('No authentication token provided');
  }

  const isFormData = body instanceof FormData;

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    ...((headers as Record<string, string>) || {}),
  };

  if (!isFormData && !authHeaders['Content-Type']) {
    authHeaders['Content-Type'] = 'application/json';
  }

  const paramsValues = buildQueryParams(query);

  if (paramsValues) {
    url = url + (url.includes('?') ? '&' : '?') + paramsValues;
  }

  const requestOptions = {
    method,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  };

  const apiUrl = `${baseUrl}/${url}`;

  let response = await fetch(apiUrl, {
    ...requestOptions,
    headers: authHeaders,
    ...props,
    stream: true, // Enables streaming
  });

  // If the server responds with 401, attempt a silent token refresh and retry
  if (response.status === responseStatus) {
    try {
      await refreshAccessToken();

      const newAccessToken = useAuthStore.getState().tokens?.accessToken;
      authHeaders.Authorization = `Bearer ${newAccessToken}`;

      // Retry the original request with the new token
      response = await fetch(apiUrl, {
        ...requestOptions,
        headers: authHeaders,
        ...props,
        stream: true, // Enables streaming on retry
      });
    } catch (error) {
      alert('Session expired. Please login again.');
      throw error;
    }
  }

  return response;
};

export async function* authenticatedStreamingSseFetch(
  props: BaseAuthenticatedFetchProps
): AsyncGenerator<string, void, unknown> {
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
                yield parsed.response;
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
}
