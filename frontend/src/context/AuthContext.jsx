import { getCurrentUser, login as apiLogin, register as apiRegister } from '@/services/api';
import { clearAuthState, getAuthToken, getAuthUser, saveAuthState, saveAuthUser } from '@/services/auth';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const DEFAULT_HEART_REFILL_INTERVAL_SECONDS = 120;

const getHeartRefillIntervalSeconds = (user) => {
  const seconds = Number(user?.heartRefillIntervalSeconds);
  return Number.isInteger(seconds) && seconds > 0 ? seconds : DEFAULT_HEART_REFILL_INTERVAL_SECONDS;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          await clearAuthState();
          return;
        }

        const storedUser = await getAuthUser();
        if (storedUser) {
          setUser(storedUser);
        }

        const { data, error } = await getCurrentUser();
        if (error || !data) {
          await clearAuthState();
          setUser(null);
          return;
        }
        await saveAuthUser(data);
        setUser(data);
      } catch (_e) {
        await clearAuthState();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootAuth();
  }, []);

  useEffect(() => {
    if (!user || user.hearts >= user.maxHearts || !user.nextHeartAt) {
      return undefined;
    }

    const nextHeartTime = new Date(user.nextHeartAt).getTime();
    const delay = Math.max(nextHeartTime - Date.now() + 500, 1000);
    const timer = setTimeout(() => {
      setUser((current) => {
        if (!current || current.hearts >= current.maxHearts) {
          return current;
        }

        const nextHearts = Math.min(current.hearts + 1, current.maxHearts);
        const intervalSeconds = getHeartRefillIntervalSeconds(current);
        const nextHeartAt = nextHearts >= current.maxHearts
          ? null
          : new Date(Date.now() + intervalSeconds * 1000).toISOString();

        const nextUser = {
          ...current,
          hearts: nextHearts,
          nextHeartAt,
          minutesUntilNextHeart: nextHeartAt ? Math.ceil(intervalSeconds / 60) : 0,
          secondsUntilNextHeart: nextHeartAt ? intervalSeconds : 0,
        };
        saveAuthUser(nextUser);
        return nextUser;
      });
      refreshUser();
    }, delay);

    return () => clearTimeout(timer);
  }, [user?.hearts, user?.maxHearts, user?.nextHeartAt]);

  const login = async (email, password) => {
    const { data, error } = await apiLogin(email, password);
    if (error) return { error };
    if (!data?.token || !data?.user) return { error: 'Email hoặc mật khẩu không đúng' };
    await saveAuthState(data);
    setUser(data.user);
    return { data: data.user };
  };

  const register = async (userData) => {
    const { data, error } = await apiRegister(userData);
    if (error) return { data: null, error };
    if (!data?.token || !data?.user) return { data: null, error: 'Không thể tạo tài khoản' };
    await saveAuthState(data);
    setUser(data.user);
    return { data: data.user, error: null };
  };

  const logout = async () => {
    await clearAuthState();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data, error } = await getCurrentUser();
    if (error || !data) {
      await clearAuthState();
      setUser(null);
      return;
    }
    await saveAuthUser(data);
    setUser(data);
  };

  const updateUserLocally = (patch) => {
    setUser((prev) => prev ? { ...prev, ...patch } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, updateUserLocally }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
