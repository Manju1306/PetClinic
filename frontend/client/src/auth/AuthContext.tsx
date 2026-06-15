import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { url } from '../util';
import { IAuthCredentials, IAuthResponse, IAuthUser, IError } from '../types';

import { clearSession, readToken, readUser, writeSession } from './authStorage';
import { SESSION_CLEARED_EVENT } from './refreshClient';

export class AuthError extends Error {
  readonly status: number;
  readonly fieldErrors?: IError;
  constructor(status: number, message: string, fieldErrors?: IError) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const ADMIN_ROLES = ['ROLE_ADMIN', 'ROLE_OWNER_ADMIN'];

interface IAuthContextValue {
  user: IAuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: IAuthCredentials) => Promise<void>;
  signup: (credentials: IAuthCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<IAuthContextValue | null>(null);

const postCredentials = async (
  path: string,
  credentials: IAuthCredentials
): Promise<IAuthResponse> => {
  const response = await fetch(url(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (response.status >= 200 && response.status < 300) {
    return (await response.json()) as IAuthResponse;
  }

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body — leave null
  }

  const message =
    response.status === 401
      ? 'Invalid email or password'
      : body?.message || 'Authentication failed';
  throw new AuthError(response.status, message, body?.fieldErrors ? body : undefined);
};

interface IProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: IProps) => {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<IAuthUser | null>(() => readUser());

  const handleAuthResponse = useCallback((response: IAuthResponse) => {
    writeSession({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      user: response.user,
    });
    setToken(response.access_token);
    setUser(response.user);
  }, []);

  useEffect(() => {
    const onCleared = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener(SESSION_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, onCleared);
  }, []);

  const login = useCallback(
    async (credentials: IAuthCredentials) => {
      handleAuthResponse(await postCredentials('auth/login', credentials));
    },
    [handleAuthResponse]
  );

  const signup = useCallback(
    async (credentials: IAuthCredentials) => {
      handleAuthResponse(await postCredentials('auth/signup', credentials));
    },
    [handleAuthResponse]
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = readToken();
    if (!currentToken) return;
    try {
      const res = await fetch(url('auth/me'), {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const isAdmin = useMemo(
    () => user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false,
    [user]
  );

  const value = useMemo<IAuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isAdmin,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, token, isAdmin, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): IAuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
};
