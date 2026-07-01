import { env } from '@/env';
import { useAuthStore } from '@/store/auth';
import { fetch } from '../fetch';
import { buildQueryParams } from '../fetch/utils';
import { refreshAccessToken } from './tokens-manager';
import type { BaseAuthenticatedFetchProps } from './type';

/**
 * Core authenticated fetch executor.
 * Automatically attaches the JWT access token, serializes query params,
 * and handles Content-Type for JSON vs FormData bodies.
 * On a 401 response, transparently refreshes the access token and retries once.
 */
export const executeAuthenticatedRequest = async ({
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
      });
    } catch (error) {
      alert('Session expired. Please login again.');

      throw error;
    }
  }

  return response;
};
