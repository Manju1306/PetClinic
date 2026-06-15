import { IRefreshResponse } from '../types';
import { url } from '../util';

import {
  clearSession,
  readRefreshToken,
  readToken,
  writeTokens,
} from './authStorage';

export const SESSION_CLEARED_EVENT = 'petclinic:auth:session-cleared';

let pendingRefresh: Promise<string> | null = null;

const dispatchSessionCleared = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_CLEARED_EVENT));
  }
};

const performRefresh = async (): Promise<string> => {
  const refresh_token = readRefreshToken();
  if (!refresh_token) {
    clearSession();
    dispatchSessionCleared();
    throw new Error('No refresh token available');
  }

  let response: Response;
  try {
    response = await fetch(url('auth/refresh'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    });
  } catch (err) {
    // network error — leave session intact so a later retry can succeed
    throw err;
  }

  if (response.status < 200 || response.status >= 300) {
    clearSession();
    dispatchSessionCleared();
    throw new Error(`Refresh failed with status ${response.status}`);
  }

  const body = (await response.json()) as IRefreshResponse;
  if (!body?.access_token) {
    clearSession();
    dispatchSessionCleared();
    throw new Error('Refresh response missing access_token');
  }

  writeTokens(body.access_token, body.refresh_token);
  return body.access_token;
};

// Single-flight: while a refresh is in progress, concurrent callers wait on
// the same promise instead of firing duplicate refresh requests.
export const refreshAccessToken = (): Promise<string> => {
  if (!pendingRefresh) {
    pendingRefresh = performRefresh().finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
};

export const getAccessToken = (): string | null => readToken();
