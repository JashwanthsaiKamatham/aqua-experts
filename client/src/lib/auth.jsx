/**
 * Session context — email + password auth against our own API.
 * The JWT is stored in localStorage so the session survives refreshes
 * and works across devices (same credentials everywhere).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const boot = async () => {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await api.me();
        if (alive) setUser(me);
      } catch {
        tokenStore.set('');
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    boot();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const signup = useCallback(async ({ email, password, fullName }) => {
    const res = await api.signup({ email, password, fullName });
    tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    tokenStore.set('');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (fullName) => {
    const res = await api.updateProfile({ fullName });
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, updateProfile, isAuthed: Boolean(user) }),
    [user, loading, login, signup, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
