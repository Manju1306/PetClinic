import { IHttpMethod } from '../types';
import { readRefreshToken, readToken } from '../auth/authStorage';
import { refreshAccessToken } from '../auth/refreshClient';

const BACKEND_URL =
  typeof __API_SERVER_URL__ === 'undefined'
    ? 'http://localhost:3000'
    : __API_SERVER_URL__;

export const url = (path: string): string => `${BACKEND_URL}/${path}`;

export const toIsoDate = (value: Date | string | null): string => {
  if (value == null) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const bearerHeader = (token: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

const sendWithToken = (
  fullUrl: string,
  init: RequestInit,
  token: string | null
): Promise<Response> =>
  fetch(fullUrl, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...bearerHeader(token),
    },
  });

// Try a request with the current access token; if it 401s and a refresh token
// is available, refresh once (single-flight) and retry. If the refresh itself
// fails, the session is cleared by refreshClient and the original 401 is
// returned to the caller.
const sendWithRefresh = async (
  fullUrl: string,
  init: RequestInit
): Promise<Response> => {
  const response = await sendWithToken(fullUrl, init, readToken());
  if (response.status !== 401 || !readRefreshToken()) {
    return response;
  }

  try {
    const newToken = await refreshAccessToken();
    return await sendWithToken(fullUrl, init, newToken);
  } catch {
    return response;
  }
};

// Authenticated fetch for any API call other than login/signup (which use raw
// fetch in AuthContext). Adds the Bearer token header when a session exists,
// auto-refreshes on 401, and retries the request once with the new token.
export const apiFetch = (path: string, init: RequestInit = {}): Promise<Response> =>
  sendWithRefresh(url(path), init);

export const submitForm = (
  method: IHttpMethod,
  path: string,
  data: any,
  onSuccess: (status: number, response: any) => void
) => {
  //const requestUrl = url(path);
  const requestUrl = path;

  const fetchParams: RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  return sendWithRefresh(requestUrl, fetchParams).then((response) =>
    response.status === 204
      ? onSuccess(response.status, {})
      : response.json().then((result) => onSuccess(response.status, result))
  );
};
