import { IAuthUser } from '../types';

const TOKEN_KEY = 'petclinic.auth.token';
const REFRESH_TOKEN_KEY = 'petclinic.auth.refresh_token';
const USER_KEY = 'petclinic.auth.user';

export interface ISession {
  access_token: string;
  refresh_token: string;
  user: IAuthUser;
}

export const readToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const readRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const readUser = (): IAuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as IAuthUser) : null;
  } catch {
    return null;
  }
};

export const writeSession = (session: ISession): void => {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  if (session.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
};

// Replace just the tokens after a refresh, preserving the cached user.
export const writeTokens = (access_token: string, refresh_token?: string): void => {
  localStorage.setItem(TOKEN_KEY, access_token);
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
